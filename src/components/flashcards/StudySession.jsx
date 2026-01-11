
import React, { useState } from 'react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { calculateNextReview } from '../../services/ai/gemini';

const StudySession = ({ deck, onClose, currentUser }) => {
    // Deck cards should already have the correct 'nextReview' merged in by Dashboard
    const sessionCards = deck.cards.filter(c => {
        const now = Date.now();
        return !c.nextReview || c.nextReview <= now;
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [finished, setFinished] = useState(sessionCards.length === 0);

    const currentCard = sessionCards[currentIndex];

    // Rating Logic
    const handleRate = async (rating) => {
        // Calculate new stats based on THIS user's current progress
        // currentCard already contains the merged progress from Dashboard
        const newStats = calculateNextReview(currentCard, rating);

        // Save to DB: update `progress.Rafa` or `progress.Ju`
        try {
            const cardRef = doc(db, 'diseases', deck.diseaseId, 'flashcards', currentCard.id);

            // Construct the path for update: "progress.Rafa"
            const fieldPath = `progress.${currentUser}`;

            await updateDoc(cardRef, {
                [fieldPath]: newStats
            });
        } catch (e) {
            console.error("Error saving progress", e);
        }

        // Move next
        setIsFlipped(false);
        if (currentIndex < sessionCards.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        } else {
            setFinished(true);
        }
    };

    if (sessionCards.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>Nada para estudar aqui! 🏖️</h2>
                <p>Bom trabalho, {currentUser}.</p>
                <button onClick={onClose}>Voltar</button>
            </div>
        );
    }

    if (finished) {
        return (
            <div style={{
                height: '80vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s'
            }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</h1>
                <h2 style={{ color: 'var(--color-primary)' }}>Sessão Concluída!</h2>
                <p>Você revisou {sessionCards.length} cartões.</p>
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '32px', padding: '12px 32px', borderRadius: '50px',
                        background: 'var(--color-text)', color: '#fff', border: 'none',
                        cursor: 'pointer', fontSize: '1.1rem'
                    }}
                >
                    Voltar ao Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', height: '85vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft /> Encerrar
                </button>
                <div style={{ color: '#aaa', fontWeight: 'bold' }}>
                    {currentIndex + 1} / {sessionCards.length}
                </div>
            </div>

            {/* Card Container (Perspective) */}
            <div style={{ flex: 1, perspective: '1000px', cursor: 'pointer' }} onClick={() => !isFlipped && setIsFlipped(true)}>
                <div id="flashcard-card" style={{
                    position: 'relative', width: '100%', height: '100%',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: '24px'
                }}>

                    {/* FRONT */}
                    <div style={{
                        position: 'absolute', width: '100%', height: '100%',
                        backfaceVisibility: 'hidden',
                        background: '#fff', borderRadius: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '40px', textAlign: 'center',
                        fontSize: '1.8rem', fontWeight: '500', color: '#333',
                        border: '1px solid #eee'
                    }}>
                        {currentCard.front}
                        <div style={{ position: 'absolute', bottom: '20px', fontSize: '0.9rem', color: '#ccc' }}>
                            (Clique para ver a resposta)
                        </div>
                    </div>

                    {/* BACK */}
                    <div style={{
                        position: 'absolute', width: '100%', height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: '#f8f9fa', borderRadius: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '40px', textAlign: 'center',
                        fontSize: '1.6rem', color: '#444',
                        border: '1px solid #eee'
                    }}>
                        {currentCard.back}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div id="flashcard-rate-options" style={{
                marginTop: '32px', minHeight: '80px',
                opacity: isFlipped ? 1 : 0,
                pointerEvents: isFlipped ? 'auto' : 'none',
                transition: 'opacity 0.2s',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px'
            }}>
                <button id="btn-rate-0" onClick={() => handleRate(0)} style={{ ...btnStyle, background: '#ffcdd2', color: '#c62828' }}>Errei<br /><small>Agora</small></button>
                <button id="btn-rate-1" onClick={() => handleRate(1)} style={{ ...btnStyle, background: '#ffe0b2', color: '#ef6c00' }}>Difícil<br /><small>2d</small></button>
                <button id="btn-rate-2" onClick={() => handleRate(2)} style={{ ...btnStyle, background: '#c8e6c9', color: '#2e7d32' }}>Bom<br /><small>3d</small></button>
                <button id="btn-rate-3" onClick={() => handleRate(3)} style={{ ...btnStyle, background: '#b3e5fc', color: '#0277bd' }}>Fácil<br /><small>5d</small></button>
            </div>
        </div>
    );
};

const btnStyle = {
    border: 'none', borderRadius: '12px', padding: '12px', fontSize: '1rem',
    fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s'
};

export default StudySession;
