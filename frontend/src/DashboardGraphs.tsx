import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Target, TrendingUp, Flame, BookOpen, Play, CheckCircle2, AlertCircle, ChevronDown, Sparkles, ArrowLeft, Trash2 } from 'lucide-react';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';
import { useTimer } from './TimerContext';
import { supabase } from './supabaseClient';

interface Session {
  id: any;
  subjectId: string;
  chapterId: string;
  durationMinutes: number;
  timestamp: number;
  type: string;
}

export const SUBJECT_COLORS: Record<string, string> = {
  'fr': '#3B82F6',
  'afm': '#10B981',
  'aud': '#F59E0B',
  'dt': '#8B5CF6',
  'idt': '#F43F5E',
  'ibs': '#06B6D4'
};
export const getSubColor = (id: string) => SUBJECT_COLORS[id?.toLowerCase()] || '#FF9900';

function loadExamDate(): string | null {
  return localStorage.getItem('ascend_exam_date') || null;
}
function daysUntil(dateStr: string): number {
  const target = new Date(dateStr); const now = new Date();
  now.setHours(0, 0, 0, 0); target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

const orderedSubjects = Object.values(CA_FINAL_SYLLABUS) as any[];

export const DashboardGraphs = () => {
  const { startTimer, isRunning, activeSubject, activeChapter, pauseTimer, elapsedTime } = useTimer();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [examDate, setExamDate] = useState<string | null>(loadExamDate);

  // ── Manual Goal State ──
  const todayKey = `ascend_daily_target_${new Date().toISOString().split('T')[0]}`;
  const [dailyTarget, setDailyTarget] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem(todayKey) || 'null'); } catch { return null; }
  });
  const [goalForm, setGoalForm] = useState({ subjectId: 'fr', chapterId: 'fr-1', targetHours: 2 });
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const handleEditGoal = () => {
    if (isRunning && activeSubject?.id === dailyTarget.subjectId && activeChapter?.id === dailyTarget.chapterId) {
      if (!window.confirm("Switching targets will pause your current session. Continue?")) return;
      pauseTimer();
    }
    setGoalForm(dailyTarget);
    setIsEditingGoal(true);
  };

  const handleClearGoal = () => {
    localStorage.removeItem(todayKey);
    setDailyTarget(null);
    setIsEditingGoal(false);
  };

  const handleSaveGoal = () => {
    localStorage.setItem(todayKey, JSON.stringify(goalForm));
    setDailyTarget(goalForm);
    setIsEditingGoal(false);
  };

  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) return;
        
        const { data, error } = await supabase.from('study_sessions').select('*').order('session_timestamp', { ascending: false });
        if (data && !error) {
          const mapped: Session[] = data.map(r => ({
            id: r.id,
            subjectId: r.subject_id,
            chapterId: r.chapter_id,
            durationMinutes: r.duration_minutes,
            timestamp: parseInt(r.session_timestamp),
            type: r.session_type
          }));
          setSessions(mapped);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchCloudData();
    const reload = () => { fetchCloudData(); setExamDate(loadExamDate()); };
    window.addEventListener('sessionSaved', reload);
    window.addEventListener('examDateChanged', reload);
    // Refresh from cloud every 2 mins to save bandwidth
    const iv = setInterval(reload, 120000);
    return () => { window.removeEventListener('sessionSaved', reload); window.removeEventListener('examDateChanged', reload); clearInterval(iv); };
  }, []);

  // ── 12-Hour Target Tracker & Pacing Engine ──
  const { totalLoggedHoursToday, paceStatus, pctTarget } = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayBaseMins = sessions
      .filter(s => new Date(s.timestamp).toDateString() === todayStr)
      .reduce((a, s) => a + s.durationMinutes, 0);
    
    // Include active session
    const activeMins = (isRunning && elapsedTime) ? (elapsedTime / 60000) : 0;
    const totalHours = (todayBaseMins + activeMins) / 60;

    const now = new Date();
    const currentHour = now.getHours() + (now.getMinutes() / 60);
    const expected = Math.max(0, Math.min(12, (currentHour - 7) * (12 / 15))); // 7AM to 10PM (15hrs)

    let status = { text: '', isAhead: true };
    if (totalHours >= expected) {
      status = { text: '● On Track / Ahead of Pace', isAhead: true };
    } else {
      status = { text: `▲ Deficit: ${(expected - totalHours).toFixed(1)}h behind target pace`, isAhead: false };
    }

    return { totalLoggedHoursToday: totalHours, paceStatus: status, pctTarget: Math.min(100, (totalHours / 12) * 100) };
  }, [sessions, isRunning, elapsedTime]);

  // ── Daily Target Progress Calculation (Specific Chapter) ──
  const todayTargetProgress = useMemo(() => {
    if (!dailyTarget) return { currentMins: 0, targetMins: 0, pct: 0, isComplete: false };
    const todayStr = new Date().toDateString();
    let currentMins = sessions
      .filter(s => new Date(s.timestamp).toDateString() === todayStr && s.subjectId === dailyTarget.subjectId && s.chapterId === dailyTarget.chapterId)
      .reduce((a, s) => a + s.durationMinutes, 0);
    
    if (isRunning && activeSubject?.id === dailyTarget.subjectId && activeChapter?.id === dailyTarget.chapterId) {
       currentMins += (elapsedTime / 60000);
    }
    
    const targetMins = dailyTarget.targetHours * 60;
    const pct = Math.min(100, Math.round((currentMins / targetMins) * 100));
    return { currentMins, targetMins, pct, isComplete: currentMins >= targetMins };
  }, [sessions, dailyTarget, isRunning, elapsedTime, activeSubject, activeChapter]);

  // ── Smart Revision Nudge (7-Day Deficit) ──
  const smartRevision = useMemo(() => {
    const sevenDaysAgo = Date.now() - (7 * 86400000);
    const last7Sessions = sessions.filter(s => s.timestamp >= sevenDaysAgo);
    
    const subHours: Record<string, number> = {};
    orderedSubjects.forEach(s => subHours[s.id] = 0);
    
    last7Sessions.forEach(s => {
      const rawId = s.subjectId ? String(s.subjectId) : 'other';
      const cleanId = (CA_FINAL_SYLLABUS as any)[rawId] ? rawId : (orderedSubjects.find((os, idx) => String(idx+1)===rawId)?.id || rawId);
      if (subHours[cleanId] !== undefined) {
        subHours[cleanId] += s.durationMinutes / 60;
      }
    });

    let minSubId = orderedSubjects[0].id;
    let minHours = subHours[minSubId];
    orderedSubjects.forEach(s => {
      if (subHours[s.id] < minHours) { minSubId = s.id; minHours = subHours[s.id]; }
    });

    const recommendedSubject = orderedSubjects.find(s => s.id === minSubId);
    return { subject: recommendedSubject, hoursLogged: minHours.toFixed(1) };
  }, [sessions]);


  // ── Core Metrics ──
  const totalMinutes = sessions.reduce((a, s) => a + (s.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60);

  const uniqueDays = new Set(sessions.map(s => new Date(s.timestamp).toDateString()));
  const studyDays = uniqueDays.size;

  const streak = (() => {
    let count = 0; const d = new Date(); d.setHours(0, 0, 0, 0);
    while (true) {
      if (uniqueDays.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1); } else break;
    }
    return count;
  })();

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
    return { date: d, dateStr: d.toDateString(), name: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: 0 };
  });
  sessions.forEach(s => {
    const sd = new Date(s.timestamp).toDateString();
    const match = last7.find(day => day.dateStr === sd);
    if (match) match.hours += (s.durationMinutes / 60);
  });
  last7.forEach(d => {
    d.hours = Number(d.hours.toFixed(1));
    (d as any).hoursBg1 = Number((d.hours * 0.7 + 0.8).toFixed(1));
    (d as any).hoursBg2 = Number((d.hours * 1.3 - 0.4).toFixed(1));
  });
  const last7Total = last7.reduce((a, d) => a + d.hours, 0);
  const avgDaily = (last7Total / 7);

  const daysToExam = examDate ? daysUntil(examDate) : null;

  // Chart data extraction
  const syllabusById: Record<string, string> = {};
  orderedSubjects.forEach((s: any, idx: number) => {
    syllabusById[s.id] = s.id.toUpperCase();
    syllabusById[String(idx + 1)] = s.id.toUpperCase();
  });
  const subjectHours: Record<string, number> = {};
  sessions.forEach(s => {
    const rawId = s.subjectId ? String(s.subjectId) : 'other';
    const key = syllabusById[rawId] || rawId.toUpperCase();
    subjectHours[key] = (subjectHours[key] || 0) + s.durationMinutes / 60;
  });
  const subjectEntries = Object.entries(subjectHours).sort((a, b) => b[1] - a[1]);

  // Vibrant Action Button Style
  const actionBtnClass = "flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-sm tracking-wide transition-all duration-200 hover:-translate-y-[1px]";
  const actionBtnStyle = { 
    background: 'linear-gradient(135deg, #FF6B00 0%, #FFA800 100%)', 
    boxShadow: '0 4px 15px rgba(255, 107, 0, 0.35)' 
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* ── 12-Hour Target Tracker (New) ── */}
      <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">12-Hour Daily Target</h2>
              <p className="text-sm text-[#9CA3AF]">
                {totalLoggedHoursToday.toFixed(1)} / 12.0 hrs · {Math.round(pctTarget)}%
              </p>
            </div>
            
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${paceStatus.isAhead ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {paceStatus.text}
            </div>
          </div>

          <div className="flex gap-1.5 w-full">
            {Array.from({ length: 12 }).map((_, i) => {
              const blockFill = Math.max(0, Math.min(1, totalLoggedHoursToday - i));
              const isActive = blockFill > 0 && blockFill < 1;
              return (
                <div key={i} className="flex-1 h-3.5 bg-[#131A22] rounded-sm border border-[#2D3A4B] overflow-hidden relative shadow-inner">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF6B00] to-[#FF9900] transition-all duration-300" 
                    style={{ width: `${blockFill * 100}%` }}
                  />
                  {isActive && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-white/30 animate-[shimmer_2s_infinite]" 
                      style={{ width: `${blockFill * 100}%` }} 
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Row 1: Dual Target/Revision Engine ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Manual Goal Component */}
        <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#FF9900]" />
              <h3 className="font-semibold text-lg text-white tracking-tight">Today's Study Goal</h3>
            </div>
            {dailyTarget && !isEditingGoal && (
              <button 
                onClick={handleEditGoal} 
                className="text-xs text-[#9CA3AF] hover:text-[#FF9900] flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-[#FF9900]/10"
              >
                <ArrowLeft size={12} /> Edit Target
              </button>
            )}
          </div>

          {!dailyTarget || isEditingGoal ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                <select 
                  value={goalForm.subjectId} 
                  onChange={e => setGoalForm(prev => ({ ...prev, subjectId: e.target.value, chapterId: (CA_FINAL_SYLLABUS as any)[e.target.value].chapters[0].id }))}
                  className="w-full min-w-0 bg-[#131A22] border border-[#2D3A4B] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF9900]/50 outline-none truncate"
                >
                  {orderedSubjects.map(s => <option key={s.id} value={s.id}>{s.id.toUpperCase()} - {s.name}</option>)}
                </select>
                <select 
                  value={goalForm.chapterId} 
                  onChange={e => setGoalForm(prev => ({ ...prev, chapterId: e.target.value }))}
                  className="w-full min-w-0 bg-[#131A22] border border-[#2D3A4B] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF9900]/50 outline-none truncate"
                >
                  {((CA_FINAL_SYLLABUS as any)[goalForm.subjectId]?.chapters || []).map((c: any) => (
                    <option key={c.id} value={c.id}>Ch {c.number}: {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <input 
                  type="number" min="0.5" step="0.5" value={goalForm.targetHours} 
                  onChange={e => setGoalForm(prev => ({ ...prev, targetHours: Number(e.target.value) }))}
                  className="w-20 bg-[#131A22] border border-[#2D3A4B] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF9900]/50 outline-none text-center"
                />
                <span className="text-sm text-[#9CA3AF]">Hours Target</span>
                
                <div className="ml-auto flex items-center gap-2">
                  {isEditingGoal && (
                    <button 
                      onClick={handleClearGoal}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition text-xs font-medium"
                    >
                      <Trash2 size={14}/> Clear
                    </button>
                  )}
                  <button 
                    onClick={handleSaveGoal}
                    className="flex items-center gap-2 px-4 py-2 bg-[#232F3E] hover:bg-[#2D3A4B] text-white rounded-lg transition text-sm font-medium border border-[#2D3A4B]"
                  >
                    Save Target <ChevronDown size={14}/>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border" style={{ color: getSubColor(dailyTarget.subjectId), backgroundColor: `${getSubColor(dailyTarget.subjectId)}15`, borderColor: `${getSubColor(dailyTarget.subjectId)}40` }}>
                      {dailyTarget.subjectId}
                    </span>
                    <span className="text-sm font-medium text-white">Ch {((CA_FINAL_SYLLABUS as any)[dailyTarget.subjectId]?.chapters.find((c:any) => c.id === dailyTarget.chapterId))?.number || '?'}</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] line-clamp-1 max-w-[250px]">
                    {((CA_FINAL_SYLLABUS as any)[dailyTarget.subjectId]?.chapters.find((c:any) => c.id === dailyTarget.chapterId))?.title}
                  </p>
                </div>
                {todayTargetProgress.isComplete ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 size={14}/> Target Met
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const sub = (CA_FINAL_SYLLABUS as any)[dailyTarget.subjectId];
                      const ch = sub?.chapters.find((c:any) => c.id === dailyTarget.chapterId);
                      if (sub && ch) startTimer(sub, ch, 'Self Study');
                    }}
                    className={actionBtnClass} style={actionBtnStyle}
                  >
                    <Play size={14} fill="currentColor"/> Launch Session
                  </button>
                )}
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-[#9CA3AF]">{Math.floor(todayTargetProgress.currentMins / 60)}h {todayTargetProgress.currentMins % 60}m elapsed</span>
                  <span className="text-white">{dailyTarget.targetHours}h target</span>
                </div>
                <div className="h-2.5 bg-[#131A22] rounded-full overflow-hidden border border-[#2D3A4B]">
                  <div className="h-full bg-gradient-to-r from-[#FF9900] to-[#FF6B00] rounded-full transition-all duration-700 relative" style={{ width: `${todayTargetProgress.pct}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Smart Revision Nudge (7-Day Deficit Algorithm) */}
        <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#FF6B00]" />
              <h3 className="font-semibold text-lg text-white tracking-tight">Smart Revision Nudge</h3>
            </div>
            <span className="text-[10px] text-[#FF6B00] font-bold uppercase tracking-wider bg-[#FF6B00]/10 px-2 py-0.5 rounded border border-[#FF6B00]/20">Algorithm</span>
          </div>

          <div className="flex-1 flex flex-col justify-center relative z-10">
            <div className="flex items-start gap-3 bg-[#131A22] border border-[#2D3A4B] rounded-lg p-4">
              <AlertCircle size={20} className="text-[#9CA3AF] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white leading-relaxed">
                  <strong className="font-semibold text-[#FF9900]">Revision Deficit:</strong> {smartRevision.subject?.name} ({smartRevision.subject?.id.toUpperCase()}) has only {smartRevision.hoursLogged} hours logged in the last 7 days.
                </p>
                <p className="text-xs text-[#9CA3AF] mt-2">Recommended: 45m Quick Revision to maintain spaced repetition strength.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end relative z-10">
             <button
                onClick={() => {
                  if (smartRevision.subject) startTimer(smartRevision.subject, smartRevision.subject.chapters[0], 'Revision');
                }}
                className={actionBtnClass} style={actionBtnStyle}
              >
                <Play size={14} fill="currentColor"/> Revise Now
              </button>
          </div>
        </div>

      </div>

      {/* ── Row 2: Secondary KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        <KpiCard icon={<Clock size={16}/>} label="Total Hours" value={totalHours.toFixed(1)} unit="h" />
        <KpiCard icon={<TrendingUp size={16}/>} label="Avg Daily (7d)" value={avgDaily.toFixed(1)} unit="h" />
        <KpiCard icon={<Flame size={16}/>} label="Current Streak" value={String(streak)} unit="d" />
        {daysToExam !== null ? (
          <KpiCard icon={<Calendar size={16}/>} label="Days to Exam" value={String(daysToExam)} unit="d" accent={daysToExam <= 30} />
        ) : (
          <div className="p-5 rounded-xl border border-[#2D3A4B] bg-[#1B2430]">
            <div className="flex items-center gap-2 text-[#9CA3AF] mb-2">
              <Calendar size={16}/>
              <span className="text-xs font-medium uppercase tracking-wider">Days to Exam</span>
            </div>
            <div className="text-2xl font-semibold text-[#6B7280]">Not Set</div>
          </div>
        )}
      </div>

      {/* ── Row 3: Area Chart (Glowing Neon Yellow/Orange) ── */}
      <div className="p-6 rounded-xl border border-[#3d2008] bg-[#0c0500] flex flex-col min-h-[300px] relative overflow-hidden">
        {/* Background Glowing Bokeh Effects */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#fb8500]/20 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 right-20 w-64 h-64 bg-[#ffb703]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-[#ff5400]/15 rounded-full blur-[50px] pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="font-semibold text-white">Study Activity — Last 7 Days</h3>
          <span className="text-xs text-[#9CA3AF]">{last7Total.toFixed(1)}h total</span>
        </div>
        
        {last7Total === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm relative z-10">
            No study sessions logged yet. Start a timer to see your activity here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260} className="relative z-10">
            <AreaChart data={last7} margin={{ top: 15, right: 20, left: -20, bottom: 10 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffb703" stopOpacity={0.7}/>
                  <stop offset="100%" stopColor="#fb8500" stopOpacity={0.0}/>
                </linearGradient>
                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="heavyGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffb703" vertical={false} opacity={0.15}/>
              <XAxis 
                dataKey="name" 
                stroke="#ffb703" 
                tick={{ fill: '#fb8500', fontSize: 12, fontWeight: 500 }} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#ffb703" 
                tick={{ fill: '#fb8500', fontSize: 12, fontWeight: 500 }} 
                tickLine={false} 
                axisLine={false} 
                unit="h"
                dx={-10}
              />
              <Tooltip 
                cursor={{ stroke: '#ffb703', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    // Only show the tooltip for the real hours data
                    const realData = payload.find(p => p.dataKey === 'hours');
                    if (realData) {
                      return (
                        <div className="bg-[#1a0f07]/90 backdrop-blur-md border border-[#ffb703]/50 rounded-lg p-3 shadow-[0_0_15px_rgba(255,183,3,0.3)]">
                          <p className="text-[#ffb703] font-extrabold text-sm tracking-wide">{realData.value} Hours Logged</p>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />
              
              {/* Background dummy wave 1 */}
              <Area 
                type="monotone" 
                dataKey="hoursBg1" 
                stroke="#ff5400" 
                strokeWidth={3} 
                fillOpacity={0}
                filter="url(#heavyGlow)"
                opacity={0.5}
                activeDot={false}
              />
              
              {/* Background dummy wave 2 */}
              <Area 
                type="monotone" 
                dataKey="hoursBg2" 
                stroke="#fb8500" 
                strokeWidth={4} 
                fillOpacity={0}
                filter="url(#neonGlow)"
                opacity={0.6}
                activeDot={false}
              />
              
              {/* Foreground Real Wave */}
              <Area 
                type="monotone" 
                dataKey="hours" 
                stroke="#ffb703" 
                strokeWidth={5} 
                fillOpacity={1} 
                fill="url(#colorHours)" 
                filter="url(#neonGlow)"
                activeDot={{ r: 7, fill: '#ffb703', stroke: '#fff', strokeWidth: 2, filter: "url(#neonGlow)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Row 4: Hours by Subject ── */}
      {subjectEntries.length > 0 && (
        <div className="p-6 rounded-xl border border-[#2D3A4B] bg-[#1B2430]">
          <h3 className="font-semibold mb-5">Hours by Subject</h3>
          <div className="flex flex-col gap-3">
            {subjectEntries.map(([key, hrs], i) => {
              const maxHrs = subjectEntries[0][1];
              const pct = maxHrs > 0 ? (hrs / maxHrs) * 100 : 0;
              const subColor = getSubColor(key);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{key}</span>
                    <span className="text-xs text-[#9CA3AF] tabular-nums">{hrs.toFixed(1)}h</span>
                  </div>
                  <div className="h-2 bg-[#232F3E] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: subColor }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Small KPI card component ──
function KpiCard({ icon, label, value, unit, accent }: { icon: React.ReactNode; label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div className="p-5 rounded-xl border border-[#2D3A4B] bg-[#1B2430]">
      <div className="flex items-center gap-2 text-[#9CA3AF] mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-semibold text-white">
        {value}
        {unit && <span className={`text-lg ml-1 ${accent ? 'text-red-400' : 'text-[#FF9900]'}`}>{unit}</span>}
      </div>
    </div>
  );
}
