const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Simple static file server
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'timeline-version.html' : req.url);
    
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

// Test script specifically for alignment issues
const alignmentTestScript = `
console.log('=== CHART ALIGNMENT TEST STARTED ===');

// Wait for page to load completely
setTimeout(() => {
    console.log('Testing chart and timeline alignment...');
    
    // Check timeline events and their positions
    const timelineEvents = document.querySelectorAll('.timeline-event-marker');
    console.log('Timeline event markers found:', timelineEvents.length);
    
    timelineEvents.forEach((marker, index) => {
        const style = window.getComputedStyle(marker);
        const leftPos = style.left;
        console.log('Event marker', index, 'position:', leftPos);
    });
    
    // Check chart SVG path
    const chartPath = document.getElementById('areaPath');
    if (chartPath) {
        const pathData = chartPath.getAttribute('d');
        console.log('Chart path data:', pathData.substring(0, 200) + '...');
    }
    
    // Get timeline container dimensions
    const timelineTrack = document.querySelector('.timeline-track');
    if (timelineTrack) {
        const rect = timelineTrack.getBoundingClientRect();
        console.log('Timeline track width:', rect.width);
    }
    
    // Test specific date alignment - ceasefire 24/11/2023
    const slider = document.getElementById('timelineSlider');
    const totalDays = parseInt(slider.max);
    console.log('Total timeline days:', totalDays);
    
    // Calculate where 24/11/2023 should be
    const warStart = new Date('2023-10-07');
    const ceasefireDate = new Date('2023-11-24');
    const today = new Date();
    
    const daysSinceWar = Math.floor((today - warStart) / (1000 * 60 * 60 * 24));
    const daysSinceCeasefire = Math.floor((today - ceasefireDate) / (1000 * 60 * 60 * 24));
    
    console.log('Days since war start:', daysSinceWar);
    console.log('Days since ceasefire (24/11/2023):', daysSinceCeasefire);
    console.log('Ceasefire should be at slider position:', daysSinceCeasefire);
    
    // Move slider to ceasefire date
    slider.value = daysSinceCeasefire;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    
    setTimeout(() => {
        // Check where progress bar is now
        const progressBar = document.getElementById('timelineProgress');
        const progressWidth = progressBar.style.width;
        console.log('Progress bar width at ceasefire date:', progressWidth);
        
        // Check handle position
        const handlePercent = (daysSinceCeasefire / totalDays) * 100;
        console.log('Expected handle position %:', handlePercent);
        
        // Find ceasefire event marker
        const ceasefireMarker = Array.from(timelineEvents).find(marker => {
            const style = window.getComputedStyle(marker);
            const leftPercent = parseFloat(style.left);
            return Math.abs(leftPercent - handlePercent) < 1; // Within 1% tolerance
        });
        
        if (ceasefireMarker) {
            console.log('✓ Found ceasefire marker aligned with handle');
        } else {
            console.log('✗ Ceasefire marker NOT aligned with handle');
            console.log('Looking for event markers near position', handlePercent + '%');
            timelineEvents.forEach((marker, i) => {
                const style = window.getComputedStyle(marker);
                const leftPercent = parseFloat(style.left);
                console.log('Marker', i, 'at', leftPercent + '%', '(diff:', Math.abs(leftPercent - handlePercent).toFixed(1) + '%)');
            });
        }
        
    }, 1000);
    
}, 5000); // Wait 5 seconds for full initialization
`;

const PORT = 8005;
server.listen(PORT, () => {
    console.log(`Alignment test server running at http://localhost:${PORT}`);
    
    // Try Chrome/Chromium in headless mode
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
                '--remote-debugging-port=9224',
                '--no-sandbox',
                '--disable-web-security',
                '--enable-logging',
                '--log-level=0',
                '--disable-dev-shm-usage',
                '--virtual-time-budget=15000',
                '--run-all-compositor-stages-before-draw',
                `--evaluate-on-load=(${alignmentTestScript})`,
                `http://localhost:${PORT}/timeline-version.html`
            ], { 
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            chrome.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('BROWSER:', output.trim());
            });
            
            chrome.stderr.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Console') || output.includes('Timeline') || output.includes('Chart') || output.includes('Event') || output.includes('Days') || output.includes('Progress') || output.includes('✓') || output.includes('✗')) {
                    console.log('BROWSER:', output.trim());
                }
            });
            
            chrome.on('close', (code) => {
                console.log(`Test completed with code ${code}`);
                server.close();
                process.exit(0);
            });
            
            chrome.on('error', (error) => {
                console.log(`Chrome error: ${error.message}`);
            });
            
            // Kill after 15 seconds
            setTimeout(() => {
                chrome.kill('SIGTERM');
                setTimeout(() => chrome.kill('SIGKILL'), 2000);
            }, 15000);
            
            chromeFound = true;
            
        } catch (error) {
            console.log(`Failed with ${chromePath}:`, error.message);
        }
    }
    
    if (!chromeFound) {
        console.log('Chrome not found. Please open http://localhost:8005 manually and check browser console.');
        
        // Create test HTML with injected script
        const originalHTML = fs.readFileSync(path.join(__dirname, 'timeline-version.html'), 'utf8');
        const modifiedHTML = originalHTML.replace('</body>', `<script>${alignmentTestScript}</script></body>`);
        fs.writeFileSync(path.join(__dirname, 'timeline-alignment-test.html'), modifiedHTML);
        console.log('Created timeline-alignment-test.html - open this file to see the test results in console.');
    }
});