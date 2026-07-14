import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Sparkles, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => void;
  onRegister: (username: string, email: string, pass: string) => void;
  onGoogleLogin: () => void;
  initialTab?: 'login' | 'register';
  customPrompt?: string | null;
}

export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onGoogleLogin,
  initialTab = 'login',
  customPrompt = null,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginEmail, loginPassword);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(regUsername, regEmail, regPassword);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transform scale-100 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-gradient-to-tr from-neko-500 to-neko-purple rounded-2xl items-center justify-center neon-glow mx-auto mb-1">
            <span className="text-lg select-none">🐱</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
            {activeTab === 'login' ? 'Masuk ke Nekonime' : 'Daftar Baru Wibu'}
          </h2>
          
          {customPrompt ? (
            <div className="text-xs text-neko-500 font-semibold px-2 py-1 bg-neko-500/10 border border-neko-500/20 rounded-lg inline-block select-none">
              {customPrompt}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              Masuk untuk menyimpan watchlist, memberi rating, & berdiskusi bersama Wibu lainnya.
            </p>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800/80">
          <button 
            type="button"
            onClick={() => setActiveTab('login')} 
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'login' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Masuk Akun
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('register')} 
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'register' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Forms */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-400">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  required 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@email.com" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 focus:outline-none focus:border-neko-500"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-400">Kata Sandi</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  required 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan kata sandi" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 focus:outline-none focus:border-neko-500"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2.5 bg-gradient-to-r from-neko-500 to-neko-purple hover:opacity-95 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Masuk Sekarang <ArrowRight className="w-4 h-4" />
            </button>
            

          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-400">Nama Pengguna (Wibu Name)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <User className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  required 
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Contoh: OtakuNeko" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 focus:outline-none focus:border-neko-500"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-400">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  required 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="nama@email.com" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 focus:outline-none focus:border-neko-500"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-400">Kata Sandi</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  required 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Sandi minimal 6 karakter" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 focus:outline-none focus:border-neko-500"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2.5 bg-gradient-to-r from-neko-purple to-neko-500 hover:opacity-95 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Daftar Baru <Sparkles className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-800/80"></div>
          <span className="flex-shrink mx-4 text-[10px] text-zinc-500 font-bold tracking-widest uppercase">ATAU</span>
          <div className="flex-grow border-t border-zinc-800/80"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={onGoogleLogin}
          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 hover:text-white font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
        >
          <Chrome className="w-4 h-4 text-red-500" />
          Masuk dengan Google
        </button>
      </div>
    </div>
  );
}
