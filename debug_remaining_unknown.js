// Debug the remaining unknown case
const fs = require('fs');

function findSpecificRecord(csvText, recordId) {
    const lines = csvText.split('\n');
    let currentRecord = '';
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.match(/^"\d+-\d+"/)) {
            if (currentRecord && currentRecord.includes(recordId)) {
                return currentRecord;
            }
            currentRecord = line;
        } else {
            currentRecord += ' ' + line;
        }
    }
    
    // Check final record
    if (currentRecord && currentRecord.includes(recordId)) {
        return currentRecord;
    }
    
    return null;
}

const csvContent = fs.readFileSync('idf-url-increment.csv', 'utf8');
const record = findSpecificRecord(csvContent, '1753822536-529');

if (record) {
    console.log('=== DEBUGGING REMAINING UNKNOWN RECORD ===');
    console.log('Full record:');
    console.log(record);
    
    console.log('\n--- Testing current pattern ---');
    const namePattern = /\s+([א-ת\s'\-\(\)]+)\s+ז""ל/;
    const nameMatch = record.match(namePattern);
    console.log('Current pattern match:', nameMatch);
    
    console.log('\n--- Looking for ז"ל patterns ---');
    const zalPattern = /ז""ל/g;
    const zalMatches = [...record.matchAll(zalPattern)];
    console.log('All ז"ל occurrences:', zalMatches.length);
    
    zalMatches.forEach((match, i) => {
        const startPos = Math.max(0, match.index - 50);
        const endPos = Math.min(record.length, match.index + 20);
        const context = record.substring(startPos, endPos);
        console.log(`  Context ${i+1}: ...${context}...`);
    });
    
    console.log('\n--- All quoted fields ---');
    const quotedFields = record.match(/"[^"]*"/g);
    quotedFields?.forEach((field, i) => {
        if (field.includes('ז""ל')) {
            console.log(`  Field ${i} with ז"ל: ${field}`);
        }
    });
}