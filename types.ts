
export interface Flashcard {
  front: string;
  back: string;
}

export interface Takeaway {
  point: string;
  explanation: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface LectureData {
  id: string;
  title: string;
  date: string;
  durationSeconds: number;
  transcript: string; // HTML or Markdown string
  summary: string;
  takeaways: Takeaway[];
  flashcards: Flashcard[];
  confidenceScore: number; // 0-100
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface AppState {
  lectures: LectureData[];
  currentView: 'dashboard' | 'lecture' | 'create' | 'settings';
  selectedLectureId: string | null;
}

// --- Settings & Integrations Types ---

export type ThemeOption = 'light' | 'dark' | 'system';
export type FontSizeOption = 'small' | 'normal' | 'large';

export interface UserProfile {
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'other';
  bio: string;
  avatarUrl?: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter' | 'elevenlabs' | 'other';
  enabled: boolean;
  apiKey: string;
  apiKeyStored: 'local' | 'none'; // 'server' not used in this local-first version
  model?: string;
  baseUrl?: string; // For OpenRouter/Custom
  httpReferer?: string; // OpenRouter specific
  xTitle?: string; // OpenRouter specific
  lastTestedAt?: string | null;
}

export interface AppPreferences {
  theme: ThemeOption;
  fontSize: FontSizeOption;
  reducedMotion: boolean;
  defaultChunkLengthMinutes: number;
  autoGenerateFlashcards: boolean;
}

export interface Settings {
  profile: UserProfile;
  integrations: Record<string, IntegrationConfig>;
  preferences: AppPreferences;
}
