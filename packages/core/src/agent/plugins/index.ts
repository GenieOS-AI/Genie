import { z } from 'zod';
export { BasePlugin } from './BasePlugin';

/**
 * Interface representing an example message for a tool
 */
export interface ToolExample {
  user: string;
  tool: {params: Record<string, unknown>};
}

/**
 * Interface for tool configuration including name, description, schema and examples
 */
export interface ToolConfig extends Record<string, unknown> {
  name: string;
  description: string;
  examples: ToolExample[];
}

export { BaseTool } from './tools/BaseTool'; 