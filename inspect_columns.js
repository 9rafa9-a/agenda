
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

try {
    const buf = readFileSync('amrigs 10 anos.xlsx');
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheet = workbook.Sheets['AMRIGS 2017'] || workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: 'EMPTY' });

    console.log("=== INSPECTING COL H (Index 7) ===");
    rows.slice(0, 20).forEach((row, i) => {
        // Log H to see if it has text
        const hVal = row[7];
        console.log(`Row ${i}: H(7)='${hVal ? hVal.toString().substring(0, 50) + '...' : 'undefined'}'`);
    });

} catch (e) {
    console.error(e);
}
