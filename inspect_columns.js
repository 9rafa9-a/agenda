
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

try {
    const buf = readFileSync('amrigs 10 anos.xlsx');
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheet = workbook.Sheets['AMRIGS 2017'] || workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: 'EMPTY' });

    console.log("=== INSPECTING UNIQUE AREAS (Column B/1) ===");
    const areas = new Set();
    rows.forEach(row => {
        if (row[1] && typeof row[1] === 'string' && row[1] !== 'Grande Área') {
            areas.add(row[1].trim());
        }
    });
    console.log(Array.from(areas).sort());

} catch (e) {
    console.error(e);
}
