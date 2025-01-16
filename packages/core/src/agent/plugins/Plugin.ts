import { IPlugin, PluginMetadata, PluginOptions, PluginCallback, PluginCallbackData } from '../types/plugin';
import { IHandler, IHandlerRequest } from '../../services/types/handler';
import { IHandlerResponse } from '../../services/types/handler';
import { IAgent, ToolInput, ToolOutput } from '../types';
import { Tool } from './tools/Tool';
import { logger } from '../../utils';

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
    logger.debug(`Creating plugin: ${metadata.name}`, { version: metadata.version });
    this.metadata = metadata;
    this.options = options;
    this.toolClasses = tools;
  }

  /**
   * Clean up any resources used by the plugin
   */
  cleanup?(): Promise<void> {
    logger.debug(`Cleaning up plugin: ${this.metadata.name}`);
    throw new Error('Method not implemented.');
  }

  /**
   * Initialize the plugin with an agent instance
   * Must be called before using any plugin functionality
   */
  public existAgent(): boolean {
    const exists = !!this.agent;
    if (!exists) {
      logger.warn(`Agent not set for plugin: ${this.metadata.name}`);
    }
    return exists;
  }

  public async initialize(agent: IAgent, handlers: IHandler<IHandlerRequest, IHandlerResponse>[]): Promise<void> {
    logger.info(`Initializing plugin: ${this.metadata.name}`);
    logger.info(`Handlers: ${handlers.map(handler => handler.constructor.name).join(', ')}`);

    this.agent = agent;
    
    // Initialize tools after agent is set
    logger.debug(`Initializing ${this.toolClasses.length} tools for plugin: ${this.metadata.name}`);
    this._tools = await Promise.all(this.toolClasses.map(async Tool => {
      const tool = new Tool(agent, this.handleToolCallback.bind(this));
      // Find matching handlers for this tool
      const toolHandlers = handlers.filter(handler => handler.tool_name === tool.name);
      if (toolHandlers.length > 0) {
        logger.debug(`Found ${toolHandlers.length} handlers for tool: ${tool.name}`);
        await tool.initialize(toolHandlers);
      } else {
        logger.warn(`No handlers found for tool: ${tool.name}`);
      }
      return tool;
    }));
    logger.info(`Plugin ${this.metadata.name} initialized with ${this._tools.length} tools: ${this._tools.map(tool => tool.name).join(', ')}`);
  }

  /**
   * Set the plugin callback
   */
  public setCallback(callback: PluginCallback): void {
    logger.debug(`Setting callback for plugin: ${this.metadata.name}`);
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
    logger.debug(`Tool callback received for ${toolName}`, { input, output });
    if (this._callback) {
      const data: PluginCallbackData = {
        tool: {
          name: toolName,
          input,
          output
        }
      };
      this._callback(this.metadata.name, data);
      logger.debug(`Callback executed for plugin: ${this.metadata.name}`);
    } else {
      logger.debug(`No callback registered for plugin: ${this.metadata.name}`);
    }
  }
} 