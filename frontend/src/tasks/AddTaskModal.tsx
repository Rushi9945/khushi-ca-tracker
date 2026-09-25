import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, BookOpen, AlertCircle } from 'lucide-react';
import { CA_FINAL_SYLLABUS } from '../data/caFinalSyllabus';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: any) => void;
  defaultDate?: string | null;
}

const subjects = Object.values(CA_FINAL_SYLLABUS) as any[];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [dueDate, setDueDate] = useState(defaultDate || '');
  const [cycle, setCycle] = useState<'Initial'|'R1'|'R2'|'R3'>('Initial');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Determine default status based on due date if not explicitly handled
    let status = 'PENDING';
    if (dueDate) {
      const today = new Date().toISOString().split('T')[0];
      if (dueDate === today) status = 'TODAY';
      else status = 'SCHEDULED';
    }

    onAdd({
      title: title.trim(),
      subjectId,
      dueDate: dueDate || null,
      cycle,
      status
    });

    // Reset
    setTitle('');
    setDueDate('');
    setCycle('Initial');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3A4B] bg-[#131A22]/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Add New Task
          </h3>
          <button onClick={onClose} className="text-[#6B7280] hover:text-white transition p-1 rounded-md hover:bg-[#2D3A4B]">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Revise Ind AS 115"
              className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5"><BookOpen size={12}/> Subject</label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5"><CalendarIcon size={12}/> Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 transition [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5"><AlertCircle size={12}/> Cycle</label>
              <select
                value={cycle}
                onChange={e => setCycle(e.target.value as any)}
                className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition"
              >
                <option value="Initial">Initial Completion</option>
                <option value="R1">Revision 1</option>
                <option value="R2">Revision 2</option>
                <option value="R3">Revision 3</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={!title.trim()}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#131A22] font-bold rounded-lg transition shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
