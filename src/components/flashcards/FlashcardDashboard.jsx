
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Brain, Play, CheckCircle, Clock, User, Sparkles } from 'lucide-react';
import StudySession from './StudySession';

const FlashcardDashboard = () => {
    const [currentUser, setCurrentUser] = useState(localStorage.getItem('flashcard_user') || null);
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeck, setSelectedDeck] = useState(null);

    const navigate = useNavigate();

    // User Selection Handler
    const handleUserSelect = (user) => {
        setCurrentUser(user);
        localStorage.setItem('flashcard_user', user);
        // Trigger fetch
        setLoading(true);
    };

    useEffect(() => {
        if (currentUser) fetchDecks();
    }, [currentUser]);

    const fetchDecks = async () => {
        try {
            const q = query(collection(db, 'diseases'));
            const snap = await getDocs(q);

            const deckList = [];

            for (const d of snap.docs) {
                const diseaseData = d.data();
                if (diseaseData.trashed) continue;

                const fcRef = collection(db, 'diseases', d.id, 'flashcards');
                const fcSnap = await getDocs(fcRef);

                if (fcSnap.empty) continue;

                const cards = fcSnap.docs.map(c => ({ id: c.id, ...c.data(), diseaseId: d.id }));

                // Filter stats based on Current User
                const userCards = cards.map(c => {
                    // Extract progress for this user, or default
                    const progress = (c.progress && c.progress[currentUser]) || {};
                    return { ...c, ...progress }; // Mix in progress (interval, nextReview)
                });

                const now = Date.now();
                const due = userCards.filter(c => !c.nextReview || c.nextReview <= now);
                const newCards = userCards.filter(c => !c.repetitions);

                deckList.push({
                    diseaseId: d.id,
                    diseaseName: diseaseData.name,
                    subject: diseaseData.subject || 'Geral',
                    total: cards.length,
                    due: due.length,
                    new: newCards.length,
                    cards: userCards // These cards now have the correct 'nextReview' for the user
                });
            }

            setDecks(deckList);
        } catch (e) {
            console.error("Error fetching decks", e);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div style={{
                height: '80vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '32px'
            }}>
                <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '3rem', color: 'var(--color-primary)' }}>
                    Quem vai estudar hoje?
                </h1>
                <div style={{ display: 'flex', gap: '32px' }}>
                    <button onClick={() => handleUserSelect('Rafa')} style={userBtnStyle}>
                        <div style={{ fontSize: '4rem' }}>👨🏻‍🦰</div>
                        Rafa
                    </button>
                    <button onClick={() => handleUserSelect('Ju')} style={userBtnStyle}>
                        <div style={{ fontSize: '4rem' }}>👩🏻‍🦰</div>
                        Ju
                    </button>
                </div>
            </div>
        );
    }

    if (selectedDeck) {
        return (
            <StudySession
                deck={selectedDeck}
                currentUser={currentUser}
                onClose={() => {
                    setSelectedDeck(null);
                    fetchDecks();
                }}
            />
        );
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando progresso de {currentUser}... 🧠</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'var(--font-hand)', color: 'var(--color-primary)', margin: 0 }}>
                    Flashcards de {currentUser}
                </h1>
                <button onClick={() => handleUserSelect(null)} style={{ background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>
                    Trocar Usuário
                </button>
            </div>

            {decks.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px', background: '#fff',
                    borderRadius: '20px', border: '2px dashed #eee'
                }}>
                    <Brain size={48} color="#ddd" />
                    <p style={{ color: '#888', marginTop: '16px' }}>
                        Nenhum flashcard encontrado.<br />
                        Vá em um resumo e clique no botão "✨ Gerar Flashcards" para começar.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {decks.map(deck => (
                        <div key={deck.diseaseId} style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid #eee',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Subject Badge */}
                            <span style={{
                                position: 'absolute', top: '16px', right: '16px',
                                fontSize: '0.7rem', textTransform: 'uppercase',
                                background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px', color: '#666'
                            }}>
                                {deck.subject}
                            </span>

                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', paddingRight: '60px' }}>
                                {deck.diseaseName}
                            </h3>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                <div style={{
                                    flex: 1, background: '#e3f2fd', padding: '12px', borderRadius: '12px',
                                    textAlign: 'center', color: '#1976d2'
                                }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{deck.new}</div>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Novos</div>
                                </div>
                                <div style={{
                                    flex: 1, background: '#ffebee', padding: '12px', borderRadius: '12px',
                                    textAlign: 'center', color: '#d32f2f'
                                }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{deck.due}</div>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Revisar</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedDeck(deck)}
                                disabled={deck.due === 0 && deck.new === 0}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: (deck.due > 0 || deck.new > 0) ? 'var(--color-primary)' : '#eee',
                                    color: (deck.due > 0 || deck.new > 0) ? '#fff' : '#aaa',
                                    fontWeight: 'bold',
                                    cursor: (deck.due > 0 || deck.new > 0) ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {(deck.due > 0 || deck.new > 0) ? (
                                    <><Play size={18} /> Estudar Agora</>
                                ) : (
                                    <><CheckCircle size={18} /> Tudo em dia!</>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const userBtnStyle = {
    background: '#fff', border: '1px solid #eee', borderRadius: '24px',
    padding: '32px', cursor: 'pointer', minWidth: '200px',
    boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s',
    fontWeight: 'bold', fontSize: '1.5rem', color: '#555'
};

export default FlashcardDashboard;
