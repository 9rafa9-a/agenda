
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Check, X, ShieldCheck, Info, ChevronLeft, ChevronRight } from 'lucide-react';

const QuizSheet = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(0);
    const PER_PAGE = 10;

    // Popover State
    const [openKeyPopover, setOpenKeyPopover] = useState(null); // stores index of row open

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
        const newAnswers = { ...quiz.userAnswers, [qNum]: option };
        await updateDoc(doc(db, 'quizzes', id), { userAnswers: newAnswers });
    };

    const handleKeyClick = async (qIndex, option) => {
        if (!quiz) return;
        const qNum = (qIndex + 1).toString();
        const newKeys = { ...quiz.correctAnswers, [qNum]: option };
        await updateDoc(doc(db, 'quizzes', id), { correctAnswers: newKeys });
        setOpenKeyPopover(null); // Close after selection
    };

    if (loading) return <div>Carregando gabarito...</div>;
    if (!quiz) return <div>Provinha não encontrada.</div>;

    // Stats Calculation
    const total = quiz.qCount;
    const totalPages = Math.ceil(total / PER_PAGE);

    const answeredCount = Object.keys(quiz.userAnswers || {}).length;
    const correctKeys = quiz.correctAnswers || {};
    const keyCount = Object.keys(correctKeys).length;

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

    // Pagination Logic
    const startIdx = currentPage * PER_PAGE;
    const currentQuestions = Array.from({ length: Math.min(PER_PAGE, total - startIdx) }).map((_, i) => startIdx + i);

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
                    <div style={{ width: '80px' }}></div>
                </div>

                {/* Score Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '0.9rem', color: '#555' }}>
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

            {/* Pagination Controls (Top) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        style={{
                            width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                            background: currentPage === i ? 'var(--color-primary)' : '#e0e0e0',
                            color: currentPage === i ? '#fff' : '#666',
                            fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Bubble Grid */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
                background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)',
                border: '1px solid #eee'
            }}>
                {currentQuestions.map((idx) => {
                    const qNum = (idx + 1).toString();
                    const userVal = quiz.userAnswers?.[qNum];
                    const keyVal = quiz.correctAnswers?.[qNum];

                    return (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '8px', borderRadius: '8px',
                            background: idx % 2 === 0 ? '#fcfcfc' : '#fff',
                            position: 'relative' // For popover positioning
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
                                    let bg = '#fff';
                                    let color = '#555';
                                    let border = '2px solid #e0e0e0';
                                    let fontWeight = 'normal';

                                    const isSelectedByUser = userVal === opt;
                                    const isKey = keyVal === opt;
                                    const hasKey = !!keyVal;

                                    if (hasKey) {
                                        if (isKey) {
                                            if (isSelectedByUser) {
                                                // Correct + User Selected
                                                bg = '#4caf50';
                                                color = '#fff';
                                                border = '2px solid #4caf50';
                                            } else {
                                                // Correct + User Missed
                                                bg = '#fff';
                                                color = '#4caf50';
                                                border = '2px solid #4caf50';
                                                fontWeight = 'bold';
                                            }
                                        } else if (isSelectedByUser) {
                                            // Wrong + User Selected
                                            bg = '#ffcdd2';
                                            color = '#c62828';
                                            border = '2px solid #ef5350';
                                        }
                                    } else {
                                        // No Key Set yet
                                        if (isSelectedByUser) {
                                            bg = '#e3f2fd';
                                            color = '#1565c0';
                                            border = '2px solid #bbdefb';
                                        }
                                    }

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

                            {/* Info (Key Setter) Icon */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setOpenKeyPopover(openKeyPopover === idx ? null : idx)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: keyVal ? '#4caf50' : '#ccc', padding: '4px'
                                    }}
                                    title="Marcar Gabarito"
                                >
                                    <Info size={20} />
                                </button>

                                {/* Mini Popover for Setting Key */}
                                {openKeyPopover === idx && (
                                    <div style={{
                                        position: 'absolute', right: '30px', top: '-10px',
                                        background: '#fff', borderRadius: '30px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                        border: '1px solid #eee',
                                        padding: '4px 8px',
                                        display: 'flex', gap: '4px', zIndex: 100
                                    }}>
                                        {['A', 'B', 'C', 'D', 'E'].map(kOpt => (
                                            <button
                                                key={kOpt}
                                                onClick={() => handleKeyClick(idx, kOpt)}
                                                style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    border: '1px solid #ddd', background: keyVal === kOpt ? '#4caf50' : '#fff',
                                                    color: keyVal === kOpt ? '#fff' : '#555',
                                                    fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                                                }}
                                            >
                                                {kOpt}
                                            </button>
                                        ))}
                                        {/* Clear Key Option */}
                                        <button
                                            onClick={() => handleKeyClick(idx, null)}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                border: '1px solid #ddd', background: '#f5f5f5', color: '#888',
                                                fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="Limpar Gabarito"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls (Bottom) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px' }}>
                <button
                    disabled={currentPage === 0}
                    onClick={() => {
                        setCurrentPage(p => p - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ background: 'none', border: 'none', cursor: currentPage === 0 ? 'default' : 'pointer', color: currentPage === 0 ? '#ccc' : 'var(--color-primary)' }}
                >
                    <ChevronLeft size={32} />
                </button>
                <button
                    disabled={currentPage === totalPages - 1}
                    onClick={() => {
                        setCurrentPage(p => p + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ background: 'none', border: 'none', cursor: currentPage === totalPages - 1 ? 'default' : 'pointer', color: currentPage === totalPages - 1 ? '#ccc' : 'var(--color-primary)' }}
                >
                    <ChevronRight size={32} />
                </button>
            </div>
        </div>
    );
};

export default QuizSheet;
