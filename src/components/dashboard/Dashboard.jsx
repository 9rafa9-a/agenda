import React, { useEffect, useState } from 'react';
import DiseaseCard from './DiseaseCard';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const Dashboard = () => {
    const navigate = useNavigate();
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDiseases = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "diseases"), orderBy("lastEdited", "desc"));
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDiseases(list);
        } catch (error) {
            console.error("Error fetching diseases:", error);
            // Fallback for when index is building or permissions fail
            // alert("Erro ao carregar lista. Verifique console.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiseases();
    }, []);

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <h2 style={{ fontSize: '1.8rem' }}>Meus Resumos</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={fetchDiseases}
                        title="Recarregar lista"
                        style={{
                            background: '#fff',
                            color: '#666',
                            border: '1px solid #ddd',
                            borderRadius: '50%',
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={20} className={loading ? 'spin' : ''} />
                    </button>

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
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Carregando resumos...
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                }}>
                    {diseases.map(item => (
                        <DiseaseCard key={item.id} {...item} />
                    ))}

                    {diseases.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#aaa' }}>
                            Nenhum resumo encontrado. Crie o primeiro para começar!
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
