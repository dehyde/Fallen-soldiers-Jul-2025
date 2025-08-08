// Test the HTML escaping fix for tooltips
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Test problematic tooltip cases
const testCases = [
    {
        name: 'ויטלי סקיפקביץ\'',
        rank: 'רס""ל',
        unit: 'עוצבת הקומנדו',
        date: '10/7/2023'
    },
    {
        name: 'ליאון בר (בן מוחה)',
        rank: 'אל""ם (במיל\')',
        unit: 'אוגדת יהודה ושומרון',
        date: '10/8/2023'
    },
    {
        name: 'שילה הר-אבן',
        rank: 'רס""ן',
        unit: 'חטיבת גולני',
        date: '10/7/2023'
    }
];

console.log('=== TESTING TOOLTIP HTML ESCAPING ===\n');

testCases.forEach((testCase, i) => {
    const tooltipText = `${testCase.rank} - ${testCase.unit} - ${testCase.date}`;
    const escapedTooltip = escapeHtml(tooltipText);
    
    console.log(`Test case ${i + 1}: ${testCase.name}`);
    console.log(`Original tooltip: "${tooltipText}"`);
    console.log(`Escaped tooltip:  "${escapedTooltip}"`);
    
    // Show how it would appear in HTML
    const htmlBefore = `<div title="${tooltipText}">${testCase.name}</div>`;
    const htmlAfter = `<div title="${escapedTooltip}">${testCase.name}</div>`;
    
    console.log(`HTML before (broken): ${htmlBefore}`);
    console.log(`HTML after (fixed):   ${htmlAfter}`);
    console.log('');
});

console.log('✅ The HTML escaping should fix all tooltip issues!');