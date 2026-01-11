import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
    const [active, setActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [steps, setSteps] = useState([]);
    const [history, setHistory] = useState({}); // To track completed "milestones" if needed

    const navigate = useNavigate();
    const location = useLocation();

    // TOUR DEFINITION
    const TOUR_STEPS = [
        {
            id: 'intro',
            target: null, // Center
            message: "Bem-vindo ao Minha Residência! 🧭\nVamos fazer um tour rápido?",
            action: 'next',
            position: 'center'
        },
        // Mobile Only Step
        ...(window.innerWidth <= 768 ? [{
            id: 'open-menu',
            target: '#mobile-menu-toggle',
            message: "Primeiro, abra o menu para vermos as opções.",
            action: 'next',
            shouldClickTarget: true
        }] : []),
        {
            id: 'nav-new',
            target: '#nav-new',
            message: "Tudo começa aqui.\nVamos criar um **Novo Resumo**.",
            action: 'wait_click',
            route: '/' // Ensure we are on dashboard initially
        },
        {
            id: 'input-title',
            target: '#input-title',
            message: "Observe: já preenchemos com **'ASMA'** para você! 🪄",
            action: 'next',
            autoFill: 'ASMA',
            route: '/new'
        },
        {
            id: 'input-subject',
            target: '#input-subject', // Added Subject Step
            message: "E definimos a matéria como **'Clínica Médica'**.",
            action: 'next',
            autoFill: 'Clínica Médica'
        },
        {
            id: 'topic-treatment',
            target: '#section-treatment',
            message: "Viu isso? 🔥\n4 questões de **Tratamento/Conduta** já apareceram!\nO app te mostra o que é mais cobrado.",
            action: 'next'
        },
        {
            id: 'btn-questions',
            target: '#btn-questions',
            message: "Curiosidade sobre o que cai? 🤔\nClique aqui para ver as **Questões de Prova** reais que cobram este tema.",
            action: 'next',
            shouldClickTarget: true
        },
        // NEW: Educational Steps for Questions
        {
            id: 'exam-toggle',
            target: '#btn-view-checklist',
            message: "Aqui você pode alternar entre a **Lista de Questões** completas ou um **Checklist** inteligente.",
            action: 'next',
            // Wait for panel to open
            waitBefore: 800
        },
        {
            id: 'exam-filters',
            target: '#exam-filters-container', // If exists
            message: "Use os filtros para focar no que importa: Diagnóstico, Tratamento, etc.",
            action: 'next'
        },
        {
            id: 'exam-credits',
            // Try to find a treatment card, fallback to first card
            target: '.exam-question-card[data-focus*="Tratamento"]',
            message: "Horas do Rafa e Gemini esmiuçando todas as respostas dos ultimos 10 anos da AMRIGS. 🧠💎",
            action: 'next',
            position: 'top' // Force top to see content
        },
        {
            id: 'close-questions',
            target: '#btn-close-exam-context',
            message: "Legal, né? Agora vamos fechar o painel de questões.",
            action: 'next',
            shouldClickTarget: true,
            position: 'left'
        },
        {
            id: 'btn-evidence',
            target: '#btn-evidence',
            message: "Dúvida no plantão? 🏥\nAcesse **Evidências e Diretrizes** confiáveis direto por este botão.",
            action: 'next',
            shouldClickTarget: true
        },
        // NEW: Educational Steps for Evidence
        {
            id: 'evidence-filters',
            target: '#evidence-filters-container',
            message: "Filtre por **Diretrizes** (Guidelines), Revisões Sistemáticas e mais.",
            action: 'next',
            waitBefore: 800
        },
        {
            id: 'close-evidence',
            target: '#btn-close-evidence',
            message: "Tudo certo. Vamos fechar as evidências também.",
            action: 'next',
            shouldClickTarget: true,
            position: 'left'
        },
        {
            id: 'close-evidence',
            target: '#btn-close-evidence',
            message: "Tudo certo. Vamos fechar as evidências também.",
            action: 'next',
            shouldClickTarget: true,
            position: 'left'
        },
        {
            id: 'section-def',
            target: '#section-definition',
            message: "Comece escrevendo na Definição.\nClique para editar.",
            action: 'wait_focus' // Changed to focus to detect click/entry
        },
        {
            id: 'section-def-write',
            target: '#section-definition',
            message: "Escreva algo breve e clique em Próximo.\n(Ex: 'Doença inflamatória crônica...')",
            action: 'next',
            position: 'top' // Move bubble out of way
        },
        {
            id: 'btn-save',
            target: '#btn-save',
            message: "Não esqueça de **Salvar** seu progresso no final!",
            action: 'next'
        },
        // Mobile Only Step (Again)
        ...(window.innerWidth <= 768 ? [{
            id: 'open-menu-flashcards',
            target: '#mobile-menu-toggle',
            message: "Abra o menu novamente para acessarmos os Flashcards.",
            action: 'next',
            shouldClickTarget: true
        }] : []),
        {
            id: 'nav-flashcards',
            target: '#nav-flashcards',
            message: "Agora, vamos ver a mágica.\nClique em **Flashcards (AI)**.",
            action: 'wait_click'
        },
        {
            id: 'flashcard-select-deck',
            target: '#deck-btn-0', // Target the BUTTON now
            message: "Aqui estão seus decks.\nClique no botão **Estudar Agora**.",
            action: 'wait_click',
            route: '/flashcards'
        },
        {
            id: 'flashcard-flip',
            target: '#flashcard-card',
            message: "A IA criou cards automaticamente!\n**Clique no cartão** para ver a resposta.",
            action: 'wait_click', // Wait for flip
            position: 'bottom',
        },
        {
            id: 'flashcard-rate',
            target: '#flashcard-rate-options',
            message: "Agora avalie seu conhecimento.\nIsso ajusta quando você verá este card novamente.",
            action: 'wait_click', // Or next
            position: 'top',
        },
        {
            id: 'nav-quizzes',
            target: '#nav-quizzes',
            message: "Aqui você treina com **Provinhas**.",
            action: 'next'
        },
        {
            id: 'nav-analytics',
            target: '#nav-analytics',
            message: "E aqui está o **Raio-X**.\nSua bússola estratégica.",
            action: 'wait_click'
        },
        {
            id: 'tab-strategic',
            target: '#tab-strategic',
            message: "Visão Estratégica: O que cai mais?",
            action: 'wait_click',
            route: '/analytics'
        },
        {
            id: 'tab-tactical',
            target: '#tab-tactical',
            message: "Visão Tática: O que estudar em cada matéria?",
            action: 'wait_click' // User clicks tab
        },
        {
            id: 'nav-help',
            target: '#nav-help',
            message: "É isso! 🚀\nSe precisar, o Guia está aqui.\n\nBons estudos!",
            action: 'finish'
        }
    ];

    const startTour = React.useCallback(() => {
        setActive(true);
        setStepIndex(0);

        // Initial setup for guest
        // Ensure we handle routing if starting from weird place
        if (location.pathname !== '/') {
            navigate('/');
        }
    }, [location.pathname, navigate]);

    const endTour = React.useCallback(() => {
        setActive(false);
        setStepIndex(0);
        localStorage.setItem('hasSeenGuestTour', 'true');
    }, []);

    const nextStep = React.useCallback(() => {
        setStepIndex(prev => {
            if (prev < TOUR_STEPS.length - 1) {
                return prev + 1;
            } else {
                endTour();
                return 0;
            }
        });
    }, [TOUR_STEPS.length, endTour]);

    const currentStep = TOUR_STEPS[stepIndex];

    const value = React.useMemo(() => ({
        active, currentStep, nextStep, startTour, endTour
    }), [active, currentStep, nextStep, startTour, endTour]);

    return (
        <TourContext.Provider value={value}>
            {children}
        </TourContext.Provider>
    );
};
