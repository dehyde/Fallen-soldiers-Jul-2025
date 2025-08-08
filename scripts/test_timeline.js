const puppeteer = require('puppeteer');
const path = require('path');

async function testTimeline() {
    const browser = await puppeteer.launch({ 
        headless: false, // Set to true for headless mode
        devtools: true,
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    const page = await browser.newPage();
    
    // Listen to console logs
    page.on('console', msg => {
        console.log('BROWSER:', msg.text());
    });
    
    // Load the timeline page
    const filePath = path.resolve(__dirname, 'timeline-version.html');
    await page.goto(`file://${filePath}`);
    
    console.log('Page loaded, waiting for initialization...');
    
    // Wait for the page to load and soldiers to render
    await page.waitForSelector('.soldier-name', { timeout: 10000 });
    await page.waitForTimeout(2000); // Give time for initialization
    
    console.log('\n=== TESTING MANUAL SLIDER MOVEMENT ===');
    
    // Test 1: Move slider manually to different positions
    const slider = await page.$('#timelineSlider');
    
    // Get slider max value
    const maxValue = await page.evaluate(() => {
        const slider = document.getElementById('timelineSlider');
        return parseInt(slider.max);
    });
    
    console.log(`Slider range: 0 to ${maxValue}`);
    
    // Test various positions
    const testPositions = [0, 30, 60, 100, 150, 200];
    
    for (const position of testPositions) {
        if (position <= maxValue) {
            console.log(`\n--- Testing position ${position} ---`);
            
            // Set slider value
            await page.evaluate((pos) => {
                const slider = document.getElementById('timelineSlider');
                slider.value = pos;
                slider.dispatchEvent(new Event('input', { bubbles: true }));
            }, position);
            
            await page.waitForTimeout(1000); // Wait for state to settle
            
            // Get current state
            const state = await page.evaluate(() => {
                const aliveCount = document.querySelectorAll('.soldier-name.alive').length;
                const dyingCount = document.querySelectorAll('.soldier-name.dying').length;
                const fallenCount = document.querySelectorAll('.soldier-name.fallen').length;
                const totalCount = document.querySelectorAll('.soldier-name').length;
                
                return { aliveCount, dyingCount, fallenCount, totalCount };
            });
            
            console.log(`State: ${state.aliveCount} alive, ${state.dyingCount} dying, ${state.fallenCount} fallen, ${state.totalCount} total`);
        }
    }
    
    console.log('\n=== TESTING NARRATIVE NAVIGATION ===');
    
    // Test 2: Click narrative buttons to trigger timeline animation
    try {
        // Click continue button to trigger narrative navigation
        const continueBtn = await page.$('#ctaContinue');
        if (continueBtn) {
            console.log('Clicking continue button...');
            await continueBtn.click();
            await page.waitForTimeout(3000); // Wait for animation to complete
        }
        
        // Click back button
        const backBtn = await page.$('#ctaBack');
        if (backBtn) {
            console.log('Clicking back button...');
            await backBtn.click();
            await page.waitForTimeout(3000); // Wait for animation to complete
        }
    } catch (error) {
        console.log('Navigation buttons not available or error:', error.message);
    }
    
    console.log('\n=== TESTING FAST SLIDER MOVEMENT ===');
    
    // Test 3: Rapidly move slider to simulate fast timeline movement
    for (let i = 0; i <= Math.min(100, maxValue); i += 10) {
        await page.evaluate((pos) => {
            const slider = document.getElementById('timelineSlider');
            slider.value = pos;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }, i);
        
        await page.waitForTimeout(50); // Fast movement - 50ms intervals
    }
    
    console.log('Fast movement test completed');
    await page.waitForTimeout(2000); // Wait for final state
    
    // Final state check
    const finalState = await page.evaluate(() => {
        const aliveCount = document.querySelectorAll('.soldier-name.alive').length;
        const dyingCount = document.querySelectorAll('.soldier-name.dying').length;
        const fallenCount = document.querySelectorAll('.soldier-name.fallen').length;
        const totalCount = document.querySelectorAll('.soldier-name').length;
        
        return { aliveCount, dyingCount, fallenCount, totalCount };
    });
    
    console.log(`\nFinal state: ${finalState.aliveCount} alive, ${finalState.dyingCount} dying, ${finalState.fallenCount} fallen, ${finalState.totalCount} total`);
    
    console.log('\nTest completed. Browser will stay open for manual inspection...');
    // Keep browser open for manual inspection
    // await browser.close();
}

// Check if puppeteer is available
try {
    testTimeline().catch(console.error);
} catch (error) {
    console.error('Error: puppeteer not found. Installing...');
    console.log('Please run: npm install puppeteer');
    console.log('Then run this script again.');
}