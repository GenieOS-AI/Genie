import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { Agent, AgentContext, AgentDependencies, } from './types/agent';
import { ModelProvider , ModelConfig} from './types/model';
import { getModelConfig } from './config';
import { SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { Handler, Service } from '../services';
import { IHandlerRequest } from '../services/types/handler';
import { IHandlerResponse } from '../services/types/handler';
import { AgentPluginConfig, Plugin} from './types';
import { findServiceConfig, findPluginConfig, getModelApiKey, getModelSettings } from '../utils/agent';

export class BaseAgent implements Agent {
  public readonly id: string;
  public readonly dependencies: AgentDependencies;
  public readonly model: {
    config: ModelConfig;
    provider: ModelProvider;
  };
  public readonly plugins: Plugin[];
  public readonly services: Service[];
  public context: AgentContext = {
    model: null as unknown as ChatOpenAI,
    tools: [],
  };
  public chatTemplate?: ChatPromptTemplate;
  
  constructor(config: {
    model: {
      config: ModelConfig;
      provider: ModelProvider;
    };
    plugins?: Plugin[];
    services?: Service[];
    chatTemplate?: ChatPromptTemplate;
  }, dependencies: AgentDependencies) {
    this.id = uuidv4();
    this.model = config.model;
    this.plugins = config.plugins ?? [];
    this.services = config.services ?? [];
    this.dependencies = dependencies;
    this.chatTemplate = config.chatTemplate;
    this.context.tools = [];
  }
   

  private async initializeServices(
    pluginConfig?: AgentPluginConfig
  ): Promise<Handler<IHandlerRequest, IHandlerResponse>[]> {
    if (!this.services?.length) return [];
    
    const handlers: Handler<IHandlerRequest, IHandlerResponse>[] = [];
    
    await Promise.all(
      this.services.map(async service => {
        const serviceConfig = findServiceConfig(service.metadata.name, pluginConfig);
        const toolConfigs = serviceConfig?.tools.map(tool => ({
            name: tool.name,
            enabled: tool.enabled,
            networks: tool.networks,
            priority: tool.priority
          })) ?? [];
        
        await service.initialize(toolConfigs);
        handlers.push(...service.handlers);
      })
    );
    
    return handlers;
  }

  private async initializePlugins(
    handlers: Handler<IHandlerRequest, IHandlerResponse>[],
    pluginConfig?: AgentPluginConfig
  ): Promise<void> {
    if (!this.plugins?.length) return;

    await Promise.all(
      this.plugins.map(async plugin => {
        const config = findPluginConfig(plugin.metadata.name, pluginConfig);
        await plugin.initialize(this, handlers);
        
        if (!plugin.existAgent()) {
          throw new Error(`Plugin ${plugin.metadata.name} failed to initialize properly`);
        }

        if (!plugin.tools?.length) return;
  
        const toolsToAdd = config?.tools 
          ? plugin.tools.filter(tool => config?.tools?.includes(tool.name))
          : plugin.tools;
        
          this.context.tools.push(...toolsToAdd);
      })
    );
  }

  private initializeModel(modelConfig: ModelConfig): void {
    const apiKey = getModelApiKey(modelConfig, this.model.provider);
    const settings = getModelSettings(modelConfig, this.model.config.settings);
    
    this.context.model = new ChatOpenAI({
      ...(apiKey && { openAIApiKey: apiKey }),
      modelName: this.model.config.model,
      ...settings
    });
  }

  private async initializeAgent(): Promise<void> {
    const systemMessage = new SystemMessage(
      "You are a helpful AI assistant that can use tools to accomplish tasks. " +
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
  }

  async initialize(pluginConfig?: AgentPluginConfig): Promise<void> {
    try {
      // Initialize services and get handlers
      const handlers = await this.initializeServices(pluginConfig);
      // Initialize plugins with handlers
      await this.initializePlugins(handlers, pluginConfig);
      
      // Initialize model
      const modelConfig = getModelConfig(this.model.provider);
      this.initializeModel(modelConfig);
      
      // Initialize agent with tools
      await this.initializeAgent();
    } catch (error: unknown) {
      throw new Error(`Failed to initialize agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async execute(input: string): Promise<string> {
    if (!this.context.executor) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    const result = await this.context.executor.invoke({
      input,
    });

    return result.output;
  }
} 