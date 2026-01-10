
const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const DB = 'pubmed';

/**
 * Searches PubMed for a given term and returns a list of PMIDs.
 * @param {string} term - The search query (e.g., "Asthma treatment").
 * @param {string} filter - Optional filter (e.g., "guideline", "systematic review").
 * @returns {Promise<string[]>} - Array of PMIDs.
 */
export const searchPubMed = async (term, filter = 'all') => {
    try {
        let query = term;

        // Append filters to the query
        if (filter === 'guideline') query += ' AND (Practice Guideline[pt] OR Guideline[pt])';
        if (filter === 'review') query += ' AND (Systematic Review[pt] OR Meta-Analysis[pt])';
        if (filter === 'clinical_trial') query += ' AND (Clinical Trial[pt])';

        // Sort by relevance (or date) and get JSON
        const url = `${BASE_URL}/esearch.fcgi?db=${DB}&term=${encodeURIComponent(query)}&retmode=json&retmax=10&sort=relevance`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.esearchresult || !data.esearchresult.idlist) {
            return [];
        }

        return data.esearchresult.idlist;
    } catch (error) {
        console.error("PubMed Search Error:", error);
        return [];
    }
};

/**
 * Fetches details (Title, Abstract, Journal, Authors) for a list of PMIDs.
 * @param {string[]} pmids - Array of PMIDs.
 * @returns {Promise<Object[]>} - Array of article objects.
 */
export const fetchArticleDetails = async (pmids) => {
    if (!pmids || pmids.length === 0) return [];

    try {
        const idString = pmids.join(',');
        // ESummary gives basic info, but we often need EFetch for abstracts. 
        // However, ESummary is lighter JSON. Let's try ESummary first for lists.
        const url = `${BASE_URL}/esummary.fcgi?db=${DB}&id=${idString}&retmode=json`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.result) return [];

        // Transform the object { "123": {...}, "456": {...}, uids: [...] } into an array
        const articles = data.result.uids.map(id => {
            const item = data.result[id];
            return {
                id,
                title: item.title,
                authors: item.authors ? item.authors.map(a => a.name).slice(0, 3).join(', ') + (item.authors.length > 3 ? ' et al.' : '') : 'Unknown',
                journal: item.source,
                pubDate: item.pubdate,
                doi: item.elocationid, // often contains doi
                // ESummary doesn't always provide the full abstract. We might need a separate call for that or use EFetch.
                // For now, we'll leave abstract blank and fetch on demand if needed, or check if available.
            };
        });

        return articles;
    } catch (error) {
        console.error("PubMed Details Error:", error);
        return [];
    }
};

/**
 * Fetches the abstract for a specific PMID using EFetch.
 * @param {string} pmid 
 * @returns {Promise<string>} - The abstract text.
 */
export const fetchAbstract = async (pmid) => {
    try {
        // retmode=xml is default/better for reliable abstract extraction, but let's try text/abstract
        const url = `${BASE_URL}/efetch.fcgi?db=${DB}&id=${pmid}&rettype=abstract&retmode=text`;

        const response = await fetch(url);
        const text = await response.text();

        return text || "Resumo não disponível.";
    } catch (error) {
        console.error("PubMed Abstract Error:", error);
        return "Erro ao carregar resumo.";
    }
};
