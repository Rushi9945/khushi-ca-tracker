import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from './supabaseClient';

export const Auth = ({ onLogin }: { onLogin: (name: string, userId: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetExam, setTargetExam] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if already logged in on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Fetch profile to get name
        supabase.from('profiles').select('full_name').eq('user_id', session.user.id).single()
          .then(({ data }) => {
            onLogin(data?.full_name || 'Student', session.user.id);
          });
      } else {
        setIsChecking(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        supabase.from('profiles').select('full_name').eq('user_id', session.user.id).single()
          .then(({ data }) => {
            onLogin(data?.full_name || 'Student', session.user.id);
          });
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [onLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        // SIGNUP
        if (!fullName || !targetExam) throw new Error('Please fill out all fields.');
        
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        if (data.user) {
          // Create profile record
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: data.user.id,
            full_name: fullName,
            target_exam: targetExam
          });
          if (profileError) throw profileError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1B2430] to-[#0B0F19]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            StudiAudit<span className="text-[#FF9900]">.</span>
          </h1>
          <p className="text-sm text-slate-400">
            {isLogin ? 'Log in to your CA Final dashboard' : 'Create your free account'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Khushi Soni"
                  className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF9900] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Exam</label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={e => setTargetExam(e.target.value)}
                  placeholder="e.g. Nov 2026"
                  className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF9900] transition"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="student@icai.org"
              className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF9900] transition"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF9900] transition"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-4 bg-gradient-to-r from-[#FF6B00] to-[#FF9900] hover:from-[#FF8533] hover:to-[#FFAD33] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Unlock Dashboard' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-xs text-[#9CA3AF] hover:text-white transition"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
