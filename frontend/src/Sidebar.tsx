import React from 'react';
import { LayoutDashboard, CheckSquare, Calendar, BookOpen, RotateCcw, BarChart2, Settings, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isLightMode: boolean;
  setIsLightMode: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isLightMode, setIsLightMode }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'syllabus', label: 'Syllabus', icon: <BookOpen size={20} /> },
    { id: 'revision', label: 'Revision', icon: <RotateCcw size={20} /> },
    { id: 'analytics', label: 'Test Analytics', icon: <BarChart2 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 h-full hidden md:flex flex-col bg-[#0B0F19] border-r border-slate-800/50 shrink-0 z-40">
      {/* Header Logo */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-extrabold text-[#0B0F19] drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]">
            SA
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-wide leading-tight">
              StudiAudit
            </span>
            <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">
              CA Final
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 custom-scrollbar">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                isActive 
                  ? 'bg-slate-800 text-amber-500 border-l-4 border-amber-500 shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-l-4 border-transparent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer / Theme Toggle */}
      <div className="p-4 border-t border-slate-800/50">
        <button 
          onClick={() => setIsLightMode(!isLightMode)} 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-amber-500 transition-all"
        >
          {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
          {isLightMode ? "Dark Mode" : "Light Mode"}
        </button>
      </div>
    </aside>
  );
};
