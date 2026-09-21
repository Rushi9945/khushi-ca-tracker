import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Keep it on screen for ~1.5s, then start fading out
    const timer1 = setTimeout(() => setIsExiting(true), 1500);
    // Give it 500ms to fade out, then unmount (Total 2.0s)
    const timer2 = setTimeout(() => onComplete(), 2000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onComplete]);

  // Mouse tracking with framer-motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for heavy, fluid movement
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Map normalized mouse coordinates (-0.5 to 0.5) to degrees/pixels
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
  
  const shadowX = useTransform(smoothX, [-0.5, 0.5], [40, -40]);
  const shadowY = useTransform(smoothY, [-0.5, 0.5], [40, -40]);
  
  // Construct dynamic text shadow string
  const textShadow = useMotionTemplate`${shadowX}px ${shadowY}px 30px rgba(0,0,0,0.9), 0 0 25px rgba(245,158,11,0.15)`;

  const handleMouseMove = (e: React.MouseEvent) => {
    // Normalize coordinates relative to window center between -0.5 and 0.5
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <motion.div 
      onMouseMove={handleMouseMove}
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden"
      style={{ perspective: 1200 }}
    >
      <motion.div 
        className="flex flex-col items-center justify-center text-center will-change-transform relative"
        style={{ 
          rotateX, 
          rotateY,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* The Degree Splash Glowing Aura */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full w-full h-[120%] -z-10 pointer-events-none"
          style={{ transform: 'translateZ(-50px)' }}
        />

        {/* Main 3D Text */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} // smooth spring-like easeOut
          className="text-6xl md:text-[6.5rem] leading-none font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#FCD34D]"
          style={{ 
            transform: 'translateZ(80px)',
            textShadow
          }}
        >
          CA Khushi Soni
        </motion.h1>
        
        {/* Bottom Subtitle Layer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          style={{ transform: 'translateZ(40px)' }}
        >
          <p className="text-sm md:text-base font-medium text-slate-400/80 tracking-wide animate-pulse">
            your StudiAudit dashboard is loading ..
          </p>
        </motion.div>

      </motion.div>
    </motion.div>
  );
};
