import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';

export const SplashScreen = ({ userName, onComplete }: { userName: string, onComplete: () => void }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Mount this overlay immediately. After exactly 3.5 seconds, animate opacity to 0
    const timer1 = setTimeout(() => setIsExiting(true), 3500);
    // Unmount after fade out (fade out is 0.5s)
    const timer2 = setTimeout(() => onComplete(), 4000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const textShadow = useMotionTemplate`${shadowX}px ${shadowY}px 30px rgba(0,0,0,0.9), 0 0 40px rgba(245, 158, 11, 0.3)`;

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F19] overflow-hidden"
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
        {/* Main 3D Text */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-[6.5rem] leading-none font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#FCD34D]"
          style={{ 
            transform: 'translateZ(80px)',
            textShadow,
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        >
          CA {userName || 'Khushi Soni'}
        </motion.h1>
        
        {/* Bottom Subtitle Layer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          style={{ transform: 'translateZ(40px)' }}
        >
          <p className="text-sm md:text-base font-medium text-slate-400/80 tracking-wide animate-pulse">
            your finalist preparation dashboard is loading ..
          </p>
        </motion.div>

      </motion.div>
    </motion.div>
  );
};
