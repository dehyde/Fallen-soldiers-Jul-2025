// Comprehensive test to find where "Unknown" names come from
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
    
    // Extract name: look for pattern with Hebrew text followed by ז"ל
    const namePattern = /\s+([א-ת\s']+)\s+ז""ל/;
    const nameMatch = line.match(namePattern);
    if (nameMatch) {
        const fullName = nameMatch[1].trim();
        // Remove rank prefix if it exists
        const cleanName = fullName.replace(/^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם)\s+/, '');
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
                    
                    // Count unknowns
                    if (soldier.name === 'Unknown') {
                        unknownNameCount++;
                        console.log(`❌ UNKNOWN NAME found in record: ${currentRecord.substring(0, 100)}...`);
                    }
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
            
            if (soldier.name === 'Unknown') {
                unknownNameCount++;
                console.log(`❌ UNKNOWN NAME found in final record: ${currentRecord.substring(0, 100)}...`);
            }
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

// Read and analyze the CSV
console.log('=== ANALYZING CSV FOR UNKNOWN NAMES ===\n');

try {
    const csvContent = fs.readFileSync('../data/idf-url-increment.csv', 'utf8');
    const result = parseCsvData(csvContent);
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Total soldiers processed: ${result.soldiers.length}`);
    console.log(`Unknown names: ${result.unknownNameCount}`);
    console.log(`Unknown ranks: ${result.unknownRankCount}`);
    console.log(`Unknown units: ${result.unknownUnitCount}`);
    
    if (result.unknownNameCount > 0) {
        console.log(`\n⚠️  ${result.unknownNameCount} soldiers will appear as "Unknown" in the UI!`);
    } else {
        console.log(`\n✅ No "Unknown" names found in the data.`);
        console.log(`If "Unknown" names appear in the UI, the issue is likely in the frontend JavaScript parsing.`);
    }
    
    // Show a few sample parsed names
    console.log(`\n=== SAMPLE PARSED NAMES ===`);
    for (let i = 0; i < Math.min(10, result.soldiers.length); i++) {
        const soldier = result.soldiers[i];
        console.log(`${i+1}. "${soldier.name}" (${soldier.rank}) - ${soldier.unit}`);
    }
    
} catch (error) {
    console.error('Error reading CSV:', error);
}