const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Simple static file server
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
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
console.log('=== TIMELINE HIGHLIGHTING TEST STARTED ===');

// Wait for page to load
setTimeout(() => {
    const slider = document.getElementById('timelineSlider');
    const totalDays = parseInt(slider.max);
    
    console.log('Slider max value:', totalDays);
    console.log('Starting automated timeline testing...');
    
    let testPosition = 0;
    const testInterval = setInterval(() => {
        if (testPosition > Math.min(200, totalDays)) {
            clearInterval(testInterval);
            console.log('=== AUTOMATED TEST COMPLETED ===');
            return;
        }
        
        // Set slider position
        slider.value = testPosition;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Log current state
        const alive = document.querySelectorAll('.soldier-name.alive').length;
        const dying = document.querySelectorAll('.soldier-name.dying').length;
        const fallen = document.querySelectorAll('.soldier-name.fallen').length;
        const total = document.querySelectorAll('.soldier-name').length;
        
        console.log('Position:', testPosition, '| Alive:', alive, '| Dying:', dying, '| Fallen:', fallen, '| Total:', total);
        
        testPosition += 5; // Move 5 days at a time
    }, 100); // Fast movement - 100ms intervals
    
    // Also test narrative buttons
    setTimeout(() => {
        console.log('\\n=== TESTING NARRATIVE NAVIGATION ===');
        const continueBtn = document.getElementById('ctaContinue');
        if (continueBtn) {
            console.log('Clicking continue button for narrative animation...');
            continueBtn.click();
        }
    }, 15000);
    
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
                `http://localhost:${PORT}/timeline-version.html`
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
        const originalHTML = fs.readFileSync(path.join(__dirname, 'timeline-version.html'), 'utf8');
        const modifiedHTML = originalHTML.replace('</body>', `<script>${testScript}</script></body>`);
        fs.writeFileSync(path.join(__dirname, 'timeline-version-test.html'), modifiedHTML);
        console.log('Created timeline-version-test.html with automatic testing.');
    }
});