import React, { useState, useEffect } from 'react';

// 20 placeholder aesthetic/medical images
const IMAGES = [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1920&q=80', // Medical Lab
    'https://images.unsplash.com/photo-1516549655169-df83a083fc9b?auto=format&fit=crop&w=1920&q=80', // Stethoscope
    'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80', // Pink Coffe
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1920&q=80', // Doctors
    'https://images.unsplash.com/photo-1584036561566-b937500d785e?auto=format&fit=crop&w=1920&q=80', // Stethoscope Pink
    'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1920&q=80', // Doctor Hand
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80', // Anatomy
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&q=80', // Lab Test
    'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=1920&q=80', // Desk Study
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1920&q=80', // Book Study
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1920&q=80', // Pink Medical
    'https://images.unsplash.com/photo-1576091160550-2187d80aeff2?auto=format&fit=crop&w=1920&q=80', // Hospital
    'https://images.unsplash.com/photo-1628771065518-0d82f0263320?auto=format&fit=crop&w=1920&q=80', // Nurse
    'https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=1920&q=80', // Research
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1920&q=80', // Study Vibes
    'https://images.unsplash.com/photo-1581056771107-24ca5f04895e?auto=format&fit=crop&w=1920&q=80', // Lab
    'https://images.unsplash.com/photo-1583912267652-3c898b9a9108?auto=format&fit=crop&w=1920&q=80', // Flowers clean
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1920&q=80', // Laptop
    'https://images.unsplash.com/photo-1512428559087-560fa5ce7d87?auto=format&fit=crop&w=1920&q=80', // Minimalist
    'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=1920&q=80'  // Coffee
];

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
