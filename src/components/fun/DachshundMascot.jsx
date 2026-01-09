import React, { useEffect, useState, useRef } from 'react';

// Dog types and their properties
const DOG_TYPES = {
    NORMAL: { speed: 15, emoji: '🐕', scale: 1, zIndex: 9999 },
    PUPPY: { speed: 12, emoji: '🐕', scale: 0.7, zIndex: 10000 },
    LONG_BOI: { speed: 20, emoji: '🌭', scale: 1.5, zIndex: 9998 },
    ZOOMIES: { speed: 3, emoji: '🐕💨', scale: 1, zIndex: 10001 }
};

const DachshundMascot = () => {
    const [dogs, setDogs] = useState([]);
    const dogIdCounter = useRef(0);

    // Helper to spawn a dog
    const spawnDog = (type = 'NORMAL', delay = 0) => {
        const id = dogIdCounter.current++;
        const dogConfig = DOG_TYPES[type] || DOG_TYPES.NORMAL;

        // Add dog to state
        setTimeout(() => {
            setDogs(prev => [...prev, {
                id,
                ...dogConfig,
                startTime: Date.now(),
                position: -10, // Start just off screen left
                isBarking: false
            }]);
        }, delay);
    };

    // Immediate spawn on mount
    useEffect(() => {
        spawnDog('NORMAL'); // The Greeter
        spawnDog('PUPPY', 2000); // And a puppy shortly after
    }, []);

    // Random spawner logic
    useEffect(() => {
        const interval = setInterval(() => {
            const rand = Math.random();
            if (rand > 0.6) { // 40% chance every 4s
                const typeRand = Math.random();
                if (typeRand > 0.9) {
                    // PACK: Spawn 3
                    spawnDog('NORMAL');
                    spawnDog('NORMAL', 800);
                    spawnDog('PUPPY', 1600);
                } else if (typeRand > 0.7) {
                    spawnDog('ZOOMIES');
                } else if (typeRand > 0.5) {
                    spawnDog('LONG_BOI');
                } else {
                    spawnDog('NORMAL');
                }
            }
        }, 4000); // Check every 4 seconds

        return () => clearInterval(interval);
    }, []);

    // Animation Loop
    useEffect(() => {
        let animationFrameId;

        const animate = () => {
            const now = Date.now();

            setDogs(prevDogs => {
                // Filter out dogs that have crossed the screen
                const activeDogs = prevDogs.filter(dog => dog.position <= 110);

                return activeDogs.map(dog => {
                    const elapsed = (now - dog.startTime) / 1000; // seconds
                    const totalDist = 120; // -10 to 110
                    const progress = elapsed / dog.speed;
                    const newPos = -10 + (totalDist * progress);

                    return { ...dog, position: newPos };
                });
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    const handleBark = (id) => {
        setDogs(prev => prev.map(d => {
            if (d.id === id) return { ...d, isBarking: true };
            return d;
        }));

        // Stop barking after 1s
        setTimeout(() => {
            setDogs(prev => prev.map(d => {
                if (d.id === id) return { ...d, isBarking: false };
                return d;
            }));
        }, 1000);
    };

    return (
        <>
            {dogs.map(dog => (
                <div
                    key={dog.id}
                    onClick={() => handleBark(dog.id)}
                    style={{
                        position: 'fixed',
                        bottom: '10px',
                        left: `${dog.position}%`,
                        fontSize: '3rem',
                        zIndex: dog.zIndex,
                        cursor: 'pointer',
                        transform: `scale(${dog.scale})`,
                        transition: 'bottom 0.2s',
                        userSelect: 'none',
                        filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.1))'
                    }}
                >
                    {dog.emoji}
                    {dog.isBarking && (
                        <div style={{
                            position: 'absolute',
                            top: '-30px',
                            left: '20px',
                            background: '#fff',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            border: '2px solid #333',
                            whiteSpace: 'nowrap',
                            animation: 'pop 0.2s ease-out'
                        }}>
                            Au! 🦴
                        </div>
                    )}
                    {/* Heart float animation */}
                    {!dog.isBarking && (
                        <div style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '0px',
                            fontSize: '1rem',
                            opacity: 0.8,
                            animation: 'float 2s infinite ease-in-out'
                        }}>
                            ❤️
                        </div>
                    )}
                </div>
            ))}
            <style>{`
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
