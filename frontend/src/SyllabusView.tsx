import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle2, Play, MessageSquare, Search, Save, X, Star } from 'lucide-react';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';
import { useTimer } from './TimerContext';
import { SUBJECT_COLORS } from './DashboardGraphs';
import { supabase } from './supabaseClient';
import { PdfViewerModal } from './PdfViewerModal';

const subjects = Object.values(CA_FINAL_SYLLABUS) as any[];

export const SyllabusView = () => {
  const { startTimer } = useTimer();
  
  const [progress, setProgress] = useState<any>({});
  const [notes, setNotes] = useState<any>({});
  
  // New States for Library
  const [viewMode, setViewMode] = useState<'tracker' | 'library'>('tracker');
  const [libraryMaterials, setLibraryMaterials] = useState<any[]>([]);
  const [materialTime, setMaterialTime] = useState<Record<string, number>>({});
  const [activeMaterial, setActiveMaterial] = useState<{ material: any, subject: any, chapter: any } | null>(null);

  const [activeGroup, setActiveGroup] = useState<'all' | 1 | 2>('all');
  const groupLabel = (g: number) => g === 1 ? 'Group 1' : 'Group 2';

  const filteredSubjects = useMemo(() => {
    if (activeGroup === 'all') return subjects;
    return subjects.filter(s => s.group === activeGroup);
  }, [activeGroup]);

  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [activeNoteChapter, setActiveNoteChapter] = useState<{ subId: string; chapter: any } | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const loadCloudData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase.from('chapter_progress').select('*');
      if (data && !error) {
        const progObj: any = {};
        const notesObj: any = {};
        data.forEach(r => {
          progObj[r.chapter_id] = {
            stars: r.confidence_stars,
            r1: r.r1,
            r2: r.r2,
            r3: r.r3,
            completed: r.completed
          };
          if (r.note) {
            notesObj[r.chapter_id] = r.note;
          }
        });
        setProgress(progObj);
        setNotes(notesObj);
      }

      // Load Materials
      const { data: matData, error: matError } = await supabase.from('chapter_materials').select('*');
      if (matData && !matError) {
        setLibraryMaterials(matData);
      }

      // Load Sessions to calculate material time
      const { data: sessionData, error: sessionError } = await supabase.from('study_sessions').select('material_id, duration_minutes').eq('user_id', session.user.id);
      if (sessionData && !sessionError) {
        const timeMap: Record<string, number> = {};
        sessionData.forEach(s => {
          if (s.material_id) {
            timeMap[s.material_id] = (timeMap[s.material_id] || 0) + (s.duration_minutes || 0);
          }
        });
        setMaterialTime(timeMap);
      }
    };
    loadCloudData();

    // Listen for custom sessionSaved events to trigger refetch
    const handleSessionSaved = () => {
      loadCloudData();
    };
    window.addEventListener('sessionSaved', handleSessionSaved);
    return () => window.removeEventListener('sessionSaved', handleSessionSaved);
  }, []);

  const updateChapterProgress = async (subjectId: string, chapterId: string, updates: any) => {
    // 1. Optimistic UI update
    const currentProg = progress[chapterId] || {};
    const newProg = { ...currentProg, ...updates };
    setProgress((prev: any) => ({ ...prev, [chapterId]: newProg }));

    // 2. Sync to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('chapter_progress').upsert({
        user_id: session.user.id,
        subject_id: subjectId,
        chapter_id: chapterId,
        confidence_stars: newProg.stars || 0,
        r1: newProg.r1 || false,
        r2: newProg.r2 || false,
        r3: newProg.r3 || false,
        completed: newProg.completed || false,
        note: notes[chapterId] || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, chapter_id' });
      
      window.dispatchEvent(new Event('sessionSaved')); // Sync export logic if needed
    } catch(e) { console.error(e); }
  };

  const saveNote = async () => {
    if (!activeNoteChapter) return;
    const chId = activeNoteChapter.chapter.id;
    const subId = activeNoteChapter.subId;
    
    // 1. Optimistic UI
    setNotes((prev: any) => ({ ...prev, [chId]: noteText }));
    setActiveNoteChapter(null);

    // 2. Sync to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const p = progress[chId] || {};
      await supabase.from('chapter_progress').upsert({
        user_id: session.user.id,
        subject_id: subId,
        chapter_id: chId,
        confidence_stars: p.stars || 0,
        r1: p.r1 || false,
        r2: p.r2 || false,
        r3: p.r3 || false,
        completed: p.completed || false,
        note: noteText,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, chapter_id' });
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeNoteChapter) setActiveNoteChapter(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeNoteChapter]);

  // ── Header Stats Calculation ──
  const getGroupStats = (group: number) => {
    const groupSubs = subjects.filter(s => s.group === group);
    let totalCh = 0;
    let completedCh = 0;
    let r1Completed = 0;

    groupSubs.forEach(sub => {
      totalCh += sub.chapters.length;
      sub.chapters.forEach((ch: any) => {
        const p = progress[ch.id] || {};
        if (p.completed) completedCh++;
        if (p.r1) r1Completed++;
      });
    });

    return {
      total: totalCh,
      completedPct: totalCh ? Math.round((completedCh / totalCh) * 100) : 0,
      r1Pct: totalCh ? Math.round((r1Completed / totalCh) * 100) : 0,
    };
  };

  const g1Stats = getGroupStats(1);
  const g2Stats = getGroupStats(2);

  const toggleSubject = (subId: string) => {
    setExpandedSubjects(prev => prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]);
  };

  const filters = ['All', 'Unread / Not Started', 'In Progress', 'Needs Revision (<3 Stars)', 'Mastered'];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300 pb-10">
      
      {/* ── Header Area & Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[ { title: 'Group 1 Progress (FR, AFM, AUD)', stats: g1Stats }, { title: 'Group 2 Progress (DT, IDT, IBS)', stats: g2Stats } ].map((g, i) => (
          <div key={i} className="bg-[#1B2430] border border-[#2D3A4B] rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-4">{g.title}</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-[#9CA3AF]">Chapters Completed</span><span className="text-white font-medium">{g.stats.completedPct}%</span></div>
                <div className="h-2 bg-[#131A22] rounded-full overflow-hidden"><div className="h-full bg-[#FF9900] rounded-full" style={{ width: `${g.stats.completedPct}%` }}/></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-[#9CA3AF]">Revision 1 (R1)</span><span className="text-white font-medium">{g.stats.r1Pct}%</span></div>
                <div className="h-2 bg-[#131A22] rounded-full overflow-hidden"><div className="h-full bg-[#10B981] rounded-full" style={{ width: `${g.stats.r1Pct}%` }}/></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Global Search & Filters ── */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1B2430] border border-[#2D3A4B] p-3 rounded-xl">
        <div className="relative w-full md:w-96 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input 
            type="text" 
            placeholder="Search any chapter, AS/Ind AS, or SA..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF9900]/50"
          />
        </div>
        
        {viewMode === 'tracker' && (
          <div className="flex gap-2 overflow-x-auto w-full no-scrollbar pb-1 md:pb-0">
            {filters.map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  activeFilter === f 
                    ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/30' 
                    : 'bg-[#131A22] text-[#9CA3AF] border-[#2D3A4B] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Dual-View Toggle ── */}
      <div className="flex justify-center mb-2">
        <div className="bg-[#131A22] p-1 rounded-full flex border border-[#2D3A4B]">
          <button 
            onClick={() => setViewMode('tracker')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'tracker' ? 'bg-[#FF9900] text-[#131A22] shadow-lg' : 'text-[#6B7280] hover:text-white'}`}
          >
            Progress Tracker
          </button>
          <button 
            onClick={() => setViewMode('library')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'library' ? 'bg-[#FF9900] text-[#131A22] shadow-lg' : 'text-[#6B7280] hover:text-white'}`}
          >
            Content Library
          </button>
        </div>
      </div>

      {/* ── Group Filter UI ── */}
      <div className="flex bg-[#1B2430] rounded-xl border border-[#2D3A4B] overflow-hidden mb-2 w-full md:w-auto self-center">
        {(['all', 1, 2] as const).map(g => (
          <button
            key={String(g)}
            onClick={() => setActiveGroup(g)}
            className={`px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
              activeGroup === g
                ? 'text-[#FF9900] border-b-2 border-[#FF9900] bg-[#FF9900]/5'
                : 'text-[#6B7280] hover:text-[#9CA3AF] hover:bg-[#232F3E]'
            }`}
          >
            {g === 'all' ? 'Both Groups' : groupLabel(g)}
          </button>
        ))}
      </div>

      {/* ── Interactive Subject Accordion Grid ── */}
      <div className="flex flex-col gap-4">
        {filteredSubjects.map(sub => {
          const subColor = SUBJECT_COLORS[sub.id] || '#FF9900';
          const isExpanded = expandedSubjects.includes(sub.id) || searchQuery.trim().length > 0;

          // Filter chapters
          let filteredChapters = sub.chapters.filter((ch: any) => {
            const matchSearch = ch.title.toLowerCase().includes(searchQuery.toLowerCase()) || String(ch.number).includes(searchQuery);
            if (!matchSearch) return false;
            
            if (viewMode === 'tracker') {
              const p = progress[ch.id] || {};
              if (activeFilter === 'Unread / Not Started') return !p.completed && !p.r1 && !p.r2 && !p.r3;
              if (activeFilter === 'In Progress') return p.completed && !p.r1;
              if (activeFilter === 'Needs Revision (<3 Stars)') return p.completed && (p.stars || 0) < 3;
              if (activeFilter === 'Mastered') return p.r2 || p.r3 || p.stars === 5;
            }
            return true;
          });

          if (filteredChapters.length === 0) return null;

          const totalSubCh = sub.chapters.length;
          const completedSubCh = sub.chapters.filter((c:any) => progress[c.id]?.completed).length;
          const subPct = totalSubCh ? Math.round((completedSubCh / totalSubCh) * 100) : 0;

          return (
            <div key={sub.id} className="bg-[#1B2430] border border-[#2D3A4B] rounded-xl overflow-hidden shadow-sm">
              
              {/* Accordion Header */}
              <div 
                onClick={() => toggleSubject(sub.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#232F3E] transition select-none group"
                style={{ borderLeft: `3px solid ${subColor}` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold" style={{ color: subColor }}>{sub.id.toUpperCase()}</span>
                    <h3 className="text-white font-semibold">{sub.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <p className="text-xs text-[#9CA3AF]">{sub.chapters.length} Chapters · {sub.chapters.reduce((a:any, c:any)=>a+c.totalLectures, 0)} Lectures</p>
                    <div className="flex items-center gap-2 w-32">
                      <div className="h-1.5 flex-1 bg-[#131A22] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${subPct}%`, backgroundColor: subColor }}/></div>
                      <span className="text-[10px] text-[#9CA3AF]">{subPct}%</span>
                    </div>
                  </div>
                </div>
                <div className="p-1 rounded-md text-[#9CA3AF] group-hover:text-white transition">
                  {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="border-t border-[#2D3A4B] bg-[#131A22]/30">
                  {viewMode === 'tracker' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#2D3A4B] text-[10px] uppercase tracking-wider text-[#6B7280] bg-[#1B2430]/50">
                            <th className="px-4 py-3 font-medium w-10">Done</th>
                            <th className="px-4 py-3 font-medium min-w-[250px]">Chapter</th>
                            <th className="px-4 py-3 font-medium text-center">Confidence</th>
                            <th className="px-4 py-3 font-medium text-center">Revision</th>
                            <th className="px-4 py-3 font-medium text-center">Notes</th>
                            <th className="px-4 py-3 font-medium text-right pr-6">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredChapters.map((ch: any) => {
                            const p = progress[ch.id] || {};
                            const hasNote = !!notes[ch.id];

                            return (
                              <tr key={ch.id} className="border-b border-[#2D3A4B]/40 hover:bg-[#232F3E] transition group/row">
                                
                                {/* Checkbox */}
                                <td className="px-4 py-3">
                                  <button 
                                    onClick={() => updateChapterProgress(sub.id, ch.id, { completed: !p.completed })}
                                    className={`flex items-center justify-center w-5 h-5 rounded border transition ${p.completed ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#4B5563] text-transparent hover:border-[#9CA3AF]'}`}
                                  >
                                    <CheckCircle2 size={14} strokeWidth={3} />
                                  </button>
                                </td>

                                {/* Chapter Title */}
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-white line-clamp-1">{ch.number}. {ch.title}</div>
                                  <div className="text-[10px] text-[#6B7280] mt-0.5">{ch.totalLectures} lectures</div>
                                </td>

                                {/* Confidence Stars */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <button 
                                        key={star}
                                        onClick={() => updateChapterProgress(sub.id, ch.id, { stars: star })}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                      >
                                        <Star size={14} className={`${(p.stars || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-[#4B5563] hover:text-[#9CA3AF]'}`} />
                                      </button>
                                    ))}
                                  </div>
                                </td>

                                {/* Revision Pills */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {['r1', 'r2', 'r3'].map((rev) => (
                                      <button
                                        key={rev}
                                        onClick={() => updateChapterProgress(sub.id, ch.id, { [rev]: !p[rev] })}
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${p[rev] ? 'bg-[#10B981] text-[#131A22]' : 'bg-[#1B2430] text-[#6B7280] border border-[#2D3A4B] hover:text-white'}`}
                                      >
                                        {rev.toUpperCase()}
                                      </button>
                                    ))}
                                  </div>
                                </td>

                                {/* Flashpoints / Notes */}
                                <td className="px-4 py-3 text-center">
                                  <button 
                                    onClick={() => { setActiveNoteChapter({ subId: sub.id, chapter: ch }); setNoteText(notes[ch.id] || ''); }}
                                    className={`p-1.5 rounded-md transition ${hasNote ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20' : 'text-[#6B7280] hover:text-white hover:bg-[#2D3A4B]'}`}
                                    title={hasNote ? "View/Edit Note" : "Add Note"}
                                  >
                                    <MessageSquare size={16} />
                                  </button>
                                </td>

                                {/* Action */}
                                <td className="px-4 py-3 text-right pr-6">
                                  <button 
                                    onClick={() => startTimer(sub, ch, p.r1 ? 'Revision' : 'Self Study')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9900]/10 text-[#FF9900] hover:bg-[#FF9900] hover:text-[#131A22] rounded text-xs font-bold transition shadow-sm"
                                  >
                                    <Play size={12} fill="currentColor"/> Start
                                  </button>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {filteredChapters.map((ch: any) => {
                        const mats = libraryMaterials.filter(m => m.chapter_id === ch.id && m.subject_id === sub.id);
                        return (
                          <div key={ch.id} className="bg-[#1B2430] border border-[#2D3A4B] rounded-lg p-4">
                            <h4 className="text-white font-medium mb-3">{ch.number}. {ch.title}</h4>
                            {mats.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {mats.map(mat => {
                                  const totalMinutes = materialTime[mat.id] || 0;
                                  const progressPct = Math.min(100, (totalMinutes / 600) * 100);

                                  return (
                                    <div key={mat.id} className="bg-[#131A22] border border-[#2D3A4B] p-3 rounded-lg flex flex-col gap-3 relative overflow-hidden">
                                      <div className="flex justify-between items-start">
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                          {mat.material_type}
                                        </span>
                                      </div>
                                      <p className="text-sm text-white line-clamp-2">{mat.title}</p>
                                      
                                      <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                                        <span className="text-[11px] flex items-center gap-1 font-medium">
                                          ⏱️ Time Logged: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                                        </span>
                                      </div>

                                      <button 
                                        onClick={() => setActiveMaterial({ material: mat, subject: sub, chapter: ch })}
                                        className="mt-auto w-full py-2 bg-[#FF9900]/10 hover:bg-[#FF9900] text-[#FF9900] hover:text-[#131A22] rounded text-xs font-bold transition flex items-center justify-center gap-2 z-10 mb-0.5"
                                      >
                                        <BookOpen size={14} /> Open & Study
                                      </button>
                                      
                                      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-[#6B7280] italic">No digital materials uploaded yet.</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Notes Modal ── */}
      {activeNoteChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3A4B] bg-[#131A22]/50">
              <div className="flex items-center gap-2 text-white">
                <MessageSquare size={18} className="text-[#FF9900]" />
                <h3 className="font-semibold">Flashpoints & Notes</h3>
              </div>
              <button 
                onClick={() => setActiveNoteChapter(null)} 
                className="text-[#6B7280] hover:text-white transition p-1 rounded-md hover:bg-[#2D3A4B]"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-[#9CA3AF] mb-4 font-medium">
                Chapter: <span className="text-white">{activeNoteChapter.chapter.title}</span>
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
                onClick={saveNote}
                className="flex items-center gap-2 px-5 py-2 bg-[#FF9900] hover:bg-[#FFAD33] text-[#131A22] font-bold rounded-lg transition shadow-lg shadow-[#FF9900]/20"
              >
                <Save size={16} /> Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content Library Modal ── */}
      {activeMaterial && (
        <PdfViewerModal 
          material={activeMaterial.material} 
          subject={activeMaterial.subject} 
          chapter={activeMaterial.chapter} 
          onClose={() => setActiveMaterial(null)} 
        />
      )}
    </div>
  );
};
