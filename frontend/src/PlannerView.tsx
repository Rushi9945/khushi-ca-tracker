import React, { useState, useEffect, useMemo } from 'react';
import { Target, Calendar, AlertTriangle, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';

const subjects = Object.values(CA_FINAL_SYLLABUS) as any[];
const defaultSequence = subjects.map(s => s.id);
const orderedPasses = ['pass1', 'pass2', 'pass3'] as const;

interface SubjectPlan { pass1: number; pass2: number; pass3: number; }
type Allocations = Record<string, SubjectPlan>;

interface PlannerState {
  allocations: Allocations;
  sequence: string[];
}

const emptyPlan = (): SubjectPlan => ({ pass1: 0, pass2: 0, pass3: 0 });

function loadPlannerState(): PlannerState {
  try {
    const data = JSON.parse(localStorage.getItem('ascend_revision_planner') || '{}');
    const cleanAlloc: Allocations = {};
    const cleanSeq: string[] = Array.isArray(data.sequence) && data.sequence.length === subjects.length 
      ? data.sequence 
      : defaultSequence;

    const sourceAlloc = data.allocations || data; // handle migration from v1

    defaultSequence.forEach(subId => {
      cleanAlloc[subId] = emptyPlan();
      if (sourceAlloc[subId]) {
        orderedPasses.forEach(p => {
          const val = sourceAlloc[subId][p];
          if (typeof val === 'number') cleanAlloc[subId][p] = val;
          else if (typeof val === 'string') cleanAlloc[subId][p] = parseFloat(val) || 0;
        });
      }
    });

    return { allocations: cleanAlloc, sequence: cleanSeq };
  } catch {
    const cleanAlloc: Allocations = {};
    defaultSequence.forEach(subId => cleanAlloc[subId] = emptyPlan());
    return { allocations: cleanAlloc, sequence: defaultSequence };
  }
}

function savePlannerState(d: PlannerState) {
  localStorage.setItem('ascend_revision_planner', JSON.stringify(d));
}

function daysUntil(dateStr: string): number {
  const t = new Date(dateStr); const n = new Date();
  t.setHours(0,0,0,0); n.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((t.getTime() - n.getTime()) / 86400000));
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Sortable Row Component ──
function SortableSubjectRow({ 
  id, index, subject, plan, calculatedDates, passConfig, updateDays, isLast 
}: { 
  id: string, index: number, subject: any, plan: SubjectPlan, calculatedDates: any, passConfig: any[], updateDays: any, isLast: boolean 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-[#1B2430] rounded-xl border ${isDragging ? 'border-[#FF9900] shadow-lg' : 'border-[#2D3A4B]'} overflow-hidden relative`}>
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_1fr_1fr] gap-0 md:gap-4 p-4 md:p-3 relative bg-[#1B2430]">
        
        {/* Sequence connector visual */}
        {!isLast && !isDragging && (
          <div className="hidden md:block absolute left-[130px] top-[100%] h-3 border-l-2 border-dashed border-[#2D3A4B] z-10" />
        )}
        
        {/* Subject Label */}
        <div className="flex items-center gap-3 px-2 py-3 md:py-0">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1.5 text-[#6B7280] hover:text-white transition rounded-md hover:bg-[#2D3A4B]"
          >
            <GripVertical size={16} />
          </div>
          
          <div className="w-6 h-6 rounded-full bg-[#131A22] border border-[#2D3A4B] flex items-center justify-center text-[10px] font-bold text-[#6B7280] shrink-0">
            {index + 1}
          </div>
          <div>
            <span className="text-sm font-semibold text-white">{subject.id.toUpperCase()}</span>
            <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">{subject.name}</p>
          </div>
        </div>

        {/* Pass Cells */}
        {passConfig.map(pc => {
          const days = plan[pc.key as keyof SubjectPlan];
          const dates = calculatedDates[subject.id]?.[pc.key];

          return (
            <div key={pc.key} className="px-2 py-3 md:py-1 border-t md:border-0 border-[#2D3A4B]/40">
              <div className="md:hidden mb-2">
                <span className="text-xs font-semibold" style={{ color: pc.color }}>{pc.label}</span>
                <span className="text-[10px] text-[#9CA3AF] ml-1.5">{pc.subtitle}</span>
              </div>

              <div className="flex flex-col justify-center h-full">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={days === 0 ? '' : days}
                    onChange={e => updateDays(subject.id, pc.key, e.target.value)}
                    placeholder="0"
                    className="w-16 bg-[#131A22] border border-[#2D3A4B] rounded-md px-2 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-[#FF9900]/50 transition text-center"
                  />
                  <span className="text-xs text-[#6B7280] font-medium">days</span>
                </div>
                
                <div className="h-4 mt-1.5 flex items-center">
                  {days > 0 && dates ? (
                    <span className="text-[11px] font-medium text-[#9CA3AF] bg-[#131A22] px-2 py-0.5 rounded border border-[#2D3A4B]">
                      {formatDateShort(dates.start)} <span className="text-[#6B7280] mx-1">→</span> {formatDateShort(dates.end)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#2D3A4B] italic">No allocation</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export const PlannerView: React.FC = () => {
  const [plannerState, setPlannerState] = useState<PlannerState>(loadPlannerState);
  const [examDate] = useState(localStorage.getItem('ascend_exam_date') || '');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [revisionStart, setRevisionStart] = useState(localStorage.getItem('ascend_revision_start') || todayStr);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Save changes
  useEffect(() => { savePlannerState(plannerState); }, [plannerState]);
  useEffect(() => { localStorage.setItem('ascend_revision_start', revisionStart); }, [revisionStart]);

  const updateDays = (subId: string, pass: typeof orderedPasses[number], val: string) => {
    const num = parseFloat(val);
    const safeNum = isNaN(num) || num < 0 ? 0 : num;
    setPlannerState(prev => ({
      ...prev,
      allocations: {
        ...prev.allocations,
        [subId]: { ...prev.allocations[subId], [pass]: safeNum }
      }
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlannerState(prev => {
        const oldIndex = prev.sequence.indexOf(active.id as string);
        const newIndex = prev.sequence.indexOf(over.id as string);
        return {
          ...prev,
          sequence: arrayMove(prev.sequence, oldIndex, newIndex)
        };
      });
    }
  };

  // ── Sequential Date Calculation Engine (Powered by sequence) ──
  const calculatedDates = useMemo(() => {
    const dates: Record<string, Record<string, { start: Date, end: Date }>> = {};
    
    let currentTs = new Date(revisionStart || new Date()).getTime();
    const d = new Date(currentTs); d.setHours(0,0,0,0);
    currentTs = d.getTime();

    orderedPasses.forEach(pass => {
      // Use the dynamic drag-and-drop sequence here instead of hardcoded order
      plannerState.sequence.forEach(subId => {
        if (!dates[subId]) dates[subId] = {};
        
        const days = plannerState.allocations[subId]?.[pass] || 0;
        if (days > 0) {
          const start = new Date(currentTs);
          const endTs = currentTs + (days * 86400000); 
          const end = new Date(endTs - 1); 
          
          dates[subId][pass] = { start, end };
          currentTs = endTs; 
        }
      });
    });
    
    return dates;
  }, [plannerState, revisionStart]);

  const totalPlannedDays = Object.values(plannerState.allocations).reduce((sum, p) => sum + p.pass1 + p.pass2 + p.pass3, 0);
  const remainingDays = examDate ? daysUntil(examDate) : 0;
  const isOverPlanned = examDate && (totalPlannedDays > remainingDays);

  const passConfig = [
    { key: 'pass1' as const, label: 'Pass 1', subtitle: 'Detailed Revision', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' },
    { key: 'pass2' as const, label: 'Pass 2', subtitle: 'Speed Revision', color: '#FF9900', bgColor: 'rgba(255,153,0,0.1)', borderColor: 'rgba(255,153,0,0.3)' },
    { key: 'pass3' as const, label: 'Pass 3', subtitle: 'Final 1.5 Days', color: '#10B981', bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">

      {/* ── Header & Validation ── */}
      <div className="bg-[#1B2430] rounded-xl border border-[#2D3A4B] p-6">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Target size={22} className="text-[#FF9900]" />
              Duration Allocation Engine
            </h2>
            <p className="text-sm text-[#9CA3AF] mt-2 leading-relaxed">
              Enter the number of days you want to spend on each subject. <strong className="text-white">Drag and drop the rows</strong> to change your study sequence. The engine will instantly recalculate all dates.
            </p>
            
            <div className="mt-5 flex items-center gap-3 bg-[#131A22] border border-[#2D3A4B] rounded-lg p-1.5 w-max">
              <span className="text-xs font-medium text-[#9CA3AF] pl-3 uppercase tracking-wider">Start Plan On:</span>
              <input
                type="date"
                value={revisionStart}
                onChange={e => setRevisionStart(e.target.value)}
                className="bg-[#1B2430] border border-[#2D3A4B] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF9900]/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            {examDate ? (
              <div className="bg-[#131A22] border border-[#2D3A4B] rounded-lg px-5 py-3 min-w-[130px]">
                <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider block mb-1">Remaining to Exam</span>
                <span className="text-xl font-semibold text-white">{remainingDays} <span className="text-xs text-[#6B7280]">days</span></span>
              </div>
            ) : (
              <div className="bg-[#131A22] border border-[#2D3A4B] rounded-lg px-5 py-3 flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Calendar size={16} /> Exam date not set
              </div>
            )}

            <div className={`border rounded-lg px-5 py-3 min-w-[130px] transition-colors ${isOverPlanned ? 'bg-red-500/10 border-red-500/30' : 'bg-[#131A22] border-[#2D3A4B]'}`}>
              <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isOverPlanned ? 'text-red-400 font-bold' : 'text-[#9CA3AF]'}`}>
                {isOverPlanned ? 'Plan Exceeds Time!' : 'Total Planned'}
              </span>
              <span className={`text-xl font-semibold flex items-center gap-2 ${isOverPlanned ? 'text-red-400' : 'text-white'}`}>
                {totalPlannedDays} <span className={`text-xs ${isOverPlanned ? 'text-red-400/70' : 'text-[#6B7280]'}`}>days</span>
                {isOverPlanned && <AlertTriangle size={16} />}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pass Column Headers ── */}
      <div className="hidden md:grid grid-cols-[240px_1fr_1fr_1fr] gap-4">
        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Subject Sequence</span>
        </div>
        {passConfig.map(p => (
          <div key={p.key} className="px-4 py-2 rounded-lg" style={{ backgroundColor: p.bgColor, border: `1px solid ${p.borderColor}` }}>
            <span className="text-sm font-semibold" style={{ color: p.color }}>{p.label}</span>
            <span className="text-[10px] text-[#9CA3AF] ml-2">{p.subtitle}</span>
          </div>
        ))}
      </div>

      {/* ── Sortable Subject Rows ── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={plannerState.sequence} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 pb-8">
            {plannerState.sequence.map((subId, idx) => {
              const sub = subjects.find(s => s.id === subId);
              if (!sub) return null;
              
              const plan = plannerState.allocations[sub.id] || emptyPlan();
              const isLast = idx === plannerState.sequence.length - 1;

              return (
                <SortableSubjectRow
                  key={sub.id}
                  id={sub.id}
                  index={idx}
                  subject={sub}
                  plan={plan}
                  calculatedDates={calculatedDates}
                  passConfig={passConfig}
                  updateDays={updateDays}
                  isLast={isLast}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

    </div>
  );
};
