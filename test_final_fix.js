// Test the final fix with Hebrew punctuation
const testCase = '"רס""ם (במיל\') מארק קונונוביץ׳ ז""ל"';

// Final pattern including Hebrew punctuation
const finalPattern = /\s+([א-ת\s'\-\(\)׳]+)\s+ז""ל/;

// Final rank cleaning
const finalRankCleaning = /^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם|אל""ם|\([^)]*\))\s+/;

console.log('=== TESTING FINAL FIX WITH HEBREW PUNCTUATION ===\n');
console.log(`Test case: ${testCase}`);

const match = testCase.match(finalPattern);
console.log(`Pattern result: ${match ? `"${match[1].trim()}"` : 'NO MATCH'}`);

if (match && match[1]) {
    const fullName = match[1].trim();
    const cleanName = fullName.replace(finalRankCleaning, '');
    console.log(`Final cleaned name: "${cleanName.trim()}"`);
}

console.log('\n✅ This should fix the last remaining Unknown name!');