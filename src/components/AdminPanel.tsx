import React, { useState } from 'react';
import { ShieldCheck, Eye, Film, Users, Sliders, Plus, X, Star, Trash2, Edit, Sparkles, Search, Loader2 } from 'lucide-react';
import { Anime, User, SystemSettings, AdminTabType } from '../types';

interface AdminPanelProps {
  animeList: Anime[];
  onAddAnime: (anime: Anime) => void;
  onEditAnime: (anime: Anime) => void;
  onDeleteAnime: (id: string) => void;
  users: User[];
  onChangeUserRole: (email: string, role: User['role']) => void;
  onToggleUserBan: (email: string) => void;
  systemSettings: SystemSettings;
  onSaveSystemSettings: (settings: SystemSettings) => void;
  onClose: () => void;
}

export default function AdminPanel({
  animeList,
  onAddAnime,
  onEditAnime,
  onDeleteAnime,
  users,
  onChangeUserRole,
  onToggleUserBan,
  systemSettings,
  onSaveSystemSettings,
  onClose,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('anime');
  const [showModal, setShowModal] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [animeToDelete, setAnimeToDelete] = useState<Anime | null>(null);

  // Episode Manager States
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [selectedAnimeForEpisodes, setSelectedAnimeForEpisodes] = useState<Anime | null>(null);
  const [tempEpisodeCount, setTempEpisodeCount] = useState(12);
  const [tempEpisodeUrls, setTempEpisodeUrls] = useState<Record<string, string>>({});
  const [urlPattern, setUrlPattern] = useState('');

  const handleOpenEpisodeManager = (anime: Anime) => {
    setSelectedAnimeForEpisodes(anime);
    setTempEpisodeCount(anime.episodes);
    setTempEpisodeUrls(anime.episodeUrls || {});
    setUrlPattern('');
    setShowEpisodeModal(true);
  };

  const handleSaveEpisodes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeForEpisodes) return;

    const cleanedUrls: Record<string, string> = {};
    Object.entries(tempEpisodeUrls).forEach(([epNum, url]) => {
      if (url && url.trim() !== '') {
        cleanedUrls[epNum] = url.trim();
      }
    });

    const updatedAnime: Anime = {
      ...selectedAnimeForEpisodes,
      episodes: tempEpisodeCount,
      episodeUrls: cleanedUrls,
    };

    onEditAnime(updatedAnime);
    setShowEpisodeModal(false);
  };

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formRating, setFormRating] = useState('9.0');
  const [formEpisodes, setFormEpisodes] = useState(12);
  const [formStatus, setFormStatus] = useState<'Ongoing' | 'Completed'>('Ongoing');
  const [formStudio, setFormStudio] = useState('');
  const [formGenres, setFormGenres] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formVideo, setFormVideo] = useState('');
  const [formSynopsis, setFormSynopsis] = useState('');

  // TMDB API Generator States
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [tmdbError, setTmdbError] = useState<string | null>(null);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [tmdbSuccessMsg, setTmdbSuccessMsg] = useState<string | null>(null);

  // SEO fields State
  const [seoTitle, setSeoTitle] = useState(systemSettings.metaTitle);
  const [seoDesc, setSeoDesc] = useState(systemSettings.metaDesc);
  const [seoServer, setSeoServer] = useState(systemSettings.streamServer);
  const [seoMaintenance, setSeoMaintenance] = useState(systemSettings.maintenanceMode);

  const handleOpenAdd = () => {
    setEditingAnime(null);
    setFormTitle('');
    setFormRating('9.0');
    setFormEpisodes(12);
    setFormStatus('Ongoing');
    setFormStudio('');
    setFormGenres('Action, Fantasy');
    setFormImage('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500');
    setFormVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setFormSynopsis('');

    // Reset TMDB states
    setTmdbQuery('');
    setTmdbResults([]);
    setTmdbError(null);
    setTmdbSuccessMsg(null);
    setShowTmdbResults(false);

    setShowModal(true);
  };

  const handleOpenEdit = (anime: Anime) => {
    setEditingAnime(anime);
    setFormTitle(anime.title);
    setFormRating(anime.rating);
    setFormEpisodes(anime.episodes);
    setFormStatus(anime.status);
    setFormStudio(anime.studio);
    setFormGenres(anime.genres.join(', '));
    setFormImage(anime.image);
    setFormVideo(anime.videoUrl);
    setFormSynopsis(anime.synopsis);

    // Reset TMDB states
    setTmdbQuery('');
    setTmdbResults([]);
    setTmdbError(null);
    setTmdbSuccessMsg(null);
    setShowTmdbResults(false);

    setShowModal(true);
  };

  const handleSearchTmdb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbQuery.trim()) return;

    setIsSearchingTmdb(true);
    setTmdbError(null);
    setTmdbSuccessMsg(null);
    setTmdbResults([]);
    setShowTmdbResults(true);

    try {
      const apiKey = '777c4c1d1255f41ff25dcb29e4321018';
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(tmdbQuery.trim())}&language=id-ID`
      );
      if (!response.ok) {
        throw new Error('Gagal menghubungi API TMDB');
      }
      const data = await response.json();
      
      const filtered = (data.results || []).filter(
        (item: any) => (item.media_type === 'tv' || item.media_type === 'movie')
      );

      if (filtered.length === 0) {
        setTmdbError('Tidak ada hasil Anime/TV Show/Movie yang cocok.');
      } else {
        setTmdbResults(filtered);
      }
    } catch (err: any) {
      setTmdbError(err.message || 'Terjadi kesalahan saat mencari.');
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  const handleSelectTmdbItem = async (id: number, mediaType: 'tv' | 'movie') => {
    setIsSearchingTmdb(true);
    setTmdbError(null);
    setTmdbSuccessMsg(null);

    try {
      const apiKey = '777c4c1d1255f41ff25dcb29e4321018';
      const detailRes = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}&language=id-ID`
      );
      if (!detailRes.ok) {
        throw new Error('Gagal mengambil detail dari TMDB');
      }
      let details = await detailRes.json();

      if (!details.overview) {
        const enRes = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}&language=en-US`
        );
        if (enRes.ok) {
          const enDetails = await enRes.json();
          details.overview = enDetails.overview;
          if (!details.name && enDetails.name) details.name = enDetails.name;
          if (!details.title && enDetails.title) details.title = enDetails.title;
          if (!details.genres && enDetails.genres) details.genres = enDetails.genres;
          if (!details.production_companies && enDetails.production_companies) {
            details.production_companies = enDetails.production_companies;
          }
        }
      }

      const title = mediaType === 'tv' ? (details.name || details.original_name) : (details.title || details.original_title);
      setFormTitle(title || '');

      const rating = details.vote_average ? details.vote_average.toFixed(1) : '9.0';
      setFormRating(rating);

      const episodes = mediaType === 'tv' ? (details.number_of_episodes || 12) : 1;
      setFormEpisodes(episodes);

      if (mediaType === 'movie') {
        setFormStatus('Completed');
      } else {
        const isOngoing = details.in_production || details.status === 'In Production' || details.status === 'Returning Series';
        setFormStatus(isOngoing ? 'Ongoing' : 'Completed');
      }

      let studio = 'Unknown';
      if (details.production_companies && details.production_companies.length > 0) {
        studio = details.production_companies[0].name;
      }
      setFormStudio(studio);

      let genresList = 'Action, Fantasy';
      if (details.genres && details.genres.length > 0) {
        genresList = details.genres.map((g: any) => g.name).join(', ');
      }
      setFormGenres(genresList);

      const posterPath = details.poster_path;
      const imageUrl = posterPath 
        ? `https://image.tmdb.org/t/p/w500${posterPath}` 
        : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';
      setFormImage(imageUrl);

      setFormSynopsis(details.overview || 'Sinopsis belum tersedia.');
      
      setTmdbSuccessMsg(`Berhasil menarik data: "${title}"`);
      setShowTmdbResults(false);
      setTmdbQuery('');
    } catch (err: any) {
      setTmdbError(err.message || 'Gagal memproses data anime.');
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const genresArray = formGenres.split(',').map(g => g.trim()).filter(g => g !== '');

    const animeData: Anime = {
      id: editingAnime ? editingAnime.id : `custom-${Date.now()}`,
      title: formTitle.trim(),
      rating: formRating,
      episodes: formEpisodes,
      status: formStatus,
      studio: formStudio.trim(),
      genres: genresArray,
      image: formImage.trim(),
      videoUrl: formVideo.trim(),
      synopsis: formSynopsis.trim(),
      isPopular: editingAnime ? editingAnime.isPopular : false,
      comments: editingAnime ? (editingAnime.comments || []) : [],
      episodeUrls: editingAnime && editingAnime.episodeUrls ? editingAnime.episodeUrls : {}
    };

    if (editingAnime) {
      onEditAnime(animeData);
    } else {
      onAddAnime(animeData);
    }
    setShowModal(false);
  };

  const handleSaveSeo = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSystemSettings({
      ...systemSettings,
      metaTitle: seoTitle.trim(),
      metaDesc: seoDesc.trim(),
      streamServer: seoServer,
      maintenanceMode: seoMaintenance,
    });
  };

  const toggleAdSetting = (key: 'banner' | 'popunder', checked: boolean) => {
    onSaveSystemSettings({
      ...systemSettings,
      [key === 'banner' ? 'showBannerAd' : 'showPopunderAd']: checked
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-zinc-950 font-bold shadow-lg">
            <ShieldCheck className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-white">Nekonime Control Panel</h1>
            <p className="text-xs text-zinc-400">Pusat kontrol database anime manual, hak akses pengguna, sistem iklan, dan SEO metadata.</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Eye className="w-4 h-4" /> Kembali Ke Beranda
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        
        {/* Sidebar Menu Items */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[10px] text-zinc-500 font-extrabold tracking-wider px-3 uppercase select-none">PILIHAN PANEL MENU</p>
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 no-scrollbar py-1">
            <button 
              onClick={() => setActiveTab('anime')} 
              className={`px-4 py-3 text-left rounded-xl text-xs font-bold flex items-center gap-2.5 transition shrink-0 cursor-pointer ${
                activeTab === 'anime' 
                  ? 'bg-gradient-to-r from-neko-500 to-neko-purple text-white shadow' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Film className="w-4 h-4" /> Kelola Anime & Eps
            </button>
            
            <button 
              onClick={() => setActiveTab('users')} 
              className={`px-4 py-3 text-left rounded-xl text-xs font-bold flex items-center gap-2.5 transition shrink-0 cursor-pointer ${
                activeTab === 'users' 
                  ? 'bg-gradient-to-r from-neko-500 to-neko-purple text-white shadow' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Users className="w-4 h-4" /> Pengguna & Role
            </button>
            
            <button 
              onClick={() => setActiveTab('ads')} 
              className={`px-4 py-3 text-left rounded-xl text-xs font-bold flex items-center gap-2.5 transition shrink-0 cursor-pointer ${
                activeTab === 'ads' 
                  ? 'bg-gradient-to-r from-neko-500 to-neko-purple text-white shadow' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Sliders className="w-4 h-4" /> Iklan & Premium
            </button>
            
            <button 
              onClick={() => setActiveTab('seo')} 
              className={`px-4 py-3 text-left rounded-xl text-xs font-bold flex items-center gap-2.5 transition shrink-0 cursor-pointer ${
                activeTab === 'seo' 
                  ? 'bg-gradient-to-r from-neko-500 to-neko-purple text-white shadow' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Sliders className="w-4 h-4" /> SEO & Sistem
            </button>
          </div>
        </div>

        {/* Main Admin Workspace */}
        <div className="lg:col-span-3 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 min-h-[500px]">
          
          {/* TAB: MANAGE ANIME LIST */}
          {activeTab === 'anime' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                <div>
                  <h2 className="text-md font-bold text-white font-display">Manajemen Koleksi Anime & Episode</h2>
                  <p className="text-xs text-zinc-400">Total terdaftar: <span className="font-bold text-neko-500">{animeList.length}</span> judul.</p>
                </div>
                <button 
                  onClick={handleOpenAdd}
                  className="px-3.5 py-1.5 bg-neko-purple hover:bg-neko-purple/90 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Manual
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 font-bold border-b border-zinc-800/80">
                    <tr>
                      <th className="p-4 rounded-l-lg">Cover</th>
                      <th className="p-4">Judul Anime</th>
                      <th className="p-4">Studio</th>
                      <th className="p-4">Episode</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 rounded-r-lg text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {animeList.map((anime) => (
                      <tr key={anime.id} className="hover:bg-zinc-900/30 transition-all border-b border-zinc-800/20">
                        <td className="p-4">
                          <img src={anime.image} alt={anime.title} className="w-10 h-14 object-cover rounded-lg bg-zinc-950 border border-zinc-800" />
                        </td>
                        <td className="p-4 font-bold text-white max-w-[200px] truncate">{anime.title}</td>
                        <td className="p-4 text-zinc-400 font-semibold">{anime.studio}</td>
                        <td className="p-4 font-bold text-zinc-200">{anime.episodes} Eps</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            anime.status === 'Ongoing' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-neko-purple/10 text-neko-purple border border-neko-purple/20'
                          }`}>
                            {anime.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1 whitespace-nowrap">
                          <button 
                            onClick={() => handleOpenEpisodeManager(anime)}
                            className="p-1.5 bg-zinc-950 border border-zinc-800 text-neko-purple hover:text-white hover:bg-neko-purple/20 rounded transition cursor-pointer inline-flex items-center"
                            title="Kelola Link Episode"
                          >
                            <Film className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(anime)}
                            className="p-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition cursor-pointer inline-flex items-center"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setAnimeToDelete(anime)}
                            className="p-1.5 bg-red-950/20 border border-red-950 text-red-400 hover:text-white hover:bg-red-700 rounded transition inline-flex items-center cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: USER & ROLE MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-800/80">
                <h2 className="text-md font-bold text-white font-display">Daftar Pengguna Nekonime</h2>
                <p className="text-xs text-zinc-400">Ubah hak akses akun, ganti status premium, atau tangguhkan akun pengguna.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 font-bold border-b border-zinc-800/80">
                    <tr>
                      <th className="p-4 rounded-l-lg">User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role Saat Ini</th>
                      <th className="p-4">Aksi Ganti Role</th>
                      <th className="p-4 rounded-r-lg text-right">Status Akun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {users.map((user) => (
                      <tr key={user.email} className="hover:bg-zinc-900/30 transition-all border-b border-zinc-800/20">
                        <td className="p-4 flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${user.avatarBg || 'bg-zinc-700'} flex items-center justify-center font-bold text-white text-[10px]`}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-white">{user.username}</span>
                        </td>
                        <td className="p-4 text-zinc-400 font-semibold">{user.email}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-950 border border-zinc-800 text-zinc-400 select-none">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <select 
                            value={user.role}
                            onChange={(e) => onChangeUserRole(user.email, e.target.value as User['role'])}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2 py-1 focus:outline-none focus:border-neko-purple text-xs cursor-pointer"
                          >
                            <option value="Standard User">Standard</option>
                            <option value="Premium">Premium Ultra</option>
                            <option value="Moderator">Moderator</option>
                            <option value="Admin">Administrator</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => onToggleUserBan(user.email)}
                            className={`px-2 py-1 rounded font-bold transition text-[11px] cursor-pointer ${
                              user.isBlocked 
                                ? 'bg-emerald-950/20 border border-emerald-950 text-emerald-400 hover:bg-emerald-800 hover:text-white' 
                                : 'bg-red-950/20 border border-red-950 text-red-400 hover:bg-red-800 hover:text-white'
                            }`}
                          >
                            {user.isBlocked ? 'Aktifkan Akun' : 'Blokir Akun'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: AD & MONETIZATION MANAGER */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-800/80">
                <h2 className="text-md font-bold text-white font-display">Iklan & Monetisasi</h2>
                <p className="text-xs text-zinc-400">Kelola penampilan iklan banner horizontal dan pop-under sponsor untuk user gratis.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white">Aktifkan Banner Ads (Home & Watch)</h3>
                      <p className="text-[11px] text-zinc-500">Iklan banner horizontal di bagian atas halaman.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={systemSettings.showBannerAd}
                        onChange={(e) => toggleAdSetting('banner', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neko-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white">Simulasi Pop-under Ads</h3>
                      <p className="text-[11px] text-zinc-500">Membuka tab popup iklan sponsor pada klik pemutar pertama. Akun premium otomatis bebas dari iklan ini.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={systemSettings.showPopunderAd}
                        onChange={(e) => toggleAdSetting('popunder', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neko-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SEO & STREAMING SERVER SETTINGS */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-800/80">
                <h2 className="text-md font-bold text-white font-display">SEO & Sistem Konfigurasi</h2>
                <p className="text-xs text-zinc-400">Atur tajuk situs utama, default metadata, dan maintenance mode situs.</p>
              </div>

              <form onSubmit={handleSaveSeo} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 block">Judul Situs Utama (Meta Title)</label>
                  <input 
                    type="text" 
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-neko-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 block">Deskripsi SEO Utama (SEO Meta Description)</label>
                  <textarea 
                    rows={3} 
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-neko-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-400 block">Streaming Player Server</label>
                    <select 
                      value={seoServer}
                      onChange={(e) => setSeoServer(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-300 focus:outline-none focus:border-neko-500 cursor-pointer"
                    >
                      <option value="Native-Custom">Native HTML5 Custom Player (Direct Video)</option>
                      <option value="Server-B">Alternative High-Speed Cloud Server</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-400 block">Maintenance Mode</label>
                    <select 
                      value={seoMaintenance}
                      onChange={(e) => setSeoMaintenance(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-300 focus:outline-none focus:border-neko-500 cursor-pointer"
                    >
                      <option value="false">Nonaktif (Situs Dapat Diakses)</option>
                      <option value="true">Aktif (Kunci Semua Akses Tamu)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800/80">
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-gradient-to-r from-neko-500 to-neko-purple hover:opacity-95 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
                  >
                    Simpan Konfigurasi
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* ================= ADD/EDIT ANIME MANUAL MODAL ================= */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 transform scale-100 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center space-y-1">
              <h2 className="font-display font-extrabold text-xl text-white">
                {editingAnime ? 'Edit Data Anime' : 'Tambah Anime Baru'}
              </h2>
              <p className="text-xs text-zinc-500">Atur database anime secara manual.</p>
            </div>

            {/* TMDB API Auto-Generator */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-bold text-xs text-zinc-300">TMDB Auto-Fill Generator</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Ketik judul anime/film di bawah untuk menarik metadata (judul, rating, studio, genre, poster, sinopsis) secara otomatis dari TMDB.
              </p>

              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Contoh: Attack on Titan, Kimetsu no Yaiba..." 
                    value={tmdbQuery}
                    onChange={(e) => setTmdbQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const pseudoEvent = { preventDefault: () => {} } as React.FormEvent;
                        handleSearchTmdb(pseudoEvent);
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-neko-500"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleSearchTmdb}
                  disabled={isSearchingTmdb}
                  className="px-3.5 py-2 bg-gradient-to-r from-neko-500 to-neko-purple hover:opacity-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                >
                  {isSearchingTmdb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
                </button>
              </div>

              {/* Status messages */}
              {tmdbError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400">
                  ❌ {tmdbError}
                </div>
              )}

              {tmdbSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 font-medium animate-pulse">
                  ✨ {tmdbSuccessMsg}
                </div>
              )}

              {/* Search Results Dropdown/List */}
              {showTmdbResults && tmdbResults.length > 0 && (
                <div className="border border-zinc-800 bg-zinc-950 rounded-xl max-h-48 overflow-y-auto divide-y divide-zinc-900 shadow-xl custom-scrollbar">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 sticky top-0 border-b border-zinc-900">
                    <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">HASIL PENCARIAN ({tmdbResults.length})</span>
                    <button 
                      type="button" 
                      onClick={() => setShowTmdbResults(false)}
                      className="text-zinc-500 hover:text-white text-[10px] font-bold"
                    >
                      Tutup
                    </button>
                  </div>
                  {tmdbResults.map((item: any) => {
                    const title = item.media_type === 'tv' ? (item.name || item.original_name) : (item.title || item.original_title);
                    const releaseDate = item.media_type === 'tv' ? item.first_air_date : item.release_date;
                    const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';
                    const posterUrl = item.poster_path 
                      ? `https://image.tmdb.org/t/p/w92${item.poster_path}` 
                      : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => handleSelectTmdbItem(item.id, item.media_type)}
                        className="flex gap-3 p-2.5 hover:bg-zinc-900/80 cursor-pointer transition items-center"
                      >
                        <img 
                          src={posterUrl} 
                          alt={title} 
                          className="w-8 h-12 object-cover rounded bg-zinc-900 border border-zinc-800 shrink-0" 
                        />
                        <div className="flex-grow min-w-0">
                          <p className="font-bold text-zinc-200 truncate text-xs">{title}</p>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-2">
                            <span>{year}</span>
                            <span className="inline-block w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="uppercase text-[9px] font-bold px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              {item.media_type === 'tv' ? 'TV Series' : 'Movie'}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-2 py-1 bg-neko-purple/15 text-neko-purple border border-neko-purple/30 text-[9px] font-bold rounded-lg hover:bg-neko-purple hover:text-white transition"
                        >
                          Pilih
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-400">Judul Anime</label>
                <input 
                  type="text" 
                  required 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-neko-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400">Skor Rating (0 - 10)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    value={formRating}
                    onChange={(e) => setFormRating(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-neko-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400">Total Episode</label>
                  <input 
                    type="number" 
                    required 
                    value={formEpisodes}
                    onChange={(e) => setFormEpisodes(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-neko-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400">Status Rilis</label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Ongoing' | 'Completed')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 focus:outline-none focus:border-neko-500 cursor-pointer"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400">Studio Pembuat</label>
                  <input 
                    type="text" 
                    required 
                    value={formStudio}
                    onChange={(e) => setFormStudio(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-neko-500" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-400">Genre (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  required 
                  value={formGenres}
                  onChange={(e) => setFormGenres(e.target.value)}
                  placeholder="Action, Fantasy, Adventure" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-neko-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-400">URL Gambar Poster</label>
                <input 
                  type="text" 
                  required 
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-neko-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-400">URL Direct Video Link (e.g. .mp4)</label>
                <input 
                  type="text" 
                  required 
                  value={formVideo}
                  onChange={(e) => setFormVideo(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-neko-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-400">Sinopsis Cerita</label>
                <textarea 
                  rows={3} 
                  required 
                  value={formSynopsis}
                  onChange={(e) => setFormSynopsis(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-neko-500" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-gradient-to-r from-neko-500 to-neko-purple hover:opacity-95 text-white font-bold rounded-xl transition cursor-pointer"
              >
                {editingAnime ? 'Simpan Perubahan' : 'Simpan Anime Baru'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= EPISODE MANAGER MODAL ================= */}
      {showEpisodeModal && selectedAnimeForEpisodes && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowEpisodeModal(false)}
        >
          <div 
            className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 transform scale-100 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowEpisodeModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-xl bg-neko-purple/15 flex items-center justify-center text-neko-purple mb-2">
                <Film className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="font-display font-extrabold text-xl text-white">
                Kelola Episode & Link Streaming
              </h2>
              <p className="text-xs text-zinc-500">
                Mengatur rincian episode untuk <span className="font-bold text-zinc-300">"{selectedAnimeForEpisodes.title}"</span>
              </p>
            </div>

            {/* Quick URL auto-generation pattern helper */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-bold text-xs">Isi Otomatis Pola URL (Opsional)</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Ketik pola URL Anda dengan tag <span className="text-neko-500 font-mono font-semibold">{`{eps}`}</span> untuk mengisi seluruh kolom episode secara otomatis.
                Contoh: <code className="text-zinc-400 font-mono text-[9px]">https://server.com/watch/tess-eps-{`{eps}`}.mp4</code>
              </p>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Masukkan pola URL..."
                  value={urlPattern}
                  onChange={(e) => setUrlPattern(e.target.value)}
                  className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-neko-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!urlPattern.trim()) return;
                    const newUrls = { ...tempEpisodeUrls };
                    for (let i = 1; i <= tempEpisodeCount; i++) {
                      newUrls[i.toString()] = urlPattern.replace('{eps}', i.toString());
                    }
                    setTempEpisodeUrls(newUrls);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-neko-500 to-neko-purple text-white text-xs font-bold rounded-xl hover:opacity-95 transition cursor-pointer shrink-0"
                >
                  Terapkan Pola
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEpisodes} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end border-b border-zinc-800/40 pb-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 block">Total Episode Rilis</label>
                  <p className="text-[10px] text-zinc-500">Ubah jumlah total episode di pemutar.</p>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={tempEpisodeCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setTempEpisodeCount(val);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-neko-500 font-semibold"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const confirmClear = window.confirm('Apakah Anda yakin ingin menghapus semua link custom episode ini? (Akan kembali menggunakan URL default)');
                    if (confirmClear) {
                      setTempEpisodeUrls({});
                    }
                  }}
                  className="px-4 py-2.5 bg-red-950/20 border border-red-950/60 hover:bg-red-900 hover:text-white text-red-400 font-bold rounded-xl transition text-center text-xs cursor-pointer"
                >
                  Hapus Semua Custom Link
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="font-bold text-zinc-400">Daftar Link Tiap Episode</span>
                  <span className="text-[10px] text-zinc-500">Kosongkan kolom untuk menggunakan URL default ({selectedAnimeForEpisodes.videoUrl.substring(0, 30)}...)</span>
                </div>

                <div className="max-h-[35vh] overflow-y-auto space-y-3.5 pr-2 border border-zinc-900 bg-zinc-900/10 p-3 rounded-2xl custom-scrollbar">
                  {Array.from({ length: tempEpisodeCount }).map((_, idx) => {
                    const epNum = (idx + 1).toString();
                    return (
                      <div key={epNum} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                        <span className="font-bold text-zinc-300 text-xs w-20 shrink-0">Episode {epNum.padStart(2, '0')}</span>
                        <input 
                          type="text"
                          placeholder={`Gunakan URL utama: ${selectedAnimeForEpisodes.videoUrl}`}
                          value={tempEpisodeUrls[epNum] || ''}
                          onChange={(e) => {
                            setTempEpisodeUrls(prev => ({
                              ...prev,
                              [epNum]: e.target.value
                            }));
                          }}
                          className="flex-grow bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-neko-500 text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-neko-500 to-neko-purple hover:opacity-95 text-white font-bold rounded-xl shadow-lg transition cursor-pointer text-xs"
              >
                Simpan Perubahan Episode ({tempEpisodeCount} Eps)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DELETE ANIME MODAL ================= */}
      {animeToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-all duration-300"
          onClick={() => setAnimeToDelete(null)}
        >
          <div 
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transform scale-100 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-black text-lg text-white">Hapus Anime Dari Database?</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Tindakan ini tidak dapat dibatalkan. Seluruh data episode, link streaming, dan komentar untuk anime ini akan terhapus secara permanen.
                </p>
              </div>
            </div>

            {/* Anime Detail Box */}
            <div className="flex gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl items-center">
              <img 
                src={animeToDelete.image} 
                alt={animeToDelete.title} 
                className="w-12 h-16 object-cover rounded-xl bg-zinc-950 border border-zinc-800 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-zinc-200 truncate">{animeToDelete.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{animeToDelete.studio}</p>
                <p className="text-[10px] text-zinc-500 mt-1 font-semibold">{animeToDelete.episodes} Episode • Rating {animeToDelete.rating}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAnimeToDelete(null)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAnime(animeToDelete.id);
                  setAnimeToDelete(null);
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/20 transition cursor-pointer text-center"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
