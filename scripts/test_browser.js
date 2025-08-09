const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Simple static file server
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url);
    
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
    }
    
    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.csv': 'text/csv'
    }[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
});

// Test script that will be injected into the page
const testScript = `
console.log('=== NARRATIVE NAVIGATION TEST STARTED ===');

// Wait for page to load
setTimeout(() => {
    console.log('Testing narrative navigation issue...');
    
    // Check if narrative engine is available
    if (window.memorial && window.memorial.narrative) {
        const narrative = window.memorial.narrative;
        console.log('Narrative points loaded:', narrative.narrativePoints.map(p => p.id));
        
        // Find our specific entries
        const recentDeaths = narrative.narrativePoints.find(p => p.id === 'recent_deaths');
        const monthBefore = narrative.narrativePoints.find(p => p.id === 'month_before_hypothetical');
        const warOverview = narrative.narrativePoints.find(p => p.id === 'war_overview');
        
        console.log('recent_deaths found:', !!recentDeaths);
        console.log('month_before_hypothetical found:', !!monthBefore);
        console.log('war_overview found:', !!warOverview);
        
        if (monthBefore) {
            console.log('month_before_hypothetical details:', monthBefore);
            console.log('Timeline point:', monthBefore.timeline_point);
            console.log('Content:', monthBefore.content_hebrew);
        }
        
        // Test navigation sequence
        console.log('\\n=== TESTING NAVIGATION SEQUENCE ===');
        
        // Navigate to recent_deaths first
        if (recentDeaths) {
            console.log('1. Navigating to recent_deaths...');
            narrative.navigateToPoint('recent_deaths');
            
            setTimeout(() => {
                console.log('Current point after recent_deaths:', narrative.currentPointId);
                const nextPoint = narrative.getNextPoint();
                console.log('Next point should be:', nextPoint ? nextPoint.id : 'none');
                
                // Click continue button
                const continueBtn = document.getElementById('ctaContinue');
                if (continueBtn) {
                    console.log('2. Clicking continue button...');
                    continueBtn.click();
                    
                    setTimeout(() => {
                        console.log('Current point after continue click:', narrative.currentPointId);
                        const content = document.getElementById('narrativeContent').innerHTML;
                        console.log('Current content preview:', content.substring(0, 100) + '...');
                        
                        // Check if we landed on month_before_hypothetical
                        if (narrative.currentPointId === 'month_before_hypothetical') {
                            console.log('SUCCESS: Reached month_before_hypothetical!');
                        } else if (narrative.currentPointId === 'war_overview') {
                            console.log('PROBLEM: Skipped to war_overview directly!');
                        } else {
                            console.log('UNEXPECTED: Landed on:', narrative.currentPointId);
                        }
                        
                        // Test template resolution
                        if (content.includes('{{soldiers_died_last_31_days}}')) {
                            console.log('ERROR: Template variable not resolved!');
                        } else if (content.includes('אם המלחמה הייתה מסתיימת לפני חודש')) {
                            console.log('SUCCESS: Content appears to be rendered correctly');
                        }
                        
                    }, 2000); // Wait for navigation animation
                } else {
                    console.log('ERROR: Continue button not found');
                }
            }, 2000); // Wait for initial navigation
        }
    } else {
        console.log('ERROR: Narrative engine not found');
    }
    
}, 3000); // Wait 3 seconds for initial load
`;

const PORT = 8003;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Testing timeline highlighting behavior...');
    
    // Try Chrome/Chromium in headless mode with console output
    const chromePaths = [
        '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"',
        '"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"',
        'chrome',
        'chromium',
        'google-chrome'
    ];
    
    let chromeFound = false;
    
    for (const chromePath of chromePaths) {
        if (chromeFound) break;
        
        try {
            console.log(`Trying to launch: ${chromePath}`);
            const chrome = spawn(chromePath, [
                '--headless',
                '--disable-gpu',
                '--remote-debugging-port=9222',
                '--no-sandbox',
                '--disable-web-security',
                '--enable-logging',
                '--log-level=0',
                '--disable-dev-shm-usage',
                '--virtual-time-budget=30000', // Run for 30 seconds
                '--run-all-compositor-stages-before-draw',
                `--evaluate-on-load=(${testScript})`,
                `http://localhost:${PORT}/`
            ], { 
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            chrome.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Console') || output.includes('updateVisualization') || output.includes('Started dying') || output.includes('Position:')) {
                    console.log('BROWSER LOG:', output.trim());
                }
            });
            
            chrome.stderr.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Console') || output.includes('updateVisualization') || output.includes('Started dying') || output.includes('Position:')) {
                    console.log('BROWSER ERROR:', output.trim());
                }
            });
            
            chrome.on('close', (code) => {
                console.log(`Chrome exited with code ${code}`);
                console.log('Test completed. Check the logs above for timeline behavior.');
                server.close();
                process.exit(0);
            });
            
            chrome.on('error', (error) => {
                console.log(`Chrome launch error: ${error.message}`);
            });
            
            // Kill after 30 seconds
            setTimeout(() => {
                console.log('Terminating Chrome after 30 seconds...');
                chrome.kill('SIGTERM');
                setTimeout(() => {
                    chrome.kill('SIGKILL');
                }, 2000);
            }, 30000);
            
            chromeFound = true;
            
        } catch (error) {
            console.log(`Failed with ${chromePath}:`, error.message);
        }
    }
    
    if (!chromeFound) {
        console.log('Chrome not found. Please open http://localhost:8003 manually and check browser console.');
        console.log('The test script will run automatically.');
        
        // Add test script injection to served HTML
        const originalHTML = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
        const modifiedHTML = originalHTML.replace('</body>', `<script>${testScript}</script></body>`);
        fs.writeFileSync(path.join(__dirname, 'index-test.html'), modifiedHTML);
        console.log('Created timeline-version-test.html with automatic testing.');
    }
});