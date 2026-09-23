import React, { useState } from 'react';
import { X, Play, FileText, ExternalLink } from 'lucide-react';
import { useTimer } from './TimerContext';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PdfViewerModal = ({ material, subject, chapter, onClose }: any) => {
  const { startTimer } = useTimer();
  const [isReading, setIsReading] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);

  if (!material) return null;
  if (!material.file_url) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F19]/95 backdrop-blur-md">
      <div className="text-white p-6 bg-red-500/20 rounded-xl">Error: No valid PDF URL found.</div>
      <button onClick={onClose} className="absolute top-4 right-4 text-white">Close</button>
    </div>
  );

  const handleStartTimer = (type: any) => {
    startTimer(subject, chapter, type);
    setIsReading(true);
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
          {isReading && (
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
      {!isReading ? (
        <div className="flex-1 flex items-center justify-center relative">
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
        <div className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#0B0F19] flex flex-col items-center py-6">
          <Document 
            className="text-amber-500 flex flex-col items-center" 
            file={material.file_url} 
            loading={<div className="text-white mt-10">Loading Khushi's Study Material...</div>}
            error={<div className="text-red-500 mt-10">Failed to load PDF. Please check the Supabase URL.</div>}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          >
            {Array.from(new Array(numPages || 0), (el, index) => (
              <Page 
                key={`page_${index + 1}`} 
                pageNumber={index + 1} 
                renderAnnotationLayer={true} 
                renderTextLayer={true} 
                width={Math.min(window.innerWidth * 0.95, 1000)} 
                className="mb-6 shadow-[0_0_25px_rgba(0,0,0,0.5)]" 
              />
            ))}
          </Document>
        </div>
      )}
    </div>
  );
};
