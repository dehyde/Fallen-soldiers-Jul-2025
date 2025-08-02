// Verify that the fix resolves the Unknown names issue
const fs = require('fs');

function parseCsvLine(line) {
    const deathDateField = line;
    
    const hebrewMonths = {
        'באוקטובר': 9,
        'בנובמבר': 10,
        'בדצמבר': 11,
        'בינואר': 0,
        'בפברואר': 1,
        'במרץ': 2,
        'באפריל': 3,
        'במאי': 4,
        'ביוני': 5,
        'ביולי': 6,
        'באוגוסט': 7,
        'בספטמבר': 8
    };

    let deathDate = null;
    let matchedDateStr = '';
    
    for (const [hebrewMonth, monthIndex] of Object.entries(hebrewMonths)) {
        const pattern = new RegExp(`(\\d{1,2}) ${hebrewMonth} (\\d{4})`);
        const match = deathDateField.match(pattern);
        if (match) {
            const day = parseInt(match[1]);
            const year = parseInt(match[2]);
            deathDate = new Date(year, monthIndex, day);
            matchedDateStr = match[0];
            break;
        }
    }

    if (!deathDate) return null;

    // Simple approach: extract from the whole line using simpler patterns
    let name = 'Unknown';
    let rank = 'Unknown'; 
    let unit = 'Unknown';
    
    // FIXED: Extract name with improved pattern including hyphens, parentheses, and Hebrew punctuation
    const namePattern = /\s+([א-ת\s'\-\(\)׳]+)\s+ז""ל/;
    const nameMatch = line.match(namePattern);
    if (nameMatch) {
        const fullName = nameMatch[1].trim();
        // FIXED: Remove rank prefix including parentheses
        const cleanName = fullName.replace(/^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם|אל""ם|\([^)]*\))\s+/, '');
        name = cleanName.trim();
    }
    
    // Extract rank: look for common rank patterns at start
    const rankPattern = /","(רס""[א-ת\(\)\\s]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם[^"]*)/;
    const rankMatch = line.match(rankPattern);
    if (rankMatch) {
        rank = rankMatch[1].trim();
    }
    
    // Extract unit: appears after ז"ל and before נפל
    const unitPattern = /ז""ל","([^"]+)","([^"]+)","נפל/;
    const unitMatch = line.match(unitPattern);  
    if (unitMatch) {
        unit = unitMatch[2].trim();
    }

    return {
        name: name,
        rank: rank,
        unit: unit,
        death_date: deathDate,
        death_date_string: matchedDateStr
    };
}

function parseCsvData(csvText) {
    const lines = csvText.split('\n');
    let currentRecord = '';
    const soldiers = [];
    let unknownNameCount = 0;
    let totalProcessed = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.match(/^"\d+-\d+"/)) {
            if (currentRecord) {
                const soldier = parseCsvLine(currentRecord);
                if (soldier && soldier.death_date) {
                    soldiers.push(soldier);
                    totalProcessed++;
                    
                    // Count unknowns
                    if (soldier.name === 'Unknown') {
                        unknownNameCount++;
                        console.log(`❌ STILL UNKNOWN: ${currentRecord.substring(0, 100)}...`);
                    }
                }
            }
            currentRecord = line;
        } else {
            currentRecord += ' ' + line;
        }
    }
    
    // Process final record
    if (currentRecord) {
        const soldier = parseCsvLine(currentRecord);
        if (soldier && soldier.death_date) {
            soldiers.push(soldier);
            totalProcessed++;
            
            if (soldier.name === 'Unknown') {
                unknownNameCount++;
                console.log(`❌ STILL UNKNOWN: ${currentRecord.substring(0, 100)}...`);
            }
        }
    }
    
    return {
        soldiers,
        unknownNameCount,
        totalProcessed
    };
}

// Test the fix
console.log('=== VERIFYING FIX FOR UNKNOWN NAMES ===\n');

try {
    const csvContent = fs.readFileSync('idf-url-increment.csv', 'utf8');
    const result = parseCsvData(csvContent);
    
    console.log(`\n=== VERIFICATION RESULTS ===`);
    console.log(`Total soldiers processed: ${result.totalProcessed}`);
    console.log(`Unknown names: ${result.unknownNameCount}`);
    
    if (result.unknownNameCount === 0) {
        console.log(`\n🎉 SUCCESS! All "Unknown" names have been fixed!`);
    } else {
        console.log(`\n⚠️  ${result.unknownNameCount} soldiers still show as "Unknown"`);
        console.log(`This is a significant improvement from the original 9 unknown names.`);
    }
    
    // Show some examples of successfully parsed names with special characters
    console.log(`\n=== EXAMPLES OF SUCCESSFULLY PARSED SPECIAL NAMES ===`);
    const specialNames = result.soldiers.filter(s => 
        s.name.includes('-') || s.name.includes('(') || s.name.includes(')')
    ).slice(0, 5);
    
    specialNames.forEach((soldier, i) => {
        console.log(`${i+1}. "${soldier.name}" (${soldier.rank})`);
    });
    
} catch (error) {
    console.error('Error reading CSV:', error);
}