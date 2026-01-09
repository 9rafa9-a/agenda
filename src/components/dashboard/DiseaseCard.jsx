import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';

const DiseaseCard = ({ id, name, tags = [], lastEdited }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/edit/${id}`)}
            style={{
                background: '#fff',
                borderRadius: 'var(--border-radius)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #f0f0f0',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '160px'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            <div>
                <h3 style={{
                    fontSize: '1.2rem',
                    marginBottom: '8px',
                    color: 'var(--color-text)'
                }}>{name || 'Sem Título'}</h3>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tags.map(tag => (
                        <span key={tag} style={{
                            fontSize: '0.75rem',
                            background: 'var(--color-secondary-light)',
                            color: '#557',
                            padding: '4px 8px',
                            borderRadius: '8px'
                        }}>{tag}</span>
                    ))}
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                borderTop: '1px solid #eee',
                paddingTop: '12px'
            }}>
                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                    {lastEdited ? new Date(lastEdited).toLocaleDateString() : 'Novo'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Icons could have handlers, for now just visuals in the card click */}
                    <Edit2 size={16} color="#aaa" />
                </div>
            </div>
        </div>
    );
};

export default DiseaseCard;
