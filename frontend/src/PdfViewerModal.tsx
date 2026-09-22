import React, { useState } from 'react';
import { X, Play, FileText, ExternalLink } from 'lucide-react';
import { useTimer } from './TimerContext';

export const PdfViewerModal = ({ material, subject, chapter, onClose }: any) => {
  const { startTimer } = useTimer();
  const [step, setStep] = useState<'intent' | 'reading'>('intent');

  if (!material) return null;
  if (!material.file_url) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F19]/95 backdrop-blur-md">
      <div className="text-white p-6 bg-red-500/20 rounded-xl">Error: No valid PDF URL found.</div>
      <button onClick={onClose} className="absolute top-4 right-4 text-white">Close</button>
    </div>
  );

  const handleStartTimer = (type: any) => {
    startTimer(subject, chapter, type);
    setStep('reading');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B0F19] w-screen h-screen overflow-hidden">
      
      {/* Fixed Header */}
      <div className="h-14 shrink-0 bg-[#131A22] border-b border-[#2D3A4B] flex items-center justify-between px-6 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#FF9900]/10 rounded-lg">
            <FileText size={18} className="text-[#FF9900]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-white text-sm font-semibold leading-tight line-clamp-1">{material.title}</h2>
            <p className="text-[10px] text-[#9CA3AF] leading-tight line-clamp-1">{subject.name} - {chapter.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* External Link Button */}
          {step === 'reading' && (
            <a 
              href={material.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-white bg-[#1B2430] hover:bg-[#2D3A4B] rounded-lg transition"
            >
              <ExternalLink size={14} /> Open Direct Link
            </a>
          )}

          <button 
            onClick={onClose}
            className="p-1.5 text-[#6B7280] hover:text-white hover:bg-[#2D3A4B] rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {step === 'intent' ? (
        <div className="flex-1 flex items-center justify-center relative">
          {/* Background blurred object for aesthetics */}
          <object
            data={`${material.file_url}#toolbar=0`}
            type="application/pdf"
            className="absolute inset-0 w-full h-full border-0 opacity-20 filter blur-sm pointer-events-none"
            aria-hidden="true"
          />
          <div className="w-full max-w-md p-8 bg-[#1B2430] border border-[#2D3A4B] rounded-2xl shadow-2xl text-center relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Ready to study?</h2>
            <p className="text-[#9CA3AF] text-sm mb-8">
              You are opening <span className="text-white font-medium">{material.title}</span>. 
              Before you start reading, lock in your focus timer.
            </p>

            <button 
              onClick={() => handleStartTimer('Self Study')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#FF6B00] to-[#FF9900] hover:from-[#FF8533] hover:to-[#FFAD33] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all"
            >
              <Play size={18} className="fill-white" />
              Start Timer & Read
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full h-[calc(100vh-3.5rem)]">
          <object
            data={`${material.file_url}#toolbar=0`}
            type="application/pdf"
            className="w-full h-full flex-1"
          >
            {/* Fallback if the browser blocks inline PDFs */}
            <div className="flex flex-col items-center justify-center h-full w-full bg-[#131A22] text-[#9CA3AF]">
              <p>Your browser does not support inline PDF viewing.</p>
              <a 
                href={material.file_url} 
                target="_blank" 
                rel="noreferrer" 
                className="mt-4 px-6 py-2 bg-[#FF9900] text-[#131A22] font-semibold rounded-md hover:bg-[#FFAD33] transition"
              >
                Download / Open PDF
              </a>
            </div>
          </object>
        </div>
      )}
    </div>
  );
};
