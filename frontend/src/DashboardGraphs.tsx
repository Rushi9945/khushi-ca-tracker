import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Target, TrendingUp, Flame, BookOpen, Play, CheckCircle2, AlertCircle, ChevronDown, Sparkles, ArrowLeft, Trash2 } from 'lucide-react';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';
import { useTimer } from './TimerContext';
import { supabase } from './supabaseClient';
import { StudyAnalyticsGraph } from './StudyAnalyticsGraph';

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
  last7.forEach(d => d.hours = Number(d.hours.toFixed(1)));
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
      
      {/* ── Row 1: 3D Isometric Study Analytics Graph ── */}
      <StudyAnalyticsGraph />

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

      {/* ── Row 3: Hours by Subject ── */}
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
