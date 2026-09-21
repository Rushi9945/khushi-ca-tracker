import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Sparkles, Send, Activity, BookOpen, Target, BrainCircuit } from 'lucide-react';
import { CA_FINAL_SYLLABUS } from './data/caFinalSyllabus';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const AiStudyManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getStudentContext = () => {
    // 1. Name
    let userName = 'Khushi';
    try {
      const profile = JSON.parse(localStorage.getItem('app_user_profile') || '{}');
      if (profile.name) userName = profile.name.split(' ')[0];
    } catch {}

    // 2. Exam Date
    const examDateStr = localStorage.getItem('ascend_exam_date');
    let daysToExam = 'Unknown';
    if (examDateStr) {
      const target = new Date(examDateStr);
      const now = new Date();
      now.setHours(0,0,0,0); target.setHours(0,0,0,0);
      daysToExam = String(Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000)));
    }

    // 3. Today's Hours & Pacing
    const sessions = JSON.parse(localStorage.getItem('ascend_sessions') || '[]');
    const todayStr = new Date().toDateString();
    const todayMins = sessions
      .filter((s:any) => new Date(s.timestamp).toDateString() === todayStr)
      .reduce((a:number, s:any) => a + s.durationMinutes, 0);
    const todayHours = todayMins / 60;
    
    const now = new Date();
    const currentHour = now.getHours() + (now.getMinutes() / 60);
    const expected = Math.max(0, Math.min(12, (currentHour - 7) * (12 / 15)));
    let pacing = todayHours >= expected ? `Ahead of pace (+${(todayHours - expected).toFixed(1)}h)` : `Behind pace by ${(expected - todayHours).toFixed(1)}h`;

    // 4. Neglected Subjects
    const sevenDaysAgo = Date.now() - (7 * 86400000);
    const last7Sessions = sessions.filter((s:any) => s.timestamp >= sevenDaysAgo);
    const subHours: Record<string, number> = {};
    Object.values(CA_FINAL_SYLLABUS).forEach((s:any) => subHours[s.id] = 0);
    last7Sessions.forEach((s:any) => {
      if (subHours[s.subjectId] !== undefined) subHours[s.subjectId] += s.durationMinutes;
    });
    const sortedSubs = Object.entries(subHours).sort((a,b) => a[1] - b[1]);
    const neglected = sortedSubs.slice(0, 2).map(s => s[0].toUpperCase()).join(', ');

    return `Name: ${userName}
Exam: CA Final (Days Left: ${daysToExam})
Today's Logged Hours: ${todayHours.toFixed(1)}h / 12.0h Goal
Pace Status: ${pacing}
Most Neglected Subjects (7 Days): ${neglected}
Keep responses extremely concise, punchy, and highly practical. Focus strictly on CA Final clearing strategies.`;
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let userName = 'Khushi';
      try {
        const profile = JSON.parse(localStorage.getItem('app_user_profile') || '{}');
        if (profile.name) userName = profile.name.split(' ')[0];
      } catch {}
      setMessages([{
        role: 'assistant',
        text: `Hey ${userName}, I'm your AI Study Manager. I've got your live study metrics right here. What do you need help with right now?`
      }]);
    }
  }, [isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const apiKey = localStorage.getItem('ascend_gemini_api_key');

    if (!apiKey) {
      // Fallback Engine
      setTimeout(() => {
        let fallbackText = "Please set your Gemini API Key in Settings to unlock real AI. Based on my local rules engine: ";
        if (userMsg.includes("12h")) fallbackText += "You have a fixed 12h goal. Check the pacing tracker on the dashboard.";
        else if (userMsg.includes("Study Next")) fallbackText += "Focus on your most neglected subject from the last 7 days.";
        else fallbackText += "Keep grinding! CA Final is tough but you've got this.";
        
        setMessages(prev => [...prev, { role: 'assistant', text: fallbackText }]);
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      const context = getStudentContext();
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: "You are an empathetic, disciplined CA Final study coach. Context: \n" + context } },
          contents: [
            ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
            { role: "user", parts: [{ text: userMsg }] }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `API Error: ${e.message || "Failed to fetch"}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const chips = [
    { label: "Analyze Today's 12h Pace", icon: <Activity size={14} />, prompt: "Analyze Today's 12h Pace" },
    { label: "What Should I Study Next?", icon: <BookOpen size={14} />, prompt: "What Should I Study Next?" },
    { label: "Quick Exam Pep Talk", icon: <Target size={14} />, prompt: "Quick Exam Pep Talk" }
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#1B2430] border border-[#2D3A4B] text-[#FF9900] p-4 rounded-full shadow-[0_4px_20px_rgba(255,153,0,0.15)] hover:shadow-[0_4px_25px_rgba(255,153,0,0.3)] transition-all duration-300 hover:scale-105 group"
      >
        <div className="absolute inset-0 rounded-full border border-[#FF9900]/30 animate-[ping_3s_ease-in-out_infinite] pointer-events-none" />
        <BrainCircuit size={24} className="group-hover:animate-pulse" />
      </button>

      {/* Slide-over Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#131A22] h-full flex flex-col border-l border-[#2D3A4B] shadow-2xl animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#2D3A4B] bg-[#1B2430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF9900]/10 flex items-center justify-center border border-[#FF9900]/30">
                  <Bot size={18} className="text-[#FF9900]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white tracking-tight leading-none mb-1">Ascend AI Mentor</h3>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Khushi's Study Desk</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#6B7280] hover:text-white transition p-1">
                <X size={20} />
              </button>
            </div>

            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-br from-[#FF9900] to-[#FF6B00] text-white rounded-br-none' 
                      : 'bg-[#1B2430] border border-[#2D3A4B] text-[#E5E7EB] rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#1B2430] border border-[#2D3A4B] rounded-bl-none flex items-center gap-2">
                    <Sparkles size={14} className="text-[#FF9900] animate-pulse" />
                    <span className="text-sm text-[#9CA3AF] animate-pulse">Analyzing context...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Chips */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto border-t border-[#2D3A4B]/50 shrink-0 no-scrollbar">
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full border border-[#2D3A4B] bg-[#1B2430] hover:bg-[#232F3E] hover:border-[#FF9900]/40 text-xs font-medium text-[#9CA3AF] hover:text-white transition-colors"
                >
                  {chip.icon} {chip.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-[#1B2430] border-t border-[#2D3A4B] shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder="Ask your AI coach..."
                  className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[#FF9900]/60 transition"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 p-1.5 text-[#FF9900] hover:bg-[#FF9900]/10 rounded-lg transition disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
