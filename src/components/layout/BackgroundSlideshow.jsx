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
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: i === index ? 0.15 : 0, // Very subtle opacity (15%)
                        transition: 'opacity 2s ease-in-out'
                    }}
                />
            ))}
            {/* Overlay to ensure text readability if images are too busy */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.4)' // White tint
            }} />
        </div>
    );
};

export default BackgroundSlideshow;
