import React, { useState, useEffect, useRef } from 'react';
import TopicSection from './TopicSection';
import EvidencePanel from './EvidencePanel';
import ExamContextPanel from './ExamContextPanel'; // New
// PDF Export
import { useReactToPrint } from 'react-to-print';
// History Icons
import { Printer, Save, ArrowLeft, History, RotateCcw, Trash2, Ban, CheckCircle, Brain, Sparkles, RotateCw, FileText, Loader2 } from 'lucide-react';
// Firestore
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, getDocs, setDoc, updateDoc, collection, addDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { generateFlashcards } from '../../services/ai/gemini';
import statsData from '../../data/amrigs_stats.json'; // Import Stats

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

// Map Exam "Focus" (Col G) to Editor Sections
const SECTION_MAPPING = {
    'Definição': 'definition', 'Fisiopatologia': 'definition', 'Etiologia': 'definition',
    'Epidemiologia': 'epidemiology', 'Fatores de Risco': 'epidemiology',
    'Quadro Clínico': 'clinical', 'Sinais e Sintomas': 'clinical', 'História Natural': 'clinical',
    'Diagnóstico': 'diagnosis', 'Exames': 'diagnosis', 'Laboratório': 'diagnosis', 'Imagem': 'diagnosis',
    'Diagnóstico Diferencial': 'differential',
    'Tratamento': 'treatment', 'Conduta': 'treatment', 'Manejo': 'treatment', 'Cirurgia': 'treatment', 'Medicamentoso': 'treatment',
    'Complicações': 'complications', 'Prognóstico': 'complications', 'Seguimento': 'complications',
    'Prevenção': 'epidemiology', 'Rastreamento': 'diagnosis'
};

