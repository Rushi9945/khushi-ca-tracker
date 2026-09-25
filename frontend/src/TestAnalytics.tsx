import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { AlertCircle, Target, Trophy, XCircle, TrendingDown, BookOpen } from 'lucide-react';

const MOCK_SCORES = [
  { id: 'FR', name: 'Financial Reporting', group: 1, score: 54, total: 100, tests: 4 },
  { id: 'AFM', name: 'Advanced Financial Management', group: 1, score: 46, total: 100, tests: 3 },
  { id: 'AUD', name: 'Advanced Auditing', group: 1, score: 38, total: 100, tests: 5 }, // Failing paper
  { id: 'DT', name: 'Direct Tax Laws', group: 2, score: 70, total: 100, tests: 6 },
  { id: 'IDT', name: 'Indirect Tax Laws', group: 2, score: 65, total: 100, tests: 4 },
  { id: 'IBS', name: 'Integrated Business Solutions', group: 2, score: 72, total: 100, tests: 2 },
];

const WEAK_CHAPTERS = [
  { subject: 'FR', title: 'Consolidated Financial Statements', percentage: 35 },
  { subject: 'AUD', title: 'Professional Ethics', percentage: 38 },
  { subject: 'AFM', title: 'Derivatives Analysis', percentage: 42 },
  { subject: 'DT', title: 'Capital Gains', percentage: 45 },
  { subject: 'IDT', title: 'Input Tax Credit', percentage: 52 },
];

const QUESTION_DATA = [
  { name: 'Correct', value: 340, color: '#10B981' }, // emerald-500
  { name: 'Wrong', value: 120, color: '#EF4444' }, // red-500
  { name: 'Skipped', value: 40, color: '#F59E0B' }, // amber-500
];

