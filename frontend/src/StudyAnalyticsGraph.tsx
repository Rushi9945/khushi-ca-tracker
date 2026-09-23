import React, { useEffect, useState } from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { supabase } from './supabaseClient';

interface DataPoint {
  date: string;
  hours: number;
}

export const StudyAnalyticsGraph = () => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) return;

      const sevenDaysAgo = Date.now() - 7 * 86400000;
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('session_timestamp, duration_minutes')
        .gte('session_timestamp', sevenDaysAgo)
        .eq('user_id', authData.session.user.id);

      if (error || !sessions) return;

      const last7 = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dateStr: d.toDateString(),
          hours: 0,
        };
      });

      sessions.forEach(s => {
        const sd = new Date(parseInt(s.session_timestamp)).toDateString();
        const match = last7.find(day => day.dateStr === sd);
        if (match) match.hours += s.duration_minutes / 60;
      });

      const formatted = last7.map(d => ({
        date: d.date,
        hours: Number(d.hours.toFixed(1)),
      }));

      setData(formatted);
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur border border-green-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-white font-bold">{payload[0].value} Hours Logged</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#0B0F19] rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-slate-800">
      <h3 className="text-white font-bold mb-6 text-lg tracking-wide z-10 relative">Study Analytics (Last 7 Days)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0.05} />
              </linearGradient>
              <filter id="glowAndDepth" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#064e3b" floodOpacity="0.8" />
              </filter>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#22c55e"
              strokeWidth={8}
              fill="url(#colorHours)"
              filter="url(#glowAndDepth)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
