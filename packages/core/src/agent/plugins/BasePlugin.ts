import { Plugin, PluginMetadata, PluginOptions } from '../types/plugin';
import { Agent } from '../types/agent';
import { BaseTool } from './tools/BaseTool';

type ToolClass = new (agent: Agent, callback?: (toolName: string, input: Record<string, unknown>, output: string) => void) => BaseTool<any>;

type PluginCallback = (pluginName: string, toolName: string, input: Record<string, unknown>, output: string) => void;

/**
 * Base plugin class that implements the Plugin interface
 * Provides common functionality for managing tools and plugin lifecycle
 */
export abstract class BasePlugin implements Plugin {
  public readonly metadata: PluginMetadata;
  protected options: PluginOptions;
  protected _tools: BaseTool<any>[] = [];
  protected agent: Agent;
  protected callback?: PluginCallback;
  private initPromise: Promise<void>;

  /**
   * Creates a new plugin instance
   * @param agent The agent instance this plugin is attached to
   * @param metadata Plugin metadata
   * @param tools Array of tool classes to instantiate
   * @param callback Optional callback function for tool execution
   * @param options Plugin-specific configuration options
   */
  constructor(
    agent: Agent, 
    metadata: PluginMetadata, 
    tools: ToolClass[] = [],
    callback?: PluginCallback,
    options: PluginOptions = {}
  ) {
    this.agent = agent;
    this.metadata = metadata;
    this.callback = callback;
    this.options = options;
    this._tools = tools.map(Tool => new Tool(agent, this.handleToolCallback.bind(this)));
    this.initPromise = this.initialize();
  }

  /**
   * Initialize the plugin
   * Override this method to add async initialization logic
   */
  public async initialize(): Promise<void> {
    // Override this method to add initialization logic
  }

  /**
   * Wait for plugin initialization to complete
   */
  public async ready(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Get all tools provided by this plugin
   */
  get tools(): BaseTool<any>[] {
    return this._tools;
  }

  /**
   * Handle tool execution callback
   */
  protected handleToolCallback(toolName: string, input: Record<string, unknown>, output: string): void {
    this.callback?.(this.metadata.name, toolName, input, output);
  }
} 