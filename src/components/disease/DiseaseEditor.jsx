import React, { useState } from 'react';
import TopicSection from './TopicSection';

const DEFAULT_TOPICS = {
    definition: { title: 'Definição/Fisio', color: 'pink' },
    epidemiology: { title: 'Epidemio/Paciente', color: 'pink' },
    clinical: { title: 'Quadro Clínico', color: 'pink' },
    diagnosis: { title: 'Diagnóstico', color: 'blue' },
    differential: { title: 'Diag. Diferencial', color: 'blue' },
    treatment: { title: 'Tratamento/Conduta', color: 'blue' },
    complications: { title: 'Complicações/Prog', color: 'yellow' },
    pearls: { title: 'Pegadinhas Prova (⚠️)', color: 'yellow' },
    notes: { title: 'Notas Questões (Erros)', color: 'yellow' },
};

const DiseaseEditor = ({ initialData, onSave }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [data, setData] = useState(initialData?.topics || {
        definition: '', epidemiology: '', clinical: '',
        diagnosis: '', differential: '', treatment: '',
        complications: '', pearls: '', notes: ''
    });

    const handleChange = (key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Header Input */}
            <div style={{
                textAlign: 'center',
                marginBottom: '32px',
                background: '#fff',
                padding: '24px',
                borderRadius: 'var(--border-radius)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    color: '#888'
                }}>Tema da Aula / Doença</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Insuficiência Cardíaca"
                    style={{
                        fontSize: '2rem',
                        textAlign: 'center',
                        border: 'none',
                        borderBottom: '2px solid var(--color-primary)',
                        outline: 'none',
                        width: '100%',
                        maxWidth: '600px',
                        fontFamily: 'var(--font-main)',
                        fontWeight: 'bold',
                        color: 'var(--color-text)'
                    }}
                />
            </div>

            {/* 9-Grid Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {Object.entries(DEFAULT_TOPICS).map(([key, config], idx) => (
                    <TopicSection
                        key={key}
                        index={idx + 1}
                        title={config.title}
                        color={config.color}
                        content={data[key]}
                        isEditable={true}
                        onChange={(val) => handleChange(key, val)}
                    />
                ))}
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <button
                    onClick={() => onSave({ name, topics: data })}
                    style={{
                        background: 'var(--color-text)',
                        color: '#fff',
                        padding: '12px 32px',
                        borderRadius: '50px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        boxShadow: 'var(--shadow-md)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                    Salvar Resumo
                </button>
            </div>
        </div>
    );
};

export default DiseaseEditor;
