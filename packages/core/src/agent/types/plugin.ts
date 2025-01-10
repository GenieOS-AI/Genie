import { Tool } from '@langchain/core/tools';

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
 * Core plugin interface that all plugins must implement
 */
export interface Plugin {
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** List of tools provided by this plugin */
  tools: Tool[];
  /** Initialize the plugin and its tools */
  initialize?(): Promise<void>;
  /** Clean up any resources used by the plugin */
  cleanup?(): Promise<void>;
} 