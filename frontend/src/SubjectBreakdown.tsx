import React, { useState, useEffect, useCallback } from 'react';
import { useTimer } from './TimerContext';
import { Star, Play, ChevronLeft, StickyNote, X, Check } from 'lucide-react';

interface ChapterData {
  id: string;
  number: number;
  title: string;
  totalLectures: number;
  confidence: number;
  r1: boolean;
  r2: boolean;
  r3: boolean;
}

interface SubjectData {
  id: string;
  name: string;
  code: string;
  group: number;
  chapters: ChapterData[];
}

interface ChapterProgress {
  confidence: number;
  r1: boolean;
  r2: boolean;
  r3: boolean;
  completed: boolean;
}

type SyllabusProgress = Record<string, ChapterProgress>;

function loadProgress(): SyllabusProgress {
  try { return JSON.parse(localStorage.getItem('ascend_syllabus_progress') || '{}'); } 
  catch { return {}; }
}

function saveProgress(p: SyllabusProgress) {
  localStorage.setItem('ascend_syllabus_progress', JSON.stringify(p));
}

function getChapterProgress(progress: SyllabusProgress, chId: string): ChapterProgress {
  return progress[chId] || { confidence: 0, r1: false, r2: false, r3: false, completed: false };
}

interface SubjectBreakdownProps {
  subject: SubjectData;
  onBack: () => void;
}

