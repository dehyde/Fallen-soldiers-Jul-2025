// Test the fixed regex pattern
const testData = [
    '"רס""ל ויטלי סקיפקביץ\' ז""ל"', // Working case
    '"אל""ם (במיל\') ליאון בר (בן מוחה) ז""ל"', // Parentheses case
    '"רס""ן שילה הר-אבן ז""ל"', // Hyphen case
    '"רס""ן משה אברהם בר-און ז""ל"' // Another hyphen case
];

// Old pattern (broken)
const oldPattern = /\s+([א-ת\s']+)\s+ז""ל/;

// New pattern (fixed)
const newPattern = /\s+([א-ת\s'\-\(\)]+)\s+ז""ל/;

console.log('=== TESTING REGEX FIX ===\n');

testData.forEach((data, i) => {
    console.log(`Test case ${i + 1}: ${data}`);
    
    const oldMatch = data.match(oldPattern);
    const newMatch = data.match(newPattern);
    
    console.log(`  Old pattern result: ${oldMatch ? `"${oldMatch[1].trim()}"` : 'NO MATCH'}`);
    console.log(`  New pattern result: ${newMatch ? `"${newMatch[1].trim()}"` : 'NO MATCH'}`);
    
    if (newMatch && newMatch[1]) {
        // Apply the rank cleaning logic
        const fullName = newMatch[1].trim();
        const cleanName = fullName.replace(/^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם)\s+/, '');
        console.log(`  Final cleaned name: "${cleanName.trim()}"`);
    }
    
    console.log('');
});

console.log('✅ The fix should resolve the "Unknown" names issue!');