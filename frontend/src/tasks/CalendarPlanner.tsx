import React, { useState } from 'react';
import { useTasks } from './useTasks';
import type { Task } from './useTasks';
import { AddTaskModal } from './AddTaskModal';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarPlanner = () => {
  const { tasks, addTask } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const openAddForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  const handleAdd = (t: any) => {
    addTask(t);
  };

  // Build grid
  const gridCells = [];
  
  // Padding left
  for (let i = 0; i < firstDayOfMonth; i++) {
    gridCells.push(<div key={`pad-${i}`} className="min-h-[120px] bg-[#0B0F19]/50 border border-slate-800/50 p-2 opacity-50" />);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const isToday = dateStr === todayStr;

    gridCells.push(
      <div 
        key={day} 
        className={`min-h-[120px] bg-[#131A22] border border-slate-800 p-2 flex flex-col gap-1.5 transition hover:border-slate-600 group relative ${isToday ? 'bg-amber-500/5 border-amber-500/30' : ''}`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-slate-900' : 'text-slate-400 group-hover:text-white'}`}>
            {day}
          </span>
          <button 
            onClick={() => openAddForDate(dateStr)}
            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-amber-500 p-1 transition"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
          {dayTasks.map(t => (
            <div 
              key={t.id} 
              className={`text-[10px] font-bold truncate px-2 py-1 rounded cursor-default border ${
                t.status === 'COMPLETED' 
                  ? 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/20 line-through' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
              title={t.title}
            >
              {t.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Padding right
  const totalCells = gridCells.length;
  const rem = totalCells % 7;
  if (rem > 0) {
    for (let i = 0; i < (7 - rem); i++) {
      gridCells.push(<div key={`pad-r-${i}`} className="min-h-[120px] bg-[#0B0F19]/50 border border-slate-800/50 p-2 opacity-50" />);
    }
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Calendar Planner</h1>
          <p className="text-sm text-slate-400 mt-1">Schedule your macro syllabus timeline.</p>
        </div>
        <button 
          onClick={() => { setSelectedDate(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] transition"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="flex-1 flex flex-col bg-[#1B2430] border border-[#2D3A4B] rounded-2xl overflow-hidden min-h-0 shadow-sm">
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-[#2D3A4B] bg-[#131A22]/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {monthNames[month]} <span className="text-amber-500">{year}</span>
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-[#2D3A4B] rounded-lg transition text-slate-400 hover:text-white"><ChevronLeft size={18}/></button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-[#2D3A4B] rounded-lg transition">TODAY</button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-[#2D3A4B] rounded-lg transition text-slate-400 hover:text-white"><ChevronRight size={18}/></button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-[#2D3A4B] bg-[#0B0F19]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-[#2D3A4B] last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto bg-[#0B0F19] custom-scrollbar">
          <div className="grid grid-cols-7 w-full h-full min-h-max auto-rows-max">
            {gridCells}
          </div>
        </div>
      </div>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAdd} defaultDate={selectedDate} />
    </div>
  );
};
