import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

const colorMap = {
    pink: { bg: '#FADADD', border: '#F4B6BE' },
    blue: { bg: '#D6EAF8', border: '#AED6F1' },
    yellow: { bg: '#FCF3CF', border: '#F9E79F' },
    default: { bg: '#FFFFFF', border: '#E0E0E0' }
};

const TopicSection = ({ title, content, color = 'default', isEditable, onChange, index }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const styles = colorMap[color] || colorMap.default;

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    // Styles for fullscreen overlay
    const fullscreenStyles = isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        margin: 0,
        borderRadius: 0,
        height: '100vh',
        width: '100vw',
        padding: '32px',
        boxSizing: 'border-box'
    } : {};

    return (
        <>
            {/* Overlay background for focus mode */}
            {isFullscreen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999
                }} onClick={toggleFullscreen} />
            )}

            <div style={{
                backgroundColor: styles.bg,
                border: `1px solid ${styles.border} `,
                borderRadius: 'var(--border-radius)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: isFullscreen ? '0 10px 40px rgba(0,0,0,0.2)' : 'var(--shadow-sm)',
                height: isFullscreen ? 'auto' : '100%',
                minHeight: '180px',
                transition: 'all 0.3s ease',
                ...fullscreenStyles
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${styles.border} `,
                    paddingBottom: '8px',
                    marginBottom: '4px'
                }}>
                    <h3 style={{
                        fontSize: isFullscreen ? '1.5rem' : '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {index !== undefined && <span style={{ marginRight: '6px', opacity: 0.6 }}>{index}.</span>}
                        {title}
                    </h3>
                    <button
                        onClick={toggleFullscreen}
                        style={{ opacity: 0.6, cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center' }}
                        title={isFullscreen ? "Minimizar" : "Expandir (Foco)"}
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={16} />}
                    </button>
                </div>

                {isEditable ? (
                    <>
                        {/* Normal Textarea for non-print usage */}
                        <textarea
                            className="no-print"
                            value={content}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={`Escreva sobre ${title}...`}
                            style={{
                                flex: 1,
                                border: 'none',
                                background: 'rgba(255,255,255,0.5)',
                                resize: 'none',
                                fontFamily: 'inherit',
                                fontSize: isFullscreen ? '1.2rem' : '0.9rem',
                                padding: '16px',
                                borderRadius: '8px',
                                outline: 'none',
                                lineHeight: 1.6
                            }}
                        />
                        {/* Print-only expansion div - mimics textarea look but expands fully */}
                        <div className="print-only" style={{
                            display: 'none', // Overridden by media print
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.9rem',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.5)',
                            borderRadius: '8px',
                            border: `1px solid ${styles.border}`
                        }}>
                            {content || '...'}
                        </div>
                    </>
                ) : (
                    <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                        {content || <span style={{ color: 'rgba(0,0,0,0.4)', fontStyle: 'italic' }}>Em branco...</span>}
                    </div>
                )}
            </div>
            {/* Styles for print toggle */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    /* Force blocks to not break awkwardly */
                    div { break-inside: avoid; } 
                }
            `}</style>
        </>
    );
};

export default TopicSection;
