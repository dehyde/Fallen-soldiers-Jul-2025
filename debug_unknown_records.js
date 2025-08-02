// Debug specific records that are producing "Unknown" names
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

// Debug the first few problematic records
const problematicIds = [
    '1753822441-132',
    '1753822458-206', 
    '1753822507-402'
];

problematicIds.forEach(id => {
    const record = findSpecificRecord(csvContent, id);
    if (record) {
        console.log(`\n=== DEBUGGING RECORD ${id} ===`);
        console.log('Full record:');
        console.log(record);
        console.log('\n--- Testing name extraction patterns ---');
        
        // Test the main name pattern
        const namePattern = /\s+([א-ת\s']+)\s+ז""ל/;
        const nameMatch = record.match(namePattern);
        console.log('Main name pattern match:', nameMatch);
        
        // Test alternative patterns
        const altPattern1 = /","([^"]*ז""ל[^"]*)",/;
        const altMatch1 = record.match(altPattern1);
        console.log('Alternative pattern 1 (field with ז"ל):', altMatch1);
        
        // Look for Hebrew text in quoted fields
        const quotedFields = record.match(/"[^"]*"/g);
        console.log('All quoted fields:');
        quotedFields?.forEach((field, i) => {
            if (field.includes('ז""ל')) {
                console.log(`  Field ${i}: ${field}`);
            }
        });
        
        // Test if there's Hebrew text but in different format
        const hebrewPattern = /[א-ת]+/g;
        const hebrewMatches = record.match(hebrewPattern);
        console.log('All Hebrew text found:', hebrewMatches?.slice(0, 10));
    }
});

// Also test what happens with a working record for comparison
const workingRecord = findSpecificRecord(csvContent, '1753822410-1');
if (workingRecord) {
    console.log(`\n=== COMPARISON: WORKING RECORD ===`);
    console.log('Full record:');
    console.log(workingRecord.substring(0, 200) + '...');
    
    const namePattern = /\s+([א-ת\s']+)\s+ז""ל/;
    const nameMatch = workingRecord.match(namePattern);
    console.log('Name pattern match on working record:', nameMatch);
}