import { IPlugin, PluginMetadata, PluginOptions, PluginCallback, PluginCallbackData } from '../types/plugin';
import { IHandler, IHandlerRequest } from '../../services/types/handler';
import { IHandlerResponse } from '../../services/types/handler';
import { IAgent, ToolInput, ToolOutput } from '../types';
import { Tool } from './tools/Tool';

type ToolClass = new (
  agent: IAgent,
  callback?: (toolName: string, input: any, output: any) => void
) => Tool<any, any, any>;

/**
 * Base plugin class that implements the Plugin interface
 * Provides common functionality for managing tools and plugin lifecycle
 */
export abstract class Plugin implements IPlugin {
  public readonly metadata: PluginMetadata;
  public readonly options: PluginOptions;
  protected _tools: Tool<ToolInput, ToolOutput, IHandler<IHandlerRequest, IHandlerResponse>>[] = [];
  protected agent!: IAgent;
  protected _callback?: PluginCallback;
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
   * Clean up any resources used by the plugin
   */
  cleanup?(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * Initialize the plugin with an agent instance
   * Must be called before using any plugin functionality
   */
  public existAgent(): boolean {
    return !!this.agent;
  }

  public async initialize(agent: IAgent, handlers: IHandler<IHandlerRequest, IHandlerResponse>[]): Promise<void> {
    this.agent = agent;
    // Initialize tools after agent is set
    this._tools = await Promise.all(this.toolClasses.map(async Tool => {
      const tool = new Tool(agent, this.handleToolCallback.bind(this));
      // Find matching handlers for this tool
      const toolHandlers = handlers.filter(handler => handler.tool_name === tool.name);
      if (toolHandlers.length > 0) {
        await tool.initialize(toolHandlers);
      }
      return tool;
    }));
  }

  /**
   * Set the plugin callback
   */
  public setCallback(callback: PluginCallback): void {
    this._callback = callback;
  }

  /**
   * Get all tools provided by this plugin
   */
  get tools(): Tool<any, any, IHandler<IHandlerRequest, IHandlerResponse>>[] {
    return this._tools;
  }

  /**
   * Handle tool execution callback
   */
  protected handleToolCallback(toolName: string, input: ToolInput, output: ToolOutput): void {
    if (this._callback) {
      const data: PluginCallbackData = {
        tool: {
          name: toolName,
          input,
          output
        }
      };
      this._callback(this.metadata.name, data);
    }
  }
} 