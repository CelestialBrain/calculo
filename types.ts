export interface DebugMetrics {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface MathProblemState {
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