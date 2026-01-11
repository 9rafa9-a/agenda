import React from 'react';

const ActivityCalendar = ({ diseases = [] }) => {
    // Generate last 28 days
    const days = Array.from({ length: 28 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (27 - i));
        return d;
    });

    // Check activity for each day
    const getActivityLevel = (date) => {
        const activityCount = diseases.filter(d => {
            if (!d.lastEdited) return false;
            const editDate = new Date(d.lastEdited);
            return editDate.toDateString() === date.toDateString();
        }).length;

        if (activityCount === 0) return 0;
        if (activityCount === 1) return 1;
        if (activityCount === 2) return 2;
        return 3;
    };

    const colors = ['#f0f0f0', '#FADADD', '#F4B6BE', '#E68FAC']; // Default, Low, Med, High (Pink Theme)

    return (
        <div className="activity-calendar-card" style={{
            background: '#fff',
            padding: '20px',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', color: '#666', margin: 0 }}>Frequência de Estudos 📅</h3>
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Últimos 30 dias</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                {days.map((date, i) => {
                    const level = getActivityLevel(date);
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                        <div
                            key={i}
                            title={`${date.toLocaleDateString()}: ${level > 0 ? 'Estudou!' : 'Sem atividade'}`}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '3px',
                                background: colors[level],
                                border: isToday ? '1px solid #aaa' : 'none',
                                flexGrow: 1,
                                maxWidth: '20px',
                                minWidth: '8px'
                            }}
                        />
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>
                <span>Menos</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {colors.map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} />)}
                </div>
                <span>Mais</span>
            </div>
        </div>
    );
};

export default ActivityCalendar;
