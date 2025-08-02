// Test improved parsing with better regex patterns
const fs = require('fs');

function parseCsvLineImproved(line) {
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

    let name = 'Unknown';
    let rank = 'Unknown'; 
    let unit = 'Unknown';
    
    // IMPROVED: Better name extraction - include hyphens, parentheses, and other common Hebrew name characters
    const namePattern = /\s+([א-ת\s'\-\(\)׳״""]+?)\s+ז""ל/;
    const nameMatch = line.match(namePattern);
    if (nameMatch) {
        const fullName = nameMatch[1].trim();
        // Remove rank prefix if it exists - expanded list
        const cleanName = fullName.replace(/^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם|אל""ם|רס""ן|תא""ל|אל""ף)\s*\([^)]*\)?\s*/, '');
        name = cleanName.trim();
    }
    
    // IMPROVED: Extract rank from proper CSV field (field 3)
    const fields = line.split('","');
    if (fields.length >= 4) {
        // Field 3 contains rank
        const rankField = fields[3];
        if (rankField && rankField.trim()) {
            rank = rankField.trim();
        }
    }
    
    // IMPROVED: Extract unit from proper CSV field (field 4) 
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

function parseCsvDataImproved(csvText) {
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
                const soldier = parseCsvLineImproved(currentRecord);
                if (soldier && soldier.death_date) {
                    soldiers.push(soldier);
                    
                    // Count unknowns
                    if (soldier.name === 'Unknown') {
                        unknownNameCount++;
                        console.log(`❌ UNKNOWN NAME: ${currentRecord.substring(0, 150)}...`);
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
        const soldier = parseCsvLineImproved(currentRecord);
        if (soldier && soldier.death_date) {
            soldiers.push(soldier);
            
            if (soldier.name === 'Unknown') {
                unknownNameCount++;
                console.log(`❌ UNKNOWN NAME: ${currentRecord.substring(0, 150)}...`);
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

// Test the improved parsing
console.log('=== TESTING IMPROVED PARSING ===\n');

try {
    const csvContent = fs.readFileSync('idf-url-increment.csv', 'utf8');
    const result = parseCsvDataImproved(csvContent);
    
    console.log(`\n=== IMPROVED RESULTS ===`);
    console.log(`Total soldiers processed: ${result.soldiers.length}`);
    console.log(`Unknown names: ${result.unknownNameCount} (was 9)`);
    console.log(`Unknown ranks: ${result.unknownRankCount} (was 33)`);
    console.log(`Unknown units: ${result.unknownUnitCount} (was 642)`);
    
    console.log(`\n=== SAMPLE PARSED NAMES (IMPROVED) ===`);
    for (let i = 0; i < Math.min(15, result.soldiers.length); i++) {
        const soldier = result.soldiers[i];
        console.log(`${i+1}. "${soldier.name}" (${soldier.rank}) - ${soldier.unit}`);
    }
    
    // Test specific problematic records
    console.log(`\n=== TESTING PREVIOUSLY PROBLEMATIC RECORDS ===`);
    const problematicIds = ['1753822441-132', '1753822458-206', '1753822507-402'];
    
    result.soldiers.forEach(soldier => {
        if (soldier.name.includes('ליאון בר') || soldier.name.includes('שילה הר') || soldier.name.includes('משה אברהם')) {
            console.log(`✅ Fixed: "${soldier.name}" (${soldier.rank}) - ${soldier.unit}`);
        }
    });
    
} catch (error) {
    console.error('Error reading CSV:', error);
}