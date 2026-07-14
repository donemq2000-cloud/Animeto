import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Star, Bookmark, Frown, MessageSquare, ThumbsUp, 
  SkipBack, SkipForward, Heart, Info, Check, AlertTriangle, X, Play,
  Home, Zap, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Core imports
import { Anime, User, SystemSettings, ViewType, Comment } from './types';
import { 
  ALL_GENRES, INITIAL_ANIME_DATABASE, DEFAULT_USERS, 
  INITIAL_SYSTEM_SETTINGS, getInitialData, saveToStorage 
} from './data';
import {
  auth,
  seedDatabaseIfEmpty,
  getAnimes,
  saveAnime,
  deleteAnime,
  addAnimeComment,
  getUserByEmail,
  saveUser,
  getAllUsers,
  getSystemSettings,
  saveSystemSettings,
  signInWithGoogle,
  loginWithEmailPassword,
  registerWithEmailPassword,
  logoutUser
} from './lib/firebase';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import HeroSlider from './components/HeroSlider';
import AnimeCard from './components/AnimeCard';
import VideoPlayer from './components/VideoPlayer';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import LegalPages from './components/LegalPages';

interface CommentItemProps {
  comment: Comment;
}

function CommentItem({ comment }: CommentItemProps) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  return (
    <div className="flex gap-3 text-xs pt-4 first:pt-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm text-[10px] select-none ${comment.avatarBg || 'bg-zinc-700'}`}>
        {comment.name.charAt(0).toUpperCase()}
      </div>
      
      <div className="space-y-1 flex-grow">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-200">{comment.name}</span>
          <span className="text-[10px] text-zinc-600">{comment.date}</span>
        </div>
        
        {comment.spoiler ? (
          <div className="space-y-1.5">
            <span className="inline-block bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded select-none">
              ⚠️ SPOILER WARNING
            </span>
            
            {showSpoiler ? (
              <p className="text-zinc-300 leading-relaxed bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
                {comment.text}
              </p>
            ) : (
              <p 
                onClick={() => setShowSpoiler(true)}
                className="blur-sm hover:blur-0 select-none cursor-pointer text-zinc-500 transition duration-300 p-2 rounded-lg border border-dashed border-zinc-800"
                title="Klik untuk melihat isi pesan spoiler"
              >
                {comment.text}
              </p>
            )}
          </div>
        ) : (
          <p className="text-zinc-300 leading-relaxed">{comment.text}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  // --- States ---
  const [animeList, setAnimeList] = useState<Anime[]>(() => 
    getInitialData<Anime[]>('nekonime_anime_db', INITIAL_ANIME_DATABASE)
  );
  
  const [users, setUsers] = useState<User[]>(() => 
    getInitialData<User[]>('nekonime_users', DEFAULT_USERS)
  );
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => 
    getInitialData<User | null>('nekonime_session', null)
  );
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => 
    getInitialData<SystemSettings>('nekonime_system', INITIAL_SYSTEM_SETTINGS)
  );

  const [dbLoading, setDbLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [view, setView] = useState<ViewType>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Semua');
  const [sortBy, setSortBy] = useState<'latest' | 'rating' | 'popular'>('latest');
  
  // Active watch states
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSpoiler, setCommentSpoiler] = useState(false);
  const [popunderTriggered, setPopunderTriggered] = useState<Record<string, boolean>>({});

  // Toast System
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'watchlist-add' | 'watchlist-remove'; message: string } | null>(null);

  // Auth Modals State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);

  // --- Effects ---

  // Initialize and load Firebase Firestore Database
  useEffect(() => {
    async function initAndFetchDatabase() {
      try {
        setDbLoading(true);
        // Ensure seeding has occurred
        await seedDatabaseIfEmpty();

        // Fetch latest records from Firestore
        const [animesData, usersData, settingsData] = await Promise.all([
          getAnimes(),
          getAllUsers(),
          getSystemSettings()
        ]);

        if (animesData && animesData.length > 0) {
          setAnimeList(animesData);
        }
        if (usersData && usersData.length > 0) {
          setUsers(usersData);
        }
        if (settingsData) {
          setSystemSettings(settingsData);
        }
      } catch (err) {
        console.error('Failed to load data from Firebase Firestore:', err);
      } finally {
        setDbLoading(false);
      }
    }
    initAndFetchDatabase();
  }, []);

  // Auth state synchronization with Firebase Auth persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        try {
          const emailKey = firebaseUser.email.toLowerCase().trim();
          const syncedProfile = await getUserByEmail(emailKey);
          if (syncedProfile) {
            const isSpecialAdmin = emailKey === 'donemq2000@gmail.com' || emailKey === 'admin@nekonime.com';
            if (isSpecialAdmin && syncedProfile.role !== 'Admin') {
              syncedProfile.role = 'Admin';
              await saveUser(syncedProfile);
            }
            setCurrentUser(syncedProfile);
            saveToStorage('nekonime_session', syncedProfile);
          } else {
            const isSpecialAdmin = emailKey === 'donemq2000@gmail.com' || emailKey === 'admin@nekonime.com';
            const fallbackProfile: User = {
              email: emailKey,
              username: firebaseUser.displayName || emailKey.split('@')[0],
              avatarBg: 'bg-indigo-600',
              role: isSpecialAdmin ? 'Admin' : 'Standard User',
              isBlocked: false
            };
            await saveUser(fallbackProfile);
            setCurrentUser(fallbackProfile);
            saveToStorage('nekonime_session', fallbackProfile);
          }
        } catch (err) {
          console.error('[Firebase Auth Sync] Error syncing user details:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Sync page title with system configurations
  useEffect(() => {
    document.title = systemSettings.metaTitle;
  }, [systemSettings.metaTitle]);

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  // Load User Specific Watchlist
  useEffect(() => {
    if (currentUser) {
      const key = `watchlist_${currentUser.email}`;
      const saved = localStorage.getItem(key);
      setWatchlist(saved ? JSON.parse(saved) : []);
    } else {
      const saved = sessionStorage.getItem('nekonime_watchlist');
      setWatchlist(saved ? JSON.parse(saved) : []);
    }
  }, [currentUser]);

  // Toast Auto Dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Actions & Helpers ---
  const triggerToast = (type: 'success' | 'error' | 'watchlist-add' | 'watchlist-remove', message: string) => {
    setToast({ type, message });
  };

  const saveWatchlist = (updatedList: string[]) => {
    setWatchlist(updatedList);
    if (currentUser) {
      localStorage.setItem(`watchlist_${currentUser.email}`, JSON.stringify(updatedList));
    } else {
      sessionStorage.setItem('nekonime_watchlist', JSON.stringify(updatedList));
    }
  };

  const handleToggleWatchlist = (animeId: string, e?: any) => {
    if (e) e.stopPropagation();
    
    if (!currentUser) {
      setAuthTab('login');
      setAuthPrompt('⚠️ Masuk akun terlebih dahulu untuk menyimpan watchlist.');
      setIsAuthOpen(true);
      return;
    }

    const index = watchlist.indexOf(animeId);
    let updated = [...watchlist];
    if (index > -1) {
      updated.splice(index, 1);
      triggerToast('watchlist-remove', 'Dihapus dari daftar tontonan');
    } else {
      updated.push(animeId);
      triggerToast('watchlist-add', 'Ditambahkan ke daftar tontonan!');
    }
    saveWatchlist(updated);
  };

  const handleWatchNow = (animeId: string, episodeNum: number = 1) => {
    const anime = animeList.find(a => a.id === animeId);
    if (anime) {
      // Ads Popunder Trigger Logic for Standard/Guest users
      const userIsPremium = currentUser && currentUser.role === 'Premium';
      if (systemSettings.showPopunderAd && !userIsPremium && !popunderTriggered[animeId]) {
        setPopunderTriggered(prev => ({ ...prev, [animeId]: true }));
        setTimeout(() => {
          triggerToast('error', '⚠️ Pop-under Ad: Sponsor dibuka dibelakang! Upgrade Premium untuk bebas iklan.');
        }, 1000);
      }

      setSelectedAnime(anime);
      setCurrentEpisode(episodeNum);
      setUserRating(null); // Reset visual rating score selection
      setView('watch');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogin = (email: string, pass: string) => {
    loginWithEmailPassword(email, pass).then((foundUser) => {
      // Update local state users list if needed
      setUsers(prev => {
        const alreadyExists = prev.some(u => u.email.toLowerCase() === foundUser.email.toLowerCase());
        if (!alreadyExists) {
          return [...prev, foundUser];
        }
        return prev.map(u => u.email.toLowerCase() === foundUser.email.toLowerCase() ? foundUser : u);
      });

      setCurrentUser(foundUser);
      saveToStorage('nekonime_session', foundUser);
      setIsAuthOpen(false);
      setAuthPrompt(null);
      triggerToast('success', `Selamat datang kembali, ${foundUser.username}!`);
    }).catch((err) => {
      console.error('Firebase Auth email sign-in failed:', err);
      triggerToast('error', err.message || 'Alamat email atau kata sandi salah, atau gagal menghubungkan ke Firebase!');
    });
  };

  const handleRegister = (username: string, email: string, pass: string) => {
    if (pass.length < 6) {
      triggerToast('error', 'Kata sandi minimal harus berisi 6 karakter!');
      return;
    }

    registerWithEmailPassword(username, email, pass).then((newUser) => {
      const updatedUsers = [...users.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase()), newUser];
      setUsers(updatedUsers);
      saveToStorage('nekonime_users', updatedUsers);

      setCurrentUser(newUser);
      saveToStorage('nekonime_session', newUser);
      setIsAuthOpen(false);
      setAuthPrompt(null);
      triggerToast('success', `Registrasi berhasil! Selamat bergabung, ${newUser.username}!`);
    }).catch(err => {
      console.error('Firebase Auth registration failed:', err);
      triggerToast('error', err.message || 'Gagal mendaftarkan akun ke database Cloud!');
    });
  };

  const handleGoogleLogin = () => {
    signInWithGoogle().then((googleUser) => {
      // Add user to local users list if not present
      setUsers(prev => {
        const alreadyExists = prev.some(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
        if (!alreadyExists) {
          return [...prev, googleUser];
        }
        return prev.map(u => u.email.toLowerCase() === googleUser.email.toLowerCase() ? googleUser : u);
      });
      
      setCurrentUser(googleUser);
      saveToStorage('nekonime_session', googleUser);
      setIsAuthOpen(false);
      setAuthPrompt(null);
      triggerToast('success', `Masuk berhasil! Selamat datang, ${googleUser.username}!`);
    }).catch((err) => {
      console.error('Google Sign-In failed:', err);
      triggerToast('error', err.message || 'Gagal masuk menggunakan Google!');
    });
  };

  const handleLogout = () => {
    logoutUser().then(() => {
      localStorage.removeItem('nekonime_session');
      setCurrentUser(null);
      setView('home');
      triggerToast('watchlist-remove', 'Sesi Anda telah berakhir.');
    }).catch(err => {
      console.error('Logout failed:', err);
    });
  };

  // --- CMS Admin Actions ---
  const handleAddAnime = (newAnime: Anime) => {
    saveAnime(newAnime).then(() => {
      const updated = [...animeList, newAnime];
      setAnimeList(updated);
      saveToStorage('nekonime_anime_db', updated);
      triggerToast('success', 'Berhasil menambahkan anime baru ke database!');
    }).catch(err => {
      console.error('Firebase saveAnime failed:', err);
      triggerToast('error', 'Gagal menyimpan anime ke database Cloud.');
    });
  };

  const handleEditAnime = (editedAnime: Anime) => {
    saveAnime(editedAnime).then(() => {
      const updated = animeList.map(a => a.id === editedAnime.id ? editedAnime : a);
      setAnimeList(updated);
      saveToStorage('nekonime_anime_db', updated);
      if (selectedAnime && selectedAnime.id === editedAnime.id) {
        setSelectedAnime(editedAnime);
      }
      triggerToast('success', 'Rincian data anime berhasil diperbarui!');
    }).catch(err => {
      console.error('Firebase saveAnime failed:', err);
      triggerToast('error', 'Gagal memperbarui rincian anime di database Cloud.');
    });
  };

  const handleDeleteAnime = (id: string) => {
    deleteAnime(id).then(() => {
      const updated = animeList.filter(a => a.id !== id);
      setAnimeList(updated);
      saveToStorage('nekonime_anime_db', updated);
      triggerToast('watchlist-remove', 'Anime berhasil dihapus dari database.');
    }).catch(err => {
      console.error('Firebase deleteAnime failed:', err);
      triggerToast('error', 'Gagal menghapus anime dari database Cloud.');
    });
  };

  const handleChangeUserRole = (email: string, role: User['role']) => {
    const targetUser = users.find(u => u.email === email);
    if (!targetUser) return;
    const updatedUser = { ...targetUser, role };
    saveUser(updatedUser).then(() => {
      const updated = users.map(u => u.email === email ? updatedUser : u);
      setUsers(updated);
      saveToStorage('nekonime_users', updated);

      // If current logged-in user got their role changed, update their active session too
      if (currentUser && currentUser.email === email) {
        const updatedSession = { ...currentUser, role };
        setCurrentUser(updatedSession);
        saveToStorage('nekonime_session', updatedSession);
      }
      triggerToast('success', `Role pengguna berhasil diubah ke ${role}`);
    }).catch(err => {
      console.error('Firebase saveUser failed:', err);
      triggerToast('error', 'Gagal memperbarui peran pengguna di database Cloud.');
    });
  };

  const handleToggleUserBan = (email: string) => {
    if (currentUser && currentUser.email === email) {
      triggerToast('error', 'Anda tidak dapat memblokir akun Anda sendiri!');
      return;
    }

    const targetUser = users.find(u => u.email === email);
    if (!targetUser) return;
    const updatedUser = { ...targetUser, isBlocked: !targetUser.isBlocked };
    saveUser(updatedUser).then(() => {
      const updated = users.map(u => u.email === email ? updatedUser : u);
      setUsers(updated);
      saveToStorage('nekonime_users', updated);
      triggerToast('success', 'Status pembatasan akses pengguna telah diubah.');
    }).catch(err => {
      console.error('Firebase saveUser failed:', err);
      triggerToast('error', 'Gagal mengubah status blokir pengguna di database Cloud.');
    });
  };

  const handleSaveSystemSettings = (newSettings: SystemSettings) => {
    saveSystemSettings(newSettings).then(() => {
      setSystemSettings(newSettings);
      saveToStorage('nekonime_system', newSettings);
      triggerToast('success', 'Konfigurasi sistem berhasil diperbarui.');
    }).catch(err => {
      console.error('Firebase saveSystemSettings failed:', err);
      triggerToast('error', 'Gagal menyimpan konfigurasi sistem di database Cloud.');
    });
  };

  // --- Comments Actions ---
  const handleSubmitComment = () => {
    if (!currentUser) {
      setAuthTab('login');
      setAuthPrompt('⚠️ Silakan masuk akun terlebih dahulu untuk mengirim komentar.');
      setIsAuthOpen(true);
      return;
    }

    if (!commentText.trim()) {
      triggerToast('error', 'Komentar tidak boleh kosong!');
      return;
    }

    const newComment: Comment = {
      name: currentUser.username,
      avatarBg: currentUser.avatarBg,
      text: commentText.trim(),
      date: 'Baru saja',
      spoiler: commentSpoiler
    };

    if (selectedAnime) {
      const activeComments = selectedAnime.comments || [];
      const updatedComments = [newComment, ...activeComments];
      const updatedAnime = { ...selectedAnime, comments: updatedComments };

      setSelectedAnime(updatedAnime);

      const updatedDatabase = animeList.map(a => a.id === selectedAnime.id ? updatedAnime : a);
      setAnimeList(updatedDatabase);
      saveToStorage('nekonime_anime_db', updatedDatabase);

      addAnimeComment(selectedAnime.id, newComment).catch(err => {
        console.error('Failed to save comment to Firestore:', err);
      });

      setCommentText('');
      setCommentSpoiler(false);
      triggerToast('success', 'Komentar Anda berhasil dipublikasikan!');
    }
  };

  const handleRateAnime = (score: number) => {
    if (!currentUser) {
      setAuthTab('login');
      setAuthPrompt('⚠️ Silakan masuk akun terlebih dahulu untuk memberikan rating.');
      setIsAuthOpen(true);
      return;
    }
    setUserRating(score);
    triggerToast('success', `Penilaian berhasil dikirim: ${score}/5 Bintang!`);
  };

  // --- Filtering & Sorting Lists ---
  const getProcessedAnime = () => {
    let list = [...animeList];

    // Filter Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.genres.some(g => g.toLowerCase().includes(q))
      );
    }

    // Filter Category
    if (selectedGenre !== 'Semua') {
      list = list.filter(a => a.genres.includes(selectedGenre));
    }

    // Sort By Selection
    if (sortBy === 'rating') {
      list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    } else if (sortBy === 'popular') {
      list = list.filter(a => a.isPopular).concat(list.filter(a => !a.isPopular));
    } else {
      // 'latest' default order
      // (Custom manual list entries go to top)
      list.sort((a, b) => {
        if (a.id.startsWith('custom-') && !b.id.startsWith('custom-')) return -1;
        if (!a.id.startsWith('custom-') && b.id.startsWith('custom-')) return 1;
        return 0;
      });
    }

    return list;
  };

  const processedList = getProcessedAnime();
  const watchlistItems = animeList.filter(a => watchlist.includes(a.id));

  // Recommendation filtering in detail watch view
  const recommendationList = selectedAnime 
    ? animeList.filter(a => a.id !== selectedAnime.id).slice(0, 4) 
    : [];

  // Maintenance overlay gate
  const userIsAdmin = currentUser && currentUser.role === 'Admin';
  const showMaintenanceMode = systemSettings.maintenanceMode === 'true' && !userIsAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-neko-dark text-zinc-100 selection:bg-neko-500 selection:text-white">
      
      {/* ⏳ Firebase Cloud Database Loading State */}
      {dbLoading && (
        <div className="fixed inset-0 bg-[#09090b] z-[100] flex flex-col items-center justify-center p-6 text-center select-none animate-pulse">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-neko-500/20 border-t-neko-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-neko-500">🐱</span>
            </div>
          </div>
          <h2 className="text-xl font-display font-black text-white tracking-wide mb-1">Nekonime Cloud</h2>
          <p className="text-xs text-zinc-500 font-medium tracking-wide animate-pulse">
            Menghubungkan & sinkronisasi basis data Cloud Firestore...
          </p>
        </div>
      )}

      {/* ⚠️ Maintenance overlay if active */}
      {showMaintenanceMode && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-6 border border-yellow-500/20 shadow-inner">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight mb-2">Situs Sedang Pemeliharaan</h1>
          <p className="text-sm text-zinc-400 max-w-md leading-relaxed mb-6">
            Website Nekonime sedang dalam proses pembaharuan server sistem oleh pengelola. Silakan kembali dalam beberapa waktu!
          </p>
          <div className="border border-zinc-800 p-4 rounded-2xl bg-zinc-900/40 text-xs text-zinc-500 max-w-sm">
            <span>Memiliki hak administrator?</span>
            <button 
              onClick={() => {
                setAuthTab('login');
                setAuthPrompt('Masuk akun Admin untuk bypass maintenance ini.');
                setIsAuthOpen(true);
              }}
              className="ml-2 font-bold text-neko-500 hover:underline cursor-pointer"
            >
              Masuk Admin
            </button>
          </div>
        </div>
      )}

      {/* TOP BANNER ADVERTISEMENT */}
      {systemSettings.showBannerAd && (!currentUser || currentUser.role !== 'Premium') && (
        <div className="bg-gradient-to-r from-neko-purple/20 via-neko-500/20 to-neko-purple/20 border-b border-zinc-800 text-center py-2 px-4 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-zinc-300">
              🎉 Nekonime Premium diskon 50%! Nikmati kebebasan menonton tanpa iklan popup & akses server premium.
            </span>
            <div className="flex items-center gap-3 shrink-0 select-none">
              <button 
                onClick={() => {
                  alert("Hubungi admin/pengelola untuk promo premium ini atau gunakan Panel Admin!");
                }}
                className="text-neko-500 font-bold hover:underline cursor-pointer"
              >
                Daftar Premium
              </button>
              <button 
                onClick={() => {
                  setSystemSettings(prev => ({ ...prev, showBannerAd: false }));
                  triggerToast('watchlist-remove', 'Banner iklan disembunyikan sementara.');
                }}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header element */}
      <Header 
        currentView={view}
        onChangeView={setView}
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowAuthModal={(tab, prompt) => {
          setAuthTab(tab);
          setAuthPrompt(prompt || null);
          setIsAuthOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        watchlistCount={watchlist.length}
      />

      {/* Main Container */}
      <main className="flex-grow pb-16">
        
        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="space-y-10">
            {/* Simulated Banner Sponsor Space */}
            {systemSettings.showBannerAd && (!currentUser || currentUser.role !== 'Premium') && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neko-purple/10 rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded font-extrabold uppercase select-none">IKLAN</span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-display">NekoVPN Premium - Jaminan Nonton Streaming Tanpa Buffering!</h4>
                      <p className="text-[11px] text-zinc-500">Akses aman server anime premium jepang seharga Rp 15k.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => triggerToast('success', 'Membuka tab sponsor iklan (Simulasi): https://nekovpn.com')}
                    className="px-3.5 py-1.5 bg-neko-purple hover:bg-neko-purple/90 text-white text-xs font-bold rounded-lg transition shrink-0 relative z-10 cursor-pointer"
                  >
                    Unduh NekoVPN
                  </button>
                </div>
              </div>
            )}

            {/* Slider Showcase */}
            {searchQuery === '' && (
              <HeroSlider 
                animeList={animeList} 
                watchlist={watchlist} 
                onToggleWatchlist={(id) => handleToggleWatchlist(id)}
                onWatchNow={(id) => handleWatchNow(id, 1)}
              />
            )}

            {/* Category selection filters */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4 gap-4 overflow-x-auto">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
                  {ALL_GENRES.map((genre) => {
                    const isActive = selectedGenre === genre;
                    return (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                          isActive 
                            ? 'bg-gradient-to-r from-neko-500 to-neko-purple text-white neon-glow' 
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-zinc-500 shrink-0 hidden sm:block select-none">
                  <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-medium">
                    {processedList.length} Anime Terdaftar
                  </span>
                </div>
              </div>
            </section>

            {/* Grid Area */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="ongoing-section">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-neko-500 rounded-full"></div>
                  <h2 className="font-display font-extrabold text-xl md:text-2xl tracking-tight text-white">
                    {selectedGenre === 'Semua' ? 'Anime Terbaru' : `Genre: ${selectedGenre}`}
                  </h2>
                </div>
                
                {/* Sort Option dropdown selection */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 hidden sm:inline select-none">Urutkan:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-300 focus:outline-none focus:border-neko-500 cursor-pointer"
                  >
                    <option value="latest">Terbaru</option>
                    <option value="rating">Rating Tertinggi</option>
                    <option value="popular">Terpopuler</option>
                  </select>
                </div>
              </div>

              {processedList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {processedList.map((anime) => (
                    <AnimeCard 
                      key={anime.id} 
                      anime={anime}
                      isWatchlisted={watchlist.includes(anime.id)}
                      onToggleWatchlist={handleToggleWatchlist}
                      onClick={() => handleWatchNow(anime.id, 1)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-neko-500 mb-4 shadow-inner">
                    <Frown className="w-10 h-10 text-neko-500" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mb-2">Anime Tidak Ditemukan</h3>
                  <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
                    Maaf, coba cari anime lain atau atur ulang preferensi filter Anda!
                  </p>
                  <button 
                    onClick={() => {
                      setSelectedGenre('Semua');
                      setSearchQuery('');
                      setSortBy('latest');
                    }}
                    className="mt-4 px-4 py-1.5 bg-neko-500 hover:bg-neko-600 rounded-full text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Lihat Semua Anime
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW: WATCH / VIDEO PLAYER DETAIL */}
        {view === 'watch' && selectedAnime && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 mt-6">
            
            {/* Breadcrumb Navigation bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setView('home')} 
                  className="p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  <SkipBack className="w-5 h-5 text-zinc-400" />
                </button>
                <div className="text-xs text-zinc-400 font-medium select-none">
                  <span className="hover:text-white cursor-pointer" onClick={() => setView('home')}>Beranda</span>
                  <span className="mx-2 text-zinc-600">/</span>
                  <span className="text-zinc-200">{selectedAnime.title}</span>
                  <span className="mx-2 text-zinc-600">/</span>
                  <span className="text-neko-500">Episode {String(currentEpisode).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {/* Layout Grid columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Custom Player and Description details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Advanced player */}
                <VideoPlayer anime={selectedAnime} episode={currentEpisode} />

                {/* Bottom Episode and Saved indicators */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <div className="flex gap-2">
                    <button 
                      disabled={currentEpisode === 1}
                      onClick={() => handleWatchNow(selectedAnime.id, currentEpisode - 1)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    >
                      <SkipBack className="w-4 h-4" /> Eps Sebelumnya
                    </button>
                    
                    <button 
                      disabled={currentEpisode === selectedAnime.episodes}
                      onClick={() => handleWatchNow(selectedAnime.id, currentEpisode + 1)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    >
                      Eps Berikutnya <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleToggleWatchlist(selectedAnime.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      watchlist.includes(selectedAnime.id)
                        ? 'bg-neko-500/10 hover:bg-neko-500/20 border border-neko-500/30 text-neko-500 shadow-inner'
                        : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${watchlist.includes(selectedAnime.id) ? 'fill-current text-neko-500' : 'text-zinc-400'}`} /> 
                    {watchlist.includes(selectedAnime.id) ? 'Tersimpan' : 'Tambah Watchlist'}
                  </button>
                </div>

                {/* Anime Meta Details Card */}
                <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <img src={selectedAnime.image} alt={selectedAnime.title} className="w-32 h-44 object-cover rounded-xl shadow-md shrink-0 border border-zinc-800" />
                    
                    <div className="space-y-3">
                      <h1 className="font-display font-extrabold text-2xl text-white">{selectedAnime.title}</h1>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedAnime.genres.map(g => (
                          <span 
                            key={g} 
                            onClick={() => {
                              setSelectedGenre(g);
                              setView('home');
                            }}
                            className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md font-medium hover:border-neko-purple cursor-pointer transition select-none"
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                        <div>
                          <span className="block text-zinc-500 font-medium">Skor Rating</span>
                          <span className="font-bold text-yellow-400 flex items-center gap-1 mt-0.5 select-none">
                            <Star className="w-4 h-4 fill-current text-yellow-400" /> {selectedAnime.rating}
                          </span>
                        </div>
                        <div>
                          <span className="block text-zinc-500 font-medium">Status</span>
                          <span className={`font-semibold mt-0.5 block ${selectedAnime.status === 'Ongoing' ? 'text-emerald-400' : 'text-neko-purple'}`}>
                            {selectedAnime.status}
                          </span>
                        </div>
                        <div>
                          <span className="block text-zinc-500 font-medium">Total Episode</span>
                          <span className="font-semibold text-zinc-200 mt-0.5 block">{selectedAnime.episodes} Episode</span>
                        </div>
                        <div>
                          <span className="block text-zinc-500 font-medium">Studio Animasi</span>
                          <span className="font-semibold text-zinc-200 mt-0.5 block">{selectedAnime.studio}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/50 pt-4 space-y-2">
                    <h3 className="font-display font-bold text-sm text-zinc-300">Sinopsis Singkat</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{selectedAnime.synopsis}</p>
                  </div>

                  {/* Rating Selector */}
                  <div className="border-t border-zinc-800/50 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-zinc-300">Bagaimana menurutmu anime ini?</h4>
                      <p className="text-xs text-zinc-500">Berikan penilaian bintang pribadimu.</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starIdx) => {
                        const isGold = userRating !== null && starIdx <= userRating;
                        return (
                          <button
                            key={starIdx}
                            onClick={() => handleRateAnime(starIdx)}
                            className="text-zinc-600 hover:text-yellow-400 transition transform hover:scale-110 cursor-pointer"
                          >
                            <Star className={`w-6 h-6 ${isGold ? 'text-yellow-400 fill-current' : 'text-zinc-600'}`} />
                          </button>
                        );
                      })}
                      <span className={`text-xs font-bold ml-2 select-none ${userRating ? 'text-yellow-400' : 'text-zinc-400'}`}>
                        {userRating ? `${userRating}/5 Bintang` : 'Beri Skor'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DISCUSSION AREA */}
                <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-neko-500" />
                    <h2 className="font-display font-extrabold text-lg text-white">
                      Diskusi & Komentar (<span className="text-neko-500">{selectedAnime.comments?.length || 0}</span>)
                    </h2>
                  </div>

                  {/* Send Area Form */}
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1 shadow-sm select-none ${
                      currentUser ? currentUser.avatarBg : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {currentUser ? currentUser.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    
                    <div className="flex-grow space-y-2">
                      <textarea 
                        rows={3} 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Bagikan opinimu tentang episode ini..." 
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-neko-500 focus:ring-1 focus:ring-neko-500 transition-all"
                      />
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={commentSpoiler}
                            onChange={(e) => setCommentSpoiler(e.target.checked)}
                            className="rounded bg-zinc-900 border-zinc-800 text-neko-500 focus:ring-neko-500 cursor-pointer" 
                          /> 
                          Sembunyikan karena mengandung spoiler
                        </label>
                        
                        <button 
                          onClick={handleSubmitComment}
                          className="px-4 py-1.5 bg-neko-500 hover:bg-neko-600 text-white font-semibold text-xs rounded-lg transition shadow-md cursor-pointer"
                        >
                          Kirim Komentar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of comments */}
                  <div className="space-y-4 pt-2 divide-y divide-zinc-800/40">
                    {selectedAnime.comments && selectedAnime.comments.length > 0 ? (
                      selectedAnime.comments.map((comment, index) => (
                        <CommentItem key={index} comment={comment} />
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-zinc-500">
                        Belum ada komentar untuk episode ini. Jadilah yang pertama berkomentar!
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Right Column: Episode Grid List and Similar recommendations list */}
              <div className="space-y-6">
                
                {/* Episode Index list selection */}
                <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-neko-500" />
                      <h3 className="font-display font-bold text-md text-white">Daftar Episode</h3>
                    </div>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                      {selectedAnime.episodes} Eps
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {Array.from({ length: selectedAnime.episodes }).map((_, idx) => {
                      const epNum = idx + 1;
                      const isCurrent = epNum === currentEpisode;
                      return (
                        <button
                          key={epNum}
                          onClick={() => handleWatchNow(selectedAnime.id, epNum)}
                          className={`py-2 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer ${
                            isCurrent 
                              ? 'bg-gradient-to-r from-neko-500 to-neko-purple border-transparent text-white neon-glow' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {String(epNum).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended Side Panel matches */}
                <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 select-none">
                    <ThumbsUp className="w-5 h-5 text-neko-purple" />
                    <h3 className="font-display font-bold text-md text-white">Rekomendasi Serupa</h3>
                  </div>

                  <div className="space-y-3.5">
                    {recommendationList.map((anime) => (
                      <div 
                        key={anime.id}
                        onClick={() => handleWatchNow(anime.id, 1)}
                        className="flex gap-3 p-2 hover:bg-zinc-900 rounded-xl cursor-pointer transition border border-transparent hover:border-zinc-800"
                      >
                        <img src={anime.image} alt={anime.title} className="w-12 h-16 object-cover rounded-lg shrink-0 border border-zinc-800" />
                        <div className="flex flex-col justify-between py-0.5 overflow-hidden">
                          <h4 className="text-xs font-bold text-zinc-100 line-clamp-2 hover:text-neko-500 transition leading-snug">
                            {anime.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 select-none">
                            <span className="text-yellow-500 font-extrabold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-current text-yellow-500" /> {anime.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* VIEW: WATCHLIST VIEW GRID */}
        {view === 'watchlist' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 mt-8">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('home')} 
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">Daftar Tontonan Saya</h1>
                <p className="text-sm text-zinc-500 leading-relaxed">Simpan koleksi anime terfavorit Anda secara aman di sini.</p>
              </div>
            </div>

            {watchlistItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {watchlistItems.map((anime) => (
                  <AnimeCard 
                    key={anime.id} 
                    anime={anime}
                    isWatchlisted={true}
                    onToggleWatchlist={handleToggleWatchlist}
                    onClick={() => handleWatchNow(anime.id, 1)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 px-4">
                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4 shadow">
                  <Heart className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-1">Daftar Tontonan Kosong</h3>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  Jelajahi halaman beranda kami dan temukan berbagai rilis anime menarik hari ini!
                </p>
                <button 
                  onClick={() => setView('home')} 
                  className="mt-5 px-5 py-2 bg-gradient-to-r from-neko-500 to-neko-purple text-white text-xs font-semibold rounded-full shadow hover:opacity-90 transition cursor-pointer"
                >
                  Cari Anime Menarik
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: CONTROL CMS ADMIN PANEL */}
        {view === 'admin' && (
          <AdminPanel 
            animeList={animeList}
            onAddAnime={handleAddAnime}
            onEditAnime={handleEditAnime}
            onDeleteAnime={handleDeleteAnime}
            users={users}
            onChangeUserRole={handleChangeUserRole}
            onToggleUserBan={handleToggleUserBan}
            systemSettings={systemSettings}
            onSaveSystemSettings={handleSaveSystemSettings}
            onClose={() => setView('home')}
          />
        )}

        {/* VIEW: LEGAL PAGES (DISCLAIMER, DMCA, PRIVACY) */}
        {(view === 'disclaimer' || view === 'dmca' || view === 'privacy') && (
          <LegalPages 
            initialTab={view}
            onBackToHome={() => setView('home')}
          />
        )}

      </main>

      {/* Footer Element */}
      <Footer onChangeView={setView} />

      {/* Floating Bottom Navigation Bar for Mobile (Android / Touch Device optimization) */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/60 py-2 px-6 flex justify-around items-center rounded-t-2xl shadow-[0_-10px_25px_rgba(0,0,0,0.65)] select-none">
        <button
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${view === 'home' ? 'text-neko-500' : 'text-zinc-500'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wide">Beranda</span>
        </button>

        <button
          onClick={() => {
            setView('home');
            setTimeout(() => {
              const ongoingSection = document.getElementById('ongoing-section');
              if (ongoingSection) ongoingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
          }}
          className="flex flex-col items-center gap-1 text-zinc-500 active:scale-90 transition-all duration-200"
        >
          <Zap className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wide">Ongoing</span>
        </button>

        <button
          onClick={() => setView('watchlist')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 relative ${view === 'watchlist' ? 'text-neko-500' : 'text-zinc-500'}`}
        >
          <Bookmark className="w-5 h-5" />
          {watchlist.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-neko-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full scale-90">
              {watchlist.length}
            </span>
          )}
          <span className="text-[9px] font-bold tracking-wide">Koleksi</span>
        </button>

        {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Moderator') && (
          <button
            onClick={() => setView('admin')}
            className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${view === 'admin' ? 'text-yellow-500' : 'text-zinc-500'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wide">Admin</span>
          </button>
        )}
      </div>

      {/* ================= AUTH TABBED DIALOG MODAL ================= */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthPrompt(null);
        }}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={handleGoogleLogin}
        initialTab={authTab}
        customPrompt={authPrompt}
      />

      {/* --- FLOATING TOAST NOTIFICATION MESSAGE --- */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            className="fixed bottom-6 right-6 z-50 bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl max-w-sm pointer-events-none"
            initial={{ translateY: 80, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <div className={`p-1.5 rounded-lg ${
              toast.type === 'watchlist-add' || toast.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : toast.type === 'watchlist-remove'
                ? 'bg-zinc-500/10 text-zinc-400'
                : 'bg-red-500/10 text-red-500'
            }`}>
              {toast.type === 'watchlist-add' || toast.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : toast.type === 'watchlist-remove' ? (
                <Info className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {toast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
