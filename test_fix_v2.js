// Test the improved regex pattern with better rank cleaning
const testData = [
    '"רס""ל ויטלי סקיפקביץ\' ז""ל"', // Working case
    '"אל""ם (במיל\') ליאון בר (בן מוחה) ז""ל"', // Parentheses case
    '"רס""ן שילה הר-אבן ז""ל"', // Hyphen case
    '"רס""ן משה אברהם בר-און ז""ל"' // Another hyphen case
];

// New pattern (fixed)
const newPattern = /\s+([א-ת\s'\-\(\)]+)\s+ז""ל/;

// Improved rank cleaning
const improvedRankCleaning = /^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם|אל""ם|[^א-ת]*)\s+/;

console.log('=== TESTING IMPROVED REGEX FIX ===\n');

testData.forEach((data, i) => {
    console.log(`Test case ${i + 1}: ${data}`);
    
    const newMatch = data.match(newPattern);
    
    console.log(`  Pattern result: ${newMatch ? `"${newMatch[1].trim()}"` : 'NO MATCH'}`);
    
    if (newMatch && newMatch[1]) {
        // Apply the improved rank cleaning logic
        const fullName = newMatch[1].trim();
        const cleanName = fullName.replace(improvedRankCleaning, '');
        console.log(`  Final cleaned name: "${cleanName.trim()}"`);
    }
    
    console.log('');
});

console.log('✅ The improved fix should handle all rank prefixes!');