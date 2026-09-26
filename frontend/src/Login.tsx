import React, { useState } from 'react';

interface LoginProps {
  onLogin: (name: string, gender: string, phone: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name, gender, phone);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#06080C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#06080C] to-[#06080C] p-6 z-50 fixed inset-0">
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <span className="text-2xl font-black text-amber-500">SA</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to StudiAudit</h1>
          <p className="text-slate-400 text-sm mt-2">CA Final Preparation Workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#0B0F19] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
              placeholder="Enter your name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
            <div className="flex items-center gap-3">
              {['Male', 'Female', 'Other'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    gender === g 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                      : 'bg-[#0B0F19] border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-[#0B0F19] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
              placeholder="+91"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg py-3.5 rounded-xl mt-4 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          >
            Enter Workspace
          </button>
        </form>
      </div>
    </div>
  );
};
