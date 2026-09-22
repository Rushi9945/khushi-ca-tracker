import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
export type SessionType = 'Lecture' | 'Self Study' | 'Revision';

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number; // in milliseconds
  activeSubject: any | null;
  activeChapter: any | null;
  sessionType: SessionType | null;
}

interface TimerContextValue extends TimerState {
  startTimer: (subject: any, chapter: any, type: SessionType) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndSaveSession: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    activeSubject: null,
    activeChapter: null,
    sessionType: null,
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ascend_active_timer');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isRunning && parsed.startTime) {
        // Calculate drift to keep time accurate even if tab was closed
        const now = Date.now();
        const drift = now - parsed.startTime;
        setState({
          ...parsed,
          startTime: now,
          elapsedTime: parsed.elapsedTime + drift
        });
      } else {
        setState(parsed);
      }
    }
  }, []);

  // Save to localStorage whenever state changes significantly
  useEffect(() => {
    if (state.activeChapter) {
      localStorage.setItem('ascend_active_timer', JSON.stringify(state));
    } else {
      localStorage.removeItem('ascend_active_timer');
    }
  }, [state]);

  // Tick the timer every second if running
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newElapsed = prev.elapsedTime + 1000;
          const currentHourMark = Math.floor(newElapsed / 3600000);
          const prevHourMark = Math.floor(prev.elapsedTime / 3600000);

          if (currentHourMark > prevHourMark && currentHourMark > 0) {
            // Play hourly chime
            const chimeEnabled = localStorage.getItem('ascend_hour_chime_enabled') === 'true';
            if (chimeEnabled) {
              try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) {
                  const ctx = new AudioCtx();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(880, ctx.currentTime);
                  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
                  
                  gain.gain.setValueAtTime(0.3, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
                  
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  
                  osc.start();
                  osc.stop(ctx.currentTime + 1.5);
                }
              } catch (e) {
                console.error("Audio chime failed", e);
              }
            }
          }

          return {
            ...prev,
            elapsedTime: newElapsed
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isRunning]);

  const startTimer = (subject: any, chapter: any, type: SessionType) => {
    setState({
      isRunning: true,
      startTime: Date.now(),
      elapsedTime: 0,
      activeSubject: subject,
      activeChapter: chapter,
      sessionType: type
    });
  };

  const pauseTimer = () => {
    setState(prev => ({ ...prev, isRunning: false, startTime: null }));
  };

  const resumeTimer = () => {
    setState(prev => ({ ...prev, isRunning: true, startTime: Date.now() }));
  };

  const stopAndSaveSession = async () => {
    if (!state.activeChapter) return;
    
    // Require at least 1 minute to save properly, or floor it.
    const durationMinutes = Math.max(1, Math.floor(state.elapsedTime / 60000));
    const timestamp = Date.now();
    const sessionType = state.sessionType;
    const subjectId = state.activeSubject?.id;
    const chapterId = state.activeChapter.id;
    
    // Reset state immediately so UI feels responsive
    setState({
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      activeSubject: null,
      activeChapter: null,
      sessionType: null
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active auth session");

      const { error } = await supabase.from('study_sessions').insert({
        user_id: session.user.id,
        subject_id: subjectId,
        chapter_id: chapterId,
        duration_minutes: durationMinutes,
        session_type: sessionType,
        session_timestamp: timestamp
      });

      if (error) throw error;
      
      // Dispatch custom event so other components (like Dashboard) fetch fresh data
      window.dispatchEvent(new Event('sessionSaved'));
    } catch (e: any) {
      console.error("Failed to save session to Supabase:", e);
      alert("Error saving session to cloud: " + (e.message || JSON.stringify(e)));
      // Fallback: Optional locally cache it if offline, omitted for simplicity
    }
  };

  return (
    <TimerContext.Provider value={{ ...state, startTimer, pauseTimer, resumeTimer, stopAndSaveSession }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within a TimerProvider');
  return context;
};
