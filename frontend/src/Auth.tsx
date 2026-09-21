import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const Auth = ({ onLogin }: { onLogin: (name: string) => void }) => {
  const [profile, setProfile] = useState<{ name: string; targetExam: string; passcode: string } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Setup state
  const [name, setName] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [setupPasscode, setSetupPasscode] = useState('');
  
  // Login state
  const [loginPasscode, setLoginPasscode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('app_user_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    setIsChecking(false);
  }, []);

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetExam || !setupPasscode) {
      setError('Please fill out all fields.');
      return;
    }
    const newProfile = { name, targetExam, passcode: setupPasscode };
    localStorage.setItem('app_user_profile', JSON.stringify(newProfile));
    setProfile(newProfile);
    onLogin(newProfile.name);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile && loginPasscode === profile.passcode) {
      onLogin(profile.name);
    } else {
      setError('Incorrect passcode.');
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
            {!profile ? 'Set up your local profile to begin.' : `Welcome back, ${profile.name.split(' ')[0]}`}
          </p>
        </div>

        {!profile ? (
          <form onSubmit={handleSetup} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Khushi Soni"
                className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Exam</label>
              <input
                type="text"
                value={targetExam}
                onChange={e => setTargetExam(e.target.value)}
                placeholder="e.g. Nov 2026"
                className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Create Passcode</label>
              <input
                type="password"
                value={setupPasscode}
                onChange={e => setSetupPasscode(e.target.value)}
                placeholder="••••"
                className="w-full bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] transition"
              />
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              className="w-full py-3.5 mt-4 bg-gradient-to-r from-[#FF6B00] to-[#FF9900] hover:from-[#FF8533] hover:to-[#FFAD33] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all"
            >
              Create Local Vault
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">Enter Passcode</label>
              <input
                type="password"
                value={loginPasscode}
                onChange={e => setLoginPasscode(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full text-center tracking-[0.5em] text-xl bg-[#131A22] border border-[#2D3A4B] rounded-lg px-4 py-4 text-white focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] transition"
              />
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#FF9900] hover:from-[#FF8533] hover:to-[#FFAD33] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all"
            >
              Unlock Dashboard
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
