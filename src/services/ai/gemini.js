
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize API
// Ensure VITE_GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateFlashcards = async (diseaseName, topics) => {
    try {
        // User requested gemini-2.5-flash explicitly
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Construct a prompt from the disease data
        // We filter out empty topics to avoid confusing the AI
        const filledTopics = Object.entries(topics)
            .filter(([_, content]) => content && content.trim().length > 0)
            .map(([key, content]) => `${key.toUpperCase()}: ${content}`)
            .join("\n\n");

        if (!filledTopics) throw new Error("O resumo está vazio. Preencha alguns tópicos antes de gerar.");

        const prompt = `
        Você é um preceptor de residência médica exigente.
        Com base no seguinte resumo sobre a doença "${diseaseName}", crie 5 a 10 flashcards de alto nível para estudo.
        
        RESUMO:
        ${filledTopics}

        REGRAS:
        1. Foque em "pegadinhas", quadros clínicos típicos, e tratamentos de primeira linha.
        2. O formato de saída DEVE ser um ARRAY JSON puro. Sem markdown, sem backticks.
        3. Separadores claros se necessário, mas prefira JSON estruturado.
        4. Exemplo de formato:
        [
            { "front": "Qual a primeira linha de tratamento para X?", "back": "Droga Y" },
            { "front": "Paciente com X apresenta Y. Qual o diagnóstico?", "back": "Z" }
        ]
        5. Respostas curtas e diretas.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if the model ignores the "no markdown" rule
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Erro ao gerar flashcards:", error);
        throw error;
    }
};

export const calculateNextReview = (currentStats, quality) => {
    // Quality: 0 (Again), 1 (Hard), 2 (Good), 3 (Easy)

    // Default stats if new for this user
    // We expect currentStats to be the specific user's progress object, or undefined
    let { interval, repetitions, easeFactor } = currentStats || { interval: 0, repetitions: 0, easeFactor: 2.5 };

    if (!interval) interval = 0;
    if (!repetitions) repetitions = 0;
    if (!easeFactor) easeFactor = 2.5;

    if (quality === 0) {
        // Reset
        repetitions = 0;
        interval = 1; // 1 day
    } else {
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions++;
        // Adjust easiness
        easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;
    }

    return {
        interval,
        repetitions,
        easeFactor,
        nextReview: Date.now() + (interval * 24 * 60 * 60 * 1000)
    };
};
