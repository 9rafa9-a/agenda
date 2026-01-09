import React from 'react';

const colorMap = {
    pink: { bg: '#FADADD', border: '#F4B6BE' },
    blue: { bg: '#D6EAF8', border: '#AED6F1' },
    yellow: { bg: '#FCF3CF', border: '#F9E79F' },
    default: { bg: '#FFFFFF', border: '#E0E0E0' }
};

const TopicSection = ({ title, content, color = 'default', isEditable, onChange, index }) => {
    const styles = colorMap[color] || colorMap.default;

    return (
        <div style={{
            backgroundColor: styles.bg,
            border: `1px solid ${styles.border}`,
            borderRadius: 'var(--border-radius)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)',
            height: '100%',
            minHeight: '180px'
        }}>
            <h3 style={{
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: `1px solid ${styles.border}`,
                paddingBottom: '8px',
                marginBottom: '4px'
            }}>
                {index !== undefined && <span style={{ marginRight: '6px', opacity: 0.6 }}>{index}.</span>}
                {title}
            </h3>

            {isEditable ? (
                <textarea
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Escreva sobre ${title}...`}
                    style={{
                        flex: 1,
                        border: 'none',
                        background: 'rgba(255,255,255,0.5)',
                        resize: 'none',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        padding: '8px',
                        borderRadius: '8px',
                        outline: 'none'
                    }}
                />
            ) : (
                <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {content || <span style={{ color: 'rgba(0,0,0,0.4)', fontStyle: 'italic' }}>Em branco...</span>}
                </div>
            )}
        </div>
    );
};

export default TopicSection;
