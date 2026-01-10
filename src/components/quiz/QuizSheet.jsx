
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Check, X, ShieldCheck } from 'lucide-react';

const QuizSheet = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modes: 'responding' (Taking test) | 'correcting' (Marking Answer Key)
    const [mode, setMode] = useState('responding');

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'quizzes', id), (doc) => {
            if (doc.exists()) {
                setQuiz({ id: doc.id, ...doc.data() });
            }
            setLoading(false);
        });
        return () => unsub();
    }, [id]);

    const handleBubbleClick = async (qIndex, option) => {
        if (!quiz) return;

        const qNum = (qIndex + 1).toString();

        if (mode === 'responding') {
            // Update User Answer
            const newAnswers = { ...quiz.userAnswers, [qNum]: option };
            // Auto-save
            // Optimistic update local state handled by snapshot, but we can do it locally to fail fast?
            // Snapshot is fast enough usually.
            await updateDoc(doc(db, 'quizzes', id), { userAnswers: newAnswers });
        } else {
            // Update Correct Answer (Gabarito)
            const newKeys = { ...quiz.correctAnswers, [qNum]: option };
            await updateDoc(doc(db, 'quizzes', id), { correctAnswers: newKeys });
        }
    };

    if (loading) return <div>Carregando gabarito...</div>;
    if (!quiz) return <div>Provinha não encontrada.</div>;

    // Stats Calculation
    const total = quiz.qCount;
    const answeredCount = Object.keys(quiz.userAnswers || {}).length;
    const correctKeys = quiz.correctAnswers || {};
    const keyCount = Object.keys(correctKeys).length;

    // Calculate Score (only for questions that have a key)
    let correctCount = 0;
    let wrongCount = 0;

    Object.entries(correctKeys).forEach(([qNum, correctOpt]) => {
        const userOpt = quiz.userAnswers?.[qNum];
        if (userOpt) {
            if (userOpt === correctOpt) correctCount++;
            else wrongCount++;
        }
    });

    const score = correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Header / Sticky Stats */}
            <div style={{
                position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10,
                padding: '16px 0', borderBottom: '1px solid #ddd', marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <button onClick={() => navigate('/quizzes')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={18} /> Voltar
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>{quiz.title}</h2>
                    <div style={{ width: '80px' }}></div> {/* Spacer */}
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Mode Toggle */}
                    <div style={{ background: '#e0e0e0', borderRadius: '30px', padding: '4px', display: 'flex' }}>
                        <button
                            onClick={() => setMode('responding')}
                            style={{
                                padding: '8px 24px', borderRadius: '24px', border: 'none',
                                background: mode === 'responding' ? '#fff' : 'transparent',
                                boxShadow: mode === 'responding' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: '600', color: mode === 'responding' ? '#333' : '#777',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            ✏️ Responder
                        </button>
                        <button
                            onClick={() => setMode('correcting')}
                            style={{
                                padding: '8px 24px', borderRadius: '24px', border: 'none',
                                background: mode === 'correcting' ? '#fff' : 'transparent',
                                boxShadow: mode === 'correcting' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: '600', color: mode === 'correcting' ? 'var(--color-primary)' : '#777',
                                cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <ShieldCheck size={16} /> Gabarito
                        </button>
                    </div>
                </div>

                {/* Score Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '16px', fontSize: '0.9rem', color: '#555' }}>
                    <div>
                        <b>{answeredCount}</b>/{total} Respondidas
                    </div>
                    {keyCount > 0 && (
                        <>
                            <div style={{ color: '#2e7d32' }}><b>{correctCount}</b> Acertos</div>
                            <div style={{ color: '#c62828' }}><b>{wrongCount}</b> Erros</div>
                            <div style={{ fontWeight: 'bold' }}>Nota: {score}%</div>
                        </>
                    )}
                </div>
            </div>

            {/* Bubble Grid */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
                background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)',
                border: '1px solid #eee'
            }}>
                {Array.from({ length: total }).map((_, idx) => {
                    const qNum = (idx + 1).toString();
                    const userVal = quiz.userAnswers?.[qNum];
                    const keyVal = quiz.correctAnswers?.[qNum];

                    return (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '8px', borderRadius: '8px',
                            background: idx % 2 === 0 ? '#fcfcfc' : '#fff'
                        }}>
                            {/* Question Number */}
                            <div style={{
                                width: '32px', fontWeight: 'bold', color: '#888', textAlign: 'right',
                                fontSize: '1.1rem'
                            }}>
                                {qNum}
                            </div>

                            {/* Options A-E */}
                            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                                {['A', 'B', 'C', 'D', 'E'].map(opt => {
                                    // Visual Logic
                                    // 1. Base: White bubble, Grey border
                                    // 2. Selected (User): Blue filled
                                    // 3. Gabarito Mode or Key Exist:
                                    //    - If Key == Opt: Green Ring (Correct Answer)
                                    //    - If User == Opt AND User != Key: Red filled (Wrong Answer)

                                    let bg = '#fff';
                                    let color = '#555';
                                    let border = '2px solid #e0e0e0';
                                    let fontWeight = 'normal';

                                    const isSelectedByUser = userVal === opt;
                                    const isKey = keyVal === opt;
                                    const hasKey = !!keyVal;

                                    if (hasKey) {
                                        // Correction Visuals
                                        if (isKey) {
                                            // This indicates the correct answer
                                            if (isSelectedByUser) {
                                                // Correct!
                                                bg = '#4caf50';
                                                color = '#fff';
                                                border = '2px solid #4caf50';
                                            } else {
                                                // This was the correct answer, but user missed it
                                                bg = '#fff';
                                                color = '#4caf50';
                                                border = '2px solid #4caf50'; // Green outline for correct answer
                                                fontWeight = 'bold';
                                            }
                                        } else if (isSelectedByUser) {
                                            // Wrong! (User selected this, but it's not key)
                                            bg = '#ffcdd2'; // Light red
                                            color = '#c62828';
                                            border = '2px solid #ef5350';
                                        }
                                    } else {
                                        // Study Mode Visuals (No Key yet)
                                        if (isSelectedByUser) {
                                            bg = '#e3f2fd'; // Light blue
                                            color = '#1565c0';
                                            border = '2px solid #bbdefb';
                                        }
                                    }

                                    // Hover effect logic handled via creating a specialized sub-component or simple CSS class in parent?
                                    // Inline styles are tricky for hover. We'll stick to clear static states.

                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleBubbleClick(idx, opt)}
                                            style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: bg, color: color, border: border,
                                                fontWeight: fontWeight || (isSelectedByUser ? 'bold' : 'normal'),
                                                fontSize: '1rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.1s'
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Status Icon for Row */}
                            <div style={{ width: '24px' }}>
                                {keyVal && userVal && (
                                    userVal === keyVal
                                        ? <Check size={20} color="#4caf50" />
                                        : <X size={20} color="#ef5350" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizSheet;
