export interface DebugMetrics {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface Flashcard {
  id: number;
  front: string; // The Term (e.g. "Chain Rule")
  back: string;  // The Definition/Formula
  category: string; // e.g. "Calculus"
}

export type GenerationMode = 'PROBLEM' | 'FLASHCARDS' | 'QUIZ';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
}

export interface MathProblemState {
  mode: GenerationMode; // Track which mode generated this data
  problem: string | null;
  difficultyAnalysis: string | null;
  solution: string | null;
  finalResult: string | null;
  pythonCode: string | null;
  rawResponse: string | null;
  // Hybrid Architecture Debug Data
  analystReport?: string | null;
  debugPrompt?: string | null;
  debugMetrics?: DebugMetrics | null;
  // Interactive Features
  flashcards?: Flashcard[] | null;
  quiz?: QuizQuestion[] | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  topic: string;
  data: MathProblemState;
}

export interface GeneratedImage {
  url: string;
  loading: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING_PROBLEM = 'GENERATING_PROBLEM',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface FileData {
  name: string;
  base64: string;
  mimeType: string;
}

export interface HintRequest {
  stepNumber: number;
  hintLevel: 'nudge' | 'partial' | 'full';
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface CacheEntry {
  key: string;
  data: MathProblemState;
  timestamp: number;
}