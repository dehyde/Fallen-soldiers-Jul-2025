// Verify that the HTML parsing fix works
const fs = require('fs');

// Copy the EXACT parsing function from the updated HTML
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
    
    // IMPROVED: Better name extraction - include more Hebrew name characters
    const namePattern = /\s+([א-ת\s'\-\(\)׳״""]+?)\s+ז""ל/;
    const nameMatch = line.match(namePattern);
    if (nameMatch) {
        const fullName = nameMatch[1].trim();
        // Remove rank prefix if it exists - expanded list
        const cleanName = fullName.replace(/^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם|אל""ם|רס""ן|תא""ל|אל""ף)\s*\([^)]*\)?\s*/, '');
        name = cleanName.trim();
    }
    
    // IMPROVED: Extract rank and unit from proper CSV fields instead of regex
    const fields = line.split('","');
    if (fields.length >= 4) {
        // Field 3 contains rank
        const rankField = fields[3];
        if (rankField && rankField.trim()) {
            rank = rankField.trim();
        }
    }
    
    if (fields.length >= 5) {
        // Field 4 contains unit
        const unitField = fields[4];
        if (unitField && unitField.trim()) {
            unit = unitField.trim();
        }
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
    let unknownRankCount = 0;
    let unknownUnitCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.match(/^"\d+-\d+"/)) {
            if (currentRecord) {
                const soldier = parseCsvLine(currentRecord);
                if (soldier && soldier.death_date) {
                    soldiers.push(soldier);
                    
                    if (soldier.name === 'Unknown') unknownNameCount++;
                    if (soldier.rank === 'Unknown') unknownRankCount++;
                    if (soldier.unit === 'Unknown') unknownUnitCount++;
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
            
            if (soldier.name === 'Unknown') unknownNameCount++;
            if (soldier.rank === 'Unknown') unknownRankCount++;
            if (soldier.unit === 'Unknown') unknownUnitCount++;
        }
    }
    
    return {
        soldiers,
        unknownNameCount,
        unknownRankCount,
        unknownUnitCount
    };
}

// Test with the HTML parsing function
console.log('=== VERIFYING HTML PARSING FIX ===\n');

try {
    const csvContent = fs.readFileSync('idf-url-increment.csv', 'utf8');
    const result = parseCsvData(csvContent);
    
    console.log(`✅ VERIFICATION RESULTS:`);
    console.log(`Total soldiers processed: ${result.soldiers.length}`);
    console.log(`Unknown names: ${result.unknownNameCount}`);
    console.log(`Unknown ranks: ${result.unknownRankCount}`);
    console.log(`Unknown units: ${result.unknownUnitCount}`);
    
    if (result.unknownNameCount === 0 && result.unknownUnitCount <= 5) {
        console.log(`\n🎉 SUCCESS! The fix should work in the HTML application.`);
    } else {
        console.log(`\n⚠️  There may still be issues that need addressing.`);
    }
    
    // Show a few examples
    console.log(`\n=== SAMPLE RESULTS ===`);
    for (let i = 0; i < Math.min(10, result.soldiers.length); i++) {
        const soldier = result.soldiers[i];
        console.log(`${i+1}. "${soldier.name}" (${soldier.rank}) - ${soldier.unit}`);
    }
    
} catch (error) {
    console.error('Error reading CSV:', error);
}