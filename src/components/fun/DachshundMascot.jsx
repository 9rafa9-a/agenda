import React, { useEffect, useState, useRef } from 'react';

// SVG Component for the Sausage Dog
const SausageDogSVG = ({ color = "#8B4513", w = 60, h = 40 }) => (
    <svg width={w} height={h} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Tail - Wagging upwards */}
        <path d="M15 25C10 15 5 10 2 15" stroke={color} strokeWidth="4" strokeLinecap="round" />

        {/* Body - Long capsule */}
        <rect x="10" y="25" width="65" height="22" rx="11" fill={color} />

        {/* Neck/Collar - Slanted for perspective */}
        <path d="M70 26L74 46" stroke="#FF4444" strokeWidth="6" />

        {/* Head Group */}
        <g transform="translate(72, 22)">
            {/* Snout - Long and rounded (The "Sausage" face) */}
            <rect x="0" y="5" width="28" height="14" rx="7" fill={color} />

            {/* Forehead/Skull - Blending into snout */}
            <circle cx="5" cy="10" r="10" fill={color} />

            {/* Nose Tip - Cute button nose */}
            <circle cx="26" cy="12" r="3" fill="#2d1a10" />

            {/* Ear - Large, floppy, dark brown */}
            <path d="M2 8C-2 15 -2 25 5 28C8 29 10 25 10 20C10 15 8 8 2 8" fill="#5D2906" />

            {/* Eye - Bright and lively */}
            <circle cx="12" cy="8" r="2.5" fill="black" />
            <circle cx="13" cy="7" r="1" fill="white" />
        </g>

        {/* Legs - Short and stubby */}
        <path d="M20 45V55" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M30 46V53" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M60 45V55" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M70 46V53" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
);

// Dog types and their properties
const DOG_TYPES = {
    NORMAL: { duration: '15s', component: <SausageDogSVG />, scale: 1.5, zIndex: 9999 },
    PUPPY: { duration: '12s', component: <SausageDogSVG w={40} h={30} />, scale: 1, zIndex: 10000 },
    LONG_BOI: { duration: '20s', component: <SausageDogSVG w={90} h={40} />, scale: 2, zIndex: 9998 },
    ZOOMIES: { duration: '3s', component: <SausageDogSVG />, scale: 1.5, zIndex: 10001 }
};

const DachshundMascot = () => {
    const [dogs, setDogs] = useState([]);
    const dogIdCounter = useRef(0);

    // Helper to spawn a dog
    const spawnDog = (type = 'NORMAL') => {
        const id = dogIdCounter.current++;
        const config = DOG_TYPES[type] || DOG_TYPES.NORMAL;

        setDogs(prev => [...prev, {
            id,
            ...config,
            isBarking: false
        }]);
    };

    // Immediate spawn on mount
    useEffect(() => {
        spawnDog('NORMAL');
        setTimeout(() => spawnDog('PUPPY'), 2000);
    }, []);

    // Random spawner logic
    useEffect(() => {
        const interval = setInterval(() => {
            // Check every 60 seconds. High chance (90%) to spawn ONE group/dog.
            if (Math.random() > 0.1) {
                const r = Math.random();
                if (r > 0.9) spawnDogsPack();
                else if (r > 0.7) spawnDog('ZOOMIES');
                else if (r > 0.5) spawnDog('LONG_BOI');
                else spawnDog('NORMAL');
            }
        }, 60000); // 60 seconds interval
        return () => clearInterval(interval);
    }, []);

    const spawnDogsPack = () => {
        spawnDog('NORMAL');
        setTimeout(() => spawnDog('NORMAL'), 800);
        setTimeout(() => spawnDog('PUPPY'), 1600);
    };

    const removeDog = (id) => {
        setDogs(prev => prev.filter(d => d.id !== id));
    };

    const handleBark = (id) => {
        setDogs(prev => prev.map(d =>
            d.id === id ? { ...d, isBarking: true } : d
        ));
        setTimeout(() => {
            setDogs(prev => prev.map(d =>
                d.id === id ? { ...d, isBarking: false } : d
            ));
        }, 1000);
    };

    return (
        <>
            {dogs.map(dog => (
                <div
                    key={dog.id}
                    className="walking-dog"
                    onAnimationEnd={() => removeDog(dog.id)}
                    onClick={() => handleBark(dog.id)}
                    style={{
                        position: 'fixed',
                        bottom: '10px',
                        left: '-10%',
                        zIndex: dog.zIndex,
                        cursor: 'pointer',
                        transform: `scale(${dog.scale})`,
                        userSelect: 'none',
                        filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.1))',
                        animation: `walkAcross ${dog.duration} linear forwards`
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        {/* Bouncing Animation Wrapper */}
                        <div style={{ animation: 'bounce 0.5s infinite alternate' }}>
                            {dog.component}
                        </div>

                        {dog.isBarking && (
                            <div style={{
                                position: 'absolute',
                                top: '-30px',
                                left: '10px',
                                background: '#fff',
                                color: '#333',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                border: '2px solid #333',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                animation: 'pop 0.2s ease-out'
                            }}>
                                Au! 🦴
                            </div>
                        )}

                        {!dog.isBarking && (
                            <div style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '5px',
                                fontSize: '0.8rem',
                                animation: 'float 2s infinite ease-in-out'
                            }}>
                                ❤️
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <style>{`
            @keyframes walkAcross {
                0% { left: -15vw; } 
                100% { left: 110vw; } 
            }
            @keyframes bounce {
                0% { transform: translateY(0); }
                100% { transform: translateY(-3px); }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); opacity: 0.8; }
                50% { transform: translateY(-5px); opacity: 1; }
            }
            @keyframes pop {
                0% { transform: scale(0); }
                100% { transform: scale(1); }
            }
        `}</style>
        </>
    );
};

export default DachshundMascot;
