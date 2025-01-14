import { Plugin, PluginMetadata, PluginOptions, PluginCallback, PluginCallbackData } from '../types/plugin';
import { Agent } from '../types/agent';
import { BaseTool } from './tools/BaseTool';
import { Handler } from '../../services';
import { IHandlerRequest } from '../../services/types/handler';
import { IHandlerResponse } from '../../services/types/handler';
import { ToolInput, ToolOutput } from '../types';
import { log } from 'console';

type ToolClass = new (
  agent: Agent,
  callback?: (toolName: string, input: any, output: any) => void
) => BaseTool<any, any, any>;

/**
 * Base plugin class that implements the Plugin interface
 * Provides common functionality for managing tools and plugin lifecycle
 */
export abstract class BasePlugin implements Plugin {
  public readonly metadata: PluginMetadata;
  protected options: PluginOptions;
  protected _tools: BaseTool<ToolInput, ToolOutput, Handler<IHandlerRequest, IHandlerResponse>>[] = [];
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

  public async initialize(agent: Agent, handlers: Handler<IHandlerRequest, IHandlerResponse>[]): Promise<void> {
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
    this.callback = callback;
  }

  /**
   * Get all tools provided by this plugin
   */
  get tools(): BaseTool<any, any, Handler<IHandlerRequest, IHandlerResponse>>[] {
    return this._tools;
  }

  /**
   * Handle tool execution callback
   */
  protected handleToolCallback(toolName: string, input: ToolInput, output: ToolOutput): void {
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