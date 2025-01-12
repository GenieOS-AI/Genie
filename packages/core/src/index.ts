export * from './environment';
export * from './agent';
export * from './wallet';
export * from './network';

export const VERSION = '0.0.1-alpha.0';

export function initialize() {
  return {
    version: VERSION,
    timestamp: new Date().toISOString()
  };
} 