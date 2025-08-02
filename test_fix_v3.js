// Test the final regex pattern with specific parentheses handling
const testData = [
    '"רס""ל ויטלי סקיפקביץ\' ז""ל"', // Working case
    '"אל""ם (במיל\') ליאון בר (בן מוחה) ז""ל"', // Parentheses case
    '"רס""ן שילה הר-אבן ז""ל"', // Hyphen case
    '"רס""ן משה אברהם בר-און ז""ל"' // Another hyphen case
];

// New pattern (fixed)
const newPattern = /\s+([א-ת\s'\-\(\)]+)\s+ז""ל/;

// Final rank cleaning with parentheses handling
const finalRankCleaning = /^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם|אל""ם|\([^)]*\))\s+/;

console.log('=== TESTING FINAL REGEX FIX ===\n');

testData.forEach((data, i) => {
    console.log(`Test case ${i + 1}: ${data}`);
    
    const newMatch = data.match(newPattern);
    
    console.log(`  Pattern result: ${newMatch ? `"${newMatch[1].trim()}"` : 'NO MATCH'}`);
    
    if (newMatch && newMatch[1]) {
        // Apply the final rank cleaning logic
        const fullName = newMatch[1].trim();
        const cleanName = fullName.replace(finalRankCleaning, '');
        console.log(`  Final cleaned name: "${cleanName.trim()}"`);
    }
    
    console.log('');
});

console.log('✅ The final fix should handle all cases including parentheses!');