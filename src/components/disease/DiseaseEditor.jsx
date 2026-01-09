import React, { useState, useEffect, useRef } from 'react';
import TopicSection from './TopicSection';
// PDF Export
import { useReactToPrint } from 'react-to-print';
import { Printer, Save, ArrowLeft } from 'lucide-react';
// Firestore
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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

const DiseaseEditor = () => {
    const { id } = useParams(); // If we are editing existing one
    const navigate = useNavigate();
    const componentRef = useRef(); // For PDF

    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [data, setData] = useState({
        definition: '', epidemiology: '', clinical: '',
        diagnosis: '', differential: '', treatment: '',
        complications: '', pearls: '', notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load data if ID exists
    useEffect(() => {
        if (id) {
            setLoading(true);
            const fetchData = async () => {
                try {
                    const docRef = doc(db, 'diseases', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const docData = docSnap.data();
                        setName(docData.name);
                        setSubject(docData.subject || '');
                        setData(docData.topics);
                    } else {
                        console.log("No such document!");
                    }
                } catch (e) {
                    console.error("Error fetching doc:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [id]);

    const handleChange = (key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (silent = false) => {
        if (!name.trim()) return; // Don't auto-save empty docs

        if (!silent) setSaving(true);
        try {
            const payload = {
                name,
                subject,
                topics: data,
                lastEdited: Date.now(),
                userId: 'default-user' // Eventually use auth.currentUser.uid
            };

            if (id) {
                await updateDoc(doc(db, 'diseases', id), payload);
                if (!silent) alert('Salvo com sucesso!');
            } else {
                // For new docs, we only auto-save if we have enough info to create it
                // But typically we shouldn't auto-create docs without user intent. 
                // Let's rely on manual save for the FIRST create, then auto-save updates.
                if (!silent) {
                    const docRef = await addDoc(collection(db, 'diseases'), payload);
                    alert('Criado com sucesso!');
                    navigate(`/edit/${docRef.id}`, { replace: true });
                }
            }
        } catch (e) {
            console.error("Error saving document: ", e);
            if (!silent) alert("Erro ao salvar: " + e.message);
        } finally {
            if (!silent) setSaving(false);
        }
    };

    // Auto-Save Logic (Debounced)
    useEffect(() => {
        // Only auto-save if we have an ID (document exists) to avoid phantom creations
        if (!id) return;

        const timer = setTimeout(() => {
            console.log("Auto-saving...");
            handleSave(true);
        }, 3000); // Wait 3 seconds of inactivity

        return () => clearTimeout(timer);
    }, [data, name, subject]); // Dependencies: any change triggers timer reset

    // PDF Export
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: name || 'Resumo',
    });

    if (loading) return <div>Carregando...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Top Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button onClick={() => navigate('/')} style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#888' }}>
                    <ArrowLeft size={20} /> Voltar
                </button>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={handlePrint}
                        style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#666' }}
                    >
                        <Printer size={20} /> Baixar PDF
                    </button>
                </div>
            </div>

            {/* Printable Area Wrapper */}
            <div ref={componentRef} style={{ padding: '20px' }} className="print-content">
                {/* Header Input */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px',
                    background: '#fff',
                    padding: '24px',
                    borderRadius: 'var(--border-radius)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Matéria (ex: Ginecologia)"
                        list="subjects-list"
                        style={{
                            display: 'block',
                            margin: '0 auto 16px auto',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid #eee',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            width: '200px',
                            outline: 'none',
                            color: '#666'
                        }}
                    />
                    <datalist id="subjects-list">
                        <option value="Cardiologia" />
                        <option value="Ginecologia" />
                        <option value="Pediatria" />
                        <option value="Cirurgia" />
                        <option value="Preventiva" />
                    </datalist>

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
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <button
                    onClick={handleManualSave}
                    disabled={saving}
                    style={{
                        background: 'var(--color-text)',
                        color: '#fff',
                        padding: '12px 32px',
                        borderRadius: '50px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        boxShadow: 'var(--shadow-md)',
                        transition: 'transform 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: saving ? 0.7 : 1
                    }}
                    onMouseOver={(e) => !saving && (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => !saving && (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Resumo'}
                </button>
            </div>

            {/* PDF Styles Helper */}
            <style>{`
        @media print {
          .print-content {
             margin: 0;
             padding: 0;
          }
          /* Ensure colors print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
        </div>
    );
};

export default DiseaseEditor;
