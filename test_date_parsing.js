// Test the date parsing fix
const testDates = [
    '7/10/2023',    // Should be Oct 7, 2023
    '27/10/2023',   // Should be Oct 27, 2023  
    '24/11/2023',   // Should be Nov 24, 2023
    '1/12/2023',    // Should be Dec 1, 2023
    '28/7/2025'     // Should be July 28, 2025
];

console.log('Testing date parsing fix:');
console.log('='.repeat(50));

testDates.forEach(dateStr => {
    // Old method (broken)
    const oldDate = new Date(dateStr);
    
    // New method (fixed)
    const [day, month, year] = dateStr.split('/');
    const correctedDateString = `${month}/${day}/${year}`;
    const newDate = new Date(correctedDateString);
    
    console.log(`Original: ${dateStr}`);
    console.log(`  Old parsing: ${isNaN(oldDate.getTime()) ? 'INVALID' : oldDate.toISOString() + ' (' + oldDate.toDateString() + ')'}`);
    console.log(`  New parsing: ${newDate.toISOString()} (${newDate.toDateString()})`);
    console.log(`  Valid: ${!isNaN(newDate.getTime())}`);
    console.log('-'.repeat(30));
});

// Test timeline positioning
const startDate = new Date('2023-10-26');  // War start reference
const endDate = new Date();  // Today
const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

console.log(`\nTimeline positioning test:`);
console.log(`Start date: ${startDate.toDateString()}`);
console.log(`End date: ${endDate.toDateString()}`);
console.log(`Total days: ${totalDays}`);
console.log('='.repeat(50));

testDates.forEach(dateStr => {
    const [day, month, year] = dateStr.split('/');
    const correctedDateString = `${month}/${day}/${year}`;
    const eventDate = new Date(correctedDateString);
    
    const daysDiff = Math.floor((endDate - eventDate) / (1000 * 60 * 60 * 24));
    const position = (daysDiff / totalDays) * 100;
    
    console.log(`${dateStr} -> ${eventDate.toDateString()}`);
    console.log(`  Days from today: ${daysDiff}, Position: ${position.toFixed(1)}%`);
    console.log(`  In range (0-100%): ${position >= 0 && position <= 100}`);
    console.log('-'.repeat(30));
});