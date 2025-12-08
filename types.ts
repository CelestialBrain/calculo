export interface MathProblemState {
  problem: string | null;
  difficultyAnalysis: string | null;
  solution: string | null;
  finalResult: string | null;
  pythonCode: string | null;
  rawResponse: string | null;
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