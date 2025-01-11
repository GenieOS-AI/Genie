import { Plugin, PluginMetadata, PluginOptions, PluginCallback, PluginCallbackData } from '../types/plugin';
import { Agent } from '../types/agent';
import { BaseTool } from './tools/BaseTool';

type ToolClass = new (agent: Agent, callback?: (toolName: string, input: Record<string, unknown>, output: string) => void) => BaseTool<any>;

/**
 * Base plugin class that implements the Plugin interface
 * Provides common functionality for managing tools and plugin lifecycle
 */
export abstract class BasePlugin implements Plugin {
  public readonly metadata: PluginMetadata;
  protected options: PluginOptions;
  protected _tools: BaseTool<any>[] = [];
  protected agent!: Agent;
  protected callback?: PluginCallback;
  private toolClasses: ToolClass[] = [];

  /**
   * Creates a new plugin instance
   * @param metadata Plugin metadata
   * @param tools Array of tool classes to instantiate
   * @param options Plugin-specific configuration options
   */
  constructor(
    metadata: PluginMetadata, 
    tools: ToolClass[] = [],
    options: PluginOptions = {}
  ) {
    this.metadata = metadata;
    this.options = options;
    this.toolClasses = tools;
  }

  /**
   * Initialize the plugin with an agent instance
   * Must be called before using any plugin functionality
   */
  public existAgent(): boolean {
    return !!this.agent;
  }

  public async initialize(agent: Agent): Promise<void> {
    this.agent = agent;
    // Initialize tools after agent is set
    this._tools = this.toolClasses.map(Tool => new Tool(agent, this.handleToolCallback.bind(this)));
  }

  /**
   * Set the plugin callback
   */
  public setCallback(callback: PluginCallback): void {
    this.callback = callback;
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
    if (this.callback) {
      const data: PluginCallbackData = {
        tool: {
          name: toolName,
          input,
          output
        }
      };
      this.callback(this.metadata.name, data);
    }
  }
} 