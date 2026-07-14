import { Anime, User, SystemSettings } from './types';

export const ALL_GENRES = ["Semua", "Action", "Adventure", "Fantasy", "Sci-Fi", "Romance", "Slice of Life", "Mystery", "Comedy"];

export const INITIAL_ANIME_DATABASE: Anime[] = [
  {
    id: "neko-tabibito",
    title: "Neko no Tabibito: Journey of a Cat",
    rating: "9.2",
    episodes: 12,
    status: "Ongoing",
    studio: "Meow Production",
    genres: ["Adventure", "Fantasy", "Slice of Life"],
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    synopsis: "Mengisahkan petualangan seekor kucing ajaib bernama Kuro yang mampu berbicara bahasa manusia. Di dunia penuh fantasi, Kuro mengelilingi daratan misterius mencari tuannya yang hilang.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    isPopular: true,
    comments: [
      { name: "SoraChan", avatarBg: "bg-pink-500", text: "Visualnya gemesin banget, Kuro bener-bener pahlawan sejati!", date: "2 jam lalu", spoiler: false },
      { name: "WibuSepuh", avatarBg: "bg-purple-600", text: "Lagu openingnya candu parah sih, recommended!", date: "1 hari lalu", spoiler: false }
    ]
  },
  {
    id: "chrono-whispers",
    title: "Chrono Whispers: The Sound of Tomorrow",
    rating: "8.9",
    episodes: 24,
    status: "Ongoing",
    studio: "Future Lab Studio",
    genres: ["Sci-Fi", "Mystery", "Comedy"],
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    synopsis: "Saat frekuensi aneh masuk ke ponsel para remaja di Tokyo, mereka mulai mendengar percakapan masa depan mereka sendiri yang misterius.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    isPopular: true,
    comments: [
      { name: "Kuroneko", avatarBg: "bg-indigo-500", text: "Endingnya masih belum ketebak banget, plot twist melimpah!", date: "3 jam lalu", spoiler: true }
    ]
  },
  {
    id: "cyber-samurai-meow",
    title: "Cyber Samurai: Meow-01",
    rating: "9.5",
    episodes: 12,
    status: "Completed",
    studio: "Cyberpunk Studio",
    genres: ["Action", "Sci-Fi"],
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    synopsis: "Di tahun 2099, kota Neo-Kyoto dikuasai oleh konglomerat kejam. Seorang samurai robot berwajah kucing bertarung melawan tentara cyborg.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    isPopular: true,
    comments: []
  },
  {
    id: "hollow-knight-shinkai",
    title: "The Silent Forest: Whisper of Stars",
    rating: "9.1",
    episodes: 12,
    status: "Completed",
    studio: "Shinkai Lab",
    genres: ["Fantasy", "Romance", "Slice of Life"],
    image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=60",
    synopsis: "Di dalam hutan kuno yang tertutup salju abadi, dua petualang muda tak sengaja membangkitkan bintang jatuh yang membawa pesan penting tentang masa lalu dunia.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    isPopular: false,
    comments: []
  },
  {
    id: "mecha-strike-origin",
    title: "Mecha Strike: Zero Gravity",
    rating: "8.7",
    episodes: 12,
    status: "Ongoing",
    studio: "Trigger-X",
    genres: ["Action", "Sci-Fi", "Comedy"],
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=60",
    synopsis: "Seorang pilot mecha pemula terpaksa bekerja sama dengan kecerdasan buatan sarkastik untuk bertahan hidup di garis depan perang koloni angkasa.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    isPopular: false,
    comments: []
  }
];

export const DEFAULT_USERS: User[] = [
  { email: "wibu@nekonime.com", password: "wibu123", username: "WibuSepuh", avatarBg: "bg-purple-600", role: "Premium" },
  { email: "admin@nekonime.com", password: "admin123", username: "AdminNeko", avatarBg: "bg-pink-500", role: "Admin" }
];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  metaTitle: "Nekonime - Website Stream Anime Terbaik",
  metaDesc: "Nekonime merupakan website portal streaming anime gratis kualitas HD Bahasa Indonesia.",
  streamServer: "Native-Custom",
  maintenanceMode: "false",
  showBannerAd: true,
  showPopunderAd: true
};

export function getInitialData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading key ${key} from localStorage:`, error);
  }
  return defaultValue;
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key ${key} to localStorage:`, error);
  }
}
