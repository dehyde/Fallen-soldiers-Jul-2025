const fs = require('fs');

function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Test the final lines
const csvContent = fs.readFileSync('narrative.csv', 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim()); // Remove empty lines

console.log('Total lines:', lines.length);
console.log('Header fields:', parseCsvLine(lines[0]).length);
console.log('Header:', parseCsvLine(lines[0]));

console.log('\nLast month line (15):');
const lastMonthLine = lines[14]; // 0-based, so line 15 is index 14
console.log('Fields count:', parseCsvLine(lastMonthLine).length);
console.log('Fields:', parseCsvLine(lastMonthLine));

console.log('\nMonthly average line (16):');
const monthlyLine = lines[15]; // 0-based, so line 16 is index 15
console.log('Fields count:', parseCsvLine(monthlyLine).length);
console.log('Fields:', parseCsvLine(monthlyLine));

console.log('\nField comparison:');
const headerFields = parseCsvLine(lines[0]);
const lastMonthFields = parseCsvLine(lastMonthLine);
const monthlyFields = parseCsvLine(monthlyLine);
console.log('Header count:', headerFields.length);
console.log('Last month count:', lastMonthFields.length);
console.log('Monthly average count:', monthlyFields.length);
console.log('Last month match:', headerFields.length === lastMonthFields.length);
console.log('Monthly average match:', headerFields.length === monthlyFields.length);