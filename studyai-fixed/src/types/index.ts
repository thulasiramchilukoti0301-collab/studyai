export interface StudyMaterial {
  id: string;
  name: string;
  text: string;
  type: 'pdf' | 'txt';
  size: string;
  uploadedAt: Date;
}

export interface Activity {
  id: string;
  type: 'flashcards' | 'session' | 'quiz' | 'summary';
  title: string;
  subtitle: string;
  time: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export type AiViewType = 'none' | 'summary' | 'quiz' | 'flashcards';
