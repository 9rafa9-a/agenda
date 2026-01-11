
import React, { useState, useEffect } from 'react';
import { searchPubMed, fetchArticleDetails, fetchAbstract } from '../../services/pubmed';
import { X, Search, ExternalLink, BookOpen, Filter, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const EvidencePanel = ({ diseaseName, onClose }) => {
    const [query, setQuery] = useState(diseaseName);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('guideline'); // Default to guidelines as they are most useful
    const [expandedAbstract, setExpandedAbstract] = useState(null); // PMID of expanded card
    const [abstractLoading, setAbstractLoading] = useState(false);
    const [abstractContent, setAbstractContent] = useState({}); // Cache abstracts

    useEffect(() => {
        if (diseaseName) {
            handleSearch();
        }
    }, []); // Run once on mount

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        setArticles([]);
        try {
            const pmids = await searchPubMed(query, filter);
            if (pmids.length > 0) {
                const details = await fetchArticleDetails(pmids);
                setArticles(details);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleAbstract = async (id) => {
        if (expandedAbstract === id) {
            setExpandedAbstract(null);
            return;
        }

        setExpandedAbstract(id);

        // If not cached, fetch it
        if (!abstractContent[id]) {
            setAbstractLoading(true);
            const text = await fetchAbstract(id);
            setAbstractContent(prev => ({ ...prev, [id]: text }));
            setAbstractLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: '450px', maxWidth: '90vw',
            background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid #eee'
        }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1565c0' }}>
                        <BookOpen size={20} /> Evidências
                    </h2>
                    <button id="btn-close-evidence" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ position: 'relative' }}>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Pesquisar no PubMed..."
                        style={{
                            width: '100%', padding: '10px 40px 10px 16px', borderRadius: '8px',
                            border: '1px solid #ddd', outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                    >
                        <Search size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div id="evidence-filters-container" style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {['all', 'guideline', 'review', 'clinical_trial'].map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setTimeout(handleSearch, 0); }} // Trigger search after state update (hacky, ideally use useEffect)
                            style={{
                                padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', whiteSpace: 'nowrap',
                                border: '1px solid',
                                cursor: 'pointer',
                                background: filter === f ? '#e3f2fd' : '#fff',
                                borderColor: filter === f ? '#2196f3' : '#ddd',
                                color: filter === f ? '#1565c0' : '#666'
                            }}
                        >
                            {f === 'all' && 'Tudo'}
                            {f === 'guideline' && 'Diretrizes'}
                            {f === 'review' && 'Revisões'}
                            {f === 'clinical_trial' && 'Ensaios'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fafafa' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        <Loader2 className="spin" size={32} />
                        <p>Buscando na ciência...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        <p>Nenhum artigo encontrado.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {articles.map(article => (
                            <div key={article.id} style={{
                                background: '#fff', padding: '16px', borderRadius: '12px',
                                border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {article.journal} • {article.pubDate ? new Date(article.pubDate).getFullYear() : ''}
                                </div>
                                <h3 style={{ fontSize: '1rem', margin: '0 0 8px 0', lineHeight: '1.4', color: '#333' }}>
                                    {article.title}
                                </h3>
                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
                                    {article.authors}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid #f5f5f5' }}>
                                    <button
                                        onClick={() => toggleAbstract(article.id)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            fontSize: '0.85rem', color: '#1976d2', fontWeight: '500',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        {expandedAbstract === article.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        {expandedAbstract === article.id ? 'Fechar Resumo' : 'Ler Resumo'}
                                    </button>

                                    <a
                                        href={`https://pubmed.ncbi.nlm.nih.gov/${article.id}/`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontSize: '0.85rem', color: '#666', textDecoration: 'none',
                                            display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto'
                                        }}
                                    >
                                        PubMed <ExternalLink size={14} />
                                    </a>
                                </div>

                                {/* Abstract Content */}
                                {expandedAbstract === article.id && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.5', color: '#444' }}>
                                        {abstractLoading && !abstractContent[article.id] ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888' }}>
                                                <Loader2 className="spin" size={16} /> Carregando texto...
                                            </div>
                                        ) : (
                                            abstractContent[article.id]
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default EvidencePanel;