const DiseaseEditor = () => {
    // ... (Hooks)
    const { id } = useParams();
    const navigate = useNavigate();
    const componentRef = useRef();

    // ... (State)
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [data, setData] = useState({
        definition: '', epidemiology: '', clinical: '',
        diagnosis: '', differential: '', treatment: '',
        complications: '', pearls: '', notes: ''
    });

    // ... (Other State: loading, saving, trashed, generating, smart sync)
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [trashed, setTrashed] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [lastGenTopics, setLastGenTopics] = useState(null);
    const [updatesAvailable, setUpdatesAvailable] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showEvidence, setShowEvidence] = useState(false);
    const [showExamContext, setShowExamContext] = useState(false);

    // === SMART EXAM FEATURES ===
    // Calculate Relevance per Section
    const sectionRelevance = React.useMemo(() => {
        if (!name) return {};
        const normalizedName = name.trim().toLowerCase();

        // 1. Filter Questions for this Topic (Fuzzy Match)
        const relatedQuestions = statsData.filter(d => {
            if (!d.topic) return false;
            const t = d.topic.toLowerCase().trim();
            // Check if one contains the other (bidirectional)
            return t.includes(normalizedName) || normalizedName.includes(t);
        });

        if (relatedQuestions.length === 0) return {};

        // 2. Count Hits per Section Key
        const counts = {};
        relatedQuestions.forEach(q => {
            if (!q.focus) return;
            // Fuzzy match focus strings to keys
            const focusTerms = Object.keys(SECTION_MAPPING);
            const matchedTerm = focusTerms.find(term => q.focus.includes(term));

            if (matchedTerm) {
                const key = SECTION_MAPPING[matchedTerm];
                counts[key] = (counts[key] || 0) + 1;
            } else {
                // Fallback for uncategorized -> 'notes' or ignore?
                // counts['notes'] = (counts['notes'] || 0) + 1;
            }
        });

        // 3. Mark "Hot" Sections (Top 3 or > threshold)
        // Let's say: > 3 questions = VERY HOT, > 0 = HOT
        const relevance = {};
        Object.keys(DEFAULT_TOPICS).forEach(key => {
            const count = counts[key] || 0;
            relevance[key] = {
                count,
                isHot: count >= 3, // High Yield threshold
                hasQuestions: count > 0 // Any questions
            };
        });

        return relevance;
    }, [name]);
    // ===========================

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
                        if (docData.lastGeneratedTopics) {
                            setLastGenTopics(docData.lastGeneratedTopics);
                        }
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

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToastMsg = (msg, type = 'success') => {
        setToast({ show: true, message: msg, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Check for changes (Smart Sync)
    useEffect(() => {
        if (!lastGenTopics) return;

        const hasChanges = Object.keys(data).some(key => {
            const current = (data[key] || '').trim();
            const last = (lastGenTopics[key] || '').trim();
            return current !== last;
        });

        setUpdatesAvailable(hasChanges);
    }, [data, lastGenTopics]);

    // AI Generation Logic (Smart / Full)
    const handleGenerateFlashcards = async (forceFull = false) => {
        if (!name || generating) return;
        setGenerating(true);

        let topicsToProcess = data;
        let isIncremental = false;

        // Smart Sync Logic
        if (!forceFull && lastGenTopics) {
            const changed = {};
            let changeCount = 0;
            Object.keys(data).forEach(key => {
                const current = (data[key] || '').trim();
                const last = (lastGenTopics[key] || '').trim();
                if (current !== last) {
                    changed[key] = current;
                    changeCount++;
                }
            });

            if (changeCount > 0) {
                topicsToProcess = changed;
                isIncremental = true;
                showToastMsg(`Gerando cards para ${changeCount} tópicos atualizados...`, 'info');
            } else {
                showToastMsg('Nenhuma alteração detectada.', 'info');
                setGenerating(false);
                return;
            }
        } else {
            showToastMsg('Gerando flashcards completos com IA... Aguarde.', 'info');
        }

        try {
            // 1. Generate Content
            const flashcards = await generateFlashcards(name, topicsToProcess);

            if (!flashcards || flashcards.length === 0) throw new Error("IA não gerou cards.");

            // 2. Save to Firestore (Subcollection)
            const collectionRef = collection(db, 'diseases', id, 'flashcards');

            for (const card of flashcards) {
                await addDoc(collectionRef, {
                    ...card,
                    diseaseId: id,
                    createdAt: Date.now(),
                    progress: { Rafa: {}, Ju: {} } // Init empty progress
                });
            }

            // 3. Update Last Generated Snapshot
            await updateDoc(doc(db, 'diseases', id), {
                lastGeneratedTopics: data // Save current full state as the new baseline
            });
            setLastGenTopics(data);
            setUpdatesAvailable(false);

            showToastMsg(`Sucesso! ${flashcards.length} novos cards gerados.`);
        } catch (e) {
            console.error(e);
            showToastMsg('Erro ao gerar cards: ' + e.message, 'error');
        } finally {
            setGenerating(false);
        }
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
                    showToastMsg('Criado com sucesso!');
                    navigate(`/edit/${docRef.id}`, { replace: true });
                    return docRef.id; // Return new ID
                }
            }
            return id;
        } catch (e) {
            console.error("Error saving document: ", e);
            if (!silent) showToastMsg("Erro ao salvar: " + e.message, 'error');
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
                showToastMsg('Resumo salvo', 'success');
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
            showToastMsg('Versão restaurada!');
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
                showToastMsg(newStatus ? 'Movido para a lixeira.' : 'Restaurado com sucesso!');
                navigate(newStatus ? '/?trash=true' : '/');
            } catch (e) {
                console.error("Error updating trash status:", e);
                showToastMsg("Erro: " + e.message, 'error');
            }
        }
    };

    const handleDeleteForever = async () => {
        if (!id) return;
        if (window.confirm('TEM CERTEZA? Isso apagará o resumo PERMANENTEMENTE e não pode ser desfeito.')) {
            try {
                await deleteDoc(doc(db, 'diseases', id));
                showToastMsg('Resumo deletado para sempre.');
                navigate('/?trash=true');
            } catch (e) {
                console.error("Error deleting doc:", e);
                showToastMsg("Erro ao deletar: " + e.message, 'error');
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
            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    background: toast.type === 'error' ? '#ff4444' : '#4caf50',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: '600',
                    zIndex: 3000,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.type === 'error' ? <Ban size={20} /> : <CheckCircle size={20} />}
                    {toast.message}
                </div>
            )}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

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
                        <>
                            <button
                                onClick={() => handleGenerateFlashcards(false)} // Smart Gen default
                                disabled={generating}
                                style={{
                                    display: 'flex', gap: '8px', alignItems: 'center',
                                    color: updatesAvailable ? '#fff' : '#9c27b0',
                                    background: updatesAvailable ? '#9c27b0' : '#f3e5f5', // Highlight if updates ready
                                    border: 'none',
                                    padding: '8px 16px', borderRadius: '20px', fontWeight: '600',
                                    cursor: generating ? 'wait' : 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: updatesAvailable ? '0 0 10px rgba(156, 39, 176, 0.5)' : 'none'
                                }}
                            >
                                {generating ? <RotateCw className="spin" size={20} /> : <Sparkles size={20} />}
                                {generating ? 'Criando...' : (updatesAvailable ? 'Atualizar Flashcards' : 'Gerar Flashcards AI')}
                            </button>
                            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

                            <button
                                onClick={() => setShowExamContext(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', cursor: 'pointer',
                                    background: showExamContext ? '#ffedd5' : '#fff', color: showExamContext ? '#d97706' : '#555',
                                    fontWeight: '600'
                                }}>
                                <FileText size={18} /> Questões
                            </button>

                            <button onClick={() => setShowEvidence(true)} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', cursor: 'pointer',
                                background: '#fff', color: '#555', fontWeight: '600'
                            }}>
                                <Brain size={18} /> Evidências 🔬
                            </button>

                            <button
                                onClick={handleTrash}
                                style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#ff6b6b' }}
                            >
                                <Trash2 size={20} /> Excluir
                            </button>
                        </>
                    )}

                    <div style={{ width: '1px', height: '24px', background: '#ddd' }}></div>

                    <button
                        onClick={() => { setShowHistory(true); fetchHistory(); }}
                        style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#666' }}
                    >
                        <History size={20} />
                    </button>

                    <button onClick={handlePrint} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '8px' }}>
                        <Printer size={20} />
                    </button>
                </div>
            </div>

            {/* Evidence Panel Drawer */}
            {
                showEvidence && (
                    <EvidencePanel
                        diseaseName={name}
                        onClose={() => setShowEvidence(false)}
                    />
                )
            }

            {/* History Modal */}
            {
                showHistory && (
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
                )
            }

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
                <div className="grid-layout">
                    {Object.entries(DEFAULT_TOPICS).map(([key, config]) => (
                        <TopicSection
                            key={key}
                            title={config.title}
                            color={config.color}
                            content={data[key]}
                            onChange={(val) => handleChange(key, val)}
                            isEditable={!trashed}
                            index={key}
                            relevance={sectionRelevance[key]} // Pass Smart Relevance
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
        </div >
    );
};

export default DiseaseEditor;
