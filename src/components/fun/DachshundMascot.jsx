import React, { useEffect, useState } from 'react';

const DachshundMascot = () => {
    const [position, setPosition] = useState(-100);
    const [isWalking, setIsWalking] = useState(false);
    const [direction, setDirection] = useState('right'); // 'right' or 'left'

    useEffect(() => {
        // Start walking randomly
        const checkWalk = setInterval(() => {
            if (!isWalking && Math.random() > 0.7) {
                startWalk();
            }
        }, 5000);

        return () => clearInterval(checkWalk);
    }, [isWalking]);

    const startWalk = () => {
        setIsWalking(true);
        const startPos = -10;
        const endPos = 110;
        const duration = 15000; // 15 seconds to cross screen
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentPos = startPos + (endPos - startPos) * progress;
            setPosition(currentPos);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsWalking(false);
                setPosition(-10);
            }
        };

        requestAnimationFrame(animate);
    };

    if (!isWalking) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '10px',
                left: `${position}%`,
                fontSize: '3rem',
                zIndex: 9999,
                pointerEvents: 'none',
                transition: 'transform 0.1s linear',
                filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.1))'
            }}
        >
            🐕
            <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-10px',
                fontSize: '1rem',
                animation: 'float 2s infinite ease-in-out'
            }}>
                ❤️
            </div>
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default DachshundMascot;
