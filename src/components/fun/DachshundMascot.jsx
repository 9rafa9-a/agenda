import React, { useEffect, useState, useRef } from 'react';

// SVG Component for the Sausage Dog
const SausageDogSVG = ({ color = "#8B4513", w = 60, h = 40 }) => (
    <svg width={w} height={h} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Tail */}
        <path d="M85 20C85 20 90 10 95 15C100 20 95 25 88 28" stroke={color} strokeWidth="4" strokeLinecap="round" />
        {/* Body - The Sausage Part */}
        <rect x="20" y="20" width="70" height="25" rx="12" fill={color} />
        {/* Head */}
        <circle cx="20" cy="25" r="18" fill={color} />
        {/* Snout */}
        <path d="M10 25L2 28L10 31" fill={color} />
        <circle cx="4" cy="27" r="2" fill="black" />
        {/* Ear */}
        <path d="M20 25C20 25 10 30 12 40C14 50 24 40 24 35" fill="#5D2906" />
        {/* Eye */}
        <circle cx="15" cy="20" r="2.5" fill="black" />
        <circle cx="16" cy="19" r="1" fill="white" />
        {/* Legs */}
        <path d="M30 45V55" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M40 45V52" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M75 45V55" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M85 45V52" stroke={color} strokeWidth="5" strokeLinecap="round" />
        {/* Collar */}
        <rect x="28" y="20" width="4" height="25" fill="#FF4444" opacity="0.8" />
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
            if (Math.random() > 0.6) { // 40% chance every 4s
                const r = Math.random();
                if (r > 0.9) spawnDogsPack();
                else if (r > 0.7) spawnDog('ZOOMIES');
                else if (r > 0.5) spawnDog('LONG_BOI');
                else spawnDog('NORMAL');
            }
        }, 4000);
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
