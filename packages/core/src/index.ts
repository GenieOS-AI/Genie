export * from './environment';
export * from './agent/plugins';
export * from './agent/types';

export const VERSION = '0.0.1-alpha.0';

export function initialize() {
  return {
    version: VERSION,
    timestamp: new Date().toISOString()
  };
} 