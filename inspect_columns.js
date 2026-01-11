
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

try {
    const buf = readFileSync('amrigs 10 anos.xlsx');
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheet = workbook.Sheets['AMRIGS 2017'] || workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: 'EMPTY' });

    console.log("=== INSPECTING COLUMNS B (1), C (2), G (6) ===");
    // Sample first 20 rows
    rows.slice(0, 20).forEach((row, i) => {
        console.log(`Row ${i}: B='${row[1]}', C='${row[2]}', G='${row[6]}'`);
    });

    console.log("\n=== COUNTING NON-EMPTY G (6) ===");
    let countG = 0;
    let total = 0;
    rows.forEach(row => {
        if (row[1] && row[1] !== 'EMPTY') { // If row has Area
            total++;
            if (row[6] && row[6] !== 'EMPTY') countG++;
        }
    });
    console.log(`Total Rows with Area: ${total}`);
    console.log(`Rows with Focus (G): ${countG}`);

} catch (e) {
    console.error(e);
}
