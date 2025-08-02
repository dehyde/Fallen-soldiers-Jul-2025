// Check for special characters in rank and unit data that could break tooltips
const fs = require('fs');

function parseCsvLine(line) {
    const deathDateField = line;
    
    const hebrewMonths = {
        'באוקטובר': 9, 'בנובמבר': 10, 'בדצמבר': 11, 'בינואר': 0,
        'בפברואר': 1, 'במרץ': 2, 'באפריל': 3, 'במאי': 4,
        'ביוני': 5, 'ביולי': 6, 'באוגוסט': 7, 'בספטמבר': 8
    };

    let deathDate = null;
    
    for (const [hebrewMonth, monthIndex] of Object.entries(hebrewMonths)) {
        const pattern = new RegExp(`(\\d{1,2}) ${hebrewMonth} (\\d{4})`);
        const match = deathDateField.match(pattern);
        if (match) {
            const day = parseInt(match[1]);
            const year = parseInt(match[2]);
            deathDate = new Date(year, monthIndex, day);
            break;
        }
    }

    if (!deathDate) return null;

    let name = 'Unknown';
    let rank = 'Unknown'; 
    let unit = 'Unknown';
    
    // Extract name with improved pattern
    const namePattern = /\s+([א-ת\s'\-\(\)׳]+)\s+ז""ל/;
    const nameMatch = line.match(namePattern);
    if (nameMatch) {
        const fullName = nameMatch[1].trim();
        const cleanName = fullName.replace(/^(רס""[א-ת]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם|אל""ם|\([^)]*\))\s+/, '');
        name = cleanName.trim();
    }
    
    // Extract rank
    const rankPattern = /","(רס""[א-ת\(\)\\s]+|סמל|סרן|רב""ט|סמ""ר|רס""ל|רס""ם[^"]*)/;
    const rankMatch = line.match(rankPattern);
    if (rankMatch) {
        rank = rankMatch[1].trim();
    }
    
    // Extract unit
    const unitPattern = /ז""ל","([^"]+)","([^"]+)","נפל/;
    const unitMatch = line.match(unitPattern);  
    if (unitMatch) {
        unit = unitMatch[2].trim();
    }

    return { name, rank, unit, death_date: deathDate };
}

function parseCsvData(csvText) {
    const lines = csvText.split('\n');
    let currentRecord = '';
    const soldiers = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.match(/^"\d+-\d+"/)) {
            if (currentRecord) {
                const soldier = parseCsvLine(currentRecord);
                if (soldier && soldier.death_date) {
                    soldiers.push(soldier);
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
        }
    }
    
    return soldiers;
}

// Analyze the data for problematic characters
console.log('=== ANALYZING TOOLTIP DATA FOR SPECIAL CHARACTERS ===\n');

try {
    const csvContent = fs.readFileSync('idf-url-increment.csv', 'utf8');
    const soldiers = parseCsvData(csvContent);
    
    console.log(`Total soldiers: ${soldiers.length}\n`);
    
    // Check for problematic characters in rank and unit fields
    const problematicChars = ['"', "'", '<', '>', '&', '\n', '\r', '\t'];
    const problematicSoldiers = [];
    
    soldiers.forEach((soldier, index) => {
        const hasProblematicRank = problematicChars.some(char => soldier.rank.includes(char));
        const hasProblematicUnit = problematicChars.some(char => soldier.unit.includes(char));
        const hasProblematicName = problematicChars.some(char => soldier.name.includes(char));
        
        if (hasProblematicRank || hasProblematicUnit || hasProblematicName) {
            problematicSoldiers.push({
                index,
                name: soldier.name,
                rank: soldier.rank,
                unit: soldier.unit,
                issues: {
                    name: hasProblematicName,
                    rank: hasProblematicRank,
                    unit: hasProblematicUnit
                }
            });
        }
    });
    
    console.log(`Found ${problematicSoldiers.length} soldiers with potentially problematic tooltip data:\n`);
    
    problematicSoldiers.slice(0, 10).forEach((soldier, i) => {
        console.log(`${i + 1}. "${soldier.name}"`);
        console.log(`   Rank: "${soldier.rank}" ${soldier.issues.rank ? '❌' : '✅'}`);
        console.log(`   Unit: "${soldier.unit}" ${soldier.issues.unit ? '❌' : '✅'}`);
        console.log(`   Name: "${soldier.name}" ${soldier.issues.name ? '❌' : '✅'}`);
        console.log('');
    });
    
    if (problematicSoldiers.length > 10) {
        console.log(`... and ${problematicSoldiers.length - 10} more`);
    }
    
    // Test how a tooltip would look
    console.log('\n=== SAMPLE TOOLTIP STRINGS ===');
    soldiers.slice(0, 5).forEach((soldier, i) => {
        const tooltipString = `${soldier.rank} - ${soldier.unit} - ${soldier.death_date.toLocaleDateString()}`;
        console.log(`${i + 1}. "${soldier.name}": title="${tooltipString}"`);
    });
    
} catch (error) {
    console.error('Error:', error);
}