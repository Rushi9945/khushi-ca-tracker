import React, { useState, useEffect } from 'react';

interface StudyTimerProps {
  chapterId: number;
  chapterName: string;
  onFinish: (durationMinutes: number) => void;
  onCancel: () => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ chapterId, chapterName, onFinish, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    setIsRunning(false);
    const durationMinutes = Math.ceil(seconds / 60);
    onFinish(durationMinutes);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-emerald-500/20 blur-[100px] pointer-events-none" />
        
        <h2 className="text-xl font-medium text-slate-400 mb-2">Deep Work Session</h2>
        <h3 className="text-2xl font-bold text-white text-center mb-8">{chapterName}</h3>
        
        <div className="text-7xl font-mono font-bold text-emerald-400 mb-12 tracking-wider">
          {formatTime(seconds)}
        </div>
        
        <div className="flex gap-4 w-full">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-colors"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button 
            onClick={handleFinish}
            className="flex-1 py-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(5,150,105,0.4)]"
          >
            Finish & Log
          </button>
        </div>
        
        <button 
          onClick={onCancel}
          className="mt-6 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Cancel Session (Discard Time)
        </button>
      </div>
    </div>
  );
};
