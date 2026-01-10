
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FileText, Plus, Trash2, CheckCircle, Circle, Play } from 'lucide-react';

const QuizDashboard = () => {
    const { currentUser } = useOutletContext();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);

    // New Quiz Form
    const [newTitle, setNewTitle] = useState('');
    const [newCount, setNewCount] = useState(50); // Default 50 questions

    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) fetchQuizzes();
    }, [currentUser]);

    const fetchQuizzes = async () => {
        try {
            const q = query(
                collection(db, 'quizzes'),
                where('userId', '==', currentUser)
                // Note: Compound queries with orderBy might require an index. 
                // We'll sort client-side for simplicity if needed or add index later.
            );
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Client-side sort by createdAt desc
            list.sort((a, b) => b.createdAt - a.createdAt);

            setQuizzes(list);
        } catch (e) {
            console.error("Error fetching quizzes", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const docRef = await addDoc(collection(db, 'quizzes'), {
                title: newTitle,
                qCount: parseInt(newCount),
                userAnswers: {},
                correctAnswers: {},
                userId: currentUser,
                createdAt: Date.now(),
                status: 'active'
            });
            setShowNewModal(false);
            setNewTitle(''); // Reset
            navigate(`/quizzes/${docRef.id}`);
        } catch (e) {
            console.error(e);
            alert("Erro ao criar provinha: " + e.message);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Apagar esta provinha?")) {
            await deleteDoc(doc(db, 'quizzes', id));
            fetchQuizzes();
        }
    };

    if (!currentUser) return <div style={{ padding: '40px' }}>Por favor, identifique-se no menu lateral.</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'var(--font-hand)', color: 'var(--color-primary)' }}>
                    Suas Provinhas 📝
                </h1>
                <button
                    onClick={() => setShowNewModal(true)}
                    style={{
                        background: 'var(--color-primary)', color: '#fff',
                        border: 'none', padding: '12px 24px', borderRadius: '50px',
                        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', boxShadow: 'var(--shadow-md)'
                    }}
                >
                    <Plus size={20} /> Nova Prova
                </button>
            </div>

            {loading ? <div>Carregando...</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {quizzes.map(quiz => {
                        const answered = Object.keys(quiz.userAnswers || {}).length;
                        const total = quiz.qCount;
                        const progress = Math.round((answered / total) * 100);

                        // Calculate score if any keys act
                        const keys = quiz.correctAnswers || {};
                        const correctCount = Object.entries(keys).filter(([k, v]) => quiz.userAnswers[k] === v).length;
                        const reviewedCount = Object.keys(keys).length;

                        return (
                            <div
                                key={quiz.id}
                                onClick={() => navigate(`/quizzes/${quiz.id}`)}
                                style={{
                                    background: '#fff', padding: '24px', borderRadius: '16px',
                                    boxShadow: 'var(--shadow-sm)', border: '1px solid #eee',
                                    cursor: 'pointer', position: 'relative', transition: 'transform 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0, color: '#444' }}>{quiz.title}</h3>
                                    <button onClick={(e) => handleDelete(quiz.id, e)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>
                                    {new Date(quiz.createdAt).toLocaleDateString()} • {total} Questões
                                </div>

                                {/* Progress Bar */}
                                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, background: 'var(--color-primary)', height: '100%' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                                    <span>{answered}/{total} Respondidas</span>
                                    {reviewedCount > 0 && (
                                        <span style={{ color: correctCount / reviewedCount < 0.5 ? '#ef5350' : '#66bb6a', fontWeight: 'bold' }}>
                                            {Math.round((correctCount / reviewedCount) * 100)}% Acertos
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showNewModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <form onSubmit={handleCreate} style={{
                        background: '#fff', padding: '32px', borderRadius: '20px',
                        width: '400px', maxWidth: '90%', boxShadow: 'var(--shadow-lg)'
                    }}>
                        <h2 style={{ marginTop: 0 }}>Nova Provinha</h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nome da Prova</label>
                            <input
                                autoFocus
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Ex: Simulado SUS 2024"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nº de Questões</label>
                            <input
                                type="number"
                                value={newCount}
                                onChange={e => setNewCount(e.target.value)}
                                min="1" max="200"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" onClick={() => setShowNewModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f5f5f5', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                                Criar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default QuizDashboard;
