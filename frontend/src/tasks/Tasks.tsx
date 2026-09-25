import React, { useState } from 'react';
import { useTasks } from './useTasks';
import type { Task } from './useTasks';
import { AddTaskModal } from './AddTaskModal';
import { Plus, Calendar, CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react';
import { SUBJECT_COLORS } from '../DashboardGraphs';

export const Tasks = () => {
  const { tasks, addTask, updateTaskStatus } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group tasks
  const todayTasks = tasks.filter(t => t.status === 'TODAY');
  const scheduledTasks = tasks.filter(t => t.status === 'SCHEDULED');
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const todayStr = new Date().toISOString().split('T')[0];

  const toggleComplete = (t: Task) => {
    if (t.status === 'COMPLETED') {
      // Revert based on date
      updateTaskStatus(t.id, (t.dueDate === todayStr) ? 'TODAY' : (t.dueDate ? 'SCHEDULED' : 'PENDING'));
    } else {
      updateTaskStatus(t.id, 'COMPLETED');
    }
  };

  const getCycleColor = (cycle: string) => {
    switch (cycle) {
      case 'R1': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'R2': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'R3': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const renderCard = (t: Task) => (
    <div key={t.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col gap-3 group hover:border-slate-500 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer">
      <div className="flex items-start gap-3">
        <button onClick={() => toggleComplete(t)} className="mt-0.5 shrink-0 transition-colors">
          {t.status === 'COMPLETED' ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <Circle size={18} className="text-slate-500 hover:text-amber-500" />
          )}
        </button>
        <span className={`text-sm font-medium leading-snug ${t.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
          {t.title}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700" style={{ color: SUBJECT_COLORS[t.subjectId] || '#9CA3AF' }}>
          {t.subjectId.toUpperCase()}
        </span>
        {t.dueDate && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            <Calendar size={10} /> {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCycleColor(t.cycle)}`}>
          {t.cycle}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Task Kanban</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and prioritize your study pipeline.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] transition"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* ── Macro Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0">
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock size={16}/> <span className="text-xs font-bold uppercase">Today</span></div>
          <span className="text-2xl font-bold text-white">{todayTasks.length}</span>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex flex-col">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Calendar size={16}/> <span className="text-xs font-bold uppercase">Upcoming</span></div>
          <span className="text-2xl font-bold text-white">{scheduledTasks.length}</span>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex flex-col">
          <div className="flex items-center gap-2 text-red-500 mb-2"><AlertTriangle size={16}/> <span className="text-xs font-bold uppercase">Backlog</span></div>
          <span className="text-2xl font-bold text-white">{pendingTasks.length}</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-col">
          <div className="flex items-center gap-2 text-emerald-500 mb-2"><CheckCircle2 size={16}/> <span className="text-xs font-bold uppercase">Completed</span></div>
          <span className="text-2xl font-bold text-white">{completedTasks.length}</span>
        </div>
      </div>

      {/* ── Kanban Columns ── */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-0">
        
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
            <h3 className="font-semibold text-amber-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/> TODAY</h3>
            <span className="text-xs text-amber-500/70 font-mono bg-amber-500/10 px-2 py-0.5 rounded">{todayTasks.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar pr-1">
            {todayTasks.map(renderCard)}
            {todayTasks.length === 0 && <div className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-700 rounded-xl">No tasks today.</div>}
          </div>
        </div>

        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-blue-500/30">
            <h3 className="font-semibold text-blue-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"/> SCHEDULED</h3>
            <span className="text-xs text-blue-500/70 font-mono bg-blue-500/10 px-2 py-0.5 rounded">{scheduledTasks.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar pr-1">
            {scheduledTasks.map(renderCard)}
            {scheduledTasks.length === 0 && <div className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-700 rounded-xl">Nothing scheduled.</div>}
          </div>
        </div>

        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-red-500/30">
            <h3 className="font-semibold text-red-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"/> PENDING / BACKLOG</h3>
            <span className="text-xs text-red-500/70 font-mono bg-red-500/10 px-2 py-0.5 rounded">{pendingTasks.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar pr-1">
            {pendingTasks.map(renderCard)}
            {pendingTasks.length === 0 && <div className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-700 rounded-xl">Queue is clear!</div>}
          </div>
        </div>

        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
            <h3 className="font-semibold text-emerald-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"/> COMPLETED</h3>
            <span className="text-xs text-emerald-500/70 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">{completedTasks.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar pr-1 opacity-60 hover:opacity-100 transition-opacity">
            {completedTasks.map(renderCard)}
          </div>
        </div>

      </div>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} />
    </div>
  );
};
