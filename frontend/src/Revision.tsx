import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';
import { PdfViewerModal } from './PdfViewerModal';
import { AlertCircle, Clock, Calendar, CheckCircle2, Play, Activity, Info } from 'lucide-react';
import { SUBJECT_COLORS } from './DashboardGraphs';

const subjects = Object.values(CA_FINAL_SYLLABUS) as any[];

interface RevisionItem {
  subject: any;
  chapter: any;
  currentPhase: string;
  nextCycle: string;
  nextDueDate: Date | null;
  lastActionDate: Date;
  lastActionName: string;
  cycleContext: string;
  status: 'overdue' | 'today' | 'upcoming' | 'completed';
  daysDiff: number;
}

export const Revision = () => {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [phaseCounts, setPhaseCounts] = useState({ Initial: 0, R1: 0, R2: 0, R3: 0 });
  
  const [activeMaterial, setActiveMaterial] = useState<{ material: any, subject: any, chapter: any } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [sessRes, matRes] = await Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', session.user.id),
      supabase.from('chapter_materials').select('*')
    ]);

    if (matRes.data) setMaterials(matRes.data);

    if (sessRes.data) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const parsedItems: RevisionItem[] = [];
      const counts = { Initial: 0, R1: 0, R2: 0, R3: 0 };

      // Group sessions by chapter
      const sessionsByCh: Record<string, any[]> = {};
      sessRes.data.forEach(s => {
        if (!sessionsByCh[s.chapter_id]) sessionsByCh[s.chapter_id] = [];
        sessionsByCh[s.chapter_id].push(s);
      });

      Object.entries(sessionsByCh).forEach(([chapterId, chSessions]) => {
        let subject, chapter;
        for (const sub of subjects) {
          const c = sub.chapters.find((x:any) => x.id === chapterId);
          if (c) { subject = sub; chapter = c; break; }
        }
        if (!chapter) return;

        // Sort ascending
        chSessions.sort((a, b) => parseInt(a.session_timestamp) - parseInt(b.session_timestamp));
        
        const initialSession = chSessions[0];
        const initialDate = new Date(parseInt(initialSession.session_timestamp));
        initialDate.setHours(0,0,0,0);

        const r1Date = new Date(initialDate); r1Date.setDate(r1Date.getDate() + 3);
        const r2Date = new Date(initialDate); r2Date.setDate(r2Date.getDate() + 14);
        const r3Date = new Date(initialDate); r3Date.setDate(r3Date.getDate() + 30);

        const r1Session = chSessions.find(s => {
          const d = new Date(parseInt(s.session_timestamp)); d.setHours(0,0,0,0);
          return d >= r1Date;
        });
        const r2Session = chSessions.find(s => {
          const d = new Date(parseInt(s.session_timestamp)); d.setHours(0,0,0,0);
          return d >= r2Date;
        });
        const r3Session = chSessions.find(s => {
          const d = new Date(parseInt(s.session_timestamp)); d.setHours(0,0,0,0);
          return d >= r3Date;
        });

        let currentPhase = 'Initial';
        let nextCycle = 'R1';
        let nextDueDate: Date | null = r1Date;
        let lastActionDate = initialDate;
        let lastActionName = 'Initial Completion';
        let cycleContext = '3 days after Initial';

        if (r3Session) {
          currentPhase = 'R3';
          nextCycle = 'Done';
          nextDueDate = null;
          lastActionDate = new Date(parseInt(r3Session.session_timestamp));
          lastActionName = 'R3 Done';
          cycleContext = 'Completed';
        } else if (r2Session) {
          currentPhase = 'R2';
          nextCycle = 'R3';
          nextDueDate = r3Date;
          lastActionDate = new Date(parseInt(r2Session.session_timestamp));
          lastActionName = 'R2 Done';
          cycleContext = '30 days after Initial';
        } else if (r1Session) {
          currentPhase = 'R1';
          nextCycle = 'R2';
          nextDueDate = r2Date;
          lastActionDate = new Date(parseInt(r1Session.session_timestamp));
          lastActionName = 'R1 Done';
          cycleContext = '14 days after Initial';
        }

        if (lastActionDate) lastActionDate.setHours(0,0,0,0);
        counts[currentPhase as keyof typeof counts]++;

        let status: 'overdue' | 'today' | 'upcoming' | 'completed' = 'completed';
        let daysDiff = 0;
        
        if (nextDueDate) {
          const timeDiff = nextDueDate.getTime() - todayDate.getTime();
          daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          if (daysDiff < 0) status = 'overdue';
          else if (daysDiff === 0) status = 'today';
          else status = 'upcoming';
        }

        parsedItems.push({
          subject,
          chapter,
          currentPhase,
          nextCycle,
          nextDueDate,
          lastActionDate,
          lastActionName,
          cycleContext,
          status,
          daysDiff
        });
      });

      setPhaseCounts(counts);
      setItems(parsedItems);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('sessionSaved', loadData);
    return () => window.removeEventListener('sessionSaved', loadData);
  }, []);

  const handleStartRevision = (item: RevisionItem) => {
    const mats = materials.filter(m => m.chapter_id === item.chapter.id);
    if (mats.length > 0) {
      setActiveMaterial({ material: mats[0], subject: item.subject, chapter: item.chapter });
    } else {
      alert("No digital materials linked to this chapter yet. Go to the Syllabus Content Library to add some!");
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const momentum = items.filter(i => i.lastActionDate >= sevenDaysAgo).sort((a,b) => b.lastActionDate.getTime() - a.lastActionDate.getTime());
  const actionItems = items.filter(i => i.status === 'overdue' || i.status === 'today').sort((a,b) => a.daysDiff - b.daysDiff);
  const upcomingItems = items.filter(i => i.status === 'upcoming').sort((a,b) => a.nextDueDate!.getTime() - b.nextDueDate!.getTime());

  const getCycleColor = (cycle: string) => {
    switch (cycle) {
      case 'R1': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'R2': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'R3': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const nodes = [
    { key: 'Initial', label: 'Initial', sub: 'Waiting for R1', color: 'border-emerald-500 text-emerald-500 bg-emerald-500/10' },
    { key: 'R1', label: 'R1: +3 Days', sub: 'Waiting for R2', color: 'border-amber-500 text-amber-500 bg-amber-500/10' },
    { key: 'R2', label: 'R2: +14 Days', sub: 'Waiting for R3', color: 'border-blue-500 text-blue-500 bg-blue-500/10' },
    { key: 'R3', label: 'R3: +30 Days', sub: 'Fully Mastered', color: 'border-purple-500 text-purple-500 bg-purple-500/10' },
  ];

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 overflow-y-auto custom-scrollbar pb-10">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SRS Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Science-backed spaced repetition pipeline derived directly from your study sessions.</p>
        </div>
      </div>

      {/* ── Visual SRS Pipeline (Top Section) ── */}
      <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-6 md:p-8 mb-8 relative flex justify-between items-center overflow-x-auto">
        <div className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-[#2D3A4B] -translate-y-1/2 z-0 rounded-full" />
        
        {nodes.map((n) => (
          <div key={n.key} className="relative z-10 flex flex-col items-center gap-3 w-32 shrink-0">
            <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shadow-lg ${n.color}`}>
              <span className="text-xl font-bold">{phaseCounts[n.key as keyof typeof phaseCounts] || 0}</span>
            </div>
            <div className="text-center bg-[#1B2430] px-2">
              <h4 className="text-sm font-bold text-white">{n.label}</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{n.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3-Column Content Lists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Momentum */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#2D3A4B] pb-2">
            <Activity size={18} className="text-emerald-500" />
            <h2 className="font-bold text-lg text-white">Recently Completed</h2>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{momentum.length}</span>
          </div>
          
          <div className="flex flex-col gap-3">
            {loading ? <div className="text-slate-500 text-sm py-4">Loading data...</div> : null}
            {!loading && momentum.length === 0 && (
              <div className="border border-[#2D3A4B] border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">
                No recent completions in the last 7 days.
              </div>
            )}
            {momentum.map(item => (
              <div key={item.chapter.id} className="bg-[#131A22] border border-[#2D3A4B] p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700" style={{ color: SUBJECT_COLORS[item.subject.id] || '#9CA3AF' }}>
                      {item.subject.id.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {item.lastActionName}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 truncate">{item.chapter.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Action */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#2D3A4B] pb-2 relative z-20">
            <AlertCircle size={18} className="text-red-500" />
            <h2 className="font-bold text-lg text-white">Due Today & Overdue</h2>
            
            {/* The Tooltip/Info Button */}
            <div className="relative group flex items-center ml-1">
              <button className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 p-1 rounded-full transition-colors">
                <Info size={16} />
              </button>

              {/* Pointing Arrow & Text */}
              <div className="absolute -top-7 left-1 flex items-end gap-1 text-red-500 pointer-events-none w-32 origin-bottom-left animate-pulse">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 translate-y-2 -translate-x-1">
                  <path d="M10 9l-6 6 6 6"/>
                  <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
                </svg>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-500 leading-tight bg-[#06080C]/80 px-1 rounded backdrop-blur-sm -ml-1">
                  Click for info
                </span>
              </div>

              {/* Tooltip Popup */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-[#131A22] border border-red-500/30 shadow-[0_10px_30px_rgba(239,68,68,0.2)] text-slate-200 text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                <p className="font-bold text-red-500 mb-1 flex items-center gap-1.5"><AlertCircle size={12}/> Automated Pipeline</p>
                <p className="leading-relaxed">This Spaced Repetition engine is fully automated! Chapters will organically jump here <strong className="text-white">exactly 3, 14, or 30 days</strong> after you study them. You cannot manually add items here—trust the algorithm!</p>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-red-500/30"></div>
              </div>
            </div>

            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{actionItems.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {!loading && actionItems.length === 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-6 text-center text-sm font-medium">
                You are completely caught up! Great job.
              </div>
            )}
            {actionItems.map(item => (
              <div key={item.chapter.id} className={`bg-[#1B2430] border ${item.status === 'overdue' ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]'} p-4 rounded-xl flex flex-col gap-3`}>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#131A22] border border-[#2D3A4B]" style={{ color: SUBJECT_COLORS[item.subject.id] || '#9CA3AF' }}>
                      {item.subject.id.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getCycleColor(item.nextCycle)}`}>
                      {item.nextCycle} Due
                    </span>
                    {item.status === 'overdue' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/30">
                        Overdue {Math.abs(item.daysDiff)}d
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{item.chapter.title}</h3>
                </div>
                
                <button 
                  onClick={() => handleStartRevision(item)}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF9900] hover:bg-[#FFAD33] text-[#131A22] py-2.5 rounded-lg text-sm font-bold transition shadow-lg shadow-[#FF9900]/20 mt-1"
                >
                  <Play size={16} fill="currentColor" /> Revise Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Context */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#2D3A4B] pb-2">
            <Calendar size={18} className="text-blue-400" />
            <h2 className="font-bold text-lg text-white">Upcoming Pipeline</h2>
            <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{upcomingItems.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {!loading && upcomingItems.length === 0 && (
              <div className="border border-[#2D3A4B] border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">
                No upcoming revisions scheduled yet.
              </div>
            )}
            {upcomingItems.map(item => (
              <div key={item.chapter.id} className="bg-[#131A22] border border-[#2D3A4B] p-4 rounded-xl flex flex-col gap-2 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700" style={{ color: SUBJECT_COLORS[item.subject.id] || '#9CA3AF' }}>
                    {item.subject.id.toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getCycleColor(item.nextCycle)}`}>
                    {item.nextCycle}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-slate-300 leading-snug">{item.chapter.title}</h3>
                
                <div className="mt-1 pt-2 border-t border-[#2D3A4B] flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    {item.nextDueDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    ({item.cycleContext})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Content Modal ── */}
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

