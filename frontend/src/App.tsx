import { useState, useMemo, useEffect } from 'react';
import { DashboardGraphs, SUBJECT_COLORS } from './DashboardGraphs';
import { SubjectBreakdown } from './SubjectBreakdown';
import { SettingsView } from './SettingsView';
import { PlannerView } from './PlannerView';
import { SyllabusView } from './SyllabusView';
import { SplashScreen } from './SplashScreen';
import { Auth } from './Auth';
import { AiStudyManager } from './AiStudyManager';
import { useTimer } from './TimerContext';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';
import { BookOpen, Target, LayoutDashboard, Settings, Play, Pause, Square, ChevronRight } from 'lucide-react';

const subjects = Object.values(CA_FINAL_SYLLABUS) as any[];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'syllabus' | 'planner' | 'settings'>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<'all' | 1 | 2>('all');

  const {
    isRunning,
    elapsedTime,
    activeSubject,
    activeChapter,
    pauseTimer,
    resumeTimer,
    stopAndSaveSession
  } = useTimer();

  const handleLogin = (name: string) => {
    setUserName(name);
    setIsAuthenticated(true);
  };

  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return subjects.find(s => s.id === selectedSubjectId) || null;
  }, [selectedSubjectId]);

  const filteredSubjects = useMemo(() => {
    if (activeGroup === 'all') return subjects;
    return subjects.filter(s => s.group === activeGroup);
  }, [activeGroup]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const groupLabel = (g: number) => g === 1 ? 'Group 1' : 'Group 2';

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
    <div className="min-h-screen bg-[#131A22] text-[#FFFFFF] font-sans flex flex-col relative">
      {showSplash && <SplashScreen userName={userName} onComplete={() => setShowSplash(false)} />}

      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-50 w-full h-14 bg-[#1B2430]/85 backdrop-blur-md border-b border-[#2D3A4B]">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={navigateToDashboard}>
            <span className="font-semibold text-lg tracking-tight">StudiAudit<span className="text-[#FF9900]">.</span></span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20 font-medium">CA Final</span>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto">
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[#9CA3AF]">
              <button 
                onClick={navigateToDashboard} 
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-2 ${activeTab === 'dashboard' && !selectedSubjectId ? 'text-[#FFFFFF] bg-[#232F3E]' : 'hover:text-[#FFFFFF] hover:bg-[#232F3E]'}`}
              >
                <LayoutDashboard size={15}/> Dashboard
              </button>

              {/* ── Active Timer Pill ── */}
              {activeChapter && (
                <div className="flex items-center gap-2.5 bg-[#131A22] border border-[#FF9900]/40 rounded-full pl-3 pr-1.5 py-1 shadow-md mx-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="font-mono text-sm text-[#FF9900] tabular-nums w-[68px]">{formatTime(elapsedTime)}</span>
                  <span className="text-xs text-[#9CA3AF] max-w-[130px] truncate hidden lg:inline">{activeSubject?.id?.toUpperCase()} · Ch {activeChapter.number}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button onClick={isRunning ? pauseTimer : resumeTimer} className="p-1.5 hover:bg-[#2D3A4B] rounded-full transition" title={isRunning ? 'Pause' : 'Resume'}>
                      {isRunning ? <Pause size={13}/> : <Play size={13}/>}
                    </button>
                    <button onClick={stopAndSaveSession} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition" title="Stop & Log">
                      <Square size={13} fill="currentColor"/>
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={() => { setActiveTab('syllabus'); setSelectedSubjectId(null); }} 
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-2 ${activeTab === 'syllabus' ? 'text-[#FFFFFF] bg-[#232F3E]' : 'hover:text-[#FFFFFF] hover:bg-[#232F3E]'}`}
              >
                <BookOpen size={15}/> Syllabus
              </button>
              
              <button 
                onClick={() => { setActiveTab('planner'); setSelectedSubjectId(null); }}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-2 ${activeTab === 'planner' ? 'text-[#FFFFFF] bg-[#232F3E]' : 'hover:text-[#FFFFFF] hover:bg-[#232F3E]'}`}
              >
                <Target size={15}/> Planner
              </button>
              
              <button 
                onClick={navigateToSettings} 
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-2 ${activeTab === 'settings' ? 'text-[#FFFFFF] bg-[#232F3E]' : 'hover:text-[#FFFFFF] hover:bg-[#232F3E]'}`}
              >
                <Settings size={15}/> Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">

        {/* ── Left Sidebar (Hidden if Settings or Planner) ── */}
        {activeTab === 'dashboard' && (
          <aside className="w-full md:w-[360px] flex flex-col gap-5 shrink-0">
            <div className="bg-[#1B2430] rounded-xl border border-[#2D3A4B] overflow-hidden">
              <div className="flex border-b border-[#2D3A4B]">
                {(['all', 1, 2] as const).map(g => (
                  <button
                    key={String(g)}
                    onClick={() => setActiveGroup(g)}
                    className={`flex-1 text-xs font-semibold uppercase tracking-wider py-3 transition ${
                      activeGroup === g
                        ? 'text-[#FF9900] border-b-2 border-[#FF9900] bg-[#FF9900]/5'
                        : 'text-[#6B7280] hover:text-[#9CA3AF]'
                    }`}
                  >
                    {g === 'all' ? 'Both Groups' : groupLabel(g)}
                  </button>
                ))}
              </div>

              <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                {filteredSubjects.map((sub: any) => {
                  const isActive = selectedSubjectId === sub.id;
                  const activeColor = SUBJECT_COLORS[sub.id] || '#FF9900';
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`flex items-center justify-between px-5 py-4 border-b border-[#2D3A4B]/60 cursor-pointer transition group ${
                        isActive ? 'bg-black/20' : 'hover:bg-[#232F3E]'
                      }`}
                      style={isActive ? { borderLeft: `2px solid ${activeColor}`, backgroundColor: `${activeColor}10` } : {}}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold transition" style={{ color: isActive ? activeColor : 'white' }}>
                            {sub.id.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">{sub.code}</span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{sub.name}</p>
                        <p className="text-[10px] text-[#6B7280] mt-1">{sub.chapters.length} chapters · {sub.chapters.reduce((a: number, c: any) => a + c.totalLectures, 0)} lectures</p>
                      </div>
                      <ChevronRight size={16} className={`transition shrink-0 ${isActive ? '' : 'text-[#6B7280]'}`} style={{ color: isActive ? activeColor : undefined }}/>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* ── Right Content Area ── */}
        <div className="flex-1 w-full flex flex-col min-w-0">
          {activeTab === 'settings' ? (
            <SettingsView />
          ) : activeTab === 'planner' ? (
            <PlannerView />
          ) : activeTab === 'syllabus' ? (
            <SyllabusView />
          ) : selectedSubject ? (
            <SubjectBreakdown subject={selectedSubject} onBack={() => setSelectedSubjectId(null)} />
          ) : (
            <DashboardGraphs />
          )}
        </div>
      </main>
      
      <AiStudyManager />
    </div>
  );
}

export default App;
