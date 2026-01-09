import React, { useState, useEffect, useRef } from 'react';
import TopicSection from './TopicSection';
// PDF Export
import { useReactToPrint } from 'react-to-print';
// History Icons
import { Printer, Save, ArrowLeft, History, RotateCcw, Trash2, Ban, CheckCircle } from 'lucide-react';
// Firestore
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, getDocs, setDoc, updateDoc, collection, addDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
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
    const [trashed, setTrashed] = useState(false);

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

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
                        setTrashed(!!docData.trashed);
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

    // Internal Save Logic
    const saveToFirestore = async (silent = false) => {
        if (!name.trim()) return;

        if (!silent) setSaving(true);
        try {
            const payload = {
                name,
                subject,
                topics: data,
                lastEdited: Date.now(),
                userId: 'default-user'
            };

            if (id) {
                await updateDoc(doc(db, 'diseases', id), payload);
            } else {
                if (!silent) {
                    const docRef = await addDoc(collection(db, 'diseases'), payload);
                    alert('Criado com sucesso!');
                    navigate(`/edit/${docRef.id}`, { replace: true });
                    return docRef.id; // Return new ID
                }
            }
            return id;
        } catch (e) {
            console.error("Error saving document: ", e);
            if (!silent) alert("Erro ao salvar: " + e.message);
            throw e;
        } finally {
            if (!silent) setSaving(false);
        }
    };

    // Manual Save Button Click (Creates Version)
    const handleManualSave = async () => {
        try {
            // 1. Save current state to main doc
            const currentId = await saveToFirestore(false);

            // 2. Create a history entry (Checkpoint)
            if (currentId) {
                const historyPayload = {
                    name,
                    subject,
                    topics: data,
                    savedAt: Date.now(),
                    type: 'manual_checkpoint'
                };
                await addDoc(collection(db, 'diseases', currentId, 'history'), historyPayload);
                alert('Salvo e versão criada no histórico! 🕒');
            }
        } catch (e) {
            // Error handled in saveToFirestore
        }
    };

    // Auto-Save Logic (Debounced) - Only updates main doc
    useEffect(() => {
        if (!id) return;
        const timer = setTimeout(() => {
            console.log("Auto-saving...");
            saveToFirestore(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [data, name, subject]);

    // History Logic
    const fetchHistory = async () => {
        if (!id) return;
        setLoadingHistory(true);
        try {
            const q = query(collection(db, 'diseases', id, 'history'), orderBy('savedAt', 'desc'));
            const snap = await getDocs(q);
            setHistoryList(snap.docs.map(d => ({ vid: d.id, ...d.data() })));
        } catch (e) {
            console.error("Error fetching history", e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const restoreVersion = (version) => {
        if (window.confirm(`Deseja restaurar a versão de ${new Date(version.savedAt).toLocaleString()}? Isso substituirá o conteúdo atual.`)) {
            setName(version.name);
            setSubject(version.subject);
            setData(version.topics);
            setShowHistory(false);
            // Trigger auto-save will eventually persist this restoration
        }
    };

    // Trash Logic
    const handleTrash = async () => {
        if (!id) return;
        const newStatus = !trashed;
        if (window.confirm(newStatus ? 'Mover para a lixeira?' : 'Restaurar da lixeira?')) {
            try {
                await updateDoc(doc(db, 'diseases', id), {
                    trashed: newStatus,
                    lastEdited: Date.now()
                });
                setTrashed(newStatus);
                alert(newStatus ? 'Movido para a lixeira.' : 'Restaurado com sucesso!');
                navigate(newStatus ? '/?trash=true' : '/');
            } catch (e) {
                console.error("Error updating trash status:", e);
                alert("Erro: " + e.message);
            }
        }
    };

    const handleDeleteForever = async () => {
        if (!id) return;
        if (window.confirm('TEM CERTEZA? Isso apagará o resumo PERMANENTEMENTE e não pode ser desfeito.')) {
            try {
                await deleteDoc(doc(db, 'diseases', id));
                alert('Resumo deletado para sempre.');
                navigate('/?trash=true');
            } catch (e) {
                console.error("Error deleting doc:", e);
                alert("Erro ao deletar: " + e.message);
            }
        }
    };

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
                <button onClick={() => navigate(trashed ? '/?trash=true' : '/')} style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#888' }}>
                    <ArrowLeft size={20} /> Voltar
                </button>
                <div style={{ display: 'flex', gap: '16px' }}>

                    {trashed ? (
                        <>
                            <button
                                onClick={handleDeleteForever}
                                style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#ff4444', fontWeight: 'bold' }}
                            >
                                <Ban size={20} /> Excluir P/ Sempre
                            </button>
                            <button
                                onClick={handleTrash}
                                style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}
                            >
                                <RotateCcw size={20} /> Restaurar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleTrash}
                            style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#ff6b6b' }}
                        >
                            <Trash2 size={20} /> Excluir
                        </button>
                    )}

                    <div style={{ width: '1px', height: '24px', background: '#ddd' }}></div>

                    <button
                        onClick={() => { setShowHistory(true); fetchHistory(); }}
                        style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#666' }}
                    >
                        <History size={20} /> Histórico
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#666' }}
                    >
                        <Printer size={20} /> Baixar PDF
                    </button>
                </div>
            </div>

            {/* History Modal */}
            {showHistory && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowHistory(false)}>
                    <div style={{
                        background: '#fff', padding: '32px', borderRadius: '12px',
                        width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>Histórico de Versões</h3>
                        {loadingHistory ? <p>Carregando...</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {historyList.length === 0 && <p style={{ color: '#aaa' }}>Nenhuma versão salva manualmente ainda.</p>}
                                {historyList.map(v => (
                                    <div key={v.vid} style={{
                                        border: '1px solid #eee', padding: '12px', borderRadius: '8px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{new Date(v.savedAt).toLocaleString()}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{v.topics ? Object.keys(v.topics).length : 0} tópicos</div>
                                        </div>
                                        <button
                                            onClick={() => restoreVersion(v)}
                                            style={{
                                                background: '#eee', border: 'none', padding: '8px 12px', borderRadius: '6px',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            <RotateCcw size={14} /> Restaurar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowHistory(false)} style={{ marginTop: '20px', width: '100%', padding: '12px', border: '1px solid #ddd', background: 'none', borderRadius: '8px', cursor: 'pointer' }}>Fechar</button>
                    </div>
                </div>
            )}

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
