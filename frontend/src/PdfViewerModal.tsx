import React, { useState } from 'react';
import { useTimer } from './TimerContext';
import { Play, CheckCircle2 } from 'lucide-react';

export const PdfViewerModal = ({ material, subject, chapter, onClose }: any) => {
  const [isReading, setIsReading] = useState(false);
  const [targetTime, setTargetTime] = useState<number>(60); // Default to 60 minutes
  const [customTime, setCustomTime] = useState<string>('');
  const { startTimer, elapsedTime, stopAndSaveSession } = useTimer();

  const handleStart = (mins: number) => {
    setTargetTime(mins);
    startTimer(subject, chapter, 'Self Study');
    setIsReading(true);
  };

  const handleCustomStart = () => {
    const mins = parseInt(customTime, 10);
    if (mins && mins > 0) {
      handleStart(mins);
    } else {
      alert("Please enter a valid number of minutes.");
    }
  };

  const handleStopAndLog = async () => {
    await stopAndSaveSession();
    onClose();
  };

  if (!material) return null;

  // Aggressive URL extractor that handles spaces in Supabase file paths
  let safeUrl = '';
  if (material?.file_url) {
    let rawString = String(material.file_url).trim();
    if (rawString.includes('](')) {
      const parts = rawString.split('](');
      let urlPart = parts[1];
      if (urlPart.endsWith(')')) {
        urlPart = urlPart.slice(0, -1);
      }
      safeUrl = urlPart.trim();
    } else {
      safeUrl = rawString;
    }
  }

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const targetMs = targetTime * 60 * 1000;
  const progressPct = Math.min(100, (elapsedTime / targetMs) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B0F19] w-screen h-screen overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0 h-14">
        <h2 className="text-white font-semibold truncate pr-4">{material.title}</h2>
        <div className="flex items-center space-x-4 shrink-0">
          <a 
            href={safeUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-amber-500 hover:text-amber-400 transition"
          >
            Open in New Tab ↗
          </a>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 w-full h-[calc(100vh-3.5rem)] relative bg-[#131A22]">
        {!isReading ? (
          /* Study Intent Overlay */
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">Ready to study?</h3>
              <p className="text-slate-400 mb-6">You are about to open: {material.title}</p>
              
              <div className="mb-6">
                <p className="text-sm text-slate-300 font-medium mb-3">Set the target to finish this material:</p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {[15, 30, 60, 120].map(mins => (
                    <button 
                      key={mins}
                      onClick={() => handleStart(mins)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition border border-slate-600 hover:border-amber-500/50"
                    >
                      {mins === 60 ? '1 hr' : mins === 120 ? '2 hr' : `${mins}m`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <input 
                    type="number" 
                    placeholder="Custom (min)" 
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-32 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                  <button 
                    onClick={handleCustomStart}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Native PDF Iframe */
          <>
            <iframe 
              src={safeUrl} 
              className="w-full h-full border-0"
              title={material.title}
            />
            
            {/* Floating Active Timer HUD */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-[#0B0F19]/95 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-amber-900/20 flex flex-col items-center w-[400px]">
                
                {/* Timer Display */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-mono font-bold text-white tracking-wider drop-shadow-md">
                    {formatTime(elapsedTime)}
                  </span>
                  <span className="text-slate-400 font-mono text-lg">
                    / {formatTime(targetMs)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Motivational Text */}
                <p className="text-amber-400 text-xs font-semibold text-center mt-2 leading-relaxed px-2">
                  Time start now! Start reading now! Don't press the stop button, be committed to the target time you set.
                </p>

                {/* Complete & Log Action */}
                <button 
                  onClick={handleStopAndLog}
                  className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition border border-slate-700 hover:border-amber-500/50 group"
                >
                  <CheckCircle2 size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  Complete & Log Session
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
