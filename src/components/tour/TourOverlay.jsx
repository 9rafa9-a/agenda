import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '../../contexts/TourContext';
import { useNavigate } from 'react-router-dom';

const TourOverlay = () => {
    const { active, currentStep, nextStep, endTour } = useTour();
    const navigate = useNavigate();
    const [targetRect, setTargetRect] = useState(null);
    const [showBubble, setShowBubble] = useState(false);

    // Render Bold Text Helper
    const renderMessage = (msg) => {
        if (!msg) return null;
        const parts = msg.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <b key={i} style={{ color: '#264653' }}>{part.slice(2, -2)}</b>;
            }
            return part;
        });
    };

    // Optimized Update Loop (painless scroll tracking)
    useEffect(() => {
        if (!active || !currentStep) return;

        let rafId;
        let hasScrolled = false; // Local flag for this step instance

        const updatePosition = () => {
            if (!currentStep.target) {
                setTargetRect(null);
                setShowBubble(true);
                return;
            }

            const el = document.querySelector(currentStep.target);
            if (el) {
                // Support delay before showing bubble (for animations)
                if (currentStep.waitBefore && !hasScrolled) {
                    setTimeout(() => {
                        const rect = el.getBoundingClientRect();
                        setTargetRect({
                            top: rect.top, left: rect.left, width: rect.width, height: rect.height
                        });
                        setShowBubble(true);
                        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    }, currentStep.waitBefore);
                    hasScrolled = true;
                    return;
                }

                if (currentStep.waitBefore && hasScrolled && !targetRect) {
                    // Waiting... don't set rect yet
                    return;
                }

                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
                // Show bubble only if we have a rect (or after wait)
                if (!currentStep.waitBefore || hasScrolled) {
                    setShowBubble(true);
                }

                // Auto-scroll ONCE when element is found
                if (!hasScrolled) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    hasScrolled = true;
                }
            } else {
                // Keep retrying finding element without creating zombie Rects
            }
            rafId = requestAnimationFrame(updatePosition);
        };

        rafId = requestAnimationFrame(updatePosition);

        return () => cancelAnimationFrame(rafId);
    }, [active, currentStep]);

    // DEBUG OVERLAY
    const debugMode = false; // Disabled
    const hasTarget = !!document.querySelector(currentStep?.target);

    const renderDebug = () => {
        if (!debugMode || !active) return null;
        return (
            <div style={{
                position: 'fixed', bottom: 10, right: 10,
                background: 'rgba(0,0,0,0.8)', color: '#0f0',
                padding: '10px', borderRadius: '8px',
                fontSize: '10px', fontFamily: 'monospace', zIndex: 99999,
                pointerEvents: 'none'
            }}>
                <div>STEP: {currentStep?.id} ({useTour().stepIndex})</div>
                <div>TARGET: {currentStep?.target}</div>
                <div>FOUND: {hasTarget ? 'YES' : 'NO'}</div>
                <div>ACTION: {currentStep?.action}</div>
                <div>AUTOFILL: {currentStep?.autoFill || 'N/A'}</div>
            </div>
        );
    };

    // Added: Auto-Fill Logic for Magic Steps (Robust Retry)
    useEffect(() => {
        if (!active || !currentStep || !currentStep.autoFill) return;

        let attempts = 0;
        const maxAttempts = 20; // 10 seconds (20 * 500ms)

        const tryFill = () => {
            const el = document.querySelector(currentStep.target);
            if (el) {
                // React requires setting value AND dispatching event hack
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeInputValueSetter.call(el, currentStep.autoFill);

                const ev = new Event('input', { bubbles: true });
                el.dispatchEvent(ev);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(tryFill, 500);
            }
        };

        tryFill();
    }, [active, currentStep]);

    // State to track if we are already advancing to prevent double-skips
    const [isAdvancing, setIsAdvancing] = useState(false);

    // Auto-Advance on Input Match with DELAY
    useEffect(() => {
        if (!active || !currentStep || currentStep.action !== 'wait_input' || isAdvancing) return;

        const checkInput = () => {
            const el = document.querySelector(currentStep.target);
            if (el && currentStep.expectedValue) {
                const val = (el.value || el.innerText || '').toLowerCase();
                const expected = currentStep.expectedValue.toLowerCase();

                // Strict-ish match (must contain the full expected string)
                // AND must be focused to avoid autofill skipping
                if (val.includes(expected) && document.activeElement === el) {
                    setIsAdvancing(true);
                    setTimeout(() => {
                        nextStep();
                        setIsAdvancing(false);
                    }, 1000); // 1s delay for user to admire their work
                }
            }
        };

        const interval = setInterval(checkInput, 500);
        return () => clearInterval(interval);
    }, [active, currentStep, nextStep, isAdvancing]);

    // Enhanced "Next" Handler
    const handleNext = () => {
        if (isAdvancing) return;

        // 1. Block manual advance if waiting for specific input
        if (currentStep?.action === 'wait_input' && currentStep?.expectedValue) {
            const el = document.querySelector(currentStep.target);
            const val = (el?.value || el?.innerText || '').toLowerCase();
            if (!val.includes(currentStep.expectedValue.toLowerCase())) {
                return;
            }
        }

        // 2. Auto-Click if requested
        if (currentStep?.shouldClickTarget || currentStep?.action === 'wait_click') {
            const el = document.querySelector(currentStep.target);
            if (el) el.click();
        }

        // 3. Advance with smooth delay
        setIsAdvancing(true);
        setTimeout(() => {
            nextStep();
            setIsAdvancing(false);
        }, 600);
    };

    // Helper to find Badge Position for Arrow
    const getArrowStyle = () => {
        if (!targetRect) return {};
        // Try to find the specific badge inside the target or globally
        const badge = document.getElementById('badge-treatment');
        if (badge) {
            const bRect = badge.getBoundingClientRect();
            return {
                top: bRect.top - 5,
                left: bRect.left + bRect.width + 15,
            };
        }
        return {
            top: targetRect.top + 20,
            left: targetRect.left + 250
        };
    };

    const arrowPos = getArrowStyle();

    // Position Helper
    const getBubbleStyle = () => {
        if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        const bubbleHeight = 200;
        const isBottomHalf = targetRect.top > window.innerHeight / 2;

        // Default: Below
        let top = targetRect.top + targetRect.height + 20;

        // If bottom half or tall element, go ABOVE
        if (isBottomHalf || targetRect.height > 300) {
            top = targetRect.top - bubbleHeight - 20;
        }

        // Clamp Logic
        top = Math.min(window.innerHeight - 220, Math.max(20, top));
        const left = Math.min(window.innerWidth - 320, Math.max(20, targetRect.left + (targetRect.width / 2) - 150));

        return { top: top, left: left, transform: 'none' };
    };

    const bubblePos = getBubbleStyle();

    // Handle User Interactions (Clicks/Inputs)
    useEffect(() => {
        if (!active || !currentStep || !currentStep.target) return;

        const el = document.querySelector(currentStep.target);
        if (!el) return;

        const handleInteraction = (e) => {
            // Only auto-advance click steps if the user manually clicks the valid target
            // But we have the 'Next' button doing it too. 
            // Let's keep this for natural usage.
            if (currentStep.action === 'wait_click') {
                // Prevent memory leaks / double triggering
                el.removeEventListener('click', handleInteraction);
                setTimeout(nextStep, 600);
            }
            if (currentStep.action === 'wait_focus' && e.type === 'focus') {
                el.removeEventListener('focus', handleInteraction);
                setTimeout(nextStep, 1000);
            }
        };

        if (currentStep.action === 'wait_click') {
            el.addEventListener('click', handleInteraction);
        }
        if (currentStep.action === 'wait_focus') {
            el.addEventListener('focus', handleInteraction);
        }

        return () => {
            if (currentStep.action === 'wait_click') el.removeEventListener('click', handleInteraction);
            if (currentStep.action === 'wait_focus') el.removeEventListener('focus', handleInteraction);
        };

    }, [active, currentStep, nextStep]);


    if (!active) return null;

    // Overlay with "Hole"
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9990, pointerEvents: 'none' }}>
            {renderDebug()}

            {/* DIMMED BACKGROUND WITH HOLE */}
            {targetRect && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)',
                    clipPath: `polygon(
                        0% 0%, 0% 100%, 
                        ${targetRect.left}px 100%, 
                        ${targetRect.left}px ${targetRect.top}px, 
                        ${targetRect.left + targetRect.width}px ${targetRect.top}px, 
                        ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px, 
                        ${targetRect.left}px ${targetRect.top + targetRect.height}px, 
                        ${targetRect.left}px 100%, 
                        100% 100%, 100% 0%
                    )`
                }}></div>
            )}

            {/* SPOTLIGHT BORDER (BLINKING) */}
            {targetRect && (
                <div style={{
                    position: 'absolute',
                    top: targetRect.top - 5,
                    left: targetRect.left - 5,
                    width: targetRect.width + 10,
                    height: targetRect.height + 10,
                    border: '4px solid #FFD700',
                    borderRadius: '8px',
                    boxShadow: '0 0 20px #FFD700',
                    animation: 'blink 1.5s infinite',
                    pointerEvents: 'none'
                }}></div>
            )}

            {/* REFINED ARROW VISUAL */}
            {targetRect && currentStep.id === 'topic-treatment' && (
                <div style={{
                    position: 'absolute',
                    ...arrowPos,
                    zIndex: 10001,
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
                    transform: 'translateY(-10px)' // Fine tune
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* 1. Arrow Pointing LEFT */}
                        <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
                            <path d="M40 15 L5 15 M15 5 L5 15 L15 25" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>

                        {/* 2. Text Label */}
                        <div style={{
                            background: '#FFD700', color: '#000', padding: '4px 10px',
                            borderRadius: '20px', fontWeight: '800', fontSize: '0.85rem',
                            whiteSpace: 'nowrap'
                        }}>
                            Olha aqui! 🔥
                        </div>
                    </div>
                </div>
            )}

            {/* SPEECH BUBBLE */}
            {showBubble && (
                <div style={{
                    position: 'absolute',
                    ...bubblePos, // Apply optimized pos
                    width: '300px',
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '20px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    border: '2px solid #264653',
                    pointerEvents: 'auto', // Interactive
                    textAlign: 'center',
                    animation: 'popIn 0.3s ease-out',
                    zIndex: 10000 // Ensure above overlay
                }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '15px', whiteSpace: 'pre-line' }}>
                        {renderMessage(currentStep?.message)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            {currentStep.action !== 'wait_click' && (
                                <button onClick={handleNext} style={btnStyle}>
                                    {currentStep?.action === 'finish' ? 'Concluir' : 'Próximo ➤'}
                                </button>
                            )}
                            <button onClick={endTour} style={{ ...btnStyle, background: '#eee', color: '#666' }}>
                                Pular
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes blink {
                    0% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.02); }
                    100% { opacity: 0.6; transform: scale(1); }
                }
                @keyframes popIn {
                    0% { transform: scale(0.8) translateY(20px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const btnStyle = {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    background: '#264653', color: '#fff', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '0.9rem'
};

export default TourOverlay;
