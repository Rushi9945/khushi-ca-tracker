import React, { useState } from 'react';
import { useTimer } from './TimerContext';

export const PdfViewerModal = ({ material, subject, chapter, onClose }: any) => {
  const [isReading, setIsReading] = useState(false);
  const { startTimer } = useTimer();

  const handleStart = () => {
    // Trigger the global timer here
    startTimer(subject, chapter, 'Self Study');
    setIsReading(true);
  };

  if (!material) return null;

  // Defensive URL cleanup in case the user pasted brackets or quotes in the database
  let safeUrl = material.file_url || '';
  safeUrl = safeUrl.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
  if (safeUrl && !safeUrl.startsWith('http')) {
    safeUrl = `https://${safeUrl}`;
  }

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
      <div className="flex-1 w-full h-[calc(100vh-3.5rem)] relative">
        {!isReading ? (
          /* Study Intent Overlay */
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F19] z-10">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">Ready to study?</h3>
              <p className="text-slate-400 mb-6">You are about to open: {material.title}</p>
              <button 
                onClick={handleStart} 
                className="w-full py-3 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
              >
                Start Timer & Read
              </button>
            </div>
          </div>
        ) : (
          /* Native PDF Embed (Bypasses CORS) */
          <embed 
            src={`${safeUrl}#toolbar=0&navpanes=0&view=FitH`} 
            type="application/pdf" 
            className="w-full h-full bg-white"
          />
        )}
      </div>
    </div>
  );
};
