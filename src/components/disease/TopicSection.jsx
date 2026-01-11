import React, { useState } from 'react';
import { Maximize2, Minimize2, Flame } from 'lucide-react';

const colorMap = {
    pink: { bg: '#FADADD', border: '#F4B6BE' },
    blue: { bg: '#D6EAF8', border: '#AED6F1' },
    yellow: { bg: '#FCF3CF', border: '#F9E79F' },
    default: { bg: '#FFFFFF', border: '#E0E0E0' }
};

const TopicSection = ({ title, content, color = 'default', isEditable, onChange, index, relevance }) => {
    // ... (hooks)
    const [isFullscreen, setIsFullscreen] = useState(false);
    const styles = colorMap[color] || colorMap.default;
    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
    const fullscreenStyles = isFullscreen ? { /* ... */ } : {}; // (Simplified for diff, assume existing logic matches)

    // Relevance Visuals
    const isHot = relevance?.isHot;
    const count = relevance?.count || 0;

    // Dynamic Border/Shadow for Hot Sections
    const hotStyle = isHot ? {
        border: `2px solid #e76f51`, // Orange border
        boxShadow: '0 4px 12px rgba(231, 111, 81, 0.15)'
    } : {};

    return (
        <>
            {/* Overlay ... */}
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
                position: 'relative', // For badges
                ...hotStyle, // Apply Hot Style
                ...fullscreenStyles
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontWeight: 'bold',
                            color: isHot ? '#d97706' : 'var(--color-text)', // Orange text if hot
                            fontSize: '0.95rem'
                        }}>
                            {title}
                        </span>

                        {/* Smart Tag: Question Count Badge */}
                        {count > 0 && (
                            <span
                                id={`badge-${index}`} // Added ID for Tour Targeting
                                title={`${count} questões de prova encontradas sobre este tópico`}
                                style={{
                                    fontSize: '0.7rem', fontWeight: 'bold',
                                    background: isHot ? '#e76f51' : '#264653',
                                    color: '#fff',
                                    padding: '2px 6px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', gap: '3px'
                                }}
                            >
                                {isHot && <Flame size={10} fill="#fff" />}
                                {count}
                            </span>
                        )}
                    </div>

                    <button onClick={toggleFullscreen} className="icon-btn">
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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
            </div >
            {/* Styles for print toggle */}
            < style > {`
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
