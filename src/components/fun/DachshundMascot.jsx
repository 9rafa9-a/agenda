import React, { useEffect, useState, useRef } from 'react';

// Dog types and their properties
const DOG_TYPES = {
    NORMAL: { duration: '15s', emoji: '🐕', scale: 1, zIndex: 9999 },
    PUPPY: { duration: '12s', emoji: '🐕', scale: 0.7, zIndex: 10000 },
    LONG_BOI: { duration: '20s', emoji: '🌭', scale: 1.5, zIndex: 9998 },
    ZOOMIES: { duration: '3s', emoji: '🐕💨', scale: 1, zIndex: 10001 }
};

const DachshundMascot = () => {
    const [dogs, setDogs] = useState([]);
    const dogIdCounter = useRef(0);

    // Helper to spawn a dog
    const spawnDog = (type = 'NORMAL') => {
        const id = dogIdCounter.current++;
        const config = DOG_TYPES[type] || DOG_TYPES.NORMAL;

        // console.log(`Spawning Dog: ${type} (ID: ${id})`); 

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

    // Debug trigger
    const forceSpawn = () => {
        console.log('Force spawning dog via button');
        spawnDog('NORMAL');
    };

    return (
        <>
            {/* Debug Button - Remove later */}
            <button
                onClick={forceSpawn}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 10002,
                    padding: '8px 16px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: 0.5
                }}
            >
                Chamar Salsicha (Debug)
            </button>

            {dogs.map(dog => (
                <div
                    key={dog.id}
                    className="walking-dog"
                    onAnimationEnd={() => {
                        console.log('Animation ended for dog', dog.id);
                        removeDog(dog.id);
                    }}
                    onClick={() => handleBark(dog.id)}
                    style={{
                        position: 'fixed',
                        bottom: '20px', // Raised slightly
                        left: '-10%',
                        fontSize: '3rem',
                        zIndex: dog.zIndex,
                        cursor: 'pointer',
                        transform: `scale(${dog.scale})`,
                        userSelect: 'none',
                        // Red border for visibility check
                        border: '2px solid red',
                        background: 'rgba(255, 255, 0, 0.2)', // Yellow tint
                        // CSS Animation
                        animation: `walkAcross ${dog.duration} linear forwards`
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        {dog.emoji}
                        {dog.isBarking && (
                            <div style={{
                                position: 'absolute',
                                top: '-40px',
                                left: '10px',
                                background: '#fff',
                                color: '#333',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '1rem',
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
                                top: '-10px',
                                right: '0px',
                                fontSize: '1rem',
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
                0% { left: -10vw; } 
                100% { left: 110vw; } /* Using VW to ensure it crosses screen */
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
