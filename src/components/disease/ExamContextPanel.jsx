
import React, { useState, useMemo } from 'react';
import statsData from '../../data/amrigs_stats.json';
import { X, Filter, FileText, Target, Calendar, Info } from 'lucide-react';

const ExamContextPanel = ({ diseaseName, onClose }) => {
    // Filter data based on exact topic match or partial match
    const examQuestions = useMemo(() => {
        if (!diseaseName) return [];
        const normalizedName = diseaseName.toLowerCase().trim();

        return statsData.filter(d => {
            if (!d.topic) return false;
            // Exact match preferred, or contains
            return d.topic.toLowerCase().trim() === normalizedName;
        }).sort((a, b) => b.year - a.year); // Newest first
    }, [diseaseName]);

    const [filterFocus, setFilterFocus] = useState('all');

    // Extract unique Focus values for filter
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
            background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid #eee'
        }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#fef3e0' }}> {/* Different hue than Evidence */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706' }}>
                        <FileText size={20} /> Contexto de Prova (AMRIGS)
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <X size={24} />
                    </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#b45309', margin: 0 }}>
                    Veja como <b>{diseaseName}</b> foi cobrado nos últimos anos.
                </p>

                {/* Filters */}
                {uniqueFocuses.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                        <button
                            onClick={() => setFilterFocus('all')}
                            style={{
                                padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', whiteSpace: 'nowrap',
                                border: '1px solid', cursor: 'pointer',
                                background: filterFocus === 'all' ? '#ffedd5' : '#fff',
                                borderColor: filterFocus === 'all' ? '#fb923c' : '#ddd',
                                color: filterFocus === 'all' ? '#c2410c' : '#666'
                            }}
                        >
                            Tudo ({examQuestions.length})
                        </button>
                        {uniqueFocuses.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterFocus(f)}
                                style={{
                                    padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', whiteSpace: 'nowrap',
                                    border: '1px solid', cursor: 'pointer',
                                    background: filterFocus === f ? '#ffedd5' : '#fff',
                                    borderColor: filterFocus === f ? '#fb923c' : '#ddd',
                                    color: filterFocus === f ? '#c2410c' : '#666'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fafafa' }}>
                {filteredQuestions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        <Info size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <p>Nenhuma questão encontrada para este tópico exato.</p>
                        <p style={{ fontSize: '0.8rem' }}>Tente ajustar o nome do resumo para bater com o edital.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredQuestions.map((q, idx) => (
                            <div key={q.id || idx} style={{
                                background: '#fff', padding: '16px', borderRadius: '12px',
                                border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                borderLeft: `4px solid ${getColorByFocus(q.focus)}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 'bold',
                                        background: '#eee', padding: '2px 8px', borderRadius: '4px',
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <Calendar size={12} /> {q.year}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>ID: {q.id}</span>
                                </div>

                                {q.focus && (
                                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#555', fontWeight: '600' }}>
                                        <Target size={14} color={getColorByFocus(q.focus)} />
                                        Foco: {q.focus}
                                    </div>
                                )}

                                {q.summary && (
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#444' }}>
                                        {q.summary}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Colors for common Focus types
const getColorByFocus = (focus) => {
    if (!focus) return '#ccc';
    const f = focus.toLowerCase();
    if (f.includes('diagnóstico') || f.includes('clínico')) return '#2196f3'; // Blue
    if (f.includes('tratamento') || f.includes('conduta')) return '#4caf50'; // Green
    if (f.includes('fisiopatologia') || f.includes('anatomia')) return '#9c27b0'; // Purple
    if (f.includes('epidemiologia')) return '#ff9800'; // Orange
    return '#607d8b'; // Grey default
};

export default ExamContextPanel;
