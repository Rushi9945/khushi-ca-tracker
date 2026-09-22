import React, { useState } from 'react';
import { X, Play, Clock, FileText } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F19]/95 backdrop-blur-md">
      
      {/* Top Bar inside Modal */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-[#131A22] border-b border-[#2D3A4B] flex items-center justify-between px-6 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF9900]/10 rounded-lg">
            <FileText size={20} className="text-[#FF9900]" />
          </div>
          <div>
            <h2 className="text-white font-semibold">{material.title}</h2>
            <p className="text-xs text-[#9CA3AF]">{subject.name} - {chapter.title}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-[#6B7280] hover:text-white hover:bg-[#2D3A4B] rounded-lg transition"
        >
          <X size={20} />
        </button>
      </div>

      {step === 'intent' ? (
        <div className="w-full max-w-md p-8 bg-[#1B2430] border border-[#2D3A4B] rounded-2xl shadow-2xl text-center">
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
      ) : (
        <div className="w-full h-full pt-16">
          <iframe 
            src={`${material.file_url}#toolbar=0&navpanes=0`} 
            className="w-full h-full flex-1 border-0 bg-white"
            title={material.title}
          />
        </div>
      )}
    </div>
  );
};
