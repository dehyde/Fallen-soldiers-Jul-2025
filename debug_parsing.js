// Debug script to test CSV parsing
const fs = require('fs');

// Read the CSV file
const csvContent = fs.readFileSync('idf-url-increment.csv', 'utf8');
const lines = csvContent.split('\n');

console.log('First few lines of CSV:');
console.log(lines.slice(0, 10).map((line, i) => `${i}: ${line.substring(0, 100)}...`).join('\n'));

// Test the parsing logic on the first record
let currentRecord = '';
let recordCount = 0;

for (let i = 1; i < lines.length && recordCount < 5; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line.match(/^"\d+-\d+"/)) {
        if (currentRecord) {
            console.log(`\n=== RECORD ${recordCount + 1} ===`);
            console.log('Full record:', currentRecord);
            
            // Test name extraction
            const namePattern = /\s+([א-ת\s']+)\s+ז""ל/;
            const nameMatch = currentRecord.match(namePattern);
            console.log('Name pattern match:', nameMatch);
            
            if (nameMatch) {
                const fullName = nameMatch[1].trim();
                const cleanName = fullName.replace(/^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם)\s+/, '');
                console.log('Extracted name:', cleanName.trim());
            } else {
                console.log('❌ NO NAME MATCH - this would show as "Unknown"');
            }
            
            recordCount++;
        }
        currentRecord = line;
    } else {
        currentRecord += ' ' + line;
    }
}

// Process final record
if (currentRecord && recordCount < 5) {
    console.log(`\n=== RECORD ${recordCount + 1} ===`);
    console.log('Full record:', currentRecord);
    
    const namePattern = /\s+([א-ת\s']+)\s+ז""ל/;
    const nameMatch = currentRecord.match(namePattern);
    console.log('Name pattern match:', nameMatch);
    
    if (nameMatch) {
        const fullName = nameMatch[1].trim();
        const cleanName = fullName.replace(/^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם)\s+/, '');
        console.log('Extracted name:', cleanName.trim());
    } else {
        console.log('❌ NO NAME MATCH - this would show as "Unknown"');
    }
}