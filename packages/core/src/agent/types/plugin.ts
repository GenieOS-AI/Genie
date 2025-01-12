import { Agent } from './agent';
import { BaseTool } from '../plugins/tools/BaseTool';

/**
 * Metadata information for a plugin
 */
export interface PluginMetadata {
  /** Unique name of the plugin */
  name: string;
  /** Semantic version of the plugin */
  version: string;
  /** Description of what the plugin does */
  description: string;
  /** Optional author of the plugin */
  author?: string;
}

/**
 * Configuration options for plugins
 */
export interface PluginOptions {
  /** Plugin-specific configuration options */
  [key: string]: any;
}

/**
 * Plugin callback data structure
 */
export interface PluginCallbackData {
  /** Tool-specific data if the callback is from a tool */
  tool?: {
    name: string;
    input: Record<string, unknown>;
    output: string;
  };
  /** Any additional data */
  [key: string]: unknown;
}

/**
 * Plugin callback function type
 */
export type PluginCallback = (pluginName: string, data: PluginCallbackData) => void;

/**
 * Core plugin interface that all plugins must implement
 */
export interface Plugin {
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** List of tools provided by this plugin */
  tools: BaseTool<any>[];
  /** Initialize the plugin and its tools */
  initialize(agent: Agent): Promise<void>;
  /** Check if the plugin has an agent */
  existAgent(): boolean;
  /** Set the plugin callback */
  setCallback(callback: PluginCallback): void;
  /** Clean up any resources used by the plugin */
  cleanup?(): Promise<void>;
} 