export const TestAnalytics = () => {
  const evaluateGroup = (groupId: number) => {
    const papers = MOCK_SCORES.filter(p => p.group === groupId);
    const aggregate = papers.reduce((sum, p) => sum + p.score, 0);
    const maxAggregate = papers.length * 100;
    
    let isIndividualPass = true;
    let failingPaper = null;
    for (const p of papers) {
      if (p.score < 40) {
        isIndividualPass = false;
        failingPaper = p;
        break;
      }
    }
    
    const isAggregatePass = aggregate >= (maxAggregate / 2);
    
    let status = 'PASS';
    let reason = '';
    let bgColor = 'bg-emerald-500/10';
    let borderColor = 'border-emerald-500/30';
    let textColor = 'text-emerald-500';

    if (!isIndividualPass) {
      status = 'NEEDS WORK';
      reason = `${failingPaper!.id} below 40%`;
      bgColor = 'bg-red-500/10';
      borderColor = 'border-red-500/30';
      textColor = 'text-red-500';
    } else if (!isAggregatePass) {
      status = 'NEEDS WORK';
      reason = `Aggregate at ${aggregate}/${maxAggregate}`;
      bgColor = 'bg-red-500/10';
      borderColor = 'border-red-500/30';
      textColor = 'text-red-500';
    } else {
      reason = `Aggregate ${aggregate}/${maxAggregate}`;
    }

    return { aggregate, maxAggregate, status, reason, bgColor, borderColor, textColor, papers };
  };

  const group1 = evaluateGroup(1);
  const group2 = evaluateGroup(2);
  const totalQuestions = QUESTION_DATA.reduce((sum, d) => sum + d.value, 0);

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 overflow-y-auto custom-scrollbar pb-10">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Test Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">ICAI Benchmarking & Weakness Identification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ── ICAI Simulation Status (Spans Both Columns) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-[#1B2430] border border-[#2D3A4B] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} className="text-amber-500" />
            <h2 className="text-lg font-bold text-white">ICAI Simulation Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group 1 */}
            <div className={`p-5 rounded-xl border ${group1.borderColor} ${group1.bgColor} flex flex-col justify-between relative overflow-hidden group`}>
              <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <Target size={120} className={group1.textColor} />
              </div>
              <div className="flex items-center justify-between z-10 mb-6">
                <h3 className="font-bold text-lg text-white">Group 1</h3>
                <div className={`flex flex-col items-end`}>
                  <span className={`text-sm font-black tracking-widest uppercase px-3 py-1 rounded-full border ${group1.borderColor} ${group1.textColor}`}>
                    {group1.status}
                  </span>
                  <span className={`text-[11px] font-bold mt-1.5 ${group1.textColor}`}>{group1.reason}</span>
                </div>
              </div>
              <div className="flex gap-4 z-10">
                {group1.papers.map(p => (
                  <div key={p.id} className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold">{p.id}</span>
                    <span className={`text-xl font-black ${getScoreColor(p.score)}`}>{p.score}</span>
                  </div>
                ))}
                <div className="flex flex-col border-l border-white/10 pl-4 ml-auto text-right">
                  <span className="text-[10px] text-slate-400 font-bold">AGGREGATE</span>
                  <span className="text-xl font-black text-white">{group1.aggregate}</span>
                </div>
              </div>
            </div>

            {/* Group 2 */}
            <div className={`p-5 rounded-xl border ${group2.borderColor} ${group2.bgColor} flex flex-col justify-between relative overflow-hidden group`}>
              <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <Target size={120} className={group2.textColor} />
              </div>
              <div className="flex items-center justify-between z-10 mb-6">
                <h3 className="font-bold text-lg text-white">Group 2</h3>
                <div className={`flex flex-col items-end`}>
                  <span className={`text-sm font-black tracking-widest uppercase px-3 py-1 rounded-full border ${group2.borderColor} ${group2.textColor}`}>
                    {group2.status}
                  </span>
                  <span className={`text-[11px] font-bold mt-1.5 ${group2.textColor}`}>{group2.reason}</span>
                </div>
              </div>
              <div className="flex gap-4 z-10">
                {group2.papers.map(p => (
                  <div key={p.id} className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold">{p.id}</span>
                    <span className={`text-xl font-black ${getScoreColor(p.score)}`}>{p.score}</span>
                  </div>
                ))}
                <div className="flex flex-col border-l border-white/10 pl-4 ml-auto text-right">
                  <span className="text-[10px] text-slate-400 font-bold">AGGREGATE</span>
                  <span className="text-xl font-black text-white">{group2.aggregate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Paper-Wise Performance Table ── */}
        <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen size={18} className="text-blue-400" />
            <h3 className="font-bold text-white text-lg">Paper-Wise Performance</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2D3A4B]">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Avg Score</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Tests</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SCORES.map((paper, idx) => (
                  <tr key={paper.id} className="border-b border-[#2D3A4B]/50 last:border-0 hover:bg-[#232F3E]/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {paper.id}
                        </span>
                        <span className="text-sm font-medium text-slate-200 truncate max-w-[150px]" title={paper.name}>{paper.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-black text-sm ${getScoreColor(paper.score)}`}>{paper.score}%</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">{paper.tests}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom Right: Weak Chapters & Donut Chart ── */}
        <div className="flex flex-col gap-6">
          
          {/* Top Weak Chapters */}
          <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingDown size={18} className="text-red-500" />
              <h3 className="font-bold text-white text-lg">Top Weak Chapters</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              {WEAK_CHAPTERS.map((ch, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 group">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 shrink-0">{ch.subject}</span>
                      <span className="text-slate-300 truncate font-medium group-hover:text-amber-500 transition-colors">{ch.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`font-bold text-xs ${ch.percentage < 40 ? 'text-red-500' : 'text-amber-500'}`}>{ch.percentage}%</span>
                      {ch.percentage < 40 && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[#131A22] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${ch.percentage < 40 ? 'bg-red-500' : 'bg-amber-500'}`} 
                      style={{ width: `${ch.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Analysis Donut */}
          <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl p-6 flex items-center justify-between">
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-white text-lg">Question Analysis</h3>
              <div className="flex flex-col gap-2">
                {QUESTION_DATA.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }}></span>
                    <span className="text-slate-400 font-medium">{d.name}</span>
                    <span className="text-white font-bold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={QUESTION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {QUESTION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1B2430', borderColor: '#2D3A4B', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-white leading-none">{totalQuestions}</span>
                <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-1">Total</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
