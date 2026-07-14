import React, { useState, useEffect, useRef } from 'react';
import { Play, Home, Bookmark, Zap, LayoutDashboard, Search, X, ChevronDown, LogIn, LogOut, Gem } from 'lucide-react';
import { ViewType, User } from '../types';

interface HeaderProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  currentUser: User | null;
  onLogout: () => void;
  onShowAuthModal: (tab: 'login' | 'register', prompt?: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  watchlistCount: number;
}

export default function Header({
  currentView,
  onChangeView,
  currentUser,
  onLogout,
  onShowAuthModal,
  searchQuery,
  onSearchChange,
  watchlistCount,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOngoingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onChangeView('home');
    setTimeout(() => {
      const ongoingSection = document.getElementById('ongoing-section');
      if (ongoingSection) {
        ongoingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const isAdminOrModerator = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Moderator');

  return (
    <header className="sticky top-0 z-50 bg-neko-dark/90 backdrop-blur-md border-b border-zinc-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo */}
        <button 
          onClick={() => onChangeView('home')} 
          className="flex items-center gap-2 group shrink-0 cursor-pointer"
        >
          <div className="relative w-9 h-9 bg-gradient-to-tr from-neko-500 to-neko-purple rounded-xl flex items-center justify-center neon-glow">
            <span className="absolute -top-1.5 -left-1 text-xs transform -rotate-12 select-none">🐱</span>
            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
          </div>
          <span className="hidden min-[400px]:inline font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-pink-100 to-neko-500 bg-clip-text text-transparent group-hover:to-neko-purple transition-all duration-300">
            NEKO<span className="text-neko-purple">NIME</span>
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <button 
            onClick={() => onChangeView('home')} 
            className={`flex items-center gap-1.5 transition cursor-pointer ${currentView === 'home' ? 'text-neko-500' : 'hover:text-neko-500'}`}
          >
            <Home className="w-4 h-4" /> Beranda
          </button>
          
          <button 
            onClick={() => onChangeView('watchlist')} 
            className={`flex items-center gap-1.5 transition relative cursor-pointer ${currentView === 'watchlist' ? 'text-neko-500' : 'hover:text-neko-500'}`}
          >
            <Bookmark className="w-4 h-4" /> Daftar Tontonan
            {watchlistCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-neko-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full scale-90">
                {watchlistCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={handleOngoingClick} 
            className="flex items-center gap-1.5 hover:text-neko-500 transition cursor-pointer"
          >
            <Zap className="w-4 h-4" /> Ongoing
          </button>
          
          {isAdminOrModerator && (
            <button 
              onClick={() => onChangeView('admin')} 
              className={`bg-zinc-900 border border-zinc-800 text-yellow-500 hover:bg-zinc-800 hover:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${currentView === 'admin' ? 'border-yellow-500/50' : ''}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Panel Admin
            </button>
          )}
        </nav>

        {/* Search Box */}
        <div className="relative flex-1 max-w-[140px] min-[400px]:max-w-[180px] sm:max-w-md mx-1 sm:mx-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari anime..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-9 sm:pl-10 pr-8 sm:pr-9 py-1.5 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-neko-500 focus:ring-1 focus:ring-neko-500 transition-all duration-200"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')} 
              className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Profile Area */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onChangeView('watchlist')} 
            className="md:hidden p-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition relative cursor-pointer"
          >
            <Bookmark className="w-4.5 h-4.5 text-zinc-300" />
            {watchlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-neko-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {watchlistCount}
              </span>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            {currentUser ? (
              <>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                  className="flex items-center gap-2 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 px-3 py-1.5 rounded-full transition active:scale-95 cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-full ${currentUser.avatarBg} flex items-center justify-center text-[10px] font-bold text-white shadow`}>
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-zinc-300 max-w-[100px] truncate">
                    {currentUser.username}
                  </span>
                  <span className="hidden sm:inline-block text-[9px] bg-neko-purple/20 text-neko-purple border border-neko-purple/30 px-1.5 py-0.5 rounded-full font-extrabold uppercase scale-90">
                    {currentUser.role === 'Standard User' ? 'User' : currentUser.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-52 bg-zinc-950 border border-zinc-800 rounded-2xl py-2 shadow-2xl z-50 animate-in fade-in duration-100">
                    <div className="px-4 py-3 border-b border-zinc-800/50 text-xs">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Role: {currentUser.role}
                      </p>
                      <p className="text-sm font-bold text-white truncate mt-0.5">{currentUser.username}</p>
                      <p className="text-zinc-400 truncate">{currentUser.email}</p>
                    </div>
                    <div className="p-1">
                      {isAdminOrModerator && (
                        <button 
                          onClick={() => { onChangeView('admin'); setDropdownOpen(false); }} 
                          className="w-full text-left px-3 py-2 text-xs text-yellow-500 hover:bg-zinc-900 rounded-lg flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Panel Admin
                        </button>
                      )}
                      <button 
                        onClick={() => { onChangeView('watchlist'); setDropdownOpen(false); }} 
                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 text-zinc-500" /> Daftar Tontonan
                      </button>
                      <button 
                        onClick={() => { alert("Hubungi admin/pengelola untuk promo premium ini atau gunakan Panel Admin!"); setDropdownOpen(false); }} 
                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <Gem className="w-4 h-4 text-neko-500 animate-pulse" /> Nikmati Bebas Iklan
                      </button>
                      <div className="border-t border-zinc-800/50 my-1"></div>
                      <button 
                        onClick={() => { onLogout(); setDropdownOpen(false); }} 
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button 
                onClick={() => onShowAuthModal('login')} 
                className="px-3 py-1.5 sm:px-4 bg-gradient-to-r from-neko-500 to-neko-purple hover:opacity-95 text-white text-xs font-bold rounded-full shadow-lg transition transform active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden min-[380px]:inline">Masuk Akun</span>
                <span className="inline min-[380px]:hidden">Masuk</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
