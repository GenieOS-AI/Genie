export interface BirdeyeConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface BirdeyeError extends Error {
  code?: string;
  statusCode?: number;
}

export * from './request';
export * from './response'; 