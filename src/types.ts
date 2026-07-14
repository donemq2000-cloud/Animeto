export interface Comment {
  name: string;
  avatarBg: string;
  text: string;
  date: string;
  spoiler: boolean;
}

export interface Anime {
  id: string;
  title: string;
  rating: string;
  episodes: number;
  status: 'Ongoing' | 'Completed';
  studio: string;
  genres: string[];
  image: string;
  synopsis: string;
  videoUrl: string;
  isPopular: boolean;
  comments?: Comment[];
  episodeUrls?: { [episodeNum: string]: string };
}

export interface User {
  email: string;
  password?: string;
  username: string;
  avatarBg: string;
  role: 'Standard User' | 'Premium' | 'Moderator' | 'Admin';
  isBlocked?: boolean;
}

export interface SystemSettings {
  metaTitle: string;
  metaDesc: string;
  streamServer: string;
  maintenanceMode: string;
  showBannerAd: boolean;
  showPopunderAd: boolean;
}

export type ViewType = 'home' | 'watch' | 'watchlist' | 'admin' | 'disclaimer' | 'dmca' | 'privacy';
export type AdminTabType = 'anime' | 'users' | 'ads' | 'seo';
