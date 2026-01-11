
import React, { useState, useMemo } from 'react';
import statsData from '../../data/amrigs_stats.json';
import { X, Filter, FileText, Target, Calendar, Info, CheckSquare, Square, RefreshCw } from 'lucide-react';

const ExamContextPanel = ({ diseaseName, editorContent = {}, onClose }) => {
    // 1. Get Questions
    const examQuestions = useMemo(() => {
        if (!diseaseName) return [];
        const normalizedName = diseaseName.toLowerCase().trim();

        return statsData.filter(d => {
            if (!d.topic) return false;
            // Fuzzy match: check if one contains the other
            const t = d.topic.toLowerCase().trim();
            if (t.length < 4) return false; // Avoid short matches
            return t.includes(normalizedName) || normalizedName.includes(t);
        }).sort((a, b) => b.year - a.year);
    }, [diseaseName]);

    const [filterFocus, setFilterFocus] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'list' (Questions) or 'checklist' (Keywords)

    // 2. Extract Keywords (Naive extraction for now)
    const keywords = useMemo(() => {
        const words = new Set();
        const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'em', 'no', 'na', 'por', 'para', 'com', 'que', 'e', 'ou', 'se', 'mas', 'não', 'foi', 'é', 'são', 'ser', 'ter', 'haver', 'sobre', 'paciente', 'anos', 'caso', 'qual', 'assinale', 'correta', 'incorreta', 'alternativa', 'diagnóstico', 'tratamento', 'conduta', 'apresenta'];

        examQuestions.forEach(q => {
            if (!q.summary) return;
            // Clean and split
            const clean = q.summary.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase();
            const tokens = clean.split(/\s+/);

            tokens.forEach(t => {
                if (t.length > 4 && !stopWords.includes(t)) {
                    // Capitalize for display
                    const cap = t.charAt(0).toUpperCase() + t.slice(1);
                    words.add(cap);
                }
            });
        });

        // Return top 20 most frequent? Or just unique set?
        // Let's just return unique sorted for now.
        return Array.from(words).sort();
    }, [examQuestions]);

    // 3. Check against User Content
    const keywordStatus = useMemo(() => {
        const allText = Object.values(editorContent).join(' ').toLowerCase();

        return keywords.map(k => ({
            word: k,
            found: allText.includes(k.toLowerCase())
        })).sort((a, b) => {
            if (a.found === b.found) return a.word.localeCompare(b.word);
            return a.found ? 1 : -1; // Missing first
        });
    }, [keywords, editorContent]);

    const stats = {
        total: keywordStatus.length,
        found: keywordStatus.filter(k => k.found).length
    };
    const progress = stats.total === 0 ? 0 : Math.round((stats.found / stats.total) * 100);

    const uniqueFocuses = useMemo(() => {
        const s = new Set(examQuestions.map(q => q.focus).filter(f => f && f !== 'Indefinido'));
        return Array.from(s).sort();
    }, [examQuestions]);

    const filteredQuestions = useMemo(() => {
        if (filterFocus === 'all') return examQuestions;
        return examQuestions.filter(q => q.focus === filterFocus);
    }, [examQuestions, filterFocus]);

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: '450px', maxWidth: '90vw',
            background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            zIndex: 2000, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid #ddd'
        }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#fef3e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706' }}>
                        <FileText size={20} /> Contexto AMRIGS
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '4px', borderRadius: '8px', margin: '12px 0' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
                            background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#d97706' : '#888',
                            boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Questões ({examQuestions.length})
                    </button>
                    <button
                        onClick={() => setViewMode('checklist')}
                        style={{
                            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
                            background: viewMode === 'checklist' ? '#fff' : 'transparent', color: viewMode === 'checklist' ? '#d97706' : '#888',
                            boxShadow: viewMode === 'checklist' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Checklist ({progress}%)
                    </button>
                </div>

                {/* Filters (Only for List Mode) */}
                {viewMode === 'list' && uniqueFocuses.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        <button onClick={() => setFilterFocus('all')} style={filterStyle(filterFocus === 'all')}>Tudo</button>
                        {uniqueFocuses.map(f => (
                            <button key={f} onClick={() => setFilterFocus(f)} style={filterStyle(filterFocus === f)}>{f}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fafafa' }}>

                {viewMode === 'list' ? (
                    // LIST MODE
                    filteredQuestions.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {filteredQuestions.map((q, idx) => (
                                <div key={q.id || idx} style={{
                                    background: '#fff', padding: '16px', borderRadius: '12px',
                                    border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    borderLeft: `4px solid ${getColorByFocus(q.focus)}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#eee', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {q.year}
                                        </span>
                                    </div>
                                    {q.focus && (
                                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#555', fontWeight: '600' }}>
                                            <Target size={14} color={getColorByFocus(q.focus)} />
                                            {q.focus}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#444' }}>{q.summary}</div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // CHECKLIST MODE
                    <div>
                        <div style={{ marginBottom: '20px', padding: '15px', background: '#e0f2fe', borderRadius: '8px', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                <RefreshCw size={18} />
                                <strong>Smart Keyword Matcher</strong>
                            </div>
                            <p style={{ margin: 0 }}>
                                O sistema verifica automaticamente se você usou palavras comuns nas questões da AMRIGS.
                            </p>
                        </div>

                        {keywordStatus.length === 0 ? (
                            <EmptyState msg="Sem palavras-chave extraídas." />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {keywordStatus.map((k, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 14px', borderRadius: '8px',
                                        background: k.found ? '#f0fdf4' : '#fff',
                                        border: k.found ? '1px solid #bbf7d0' : '1px solid #eee',
                                        color: k.found ? '#15803d' : '#888',
                                        transition: 'all 0.3s'
                                    }}>
                                        {k.found ? <CheckSquare size={18} /> : <Square size={18} />}
                                        <span style={{ textDecoration: k.found ? 'line-through' : 'none', fontWeight: k.found ? 'normal' : '500' }}>
                                            {k.word}
                                        </span>
                                        {k.found && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: '#dcfce7', padding: '2px 6px', borderRadius: '8px' }}>Ok</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ msg }) => (
    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        <Info size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
        <p>{msg || "Nenhuma questão encontrada."}</p>
    </div>
);

const filterStyle = (active) => ({
    padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', whiteSpace: 'nowrap',
    border: '1px solid', cursor: 'pointer',
    background: active ? '#ffedd5' : '#fff',
    borderColor: active ? '#fb923c' : '#ddd',
    color: active ? '#c2410c' : '#666'
});

const getColorByFocus = (focus) => {
    if (!focus) return '#ccc';
    const f = focus.toLowerCase();
    if (f.includes('diagnóstico') || f.includes('clínico')) return '#2196f3';
    if (f.includes('tratamento') || f.includes('conduta')) return '#4caf50';
    if (f.includes('fisiopatologia') || f.includes('anatomia')) return '#9c27b0';
    if (f.includes('epidemiologia')) return '#ff9800';
    return '#607d8b';
};

export default ExamContextPanel;
