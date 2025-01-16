import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { IAgent, AgentContext, AgentDependencies, } from './types/agent';
import { ModelProvider , ModelConfig} from './types/model';
import { getModelConfig } from './config';
import { SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { IHandler, IHandlerRequest } from '../services/types/handler';
import { IHandlerResponse } from '../services/types/handler';
import { AgentPluginConfig, IPlugin} from './types';
import { findServiceConfig, findPluginConfig, getModelApiKey, getModelSettings } from '../utils/agent';
import { IService } from '../services/types/service';
import { logger } from '../utils';

export class Agent implements IAgent {
  public readonly id: string;
  public readonly dependencies: AgentDependencies;
  public readonly model: {
    config: ModelConfig;
    provider: ModelProvider;
  };
  public readonly plugins: IPlugin[];
  public readonly services: IService[];
  public readonly context: AgentContext = {
    model: null as unknown as ChatOpenAI,
    tools: [],
  };
  public readonly chatTemplate?: ChatPromptTemplate;
  public readonly systemMessage?: string;
  
  constructor(config: {
    model: {
      config: ModelConfig;
      provider: ModelProvider;
    };
    plugins?: IPlugin[];
    services?: IService[];
    chatTemplate?: ChatPromptTemplate;
    systemMessage?: string;
  }, dependencies: AgentDependencies) {
    this.id = uuidv4();
    this.model = config.model;
    this.plugins = config.plugins ?? [];
    this.services = config.services ?? [];
    this.dependencies = dependencies;
    this.chatTemplate = config.chatTemplate;
    this.systemMessage = config.systemMessage;
    this.context.tools = [];
  }
   

  private async initializeServices(
    pluginConfig?: AgentPluginConfig
  ): Promise<IHandler<IHandlerRequest, IHandlerResponse>[]> {
    if (!this.services?.length) {
      logger.debug('No services to initialize');
      return [];
    }
    
    const handlers: IHandler<IHandlerRequest, IHandlerResponse>[] = [];
    
    await Promise.all(
      this.services.map(async service => {
        logger.info(`Initializing service: ${service.metadata.name}`);
        const serviceConfig = findServiceConfig(service.metadata.name, pluginConfig);
        const toolConfigs = serviceConfig?.tools.map(tool => ({
            name: tool.name,
            enabled: tool.enabled,
            networks: tool.networks,
            priority: tool.priority 
          })) ?? [];
        await service.initialize(toolConfigs);
        handlers.push(...service.handlers);
        logger.debug(`Service ${service.metadata.name} initialized with ${service.handlers.length} handlers`);
      })
    );
    
    return handlers;
  }

  private async initializePlugins(
    handlers: IHandler<IHandlerRequest, IHandlerResponse>[],
    pluginConfig?: AgentPluginConfig
  ): Promise<void> {
    if (!this.plugins?.length) {
      logger.debug('No plugins to initialize');
      return;
    }

    await Promise.all(
      this.plugins.map(async plugin => {
        const config = findPluginConfig(plugin.metadata.name, pluginConfig);
        await plugin.initialize(this, handlers);
        
        if (!plugin.existAgent()) {
          const error = `Plugin ${plugin.metadata.name} failed to initialize properly`;
          logger.error(error);
          throw new Error(error);
        }

        if (!plugin.tools?.length) {
          logger.debug(`Plugin ${plugin.metadata.name} has no tools`);
          return;
        }
  
        const toolsToAdd = config?.tools 
          ? plugin.tools.filter(tool => config?.tools?.includes(tool.name))
          : plugin.tools;
        
        this.context.tools.push(...toolsToAdd);
        logger.debug(`Added ${toolsToAdd.length} tools from plugin ${plugin.metadata.name}`);
      })
    );
  }

  private initializeModel(modelConfig: ModelConfig): void {
    logger.info(`Initializing model: ${this.model.config.model}`);
    const apiKey = getModelApiKey(modelConfig, this.model.provider);
    const settings = getModelSettings(modelConfig, this.model.config.settings);
    
    this.context.model = new ChatOpenAI({
      ...(apiKey && { openAIApiKey: apiKey }),
      modelName: this.model.config.model,
      ...settings
    });
    logger.debug('Model initialized successfully');
  }

  private async initializeAgent(): Promise<void> {
    logger.info('Initializing agent executor');
    const systemMessage = new SystemMessage(
      this.systemMessage ?? "You are a helpful AI assistant that can use tools to accomplish tasks. " +
      "Always use tools when available and appropriate for the task."
    );

    const prompt = this.chatTemplate ?? ChatPromptTemplate.fromMessages([
      systemMessage,
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad")
    ]);

    const agent = await createOpenAIToolsAgent({
      llm: this.context.model,
      tools: this.context.tools as any[],
      prompt
    });

    this.context.executor = new AgentExecutor({
      agent,
      tools: this.context.tools as any[],
      verbose: this.model.config.settings?.verbose
    });
    logger.debug('Agent executor initialized successfully');
  }

  async initialize(pluginConfig?: AgentPluginConfig): Promise<void> {
    try {
      logger.info(`Initializing agent with ID: ${this.id}`);
      
      // Initialize services and get handlers
      const handlers = await this.initializeServices(pluginConfig);
      logger.debug(`Initialized ${handlers.length} handlers from services`);
      
      // Initialize plugins with handlers
      await this.initializePlugins(handlers, pluginConfig);
      logger.debug(`Initialized ${this.plugins.length} plugins`);
      
      // Initialize model
      const modelConfig = getModelConfig(this.model.provider);
      this.initializeModel(modelConfig);
      
      // Initialize agent with tools
      await this.initializeAgent();
      logger.info('Agent initialization completed successfully');
    } catch (error: unknown) {
      const errorMessage = `Failed to initialize agent: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async execute(input: string): Promise<string> {
    if (!this.context.executor) {
      const error = 'Agent not initialized. Call initialize() first.';
      logger.error(error);
      throw new Error(error);
    }

    logger.info('Executing agent with input:', input);
    const result = await this.context.executor.invoke({
      input,
    });
    logger.debug('Agent execution completed');

    return result.output;
  }
} 