export type MediaType = 'video' | 'audio' | 'hls' | 'radio';

export interface MediaItem {
  id: string;
  title: string;
  src: string;
  type: MediaType;
  genre: string;
  show?: string;
  subtitles?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}