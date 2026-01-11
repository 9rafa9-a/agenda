
import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const INPUT_FILE = 'amrigs 10 anos.xlsx';
const OUTPUT_FILE = 'src/data/amrigs_stats.json';

try {
    const buf = readFileSync(INPUT_FILE);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    let allQuestions = [];

    // Helper to identify column indices based on content
    const findColumns = (row) => {
        // Simple heuristic mapping
        // We expect: ID, Area, Specialty, Topic ... Focus ... Summary
        // Or row might vary.
        // Let's assume standard order based on inspection:
        // Col 0: Question #
        // Col 1: Area (Cirurgia, Clinica...)
        // Col 2: Specialty
        // Col 3: Topic
        // ...
        // Col 6 or similar: Focus [Tratamento]
        // Col 7 or similar: Summary
        return { id: 0, area: 1, specialty: 2, topic: 3, focus: 6, summary: 7 };
    };

    workbook.SheetNames.forEach(sheetName => {
        if (sheetName.includes('Gráfico')) return;

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

        let year = '2017'; // Default fallback
        // Try to extract year from sheet name
        const nameMatch = sheetName.match(/20\d{2}/);
        if (nameMatch) year = nameMatch[0];

        // Inspect first few rows to find where data starts and identifying Focus column
        let tempYear = year;
        let focusColIndex = -1;

        // Scan first 20 rows to find a column that looks like Focus (starts with [)
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const r = rows[i];
            if (!r) continue;
            r.forEach((cell, cellIdx) => {
                if (typeof cell === 'string' && /^\[.*\]$/.test(cell.trim())) {
                    focusColIndex = cellIdx;
                }
            });
            if (focusColIndex !== -1) break;
        }

        // Fallback if strictly bracketed format not found, try keywords
        if (focusColIndex === -1) {
            for (let i = 0; i < Math.min(rows.length, 20); i++) {
                const r = rows[i];
                if (!r) continue;
                r.forEach((cell, cellIdx) => {
                    if (typeof cell === 'string' && (cell.includes('Diagnóstico') || cell.includes('Tratamento'))) {
                        focusColIndex = cellIdx;
                    }
                });
                if (focusColIndex !== -1) break;
            }
        }

        // If still not found, default to 6 but warn
        if (focusColIndex === -1 && rows.length > 5) {
            // console.warn(`Could not identify Focus column for sheet ${sheetName}, defaulting to 6`);
            focusColIndex = 6;
        }

        rows.forEach((row, idx) => {
            if (!row || row.length === 0) return;

            // Check if row is a header or title
            const firstCell = String(row[0]);
            if (firstCell.includes('AMRIGS')) {
                const yearMatch = firstCell.match(/20\d{2}/);
                if (yearMatch) tempYear = yearMatch[0];
                return;
            }
            if (firstCell.includes('Questão') || firstCell.includes('Grande Área')) return; // Header row

            // Data extraction
            // Ensure first cell is a number (Question ID) and Col 1 is a String (Area)
            if (!isNaN(parseInt(firstCell)) && typeof row[1] === 'string') {
                const cols = findColumns(row);

                // Clean Area Name (sometimes has whitespace)
                let area = row[cols.area]?.trim();
                if (!area) return;

                // Extract Focus using dynamic index
                let focus = row[focusColIndex];
                if (focus && typeof focus === 'string') {
                    focus = focus.replace(/[\[\]]/g, '').trim();
                } else {
                    focus = 'Indefinido';
                }

                allQuestions.push({
                    year: parseInt(tempYear),
                    id: row[cols.id],
                    area: area,
                    specialty: row[cols.specialty]?.trim() || 'Geral',
                    topic: row[cols.topic]?.trim() || 'Outros',
                    focus: focus,
                    summary: row[cols.summary] || ''
                });
            }
        });
    });

    // Ensure dir exists
    if (!existsSync('src/data')) mkdirSync('src/data');

    writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));
    console.log(`Successfully processed ${allQuestions.length} questions.`);
    console.log(`Saved to ${OUTPUT_FILE}`);

} catch (e) {
    console.error("Error processing:", e);
}
