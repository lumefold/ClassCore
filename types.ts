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
  currentView: 'dashboard' | 'lecture' | 'create';
  selectedLectureId: string | null;
}
