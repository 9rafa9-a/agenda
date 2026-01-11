
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

try {
    const buf = readFileSync('amrigs 10 anos.xlsx');
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheet = workbook.Sheets['AMRIGS 2017'] || workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: 'EMPTY' });

    console.log("=== INSPECTING COLS D (3) AND G (6) ===");
    rows.slice(0, 20).forEach((row, i) => {
        // Log the whole row for context if needed, but focus on 3 and 6
        // JSON.stringify to see if it's really undefined or empty string
        console.log(`Row ${i}: D(3)='${row[3]}', G(6)='${row[6]}', H(7)='${row[7]}'`);
        // Checking H too just in case it shifted
    });

} catch (e) {
    console.error(e);
}
