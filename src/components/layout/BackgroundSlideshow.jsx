import React, { useState, useEffect } from 'react';

// Local images from public/backgrounds folder
// User needs to place 1.jpg, 2.jpg... 11.jpg in public/backgrounds
const IMAGES = Array.from({ length: 11 }, (_, i) => `/backgrounds/${i + 1}.jpg`);

const BackgroundSlideshow = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % IMAGES.length);
        }, 8000); // Change every 8 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            overflow: 'hidden',
            pointerEvents: 'none'
        }}>
            {IMAGES.map((img, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: i === index ? 1 : 0,
                        transition: 'opacity 2s ease-in-out'
                    }}
                >
                    {/* Layer 1: Blurred Fill (Background) */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(25px)',
                        transform: 'scale(1.1)', // Prevent blur edges
                        opacity: 0.5
                    }} />

                    {/* Layer 2: Main Image (Centered & Contained) */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                    }} />
                </div>
            ))}
            {/* Overlay to ensure text readability */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.25)'
            }} />
        </div>
    );
};

export default BackgroundSlideshow;
