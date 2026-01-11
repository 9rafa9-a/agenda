import React, { useState, useMemo } from 'react';
import DiseaseCard from './DiseaseCard';
import ActivityCalendar from './ActivityCalendar';
import { Plus, RefreshCw, Search, X } from 'lucide-react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { diseases, refresh } = useOutletContext();

    const [searchTerm, setSearchTerm] = useState('');

    const activeSubject = searchParams.get('subject');

    // Filter Logic
    const filteredDiseases = useMemo(() => {
        const isTrashView = searchParams.get('trash') === 'true';

        return diseases.filter(d => {
            // Trash Filter
            const isTrashed = !!d.trashed;
            if (isTrashView) {
                if (!isTrashed) return false;
            } else {
                if (isTrashed) return false;
            }

            // Subject Filter (Multi-subject support)
            if (activeSubject) {
                // Determine if the disease's subject string includes the active filter
                // We split by comma to ensure exact match on one of the tags to avoid partial word matching issues (e.g. "Cardiology" matching "Cardio")
                const subjects = d.subject ? d.subject.split(',').map(s => s.trim()) : [];
                if (!subjects.includes(activeSubject)) return false;
            }

            // Search Filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesName = d.name?.toLowerCase().includes(term);
                const matchesSubject = d.subject?.toLowerCase().includes(term);
                // Can extend to tags later
                return matchesName || matchesSubject;
            }

            return true;
        });
    }, [diseases, activeSubject, searchTerm]);

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h2 style={{ fontSize: '1.8rem', margin: 0 }}>
                        {searchParams.get('trash') === 'true' ? '🗑️ Lixeira' : (activeSubject ? activeSubject : 'Meus Resumos')}
                    </h2>
                    {(activeSubject || searchParams.get('trash') === 'true') && (
                        <span
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--color-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onClick={() => setSearchParams({})}
                        >
                            <X size={12} /> Limpar filtro
                        </span>
                    )}
                </div>

                <div className="search-container" style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {/* Search Bar */}
                    <div style={{
                        position: 'relative',
                        flex: '1 1 200px', // Allow shrinking, grow, base 200
                        height: '48px',
                    }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                        <input
                            type="text"
                            placeholder="Buscar resumo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                height: '100%',
                                padding: '0 16px 0 46px',
                                borderRadius: '50px',
                                border: '1px solid #ddd',
                                outline: 'none',
                                fontSize: '0.95rem',
                                boxShadow: 'var(--shadow-sm)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={refresh}
                            title="Recarregar lista"
                            style={{
                                background: '#fff',
                                color: '#666',
                                border: '1px solid #ddd',
                                borderRadius: '50%',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            <RefreshCw size={20} />
                        </button>

                        <button
                            onClick={() => navigate('/new')}
                            style={{
                                background: 'var(--color-primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50px',
                                padding: '0 24px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: '600',
                                boxShadow: 'var(--shadow-sm)',
                                flexShrink: 0
                            }}
                        >
                            <Plus size={20} /> <span className="hide-mobile">Novo Resumo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Calendar */}
            <ActivityCalendar diseases={diseases} />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', // Reduced min-width
                gap: '16px' // Slightly tighter gap
            }}>
                {filteredDiseases.map(item => (
                    <DiseaseCard key={item.id} {...item} />
                ))}

                {filteredDiseases.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', color: '#aaa' }}>
                        {searchTerm ? 'Nenhum resultado para sua busca.' : 'Nenhum resumo encontrado nesta categoria.'}
                    </div>
                )}
            </div>

            <style>{`
                .hide-mobile { display: inline; }
                @media (max-width: 600px) {
                    .hide-mobile { display: none; }
                    .search-container { width: 100%; margin-top: 10px; }
                }
            `}</style>
            <style>{`
                 @media (max-width: 600px) {
                    .activity-calendar-card { padding: 12px !important; }
                 }
            `}</style>
        </div>
    );
};

export default Dashboard;
