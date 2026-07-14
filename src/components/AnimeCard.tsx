import React from 'react';
import { Star, Bookmark } from 'lucide-react';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  isWatchlisted: boolean;
  onToggleWatchlist: (animeId: string, e: any) => void;
  onClick: () => void;
}

export default function AnimeCard({
  anime,
  isWatchlisted,
  onToggleWatchlist,
  onClick,
}: AnimeCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-700/80 transition-all duration-300 hover:-translate-y-1.5 shadow-md flex flex-col"
    >
      {/* Cover Image Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
        <img 
          src={anime.image} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500";
          }}
        />
        
        {/* Rating Star Badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-yellow-400 flex items-center gap-0.5 shadow-sm border border-zinc-800/60 select-none">
          <Star className="w-3 h-3 fill-current text-yellow-400" /> {anime.rating}
        </div>

        {/* Watchlist Add/Remove Action Button */}
        <button 
          onClick={(e) => onToggleWatchlist(anime.id, e)}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/75 backdrop-blur-md hover:bg-zinc-900 hover:scale-105 rounded-lg flex items-center justify-center border border-zinc-800/80 transition active:scale-95 cursor-pointer"
          title={isWatchlisted ? "Hapus dari Daftar Tontonan" : "Simpan di Daftar Tontonan"}
        >
          <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'text-neko-500 fill-current' : 'text-zinc-300'}`} />
        </button>

        {/* Status and Episode Badges */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[9px] bg-neko-purple px-1.5 py-0.5 rounded text-white font-extrabold tracking-wider shadow uppercase select-none">
            {anime.status}
          </span>
          <span className="text-[9px] bg-zinc-950/80 backdrop-blur px-1.5 py-0.5 rounded text-zinc-300 font-bold border border-zinc-800 select-none">
            {anime.episodes} Eps
          </span>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-3 flex-grow flex flex-col justify-between">
        <h3 className="font-display font-semibold text-xs text-zinc-100 group-hover:text-neko-500 transition line-clamp-2 leading-tight">
          {anime.title}
        </h3>
        <span className="text-[10px] text-zinc-500 mt-2 block overflow-hidden text-ellipsis whitespace-nowrap">
          {anime.genres.join(', ')}
        </span>
      </div>
    </div>
  );
}
