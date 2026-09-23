import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';

interface DayData {
  date: Date;
  dateStr: string;
  hours: number;
}

export const StudyHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState<DayData[]>([]);

  useEffect(() => {
    const loadHeatmap = async () => {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) return;

      // Generate last 90 days array
      const daysArray: DayData[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find the date 89 days ago
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 89);
      
      // Calculate how many days to pad to reach the previous Sunday
      const startDayOfWeek = ninetyDaysAgo.getDay();
      
      // Pad empty placeholders until Sunday
      for (let i = 0; i < startDayOfWeek; i++) {
        const padDate = new Date(ninetyDaysAgo);
        padDate.setDate(ninetyDaysAgo.getDate() - (startDayOfWeek - i));
        daysArray.push({
          date: padDate,
          dateStr: 'padding',
          hours: -1 // Indicates an empty padding day
        });
      }

      // Add the actual 90 days
      for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        daysArray.push({
          date: d,
          dateStr: d.toDateString(),
          hours: 0
        });
      }

      // Calculate start timestamp from ninetyDaysAgo
      const startTime = ninetyDaysAgo.getTime();

      // Fetch sessions within the last 90 days
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('session_timestamp, duration_minutes')
        .eq('user_id', authData.session.user.id)
        .gte('session_timestamp', startTime.toString());

      if (sessions && !error) {
        sessions.forEach(s => {
          const sDate = new Date(parseInt(s.session_timestamp)).toDateString();
          const match = daysArray.find(d => d.dateStr === sDate);
          if (match) {
            match.hours += s.duration_minutes / 60;
          }
        });
      }

      setHeatmapData(daysArray);
    };

    loadHeatmap();
    
    // Auto-reload on session saves
    window.addEventListener('sessionSaved', loadHeatmap);
    return () => window.removeEventListener('sessionSaved', loadHeatmap);
  }, []);

  const getColorClass = (hours: number) => {
    if (hours === -1) return 'bg-transparent'; // Hidden padding
    if (hours === 0) return 'bg-slate-800';
    if (hours > 0 && hours <= 4) return 'bg-emerald-950 border border-emerald-900/30';
    if (hours > 4 && hours <= 8) return 'bg-emerald-700 border border-emerald-600/30';
    if (hours > 8 && hours < 12) return 'bg-emerald-500 border border-emerald-400/30';
    return 'bg-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] border border-emerald-300';
  };

  return (
    <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-6 shadow-sm w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold tracking-tight text-lg">90-Day Consistency Matrix</h3>
        <span className="text-xs text-[#9CA3AF] bg-[#131A22] px-2.5 py-1 rounded-md border border-[#2D3A4B]">
          Last 90 Days
        </span>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        {/* CSS Grid for exactly 7 rows (Sunday to Saturday) */}
        <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
          {heatmapData.map((day, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-[3px] transition-all duration-200 hover:scale-125 hover:z-10 cursor-crosshair ${getColorClass(day.hours)}`}
              title={day.hours === -1 ? undefined : `${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${day.hours.toFixed(1)}h logged`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-end text-xs text-[#9CA3AF]">
        <span>Empty</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[3px] bg-slate-800" />
          <div className="w-3 h-3 rounded-[3px] bg-emerald-950 border border-emerald-900/30" />
          <div className="w-3 h-3 rounded-[3px] bg-emerald-700 border border-emerald-600/30" />
          <div className="w-3 h-3 rounded-[3px] bg-emerald-500 border border-emerald-400/30" />
          <div className="w-3 h-3 rounded-[3px] bg-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)] border border-emerald-300" />
        </div>
        <span>12h Target Hit</span>
      </div>
    </div>
  );
};
