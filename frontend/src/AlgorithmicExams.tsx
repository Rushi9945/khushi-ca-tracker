import React, { useState, useEffect } from 'react';
import { Play, Clock, ChevronRight, ChevronLeft, CheckCircle2, Target, AlertTriangle } from 'lucide-react';

const MOCK_QUESTIONS = [
  {
    id: 1,
    subject: 'FR - Consolidated Financial Statements',
    text: 'Under Ind AS 110, an investor controls an investee when it is exposed, or has rights, to:',
    options: [
      'Variable returns from its involvement with the investee',
      'Fixed returns only from its involvement',
      'Voting rights exceeding 50% without exception',
      'Board representation only'
    ],
  },
  {
    id: 2,
    subject: 'FR - Consolidated Financial Statements',
    text: 'How should non-controlling interests (NCI) be measured at the acquisition date under Ind AS 103?',
    options: [
      'Always at fair value',
      'Always at the NCI\'s proportionate share of the acquiree\'s identifiable net assets',
      'Either at fair value or at the NCI\'s proportionate share of net assets, on a transaction-by-transaction basis',
      'At carrying amount'
    ],
  },
  {
    id: 3,
    subject: 'FR - Consolidated Financial Statements',
    text: 'Which of the following is NOT a condition for the exemption from preparing consolidated financial statements under Ind AS 110?',
    options: [
      'The parent is a wholly-owned subsidiary and its owners have been informed.',
      'The parent\'s debt or equity instruments are not traded in a public market.',
      'The ultimate parent produces consolidated financial statements available for public use.',
      'The parent has acquired the subsidiary exclusively with a view to its subsequent disposal.'
    ],
  },
  {
    id: 4,
    subject: 'FR - Consolidated Financial Statements',
    text: 'When a parent loses control of a subsidiary, how should it account for any retained investment?',
    options: [
      'At its carrying amount at the date control is lost',
      'At its fair value at the date control is lost, recognizing any gain or loss in profit or loss',
      'At cost',
      'At fair value through Other Comprehensive Income (OCI)'
    ],
  }
];

export const AlgorithmicExams = () => {
  const [examState, setExamState] = useState<'idle' | 'running' | 'submitted'>('idle');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); // 3 hours in seconds

  useEffect(() => {
    let timer: any;
    if (examState === 'running' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && examState === 'running') {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [examState, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setExamState('running');
    setCurrentQIndex(0);
    setAnswers({});
    setTimeLeft(3 * 60 * 60);
  };

  const handleSelect = (optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [currentQIndex]: optionIdx }));
  };

  const handleSubmit = () => {
    if (examState !== 'running') return;
    const confirmSubmit = window.confirm("Are you sure you want to submit your exam?");
    if (confirmSubmit) {
      setExamState('submitted');
    }
  };

  if (examState === 'idle') {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-6">
            <Target size={40} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">System-Generated Exams</h1>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Our algorithm has analyzed your recent mock scores and identified <strong className="text-white">Consolidated Financial Statements</strong> as your weakest area. Click below to generate a highly targeted, strict 3-hour exam to close this gap.
          </p>
          <button 
            onClick={handleStart}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]"
          >
            <Play size={20} fill="currentColor" /> Generate Targeted Exam
          </button>
        </div>
      </div>
    );
  }

  if (examState === 'submitted') {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Exam Submitted Successfully</h1>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Your responses have been recorded and sent to the algorithm for deep analysis. The results will be reflected in your Test Analytics dashboard shortly.
          </p>
          <button 
            onClick={() => setExamState('idle')}
            className="bg-[#2D3A4B] hover:bg-[#374659] text-white font-bold px-8 py-3 rounded-xl transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const q = MOCK_QUESTIONS[currentQIndex];

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0F19] absolute inset-0 z-50">
      
      {/* ── Strict Top Bar ── */}
      <div className="h-16 border-b border-[#2D3A4B] bg-[#131A22] px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">{q.subject}</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            Question {currentQIndex + 1} of {MOCK_QUESTIONS.length}
          </span>
          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/30 font-mono text-lg font-bold">
            <Clock size={18} /> {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* ── Exam Body ── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col max-w-4xl mx-auto w-full">
        <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-8 md:p-10 shadow-lg flex flex-col gap-8 flex-1">
          
          <div className="flex gap-4">
            <span className="text-2xl font-black text-amber-500 mt-1">Q{currentQIndex + 1}.</span>
            <p className="text-lg text-white leading-relaxed font-medium">
              {q.text}
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {q.options.map((opt, idx) => {
              const isSelected = answers[currentQIndex] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-500/10 text-white' 
                      : 'border-[#2D3A4B] hover:border-slate-500 hover:bg-[#232F3E] text-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-amber-500' : 'border-slate-500'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                  </div>
                  <span className="leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* ── Navigation ── */}
        <div className="flex flex-wrap items-center justify-between mt-6 gap-4 shrink-0">
          <button 
            onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQIndex === 0}
            className="flex items-center gap-2 bg-[#2D3A4B] hover:bg-[#374659] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition"
          >
            <ChevronLeft size={20} /> Previous
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            {currentQIndex < MOCK_QUESTIONS.length - 1 ? (
              <button 
                onClick={() => setCurrentQIndex(prev => Math.min(MOCK_QUESTIONS.length - 1, prev + 1))}
                className="flex items-center gap-2 bg-slate-200 hover:bg-white text-slate-900 px-6 py-3 rounded-xl font-bold transition"
              >
                Next <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-8 py-3 rounded-xl font-bold transition shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
