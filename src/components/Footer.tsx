import React from 'react';
import { Play } from 'lucide-react';
import { ViewType } from '../types';

interface FooterProps {
  onChangeView: (view: ViewType) => void;
}

export default function Footer({ onChangeView }: FooterProps) {
  const handleScrollToOngoing = (e: React.MouseEvent) => {
    e.preventDefault();
    onChangeView('home');
    setTimeout(() => {
      const el = document.getElementById('ongoing-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/80 py-10 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-zinc-400">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-tr from-neko-500 to-neko-purple rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                NEKO<span className="text-neko-purple">NIME</span>
              </span>
            </div>
            <p className="leading-relaxed max-w-sm">
              Nekonime merupakan website portal streaming anime gratis kualitas HD dengan terjemahan Bahasa Indonesia. Dipersembahkan khusus untuk seluruh wibu tanah air!
            </p>
          </div>
          
          <div className="space-y-3">
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => onChangeView('disclaimer')} 
                  className="hover:text-amber-500 transition cursor-pointer text-left"
                >
                  Disclaimer
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onChangeView('dmca')} 
                  className="hover:text-neko-500 transition cursor-pointer text-left"
                >
                  DMCA Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onChangeView('privacy')} 
                  className="hover:text-neko-purple transition cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-zinc-200">Pemberitahuan</h4>
            <p className="leading-relaxed">
              Semua media video dan gambar di situs ini di-host oleh pihak ketiga. Hak cipta sepenuhnya dilindungi oleh pemilik aslinya.
            </p>
          </div>
        </div>
        
        <div className="border-t border-zinc-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>&copy; 2026 Nekonime Streaming &amp; Animeto. Semua Hak Cipta Dilindungi.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
            <button onClick={() => onChangeView('disclaimer')} className="hover:text-amber-500 transition cursor-pointer">Disclaimer</button>
            <span className="text-zinc-800 select-none hidden sm:inline">|</span>
            <button onClick={() => onChangeView('dmca')} className="hover:text-neko-500 transition cursor-pointer">DMCA Policy</button>
            <span className="text-zinc-800 select-none hidden sm:inline">|</span>
            <button onClick={() => onChangeView('privacy')} className="hover:text-neko-purple transition cursor-pointer">Privacy Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
