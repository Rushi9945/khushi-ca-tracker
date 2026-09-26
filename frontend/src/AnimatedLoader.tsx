import React from 'react';

export const AnimatedLoader = ({ name, gender }: { name: string, gender: string }) => {
  // Determine avatar path based on gender
  let avatarPath = "";
  if (gender === 'Female') {
    avatarPath = "M 200 130 C 180 130 170 150 170 170 C 170 180 175 190 185 195 L 180 230 C 180 250 220 250 220 230 L 215 195 C 225 190 230 180 230 170 C 230 150 220 130 200 130 Z"; // Bun / Longer hair silhouette
  } else if (gender === 'Male') {
    avatarPath = "M 200 140 C 185 140 175 155 175 170 C 175 185 185 195 200 195 C 215 195 225 185 225 170 C 225 155 215 140 200 140 Z M 180 195 L 170 240 C 170 250 230 250 230 240 L 220 195"; // Standard short hair + shoulders
  } else {
    avatarPath = "M 200 145 L 185 170 L 200 195 L 215 170 Z M 180 200 L 160 250 L 240 250 L 220 200"; // Abstract polygon avatar
  }

  return (
    <div className="bg-[#06080C] flex flex-col items-center justify-center h-screen w-screen z-50 fixed inset-0">
      
      <h1 className="text-4xl font-bold text-amber-500 mb-8 tracking-wide drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse">
        CA {name.toUpperCase()}
      </h1>

      <style>
        {`
          .sketch-animate {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: dash 3s ease-in-out forwards;
          }
          @keyframes dash {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>

      <svg viewBox="0 0 400 300" className="w-64 h-64 mb-8">
        {/* Desk Surface */}
        <path d="M 50 250 L 350 250" fill="none" stroke="#f59e0b" strokeWidth="2" className="sketch-animate" style={{ animationDelay: '0s' }} />
        <path d="M 70 250 L 50 280 M 330 250 L 350 280" fill="none" stroke="#f59e0b" strokeWidth="2" className="sketch-animate" style={{ animationDelay: '0.2s' }} />

        {/* Laptop */}
        <path d="M 120 250 L 150 180 L 250 180 L 280 250 Z" fill="none" stroke="#f59e0b" strokeWidth="2" className="sketch-animate" style={{ animationDelay: '0.5s' }} />
        <path d="M 160 190 L 240 190 L 260 240 L 140 240 Z" fill="none" stroke="#f59e0b" strokeWidth="1" className="sketch-animate" style={{ animationDelay: '0.8s' }} />

        {/* Notebook */}
        <rect x="290" y="235" width="40" height="10" fill="none" stroke="#f59e0b" strokeWidth="2" className="sketch-animate" style={{ animationDelay: '1.2s' }} />
        <path d="M 290 235 L 300 230 L 340 230 L 330 235" fill="none" stroke="#f59e0b" strokeWidth="2" className="sketch-animate" style={{ animationDelay: '1.4s' }} />

        {/* Dynamic Avatar sitting behind laptop */}
        <path d={avatarPath} fill="none" stroke="#f59e0b" strokeWidth="2" className="sketch-animate" style={{ animationDelay: '1.8s' }} />
      </svg>

      <p className="text-sm text-slate-400 mt-4 animate-pulse uppercase tracking-widest font-bold">
        your finalist preparation dashboard is loading ..
      </p>

    </div>
  );
};
