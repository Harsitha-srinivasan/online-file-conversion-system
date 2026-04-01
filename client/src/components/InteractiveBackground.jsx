import React, { useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FaFilePdf, FaFileImage, FaFileAlt, FaFileCode, FaFileWord, FaShieldAlt, FaRocket, FaDatabase } from 'react-icons/fa';

const InteractiveBackground = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 30, stiffness: 200 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const x = (clientX / window.innerWidth) - 0.5;
            const y = (clientY / window.innerHeight) - 0.5;
            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    const glowX = useTransform(smoothX, x => x * 300);
    const glowY = useTransform(smoothY, y => y * 300);

    // Generate stream paths with more variety and curvature
    const streams = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        y: Math.random() * 100 + '%',
        delay: Math.random() * 15,
        duration: 10 + Math.random() * 20,
        opacity: 0.1 + Math.random() * 0.15,
        color: i % 4 === 0 ? 'text-indigo-400' : (i % 3 === 0 ? 'text-pink-400' : (i % 2 === 0 ? 'text-purple-400' : 'text-cyan-400')),
        parallax: (Math.random() - 0.5) * 120,
        size: 1 + Math.random() * 2
    })), []);

    // Floating icons with stronger presence
    const floatingIcons = [
        { Icon: FaFilePdf, color: 'text-red-500/40', top: '20%', left: '15%', size: 'text-5xl', p: 50, glow: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.4))' },
        { Icon: FaFileImage, color: 'text-pink-500/40', top: '10%', left: '80%', size: 'text-4xl', p: -70, glow: 'drop-shadow(0 0 15px rgba(236, 72, 153, 0.4))' },
        { Icon: FaFileCode, color: 'text-purple-500/40', top: '70%', left: '10%', size: 'text-6xl', p: 40, glow: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))' },
        { Icon: FaFileWord, color: 'text-blue-500/40', top: '80%', left: '85%', size: 'text-5xl', p: -60, glow: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))' },
        { Icon: FaDatabase, color: 'text-indigo-400/30', top: '40%', left: '90%', size: 'text-3xl', p: -30, glow: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.3))' },
        { Icon: FaShieldAlt, color: 'text-green-400/30', top: '15%', left: '50%', size: 'text-4xl', p: 20, glow: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.3))' },
        { Icon: FaRocket, color: 'text-cyan-400/30', top: '85%', left: '20%', size: 'text-3xl', p: 80, glow: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.3))' },
    ];

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20 bg-transparent">
            {/* Base Mesh Grid (Circuit style) */}
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
                style={{ backgroundImage: 'radial-gradient(var(--text-muted) 0.5px, transparent 0.5px)', backgroundSize: '60px 60px' }}>
            </div>

            {/* Glowing Cursor Tracker - Adjusted for Light/Dark */}
            <motion.div
                className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-indigo-500/[0.07] dark:bg-indigo-500/[0.03] rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2"
                style={{ x: glowX, y: glowY }}
            />

            {/* Horizontal Streams & Bits */}
            {streams.map((stream) => (
                <motion.div
                    key={stream.id}
                    className={`absolute w-full h-[1px] ${stream.color}`}
                    style={{
                        top: stream.y,
                        opacity: stream.opacity,
                        x: useTransform(smoothX, x => x * stream.parallax)
                    }}
                >
                    <div className="absolute inset-x-0 h-full bg-current"></div>
                    {/* Moving Bit */}
                    <motion.div
                        className="absolute top-[-2px] w-2 h-1 bg-current blur-[1px]"
                        animate={{ left: ['-10%', '110%'] }}
                        transition={{
                            duration: stream.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: stream.delay
                        }}
                    />
                </motion.div>
            ))}

            {/* Parallax Floating Icons */}
            {floatingIcons.map((item, i) => (
                <motion.div
                    key={i}
                    className={`absolute ${item.color} ${item.size} blur-[0.2px]`}
                    style={{
                        top: item.top,
                        left: item.left,
                        x: useTransform(smoothX, x => x * item.p),
                        y: useTransform(smoothY, y => y * item.p),
                        filter: item.glow
                    }}
                    animate={{
                        y: [0, -25, 0],
                        rotate: [0, 8, -8, 0],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 5 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.4
                    }}
                >
                    {item.Icon && <item.Icon />}
                </motion.div>
            ))}

            {/* Background SVG Stream Shapes - Curved & Dynamic */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.08] pointer-events-none overflow-visible">
                <defs>
                    <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                        <stop offset="25%" stopColor="currentColor" stopOpacity="0.8" />
                        <stop offset="75%" stopColor="currentColor" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="10" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Dynamic curved streams echoing the reference "funnel" */}
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.path
                        key={i}
                        d={`M -200 ${100 + i * 150} C 400 ${300 + i * 80}, 800 ${600 - i * 120}, 1600 ${400 + i * 180}`}
                        stroke="url(#streamGradient)"
                        strokeWidth={4 + i * 12}
                        fill="none"
                        className={i % 3 === 0 ? "text-indigo-400" : (i % 2 === 0 ? "text-pink-400" : "text-cyan-400")}
                        filter="url(#glow)"
                        style={{
                            x: useTransform(smoothX, x => x * (40 + i * 15)),
                            y: useTransform(smoothY, y => y * (20 + i * 10))
                        }}
                        initial={{ pathLength: 0.2, opacity: 0 }}
                        animate={{
                            pathLength: [0.2, 0.5, 0.2],
                            opacity: [0.3, 0.6, 0.3],
                            strokeWidth: [2 + i, 6 + i, 2 + i]
                        }}
                        transition={{
                            duration: 4 + i,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.3
                        }}
                    />
                ))}

                {/* Cyber circuit horizontal details */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <motion.path
                        key={`cyber-${i}`}
                        d={`M -100 ${i * 15} L 1800 ${i * 15}`}
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-white opacity-20"
                        style={{
                            y: useTransform(smoothY, y => y * (i * 50) + (i * 150)),
                            x: useTransform(smoothX, x => x * (i * 20))
                        }}
                    />
                ))}
            </svg>
        </div>
    );
};

export default InteractiveBackground;