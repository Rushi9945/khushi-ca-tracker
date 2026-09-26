import React from 'react';

export const AnimatedLoader = ({ name, gender }: { name: string, gender: string }) => {
  return (
    <div className="bg-[#06080C] flex flex-col items-center justify-center h-screen w-screen z-50 overflow-hidden">
      
      <h1 className="text-4xl font-bold text-amber-500 mb-6 tracking-wide drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
        CA {name}
      </h1>

      <style>
        {`
          .custom-invert {
            /* Inverts white to black, black to white, and adds a slight sepia/amber tint */
            filter: invert(1) hue-rotate(180deg) contrast(1.2) brightness(0.9) sepia(0.3) saturate(1.5);
            mix-blend-mode: screen;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fadeInUp 1.2s ease-out forwards;
          }
        `}
      </style>

      <img 
        src="/female-study-sketch.jpg" 
        alt="Student Studying" 
        className="w-[350px] md:w-[450px] h-auto object-contain rounded-xl shadow-2xl transition-all duration-1000 ease-in-out custom-invert animate-fade-in-up" 
      />

      <p className="text-sm text-slate-400 mt-8 animate-pulse">
        your finalist preparation dashboard is loading ..
      </p>

    </div>
  );
};
