import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';
import { PdfViewerModal } from './PdfViewerModal';
import { AlertCircle, Clock, Calendar, CheckCircle2, Play } from 'lucide-react';
import { SUBJECT_COLORS } from './DashboardGraphs';

const subjects = Object.values(CA_FINAL_SYLLABUS) as any[];

interface RevisionItem {
  subject: any;
  chapter: any;
  progress: any;
  cycle: 'R1' | 'R2' | 'R3';
  dueDate: Date;
  status: 'overdue' | 'today' | 'upcoming';
  daysDiff: number;
}

export const Revision = () => {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeMaterial, setActiveMaterial] = useState<{ material: any, subject: any, chapter: any } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [progRes, matRes] = await Promise.all([
      supabase.from('chapter_progress').select('*').eq('user_id', session.user.id),
      supabase.from('chapter_materials').select('*')
    ]);

    if (matRes.data) setMaterials(matRes.data);

    if (progRes.data) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const parsedItems: RevisionItem[] = [];

      subjects.forEach(sub => {
        sub.chapters.forEach((ch: any) => {
          const p = progRes.data.find(r => r.chapter_id === ch.id);
          if (p && p.completed && !p.r3) {
            // Calculate due date
            const lastUpdate = new Date(p.updated_at || Date.now());
            let dueDate = new Date(lastUpdate);
            let cycle: 'R1'|'R2'|'R3' = 'R1';

            if (!p.r1) {
              cycle = 'R1';
              dueDate.setDate(dueDate.getDate() + 3);
            } else if (!p.r2) {
              cycle = 'R2';
              dueDate.setDate(dueDate.getDate() + 14);
            } else if (!p.r3) {
              cycle = 'R3';
              dueDate.setDate(dueDate.getDate() + 30);
            }
            dueDate.setHours(0, 0, 0, 0);

            const timeDiff = dueDate.getTime() - todayDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

            let status: 'overdue' | 'today' | 'upcoming' = 'upcoming';
            if (daysDiff < 0) status = 'overdue';
            else if (daysDiff === 0) status = 'today';

            parsedItems.push({
              subject: sub,
              chapter: ch,
              progress: p,
              cycle,
              dueDate,
              status,
              daysDiff
            });
          }
        });
      });

      // Sort: Overdue -> Today -> Upcoming (by closest date)
      parsedItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      setItems(parsedItems);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('sessionSaved', loadData);
    return () => window.removeEventListener('sessionSaved', loadData);
  }, []);

  const handleMarkRevised = async (item: RevisionItem) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Optimistic UI
    setItems(prev => prev.filter(i => i.chapter.id !== item.chapter.id));

    const updates: any = { updated_at: new Date().toISOString() };
    if (item.cycle === 'R1') updates.r1 = true;
    if (item.cycle === 'R2') updates.r2 = true;
    if (item.cycle === 'R3') updates.r3 = true;

    await supabase.from('chapter_progress')
      .update(updates)
      .eq('user_id', session.user.id)
      .eq('chapter_id', item.chapter.id);
      
    window.dispatchEvent(new Event('sessionSaved'));
  };

  const handleStartRevision = (item: RevisionItem) => {
    const mats = materials.filter(m => m.chapter_id === item.chapter.id);
    if (mats.length > 0) {
      setActiveMaterial({ material: mats[0], subject: item.subject, chapter: item.chapter });
    } else {
      alert("No digital materials linked to this chapter yet. Go to the Syllabus Content Library to add some!");
    }
  };

  const overdue = items.filter(i => i.status === 'overdue');
  const today = items.filter(i => i.status === 'today');
  const upcoming = items.filter(i => i.status === 'upcoming');

  const actionRequired = [...overdue, ...today];

  const formatBadge = (days: number) => {
    if (days === 1) return "Tomorrow";
    if (days > 1 && days < 7) return `In ${days} days`;
    return new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCycleColor = (cycle: string) => {
    switch (cycle) {
      case 'R1': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'R2': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'R3': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 overflow-y-auto custom-scrollbar pb-10">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SRS Revision Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">Science-backed spaced repetition pipeline.</p>
        </div>
      </div>

      {/* ── Macro Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 shrink-0">
        <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-xl flex flex-col shadow-[0_0_15px_rgba(239,68,68,0.05)] relative overflow-hidden">
          <div className="flex items-center gap-2 text-red-500 mb-2"><AlertCircle size={18}/> <span className="text-sm font-bold uppercase tracking-wider">Overdue</span></div>
          <span className="text-3xl font-bold text-white">{overdue.length}</span>
          <div className="absolute -right-4 -bottom-4 opacity-10 text-red-500"><AlertCircle size={100}/></div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/40 p-5 rounded-xl flex flex-col shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock size={18}/> <span className="text-sm font-bold uppercase tracking-wider">Due Today</span></div>
          <span className="text-3xl font-bold text-white">{today.length}</span>
          <div className="absolute -right-4 -bottom-4 opacity-10 text-amber-500"><Clock size={100}/></div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 text-blue-400 mb-2"><Calendar size={18}/> <span className="text-sm font-bold uppercase tracking-wider">Upcoming Pipeline</span></div>
          <span className="text-3xl font-bold text-white">{upcoming.length}</span>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-blue-400"><Calendar size={100}/></div>
        </div>
      </div>

      {/* ── Split Columns ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Action Required */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <h2 className="font-bold text-lg text-white">Action Required</h2>
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">{actionRequired.length}</span>
          </div>
          
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-slate-500 text-sm py-4">Loading pipeline...</div>
            ) : actionRequired.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-6 text-center text-sm font-medium">
                You are completely caught up! Great job.
              </div>
            ) : (
              actionRequired.map(item => (
                <div key={item.chapter.id} className={`bg-[#1B2430] border ${item.status === 'overdue' ? 'border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.05)]' : 'border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.05)]'} p-4 rounded-xl flex flex-col gap-3 transition-transform hover:-translate-y-0.5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#131A22] border border-[#2D3A4B]" style={{ color: SUBJECT_COLORS[item.subject.id] || '#9CA3AF' }}>
                          {item.subject.id.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCycleColor(item.cycle)}`}>
                          {item.cycle} Due
                        </span>
                        {item.status === 'overdue' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/20">
                            Overdue {Math.abs(item.daysDiff)}d
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1 leading-snug">{item.chapter.title}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-800">
                    <button 
                      onClick={() => handleStartRevision(item)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#FF9900]/10 hover:bg-[#FF9900] text-[#FF9900] hover:text-[#131A22] py-2 rounded-lg text-xs font-bold transition"
                    >
                      <Play size={14} fill="currentColor" /> Start Revision
                    </button>
                    <button 
                      onClick={() => handleMarkRevised(item)}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-[#131A22] py-2 rounded-lg text-xs font-bold transition"
                    >
                      <CheckCircle2 size={14} /> Mark as Revised
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Pipeline */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <h2 className="font-bold text-lg text-white">Upcoming Pipeline</h2>
            <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full">{upcoming.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {!loading && upcoming.length === 0 && (
              <div className="border border-slate-800 border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">
                No upcoming revisions scheduled yet.
              </div>
            )}
            {upcoming.map(item => (
              <div key={item.chapter.id} className="bg-[#131A22] border border-slate-800 p-3.5 rounded-xl flex items-center justify-between group hover:border-slate-600 transition-colors">
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700" style={{ color: SUBJECT_COLORS[item.subject.id] || '#9CA3AF' }}>
                      {item.subject.id.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCycleColor(item.cycle)}`}>
                      {item.cycle}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-300 truncate pr-4">{item.chapter.title}</h3>
                </div>
                
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                    {formatBadge(item.daysDiff)}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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
