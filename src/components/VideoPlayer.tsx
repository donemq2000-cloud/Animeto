import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, ChevronUp, RefreshCw, Lock, Unlock } from 'lucide-react';
import { Anime } from '../types';

interface VideoPlayerProps {
  anime: Anime;
  episode: number;
}

export default function VideoPlayer({ anime, episode }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const currentVideoUrl = anime.episodeUrls?.[episode.toString()] || anime.videoUrl;

  const isEmbedContent = (url: string) => {
    if (!url) return false;
    const lower = url.trim().toLowerCase();
    return lower.startsWith('<iframe') || lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('embed') || (lower.startsWith('http') && !lower.endsWith('.mp4'));
  };

  const getIframeSrcAndHtml = (url: string) => {
    if (!url) return { isHtml: false, src: '' };
    
    const trimmed = url.trim();
    if (trimmed.startsWith('<iframe') && trimmed.includes('src=')) {
      const match = trimmed.match(/src="([^"]+)"/);
      if (match && match[1]) {
        return { isHtml: true, rawHtml: trimmed, src: match[1] };
      }
      return { isHtml: true, rawHtml: trimmed, src: '' };
    }
    
    if (trimmed.includes('youtube.com/watch?v=')) {
      const videoId = trimmed.split('v=')[1]?.split('&')[0];
      return { isHtml: false, src: `https://www.youtube.com/embed/${videoId}` };
    } else if (trimmed.includes('youtu.be/')) {
      const videoId = trimmed.split('youtu.be/')[1]?.split('?')[0];
      return { isHtml: false, src: `https://www.youtube.com/embed/${videoId}` };
    }
    
    return { isHtml: false, src: trimmed };
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderText, setLoaderText] = useState('Menghubungkan Server NekoStream...');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const [speed, setSpeed] = useState(1.0);
  const [quality, setQuality] = useState('720p');
  
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const [hasError, setHasError] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);

  const [activePlayer, setActivePlayer] = useState<'html5' | 'iframe'>(
    isEmbedContent(currentVideoUrl) ? 'iframe' : 'html5'
  );

  // Android & Mobile specific optimizations
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{ visible: boolean; text: string; side: 'left' | 'right' }>({
    visible: false,
    text: '',
    side: 'left'
  });
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  const handleMouseMove = () => {
    if (isLocked) return;
    setShowControls(true);
    resetControlsTimeout();
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isLocked]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) {
      setShowControls(true);
      resetControlsTimeout();
      return;
    }

    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const isLeftSide = clickX < width / 2;

    if (lastTapRef.current && (now - lastTapRef.current.time) < 300) {
      e.preventDefault();
      e.stopPropagation();
      handleDoubleTapSeek(isLeftSide ? 'left' : 'right');
      lastTapRef.current = null;
      return;
    }

    lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
    setShowControls(prev => !prev);
  };

  const handleDoubleTapSeek = (side: 'left' | 'right') => {
    if (isLocked) return;
    
    const seekAmount = 10;
    const targetDuration = duration || 0;
    let targetTime = currentTime;

    if (side === 'left') {
      targetTime = Math.max(0, currentTime - seekAmount);
      setDoubleTapFeedback({ visible: true, text: '-10s', side: 'left' });
    } else {
      targetTime = Math.min(targetDuration, currentTime + seekAmount);
      setDoubleTapFeedback({ visible: true, text: '+10s', side: 'right' });
    }

    if (useSimulation) {
      setCurrentTime(targetTime);
    } else {
      const video = videoRef.current;
      if (video) {
        video.currentTime = targetTime;
        setCurrentTime(targetTime);
      }
    }

    setTimeout(() => {
      setDoubleTapFeedback(prev => ({ ...prev, visible: false }));
    }, 800);

    setShowControls(true);
    resetControlsTimeout();
  };

  // Trigger loader on anime videoUrl change
  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(true);
    setLoaderText('Menghubungkan Server NekoStream...');
    setHasError(false);
    setUseSimulation(false);
    setCurrentTime(0);
    setDuration(0);
    setActivePlayer(isEmbedContent(currentVideoUrl) ? 'iframe' : 'html5');
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentVideoUrl, episode]);

  // Simulated playback tick
  useEffect(() => {
    if (!useSimulation || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1 * speed;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [useSimulation, isPlaying, speed, duration]);

  // Click outside to close custom menus
  useEffect(() => {
    function handleClickOutside() {
      setShowSpeedMenu(false);
      setShowQualityMenu(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (useSimulation) {
      setIsPlaying(!isPlaying);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setUseSimulation(true);
      setIsPlaying(true);
      if (!duration || isNaN(duration)) {
        setDuration(1440);
      }
      return;
    }

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        setHasError(false);
      }).catch((err) => {
        console.error("Video play failed:", err instanceof Error ? err.message : String(err));
        setHasError(true);
        setUseSimulation(true);
        setIsPlaying(true);
        if (!duration || isNaN(duration)) {
          setDuration(1440);
        }
      });
    }
  };

  const handleVideoError = () => {
    console.warn("Video element load error, switching to NekoStream interactive simulation.");
    setHasError(true);
    setUseSimulation(true);
    if (!duration || isNaN(duration)) {
      setDuration(1440);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressEl = progressRef.current;
    if (!progressEl || !duration) return;

    const rect = progressEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    
    const targetTime = Math.max(0, Math.min(percentage * duration, duration));

    if (useSimulation) {
      setCurrentTime(targetTime);
    } else {
      const video = videoRef.current;
      if (video) {
        video.currentTime = targetTime;
        setCurrentTime(targetTime);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const targetMuted = !isMuted;
    setIsMuted(targetMuted);
    video.muted = targetMuted;
  };

  const handleSpeedSelect = (selectedSpeed: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeed(selectedSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = selectedSpeed;
    }
    setShowSpeedMenu(false);
  };

  const handleQualitySelect = (selectedQuality: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuality(selectedQuality);
    setShowQualityMenu(false);
    
    // Simulate resolution reload buffer
    setIsLoading(true);
    setLoaderText(`Mengubah resolusi ke ${selectedQuality}...`);
    
    const curr = useSimulation ? currentTime : (videoRef.current ? videoRef.current.currentTime : 0);
    const playingBefore = isPlaying;

    if (!useSimulation && videoRef.current) {
      videoRef.current.pause();
    }

    setTimeout(() => {
      setIsLoading(false);
      if (useSimulation) {
        setCurrentTime(curr);
        if (playingBefore) {
          setIsPlaying(true);
        }
      } else if (videoRef.current) {
        videoRef.current.currentTime = curr;
        if (playingBefore) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
            console.error("Video play failed after quality change:", err);
            setUseSimulation(true);
            setIsPlaying(true);
          });
        }
      }
    }, 1000);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        alert("Fullscreen error: " + err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  // Render correct volume icon
  const renderVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5 text-red-500" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5 text-zinc-300" />;
    return <Volume2 className="w-5 h-5 text-white" />;
  };

  return (
    <div className="space-y-3">
      {/* Player Mode Selector Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActivePlayer('html5')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activePlayer === 'html5'
              ? 'bg-gradient-to-r from-neko-500 to-neko-purple text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          NekoStream Player (Direct)
        </button>
        <button
          type="button"
          onClick={() => setActivePlayer('iframe')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activePlayer === 'iframe'
              ? 'bg-gradient-to-r from-neko-500 to-neko-purple text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Player Embed / Iframe
        </button>
      </div>

      {activePlayer === 'iframe' ? (
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 group">
          {(() => {
            const embedInfo = getIframeSrcAndHtml(currentVideoUrl);
            return (
              <iframe
                src={embedInfo.src}
                title={anime.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer"
              />
            );
          })()}
          {/* Info overlay */}
          <div className="absolute top-4 left-4 flex gap-2 pointer-events-none select-none">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur border border-zinc-800">
              🔗 External Source
            </span>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 group select-none"
          onClick={handleContainerClick}
          onMouseMove={handleMouseMove}
          onTouchStart={handleMouseMove}
        >
          {/* HTML5 video element */}
          <video
            ref={videoRef}
            src={currentVideoUrl}
            poster={anime.image}
            className={`w-full h-full object-cover block cursor-pointer ${useSimulation ? 'hidden' : 'block'}`}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onError={handleVideoError}
          />

          {useSimulation && (
            <div className="absolute inset-0 w-full h-full select-none bg-zinc-950 flex flex-col justify-between items-center overflow-hidden">
              {/* Blurred Background Poster */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-25 scale-105 pointer-events-none"
                style={{ backgroundImage: `url(${anime.image})` }}
              />
              
              {/* Subtle grid lines & sci-fi overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.3)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
              
              {/* Scanlines effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none" />

              {/* Central content */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 w-full max-w-md">
                {/* Poster thumbnail with pulse */}
                <div className="relative mb-3 group/poster">
                  <div className={`absolute -inset-1.5 bg-gradient-to-r from-neko-purple to-neko-500 rounded-xl blur opacity-60 ${isPlaying ? 'animate-pulse' : ''}`} />
                  <img 
                    src={anime.image} 
                    alt={anime.title} 
                    className="relative w-40 h-24 object-cover rounded-lg border border-zinc-700 shadow-xl"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-300 bg-black/60 px-2 py-0.5 rounded-full">
                      SIMULASI STEREO
                    </span>
                  </div>
                </div>

                {/* Simulated Stream Banner */}
                <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-3 shadow-lg w-full">
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">
                      {isPlaying ? 'Memutar Aliran NekoStream' : 'NekoStream Jeda'}
                    </span>
                  </div>
                  
                  <h3 className="text-xs font-bold text-zinc-100 line-clamp-1 mb-1">
                    {anime.title}
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Resolusi: <span className="text-neko-500 font-semibold">{quality}</span> • Kecepatan: <span className="text-zinc-300">{speed.toFixed(1)}x</span>
                  </p>

                  {/* Animated visualizer bars */}
                  <div className="flex items-end justify-center gap-1 h-8 mt-3">
                    {Array.from({ length: 15 }).map((_, i) => {
                      const animDuration = 0.5 + Math.random() * 0.8;
                      const delay = Math.random() * 0.5;
                      return (
                        <div 
                          key={i} 
                          className="w-1.5 rounded-t bg-gradient-to-t from-neko-purple to-neko-500 origin-bottom"
                          style={{
                            height: isPlaying ? '100%' : '15%',
                            animation: isPlaying ? `bounceVisualizer ${animDuration}s ease-in-out ${delay}s infinite alternate` : 'none',
                            transition: 'height 0.3s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Sandbox Notice */}
                <p className="text-[9px] text-zinc-500 mt-2.5 max-w-xs leading-relaxed select-none">
                  ⚠️ Pemutar dialihkan ke simulasi interaktif karena proteksi sandbox iframe browser Anda membatasi pemutaran video langsung.
                </p>
              </div>

              <style>{`
                @keyframes bounceVisualizer {
                  0% { transform: scaleY(0.15); }
                  100% { transform: scaleY(1); }
                }
              `}</style>
            </div>
          )}

          {/* Double Tap Seek Feedback Overlay */}
          {doubleTapFeedback.visible && (
            <div className={`absolute top-0 bottom-0 ${doubleTapFeedback.side === 'left' ? 'left-0 rounded-l-2xl' : 'right-0 rounded-r-2xl'} w-1/3 bg-white/[0.03] flex flex-col items-center justify-center z-20 pointer-events-none transition-all duration-300 animate-pulse`}>
              <div className="w-16 h-16 rounded-full bg-black/75 border border-zinc-700/40 flex flex-col items-center justify-center text-white scale-105 shadow-xl">
                {doubleTapFeedback.side === 'left' ? (
                  <svg className="w-6 h-6 text-neko-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-neko-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                )}
                <span className="text-[10px] font-mono font-black mt-1 text-zinc-300">
                  {doubleTapFeedback.text}
                </span>
              </div>
            </div>
          )}

          {/* Lock screen Unlock Overlay */}
          {isLocked && showControls && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-45 bg-black/60 pointer-events-none">
              <button
                onClick={(e) => { e.stopPropagation(); setIsLocked(false); setShowControls(true); resetControlsTimeout(); }}
                className="pointer-events-auto w-14 h-14 bg-neko-purple/90 hover:bg-neko-purple border border-neko-purple/40 rounded-full flex items-center justify-center text-white shadow-lg shadow-neko-purple/30 active:scale-90 transition-all cursor-pointer"
                title="Buka Kunci Layar"
              >
                <Unlock className="w-6 h-6 text-white" />
              </button>
              <span className="mt-3 text-xs font-semibold text-zinc-300 bg-black/80 px-3.5 py-1.5 rounded-full border border-zinc-800 flex items-center gap-1.5 select-none shadow-md">
                <Lock className="w-3.5 h-3.5 text-neko-purple" /> Layar Terkunci • Klik tombol tengah untuk membuka
              </span>
            </div>
          )}

          {/* Left Floating Lock Button (Only when controls are active and NOT locked) */}
          {showControls && !isLocked && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsLocked(true); setShowControls(false); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 shadow-lg cursor-pointer pointer-events-auto"
              title="Kunci Layar Pemutar"
            >
              <Lock className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Custom controllers UI container */}
          <div 
            className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/20 to-black/65 transition-all duration-300 z-30 pointer-events-auto ${
              showControls && !isLocked ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-98'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Info Bar */}
            <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-100 drop-shadow shadow-black">
                {anime.title} - Eps {String(episode).padStart(2, '0')}
              </span>
              <span className="text-[10px] bg-neko-purple text-white font-bold px-2 py-0.5 rounded-full neon-glow-purple uppercase tracking-wider select-none">
                Server Utama
              </span>
            </div>

            {/* Big Centralized Play Button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {!isPlaying && !isLoading && (
                <button 
                  onClick={handlePlayPause}
                  className="w-16 h-16 rounded-full bg-neko-500/90 hover:bg-neko-500 text-white flex items-center justify-center transform transition duration-300 scale-95 hover:scale-105 opacity-100 pointer-events-auto shadow-lg cursor-pointer"
                >
                  <Play className="w-8 h-8 fill-current ml-1 text-white" />
                </button>
              )}
            </div>

            {/* Bottom Control Bar */}
            <div className="p-4 space-y-3 bg-gradient-to-t from-black/90 to-transparent">
              
              {/* Progress Slider Bar */}
              <div 
                ref={progressRef}
                onClick={handleSeek}
                className="relative group/progress cursor-pointer flex items-center py-1.5"
              >
                <div className="w-full bg-zinc-700/60 h-1.5 rounded-full relative overflow-hidden">
                  {/* Buffer Bar (Fake 92%) */}
                  <div className="absolute top-0 left-0 bg-zinc-500/30 h-full w-[92%]"></div>
                  {/* Real Progress Bar */}
                  <div 
                    className="absolute top-0 left-0 bg-gradient-to-r from-neko-purple to-neko-500 h-full transition-all duration-75"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                {/* Draggable indicator handle */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-white border-2 border-neko-500 shadow scale-0 group-hover/progress:scale-100 transition-transform duration-150"
                  style={{ left: `${progressPercentage}%` }}
                ></div>
              </div>

              {/* Control Trays */}
              <div className="flex items-center justify-between">
                
                {/* Left Controls */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handlePlayPause}
                    className="text-white hover:text-neko-500 transition cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current text-white" /> : <Play className="w-5 h-5 fill-current text-white" />}
                  </button>
                  
                  {/* Volume Controller with Horizontal Expand Slider */}
                  <div className="flex items-center gap-2 group/volume">
                    <button 
                      onClick={handleMuteToggle}
                      className="text-zinc-300 hover:text-white transition cursor-pointer"
                    >
                      {renderVolumeIcon()}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-12 sm:w-0 sm:group-hover/volume:w-16 h-1 bg-zinc-600 accent-neko-500 rounded-full transition-all duration-300 cursor-pointer"
                    />
                  </div>

                  {/* Time Display */}
                  <span className="text-xs text-zinc-300 font-mono select-none">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-4">
                  
                  {/* Playback speed selector dropdown */}
                  <div className="relative inline-block text-left">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                      className="text-xs text-zinc-300 hover:text-white font-semibold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{speed === 1.0 ? 'Normal' : `${speed.toFixed(1)}x`}</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-8 right-0 mb-2 w-24 bg-zinc-950 border border-zinc-800 rounded-lg py-1 shadow-xl text-center text-xs text-zinc-400 z-50">
                        {[0.5, 1.0, 1.5, 2.0].map((s) => (
                          <button 
                            key={s}
                            onClick={(e) => handleSpeedSelect(s, e)}
                            className={`w-full px-2 py-1.5 hover:bg-zinc-900 hover:text-white block cursor-pointer ${speed === s ? 'font-bold text-neko-500' : ''}`}
                          >
                            {s === 1.0 ? 'Normal' : `${s.toFixed(1)}x`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video Quality selector dropdown */}
                  <div className="relative inline-block text-left">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                      className="text-xs text-zinc-300 hover:text-white font-semibold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{quality}</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    {showQualityMenu && (
                      <div className="absolute bottom-8 right-0 mb-2 w-24 bg-zinc-950 border border-zinc-800 rounded-lg py-1 shadow-xl text-center text-xs text-zinc-400 z-50">
                        {['1080p HD', '720p', '480p'].map((q) => (
                          <button 
                            key={q}
                            onClick={(e) => handleQualitySelect(q.replace(' HD', ''), e)}
                            className={`w-full px-2 py-1.5 hover:bg-zinc-900 hover:text-white block cursor-pointer ${quality === q.replace(' HD', '') ? 'font-bold text-neko-500' : ''}`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen Button */}
                  <button 
                    onClick={handleFullscreen}
                    className="text-zinc-300 hover:text-white transition cursor-pointer" 
                    title="Fullscreen"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
