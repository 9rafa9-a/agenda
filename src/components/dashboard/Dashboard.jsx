import React from 'react';
import DiseaseCard from './DiseaseCard';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_DATA = [
    { id: '1', name: 'Insuficiência Cardíaca', tags: ['Cardio', 'Prioridade'], lastEdited: Date.now() },
    { id: '2', name: 'Pneumonia Adquirida na Comunidade', tags: ['Pneumo'], lastEdited: Date.now() - 86400000 },
];

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <h2 style={{ fontSize: '1.8rem' }}>Meus Resumos</h2>
                <button
                    onClick={() => navigate('/new')}
                    style={{
                        background: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <Plus size={20} /> Novo Resumo
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px'
            }}>
                {MOCK_DATA.map(item => (
                    <DiseaseCard key={item.id} {...item} />
                ))}

                {/* Helper text if empty */}
                {MOCK_DATA.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#aaa' }}>
                        Nenhum resumo encontrado. Crie o primeiro!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
