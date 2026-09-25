import { useState, useMemo, useEffect } from 'react';
import { DashboardGraphs, SUBJECT_COLORS } from './DashboardGraphs';
import { SubjectBreakdown } from './SubjectBreakdown';
import { SettingsView } from './SettingsView';
import { PlannerView } from './PlannerView';
import { SyllabusView } from './SyllabusView';
import { Revision } from './Revision';
import { TestAnalytics } from './TestAnalytics';
import { Tasks } from './tasks/Tasks';
import { CalendarPlanner } from './tasks/CalendarPlanner';
import { Sidebar } from './Sidebar';
import { SplashScreen } from './SplashScreen';
import { Auth } from './Auth';
import { AiStudyManager } from './AiStudyManager';
import { useTimer } from './TimerContext';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';
import { BookOpen, Target, LayoutDashboard, Settings, Play, Pause, Square, ChevronRight, Sun, Moon } from 'lucide-react';

const subjects = Object.values(CA_FINAL_SYLLABUS) as any[];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('hasSeenSplash');
  });
  
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'syllabus' | 'planner' | 'settings'>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);


  const {
    isRunning,
    elapsedTime,
    activeSubject,
    activeChapter,
    pauseTimer,
    resumeTimer,
    stopAndSaveSession
  } = useTimer();

  const handleLogin = (name: string, id: string) => {
    setUserName(name);
    setUserId(id);
    setIsAuthenticated(true);
  };

  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return subjects.find(s => s.id === selectedSubjectId) || null;
  }, [selectedSubjectId]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const navigateToDashboard = () => {
    setActiveTab('dashboard');
    setSelectedSubjectId(null);
  };

  const navigateToSettings = () => {
    setActiveTab('settings');
    setSelectedSubjectId(null);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#06080C] text-white">
      {showSplash && <SplashScreen userName={userName} onComplete={() => {
        sessionStorage.setItem('hasSeenSplash', 'true');
        setShowSplash(false);
      }} />}

      {/* ── Left Sidebar (Desktop) ── */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(t) => { setActiveTab(t); setSelectedSubjectId(null); }} 
        isLightMode={isLightMode} 
        setIsLightMode={setIsLightMode} 
      />

      {/* ── Main Content Area ── */}
      <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar pb-20 md:pb-0">
        
        {/* Floating Timer Widget */}
        {activeChapter && (
          <div className="absolute top-4 right-6 z-50 flex items-center gap-2.5 bg-[#1B2430]/95 backdrop-blur-md border border-amber-500/40 rounded-full pl-4 pr-1.5 py-1.5 shadow-xl shadow-amber-900/20">
            <div className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono text-sm text-amber-500 tabular-nums w-[68px] font-bold">{formatTime(elapsedTime)}</span>
            <span className="text-xs text-slate-300 max-w-[150px] truncate hidden sm:inline">{activeSubject?.id?.toUpperCase()} · Ch {activeChapter.number}</span>
            <div className="flex items-center gap-1 ml-2">
              <button onClick={isRunning ? pauseTimer : resumeTimer} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition" title={isRunning ? 'Pause' : 'Resume'}>
                {isRunning ? <Pause size={14}/> : <Play size={14}/>}
              </button>
              <button onClick={stopAndSaveSession} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-full transition" title="Stop & Log">
                <Square size={14} fill="currentColor"/>
              </button>
            </div>
          </div>
        )}

        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col min-h-full">
          {activeTab === 'settings' ? (
            <SettingsView />
          ) : activeTab === 'planner' || activeTab === 'tasks' ? (
            <Tasks />
          ) : activeTab === 'syllabus' ? (
            <SyllabusView />
          ) : activeTab === 'revision' ? (
            <Revision />
          ) : activeTab === 'calendar' ? (
            <CalendarPlanner />
          ) : activeTab === 'analytics' ? (
            <TestAnalytics />
          ) : selectedSubject ? (
            <SubjectBreakdown subject={selectedSubject} onBack={() => setSelectedSubjectId(null)} />
          ) : (
            <DashboardGraphs />
          )}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0B0F19] border-t border-slate-800/80 z-50 flex items-center justify-around py-3 px-2 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        {[
          { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Dash' },
          { id: 'tasks', icon: <Target size={20}/>, label: 'Tasks' },
          { id: 'syllabus', icon: <BookOpen size={20}/>, label: 'Syllabus' },
          { id: 'settings', icon: <Settings size={20}/>, label: 'Settings' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id as any); setSelectedSubjectId(null); }}
            className={`flex flex-col items-center gap-1 p-1 transition-colors ${activeTab === item.id ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      <AiStudyManager />
    </div>
  );
}

export default App;
