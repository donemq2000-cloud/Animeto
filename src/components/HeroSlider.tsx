import { useEffect, useState } from 'react';
import { Play, Bookmark, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Anime } from '../types';

interface HeroSliderProps {
  animeList: Anime[];
  watchlist: string[];
  onToggleWatchlist: (animeId: string) => void;
  onWatchNow: (animeId: string) => void;
}

export default function HeroSlider({
  animeList,
  watchlist,
  onToggleWatchlist,
  onWatchNow,
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featured = animeList.slice(0, 3);

  // Auto-rotation effect
  useEffect(() => {
    if (featured.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const currentAnime = featured[currentIndex];
  const isWatchlisted = watchlist.includes(currentAnime.id);

  return (
    <section className="relative w-full overflow-hidden bg-zinc-950 min-h-[460px] sm:min-h-[520px] md:min-h-[580px] flex items-center">
      {/* Absolute Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-neko-dark via-neko-dark/40 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-neko-dark via-transparent to-transparent z-10 pointer-events-none" />

      {/* Slide Image with Fade Animation */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentAnime.id}
            src={currentAnime.image}
            alt={currentAnime.title}
            className="w-full h-full object-cover opacity-25"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </AnimatePresence>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnime.id}
            className="max-w-2xl space-y-4 sm:space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neko-500/10 border border-neko-500/30 text-neko-500 text-xs font-bold neon-glow select-none">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neko-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neko-500"></span>
              </span>
              <span>PILIHAN UTAMA</span>
            </div>

            {/* Title */}
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              {currentAnime.title}
            </h1>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-300 font-medium">
              <span className="text-yellow-400 font-extrabold flex items-center gap-1">
                <Star className="w-4 h-4 fill-current text-yellow-400" /> {currentAnime.rating}
              </span>
              <span className="text-zinc-600 select-none">•</span>
              <span className="bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700/50">
                {currentAnime.studio}
              </span>
              <span className="text-zinc-600 select-none">•</span>
              <span>{currentAnime.genres.join(', ')}</span>
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3">
              {currentAnime.synopsis}
            </p>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => onWatchNow(currentAnime.id)}
                className="px-6 py-2.5 bg-gradient-to-r from-neko-500 to-neko-purple text-white font-bold rounded-xl text-xs sm:text-sm shadow-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Tonton Sekarang
              </button>
              
              <button 
                onClick={() => onToggleWatchlist(currentAnime.id)}
                className="px-5 py-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'text-neko-500 fill-current' : 'text-zinc-400'}`} /> 
                {isWatchlisted ? 'Tersimpan' : 'Watchlist'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Selection Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {featured.map((_, idx) => (
          <button
            key={idx}
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex ? 'bg-neko-500 w-8' : 'bg-zinc-700 hover:bg-zinc-500 w-2.5'
            }`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
