const http = require('http');
const fs = require('fs');
const path = require('path');

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

const PORT = 8003;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    
    // Try to use available headless browser
    const { spawn } = require('child_process');
    
    // Try Chrome/Chromium in headless mode
    const chromePaths = [
        'chrome',
        'chromium',
        'google-chrome',
        '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"',
        '"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"'
    ];
    
    for (const chromePath of chromePaths) {
        try {
            console.log(`Trying to launch: ${chromePath}`);
            const chrome = spawn(chromePath, [
                '--headless',
                '--disable-gpu',
                '--remote-debugging-port=9222',
                '--no-sandbox',
                '--disable-web-security',
                `http://localhost:${PORT}/timeline-version.html`
            ], { 
                shell: true,
                stdio: 'pipe'
            });
            
            chrome.stdout.on('data', (data) => {
                console.log('Chrome stdout:', data.toString());
            });
            
            chrome.stderr.on('data', (data) => {
                console.log('Chrome stderr:', data.toString());
            });
            
            chrome.on('close', (code) => {
                console.log(`Chrome exited with code ${code}`);
                server.close();
            });
            
            setTimeout(() => {
                console.log('Closing Chrome...');
                chrome.kill();
            }, 5000);
            
            break;
        } catch (error) {
            console.log(`Failed with ${chromePath}:`, error.message);
        }
    }
});