export * from './environment';

export const VERSION = '0.0.1-alpha.0';

export function initialize() {
  return {
    version: VERSION,
    timestamp: new Date().toISOString()
  };
} 