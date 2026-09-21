import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, Calendar, Trash2, Database, AlertTriangle, X } from 'lucide-react';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';

export const SettingsView = () => {
  const [examDate, setExamDate] = useState(localStorage.getItem('ascend_exam_date') || '');
  const [exportRange, setExportRange] = useState<'today'|'week'|'month'|'all'>('all');
  
  // Data Vault State
  const [archives, setArchives] = useState<any[]>([]);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveName, setArchiveName] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ascend_archives') || '[]');
      setArchives(stored);
    } catch { setArchives([]); }
  }, []);

  const handleExamDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExamDate(val);
    if (val) {
      localStorage.setItem('ascend_exam_date', val);
    } else {
      localStorage.removeItem('ascend_exam_date');
    }
    window.dispatchEvent(new Event('examDateChanged'));
  };

  const clearExamDate = () => {
    setExamDate('');
    localStorage.removeItem('ascend_exam_date');
    window.dispatchEvent(new Event('examDateChanged'));
  };

  const daysUntil = (dateStr: string): number => {
    const target = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
  };

  const getSubjectAndChapter = (subjectId: string, chapterId: string) => {
    const subject = Object.values(CA_FINAL_SYLLABUS).find((s: any) => s.id === subjectId);
    const chapter = subject?.chapters.find((c: any) => c.id === chapterId);
    return { 
      subjectName: subject?.name || subjectId, 
      chapterTitle: chapter ? `Ch ${chapter.number}: ${chapter.title}` : chapterId 
    };
  };

  // Generic Excel Generator
  const generateExcel = (sessionsRaw: any[], progressRaw: any, notesRaw: any, fileName: string, cutoff: number = 0) => {
    const filteredSessions = sessionsRaw.filter((s:any) => s.timestamp >= cutoff);

    const sessionsData = filteredSessions.map((s: any) => {
      const { subjectName, chapterTitle } = getSubjectAndChapter(s.subjectId, s.chapterId);
      const d = new Date(s.timestamp);
      return {
        Date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        Time: d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        Subject: subjectName,
        Chapter: chapterTitle,
        'Duration (Mins)': s.durationMinutes,
        'Session Type': s.type || 'Self Study'
      };
    });

    const progressData = Object.entries(progressRaw || {}).map(([chId, p]: [string, any]) => {
      let subjId = '';
      for (const s of Object.values(CA_FINAL_SYLLABUS) as any[]) {
        if (s.chapters.some((c: any) => c.id === chId)) { subjId = s.id; break; }
      }
      const { subjectName, chapterTitle } = getSubjectAndChapter(subjId, chId);
      return {
        Subject: subjectName,
        Chapter: chapterTitle,
        'Confidence (Stars)': p.confidence || p.stars || 0,
        R1: p.r1 || false,
        R2: p.r2 || false,
        R3: p.r3 || false,
        Completed: p.completed || false
      };
    });

    const notesData = Object.entries(notesRaw || {}).map(([chId, noteText]: [string, any]) => {
      let subjId = '';
      for (const s of Object.values(CA_FINAL_SYLLABUS) as any[]) {
        if (s.chapters.some((c: any) => c.id === chId)) { subjId = s.id; break; }
      }
      const { subjectName, chapterTitle } = getSubjectAndChapter(subjId, chId);
      return {
        Subject: subjectName,
        Chapter: chapterTitle,
        'Flashpoint Note': noteText
      };
    });

    const wb = XLSX.utils.book_new();
    const wsSessions = XLSX.utils.json_to_sheet(sessionsData.length ? sessionsData : [{ Date: '', Time: '', Subject: '', Chapter: '', 'Duration (Mins)': 0, 'Session Type': '' }]);
    const wsProgress = XLSX.utils.json_to_sheet(progressData.length ? progressData : [{ Subject: '', Chapter: '', 'Confidence (Stars)': 0, R1: false, R2: false, R3: false, Completed: false }]);
    const wsNotes = XLSX.utils.json_to_sheet(notesData.length ? notesData : [{ Subject: '', Chapter: '', 'Flashpoint Note': '' }]);

    wsSessions['!cols'] = [{wch: 12}, {wch: 10}, {wch: 25}, {wch: 45}, {wch: 15}, {wch: 15}];
    wsProgress['!cols'] = [{wch: 25}, {wch: 45}, {wch: 18}, {wch: 8}, {wch: 8}, {wch: 8}, {wch: 12}];
    wsNotes['!cols'] = [{wch: 25}, {wch: 45}, {wch: 100}];

    XLSX.utils.book_append_sheet(wb, wsSessions, 'Study Sessions');
    XLSX.utils.book_append_sheet(wb, wsProgress, 'Syllabus Progress');
    XLSX.utils.book_append_sheet(wb, wsNotes, 'Notes');

    XLSX.writeFile(wb, fileName);
  };

  const handleExportCurrent = () => {
    const sessionsRaw = JSON.parse(localStorage.getItem('ascend_sessions') || '[]');
    const progressRaw = JSON.parse(localStorage.getItem('ascend_syllabus_progress') || '{}');
    const notesRaw = JSON.parse(localStorage.getItem('ascend_chapter_notes') || '{}');

    let cutoff = 0;
    const now = Date.now();
    if (exportRange === 'today') cutoff = new Date().setHours(0,0,0,0);
    else if (exportRange === 'week') cutoff = now - 7 * 86400000;
    else if (exportRange === 'month') cutoff = now - 30 * 86400000;

    const rangeStr = { today: 'Today', week: 'ThisWeek', month: 'ThisMonth', all: 'AllTime' }[exportRange];
    const dateStr = new Date().toISOString().split('T')[0];
    
    generateExcel(sessionsRaw, progressRaw, notesRaw, `StudiAudit_Export_${rangeStr}_${dateStr}.xlsx`, cutoff);
  };

  const exportArchive = (archive: any) => {
    const safeName = archive.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    generateExcel(archive.data.sessions, archive.data.progress, archive.data.notes, `StudiAudit_Archive_${safeName}.xlsx`, 0);
  };

  const executeArchiveAndReset = () => {
    if (!archiveName.trim()) return;

    const currentData = {
      sessions: JSON.parse(localStorage.getItem('ascend_sessions') || '[]'),
      progress: JSON.parse(localStorage.getItem('ascend_syllabus_progress') || '{}'),
      notes: JSON.parse(localStorage.getItem('ascend_chapter_notes') || '{}'),
      examDate: localStorage.getItem('ascend_exam_date') || ''
    };

    const newArchive = {
      id: Date.now().toString(),
      name: archiveName.trim(),
      timestamp: Date.now(),
      data: currentData
    };

    const updatedArchives = [...archives, newArchive];
    localStorage.setItem('ascend_archives', JSON.stringify(updatedArchives));
    
    // Clear active keys
    const keysToWipe = ['ascend_sessions', 'ascend_syllabus_progress', 'ascend_chapter_notes', 'ascend_revision_planner', 'ascend_exam_date'];
    keysToWipe.forEach(k => localStorage.removeItem(k));

    window.location.reload();
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("This will overwrite your current app data with the uploaded Excel file. Proceed?")) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        const wsSessions = wb.Sheets['Study Sessions'];
        if (wsSessions) {
          const sessionsRaw = XLSX.utils.sheet_to_json(wsSessions);
          const sessionsParsed = sessionsRaw.map((r: any) => {
            let subjId = r._subjectId;
            let chapId = r._chapterId;
            if (!subjId && r.Subject) {
              const sObj = Object.values(CA_FINAL_SYLLABUS).find((s:any) => s.name === r.Subject);
              if (sObj) {
                subjId = sObj.id;
                const cObj = sObj.chapters.find((c:any) => `Ch ${c.number}: ${c.title}` === r.Chapter);
                if (cObj) chapId = cObj.id;
              }
            }
            return {
              id: r._sessionId || Date.now() + Math.random(),
              subjectId: subjId,
              chapterId: chapId,
              durationMinutes: Number(r['Duration (Mins)']) || 0,
              timestamp: r._timestamp || new Date(r.Date + (r.Time ? ' ' + r.Time : '')).getTime() || Date.now(),
              type: r['Session Type'] || r.Type || 'Self Study'
            };
          }).filter((s: any) => s.chapterId);
          if (sessionsParsed.length > 0) localStorage.setItem('ascend_sessions', JSON.stringify(sessionsParsed));
        }

        const wsProgress = wb.Sheets['Syllabus Progress'];
        if (wsProgress) {
          const progressRaw = XLSX.utils.sheet_to_json(wsProgress);
          const progressParsed: Record<string, any> = {};
          progressRaw.forEach((r: any) => {
            let chapId = r._chapterId;
            if (!chapId && r.Subject && r.Chapter) {
               const sObj = Object.values(CA_FINAL_SYLLABUS).find((s:any) => s.name === r.Subject);
               if (sObj) {
                 const cObj = sObj.chapters.find((c:any) => `Ch ${c.number}: ${c.title}` === r.Chapter);
                 if (cObj) chapId = cObj.id;
               }
            }
            if (chapId) {
              progressParsed[chapId] = {
                confidence: Number(r['Confidence (Stars)']) || Number(r['Confidence Stars']) || 0,
                stars: Number(r['Confidence (Stars)']) || Number(r['Confidence Stars']) || 0,
                r1: Boolean(r.R1),
                r2: Boolean(r.R2),
                r3: Boolean(r.R3),
                completed: Boolean(r.Completed)
              };
            }
          });
          if (Object.keys(progressParsed).length > 0) localStorage.setItem('ascend_syllabus_progress', JSON.stringify(progressParsed));
        }

        const wsNotes = wb.Sheets['Notes'];
        if (wsNotes) {
          const notesRaw = XLSX.utils.sheet_to_json(wsNotes);
          const notesParsed: Record<string, string> = {};
          notesRaw.forEach((r: any) => {
            let chapId = r._chapterId;
            if (!chapId && r.Subject && r.Chapter) {
               const sObj = Object.values(CA_FINAL_SYLLABUS).find((s:any) => s.name === r.Subject);
               if (sObj) {
                 const cObj = sObj.chapters.find((c:any) => `Ch ${c.number}: ${c.title}` === r.Chapter);
                 if (cObj) chapId = cObj.id;
               }
            }
            if (chapId && r['Flashpoint Note']) notesParsed[chapId] = r['Flashpoint Note'];
          });
          if (Object.keys(notesParsed).length > 0) localStorage.setItem('ascend_chapter_notes', JSON.stringify(notesParsed));
        }

        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Error parsing Excel file. Please ensure it is a valid StudiAudit backup.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      <h2 className="text-2xl font-semibold">Settings</h2>

      {/* ── Exam Configuration ── */}
      <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#2D3A4B]">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calendar size={20} className="text-[#FF9900]" />
            Exam Configuration
          </h3>
          <p className="text-sm text-[#9CA3AF] mt-1.5">
            Set your target exam date. The dashboard countdown will automatically calculate how many days remain.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">Target Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={handleExamDateChange}
                className="bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF9900]/60 focus:ring-1 focus:ring-[#FF9900]/30 transition w-full sm:w-auto min-w-[220px]"
              />
            </div>

            {examDate && (
              <div className="flex items-center gap-4">
                <div className="bg-[#131A22] border border-[#2D3A4B] rounded-lg px-5 py-2.5">
                  <span className="text-xs text-[#9CA3AF] uppercase tracking-wider block">Countdown</span>
                  <span className="text-2xl font-semibold text-[#FF9900]">{daysUntil(examDate)}<span className="text-sm ml-1 text-[#9CA3AF]">days</span></span>
                </div>
                <button
                  onClick={clearExamDate}
                  className="p-2.5 text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  title="Clear exam date"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-[#2D3A4B]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Hour Completion Chime</h4>
                <p className="text-xs text-[#9CA3AF]">Play a subtle notification sound when an active study session crosses the hour mark.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  defaultChecked={localStorage.getItem('ascend_hour_chime_enabled') === 'true'}
                  onChange={(e) => {
                    localStorage.setItem('ascend_hour_chime_enabled', e.target.checked.toString());
                  }}
                />
                <div className="w-11 h-6 bg-[#131A22] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#9CA3AF] peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF9900] border border-[#2D3A4B] peer-checked:border-[#FF9900]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Vault & Reset Engine ── */}
      <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#2D3A4B] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Database size={20} className="text-amber-500" /> 
              Data Vault (Archived Progress)
            </h3>
            <p className="text-sm text-[#9CA3AF] mt-1.5">
              Securely store snapshots of your past preparations. Archiving resets the live dashboard so you can start fresh.
            </p>
          </div>
        </div>
        
        <div className="p-6">
          {archives.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-[#131A22] border border-[#2D3A4B] rounded-xl border-dashed">
              <Database size={24} className="text-[#4B5563] mb-2" />
              <p className="text-[#6B7280] text-sm">No archived data yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archives.map(arch => (
                <div key={arch.id} className="bg-[#131A22] border border-[#2D3A4B] p-4 rounded-xl flex items-center justify-between group hover:border-[#FF9900]/30 transition">
                  <div>
                    <h4 className="font-medium text-white">{arch.name}</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">Archived: {new Date(arch.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => exportArchive(arch)}
                    className="p-2 text-[#9CA3AF] hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition"
                    title="Export to Excel"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-[#2D3A4B]">
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium text-sm shadow-sm"
            >
              <AlertTriangle size={16} /> Archive Current Progress & Start Fresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Excel Data Management ── */}
      <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#2D3A4B]">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-emerald-500" /> 
            Excel Data Management
          </h3>
          <p className="text-sm text-[#9CA3AF] mt-1.5">
            Export your current study history to beautifully formatted Excel worksheets. 
          </p>
        </div>
        
        <div className="p-6 flex flex-col sm:flex-row items-stretch gap-6">
          <div className="flex-1 bg-[#131A22] border border-[#2D3A4B] p-6 rounded-xl flex flex-col gap-4">
            <div>
              <h4 className="font-semibold text-white mb-1">Export to Excel</h4>
              <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4">
                Save your study sessions, syllabus completion, and flashpoints as three separate worksheets in a single <code className="text-emerald-500 bg-emerald-500/10 px-1 rounded">.xlsx</code> file.
              </p>
              
              <div className="flex items-center gap-2 bg-[#1B2430] p-1 rounded-lg border border-[#2D3A4B] mb-2">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'all', label: 'All Time' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setExportRange(opt.id as any)}
                    className={`flex-1 text-[10px] font-semibold uppercase tracking-wider py-1.5 rounded-md transition ${
                      exportRange === opt.id 
                        ? 'bg-[#2D3A4B] text-white shadow-sm' 
                        : 'text-[#6B7280] hover:text-[#9CA3AF]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-[#2D3A4B]/50">
              <button 
                onClick={handleExportCurrent}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <Download size={16} /> Export Data (.xlsx)
              </button>
            </div>
          </div>

          <div className="flex-1 bg-[#131A22] border border-[#2D3A4B] p-6 rounded-xl flex flex-col gap-4">
            <div>
              <h4 className="font-semibold text-white mb-1">Restore from Excel</h4>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Upload a previously downloaded StudiAudit Excel file to restore your progress. This will overwrite current data.
              </p>
            </div>
            <div className="mt-auto pt-4 border-t border-[#2D3A4B]/50">
              <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#2D3A4B] hover:bg-[#FF9900] text-white hover:text-[#131A22] rounded-lg transition-colors font-medium text-sm shadow-sm cursor-pointer">
                <Upload size={16} /> Restore Data (.xlsx)
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Archive Confirmation Modal ── */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1B2430] border border-[#2D3A4B] rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3A4B] bg-[#131A22]/50">
              <div className="flex items-center gap-2 text-white">
                <AlertTriangle size={18} className="text-red-400" />
                <h3 className="font-semibold">Archive & Reset</h3>
              </div>
              <button 
                onClick={() => setIsArchiveModalOpen(false)} 
                className="text-[#6B7280] hover:text-white transition p-1 rounded-md hover:bg-[#2D3A4B]"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-[#9CA3AF] mb-6">
                This will save your current progress to the Data Vault and reset the entire dashboard, planner, and syllabus back to a fresh state. 
              </p>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Archive Name (e.g., First Reading Phase)</label>
                <input
                  type="text"
                  value={archiveName}
                  onChange={e => setArchiveName(e.target.value)}
                  placeholder="Enter archive name..."
                  className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF9900]/60 focus:ring-1 focus:ring-[#FF9900]/30 transition"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-[#2D3A4B] bg-[#131A22]/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#9CA3AF] hover:text-white transition"
              >
                Cancel
              </button>
              <button 
                onClick={executeArchiveAndReset}
                disabled={!archiveName.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20 hover:border-red-500"
              >
                Confirm & Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