export const SubjectBreakdown: React.FC<SubjectBreakdownProps> = ({ subject, onBack }) => {
  const [progress, setProgress] = useState<SyllabusProgress>(loadProgress);
  const [allNotes, setAllNotes] = useState<Record<string, string>>({});
  const { activeChapter, startTimer } = useTimer();

  // Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeNoteChapter, setActiveNoteChapter] = useState<{id: string, title: string} | null>(null);
  const [noteText, setNoteText] = useState('');

  // Persist progress changes
  useEffect(() => { saveProgress(progress); }, [progress]);

  // Load Notes
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('ascend_chapter_notes');
      if (savedNotes) setAllNotes(JSON.parse(savedNotes));
    } catch (e) {}
  }, []);

  const update = useCallback((chId: string, patch: Partial<ChapterProgress>) => {
    setProgress(prev => {
      const current = getChapterProgress(prev, chId);
      return { ...prev, [chId]: { ...current, ...patch } };
    });
  }, []);

  const setConfidence = (chId: string, level: number) => update(chId, { confidence: level });
  const toggleRevision = (chId: string, key: 'r1' | 'r2' | 'r3') => {
    const cur = getChapterProgress(progress, chId);
    update(chId, { [key]: !cur[key] });
  };
  const toggleCompleted = (chId: string) => {
    const cur = getChapterProgress(progress, chId);
    update(chId, { completed: !cur.completed });
  };

  const openNoteModal = (ch: ChapterData) => {
    setActiveNoteChapter({ id: ch.id, title: `Ch ${ch.number}` });
    setNoteText(allNotes[ch.id] || '');
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!activeNoteChapter) return;
    const updatedNotes = { ...allNotes };
    
    if (noteText.trim() === '') {
      delete updatedNotes[activeNoteChapter.id]; // Remove if empty
    } else {
      updatedNotes[activeNoteChapter.id] = noteText.trim();
    }

    setAllNotes(updatedNotes);
    localStorage.setItem('ascend_chapter_notes', JSON.stringify(updatedNotes));
    setIsNoteModalOpen(false);
  };

  // Compute stats
  const completedCount = subject.chapters.filter(ch => getChapterProgress(progress, ch.id).completed).length;
  const totalCount = subject.chapters.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalLectures = subject.chapters.reduce((a, c) => a + c.totalLectures, 0);

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {/* ── Back + Header ── */}
      <div>
        <button 
          onClick={onBack} 
          className="flex items-center gap-1.5 text-sm font-medium text-[#9CA3AF] hover:text-[#FF9900] transition mb-4 w-max group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Overview
        </button>

        <div className="bg-[#1B2430] rounded-xl border border-[#2D3A4B] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold">{subject.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20 font-medium">{subject.code}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#232F3E] text-[#9CA3AF] border border-[#2D3A4B] font-medium">Group {subject.group}</span>
              </div>
              <p className="text-xs text-[#6B7280]">{totalCount} chapters · {totalLectures} lectures · {completedCount} completed</p>
            </div>
            <div className="flex items-center gap-3 min-w-[180px]">
              <div className="flex-1 h-2 bg-[#232F3E] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF9900] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-[#FF9900] tabular-nums w-[42px] text-right">{progressPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chapter Cards ── */}
      <div className="flex flex-col gap-3">
        {subject.chapters.map(ch => {
          const cp = getChapterProgress(progress, ch.id);
          const isTimerActive = activeChapter?.id === ch.id;
          const hasNote = !!allNotes[ch.id];

          return (
            <div key={ch.id} className={`bg-[#1B2430] rounded-xl border transition ${isTimerActive ? 'border-[#FF9900]/50 shadow-[0_0_15px_rgba(255,153,0,0.08)]' : 'border-[#2D3A4B] hover:border-[#2D3A4B]/80'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Completed checkbox */}
                      <button
                        onClick={() => toggleCompleted(ch.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${cp.completed ? 'bg-emerald-500 border-emerald-500' : 'border-[#2D3A4B] hover:border-[#9CA3AF]'}`}
                      >
                        {cp.completed && <Check size={12} strokeWidth={3} />}
                      </button>
                      <h3 className={`text-sm font-medium leading-snug ${cp.completed ? 'line-through text-[#6B7280]' : ''}`}>
                        <span className="text-[#FF9900] font-semibold mr-1.5">Ch {ch.number}</span>
                        {ch.title}
                      </h3>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 ml-8">
                      <span className="text-xs text-[#6B7280]">{ch.totalLectures} lectures</span>

                      {/* Confidence Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setConfidence(ch.id, cp.confidence === s ? 0 : s)} className="p-0.5 hover:scale-125 transition-transform">
                            <Star size={13} className={s <= cp.confidence ? 'text-[#FF9900] fill-[#FF9900]' : 'text-[#2D3A4B] hover:text-[#6B7280]'} />
                          </button>
                        ))}
                      </div>

                      {/* Revision Dots */}
                      <div className="flex items-center gap-1.5">
                        {(['r1','r2','r3'] as const).map((rKey, i) => (
                          <button
                            key={rKey}
                            onClick={() => toggleRevision(ch.id, rKey)}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition ${
                              cp[rKey]
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-transparent text-[#6B7280] border-[#2D3A4B] hover:border-[#6B7280]'
                            }`}
                          >
                            R{i+1}
                          </button>
                        ))}
                      </div>

                      {/* Notes toggle button */}
                      <button
                        onClick={() => openNoteModal(ch)}
                        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition ${
                          hasNote ? 'text-[#FF9900] hover:text-[#FFAD33]' : 'text-[#6B7280] hover:text-[#9CA3AF]'
                        }`}
                      >
                        <StickyNote size={11} className={hasNote ? 'text-[#FF9900]' : ''} />
                        {hasNote ? 'VIEW NOTE' : 'ADD NOTE'}
                      </button>
                    </div>
                  </div>

                  {/* Right: Study button */}
                  <button
                    onClick={() => startTimer(subject, ch, 'Self Study')}
                    disabled={!!activeChapter}
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition ${
                      isTimerActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-[#FF9900]/10 text-[#FF9900] hover:bg-[#FF9900]/20 disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                  >
                    <Play size={12} fill="currentColor"/>
                    {isTimerActive ? 'Active' : 'Study'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Note Modal Overlay ── */}
      {isNoteModalOpen && activeNoteChapter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#131A22]/80 backdrop-blur-sm px-4">
          <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-[#2D3A4B] flex items-center justify-between bg-[#131A22]">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <StickyNote size={16} className="text-[#FF9900]" />
                Notes: {subject.name} - {activeNoteChapter.title}
              </h3>
              <button 
                onClick={() => setIsNoteModalOpen(false)} 
                className="text-[#9CA3AF] hover:text-white transition p-1 rounded hover:bg-[#2D3A4B]"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-[#9CA3AF] mb-4 font-medium">
                Chapter: <span className="text-white">{subject.chapters.find((c:any) => c.id === activeNoteChapter?.id)?.title}</span>
              </p>
              
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Log your key mistakes, formulas, or flashpoints for this chapter here..."
                className="w-full h-48 bg-[#131A22] border border-[#2D3A4B] rounded-xl p-4 text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#FF9900]/50 resize-none"
                autoFocus
              />
            </div>
            
            <div className="px-6 py-4 border-t border-[#2D3A4B] bg-[#131A22]/50 flex justify-end gap-3">
              <button 
                onClick={() => setActiveNoteChapter(null)}
                className="px-4 py-2 text-sm font-medium text-[#9CA3AF] hover:text-white transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNote}
                className="flex items-center gap-2 px-5 py-2 bg-[#FF9900] hover:bg-[#FFAD33] text-[#131A22] font-bold rounded-lg transition shadow-lg shadow-[#FF9900]/20"
              >
                <Save size={16} /> Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
