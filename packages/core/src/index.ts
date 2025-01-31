export * from './environment';
export * from './agent';
export * from './wallet';
export * from './network';
export * from './services';
export * from './utils';
export * from './types';
export const VERSION = '0.0.2-aplha.0';

export function initialize() {
  return {
    version: VERSION,
    timestamp: new Date().toISOString()
  };
} 