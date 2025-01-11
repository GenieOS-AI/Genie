import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { Agent, AgentConfig, AgentContext, AgentDependencies } from './types/agent';
import { ModelProvider } from './types/model';
import { getModelConfig } from './config';
import { Tool } from '@langchain/core/tools';
import { BufferMemory } from 'langchain/memory';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { env } from '../environment';

export class BaseAgent implements Agent {
  public readonly id: string;
  public readonly config: AgentConfig;
  public readonly dependencies: AgentDependencies;
  public context: AgentContext = {
    model: null as unknown as ChatOpenAI,
    tools: [],
  };

  constructor(config: AgentConfig, dependencies: AgentDependencies) {
    this.id = uuidv4();
    this.config = config;
    this.dependencies = dependencies;
    this.context.tools = [];
  }

  async initialize(): Promise<void> {
    // Initialize plugins first if they have initialization logic
    if (this.config.plugins) {
      await Promise.all(
        this.config.plugins.map(async plugin => {
          await plugin.initialize(this);
          if (!plugin.existAgent()) {
            throw new Error('Agent not found after plugin initialization');
          }
          // Add tools after plugin is initialized
          if (plugin.tools) {
            this.context.tools.push(...plugin.tools);
          }
        })
      );
    }

    const modelConfig = getModelConfig(this.config.provider);
    
    let apiKey: string | undefined;
    if (modelConfig.apiKeyEnvVarName) {
      apiKey = env.get(modelConfig.apiKeyEnvVarName);
      if (!apiKey) {
        throw new Error(`API key not found in environment for provider ${this.config.provider} (${modelConfig.apiKeyEnvVarName})`);
      }
    }

    // Initialize the language model based on provider
    switch (this.config.provider) {
      case ModelProvider.OPENAI:
        this.context.model = new ChatOpenAI({
          ...(apiKey && { openAIApiKey: apiKey }),
          modelName: this.config.model,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        });
        break;
      default:
        this.context.model = new ChatOpenAI({
          ...(apiKey && { openAIApiKey: apiKey }),
          modelName: this.config.model,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        });
        break;
    }

    // Initialize agent executor with memory
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
    });

    const systemMessage = new SystemMessage(
      "You are a helpful AI assistant that can use tools to accomplish tasks. " +
      "Always use tools when available and appropriate for the task."
    );

    const prompt = this.config.chatTemplate ?? ChatPromptTemplate.fromMessages([
      systemMessage,
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad")
    ]);

    const agent = await createOpenAIToolsAgent({
      llm: this.context.model,
      tools: this.context.tools,
      prompt: prompt,
    });

    this.context.executor = new AgentExecutor({
      agent,
      tools: this.context.tools,
      memory,
      verbose: this.config.verbose,
    });
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

  addTool(tool: Tool): void {
    this.context.tools.push(tool);
    // Reinitialize agent if it was already initialized to include new tool
    if (this.context.executor) {
      this.initialize();
    }
  }

  removeTool(toolName: string): void {
    this.context.tools = this.context.tools.filter(tool => tool.name !== toolName);
    // Reinitialize agent if it was already initialized to update tools
    if (this.context.executor) {
      this.initialize();
    }
  }
} 