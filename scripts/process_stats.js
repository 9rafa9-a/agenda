
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

        // Fallback: look for keywords but ensure it's not the Topic column (which is usually long text)
        if (focusColIndex === -1) {
            for (let i = 0; i < Math.min(rows.length, 25); i++) {
                const r = rows[i];
                if (!r) continue;
                r.forEach((cell, cellIdx) => {
                    if (typeof cell === 'string') {
                        // Must be short (< 50 chars) to avoid picking up Topics like "Diagnóstico Diferencial do Abdome Agudo..."
                        // Must NOT be the Area or Specialty columns (0, 1, 2)
                        // Must NOT be the Topic column (usually 3)
                        if (cell.length < 50 && cellIdx > 3 && (cell.includes('Diagnóstico') || cell.includes('Tratamento') || cell.includes('Conduta') || cell.includes('Quadro'))) {
                            focusColIndex = cellIdx;
                        }
                    }
                });
                if (focusColIndex !== -1) break;
            }
        }

        // If still not found, FORCE DEFAULT TO 6 (Column G) as per user request
        if (focusColIndex === -1) {
            focusColIndex = 6;
        }

        // Detect Summary Column (usually long text, not Topic)
        let summaryColIndex = -1;
        if (summaryColIndex === -1) {
            for (let i = 0; i < Math.min(rows.length, 25); i++) {
                const r = rows[i];
                if (!r) continue;
                r.forEach((cell, cellIdx) => {
                    if (typeof cell === 'string') {
                        // Summary is usually the longest cell, distinct from Topic
                        // Must be AFTER Topic/Focus
                        if (cell.length > 50 && cellIdx > focusColIndex && !cell.includes('Questão')) {
                            summaryColIndex = cellIdx;
                        }
                    }
                });
                if (summaryColIndex !== -1) break;
            }
        }

        // Default Summary if not found (Col 7 / H)
        if (summaryColIndex === -1) summaryColIndex = 7;

        rows.forEach((row, idx) => {
            if (!row || row.length === 0) return;

            // Check if row is a header or title
            const firstCell = String(row[0]);
            // Attempt to capture Year from Column A if it mimics a Year (2017-2026)
            // Or fallback to sheet year
            let rowYear = tempYear;
            // Does Col 0 look like a year? (2017, 2018...)
            // But often Col 0 is Question ID. User said Col A is Year.
            // If Col 0 is 2017, then Question ID is Col B?
            // Let's rely on Sheet Name for year as primary source unless Col A is clearly a year > 2000
            if (!isNaN(parseInt(firstCell)) && parseInt(firstCell) > 2000 && parseInt(firstCell) < 2030) {
                rowYear = firstCell;
                // If ID is shifted, we need to adjust findColumns logic?
                // For now, let's assume the standard layout provided in earlier inspection where Col 0 was 1, 2, 3...
            }


            if (firstCell.includes('AMRIGS')) {
                const yearMatch = firstCell.match(/20\d{2}/);
                if (yearMatch) tempYear = yearMatch[0];
                return;
            }
            if (firstCell.includes('Questão') || firstCell.includes('Grande Área')) return; // Header row

            // Data extraction
            // Ensure first cell is a number (Question ID) and Col 1 is a String (Area)
            // OR if Col A is Year, then Col B is ID.
            // Let's stick to the structure we SAW: Col 0 = ID.
            if (!isNaN(parseInt(firstCell)) && typeof row[1] === 'string') {
                const cols = findColumns(row);

                // Clean and Normalize Area Name
                let area = row[cols.area]?.trim();

                // Normalization Map
                if (area) {
                    // Fix typos and consolidate
                    if (area === 'Clinica Medica') area = 'Clínica Médica';
                    if (area === 'Ginecologia' || area === 'Obstetrícia') area = 'Ginecologia e Obstetrícia';
                    if (area === 'Preventiva') area = 'Medicina Preventiva';
                    if (area.includes('Psiquiatria')) {
                        // Decide where Psych goes. Usually Clinic or its own.
                        // If it's "Pediatria / Psiquiatria", maybe duplicate? 
                        // For simplicity, let's map "Pediatria / Psiquiatria" to Pediatria if it's primarily child psych, 
                        // or keep it separate. The user wants 5 macro areas usually. 
                        // Let's keep Psiquiatria separate if it exists alone, or map to Clínica if standard.
                        // AMRIGS usually has Psiquiatria separate or part of Clinic. 
                        // Let's assume separate is fine, but "Pediatria / Psiquiatria" -> Pediatria for now to reduce clutter.
                        if (area.includes('Pediatria')) area = 'Pediatria';
                    }
                }

                if (!area) return;

                // Extract Focus using dynamic index
                let focus = row[focusColIndex];
                if (focus && typeof focus === 'string') {
                    focus = focus.replace(/[\[\]]/g, '').trim();
                } else {
                    focus = 'Indefinido';
                }

                // Extract Summary
                const summary = row[summaryColIndex] || '';

                allQuestions.push({
                    year: parseInt(rowYear),
                    id: row[cols.id],
                    area: area,
                    specialty: row[cols.specialty]?.trim() || 'Geral',
                    topic: row[cols.topic]?.trim() || 'Outros',
                    focus: focus,
                    summary: summary,
                    summaryLength: summary.length
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
