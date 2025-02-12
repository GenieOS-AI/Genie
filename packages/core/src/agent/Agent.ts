import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { IAgent, AgentContext, AgentDependencies, SessionConfig } from './types/agent';
import { ModelProvider, ModelConfig } from './types/model';
import { getModelConfig } from './config';
import { AIMessage, BaseMessage, HumanMessage, MessageContent, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { IHandler, IHandlerRequest } from '../services/types/handler';
import { IHandlerResponse } from '../services/types/handler';
import { AgentPluginConfig, IPlugin } from './types';
import { findServiceConfig, findPluginConfig, getModelSettings } from '../utils/agent';
import { IService } from '../services/types/service';
import { logger } from '../utils';
import { Annotation, Command, CompiledStateGraph, END, interrupt, START, StateGraph } from '@langchain/langgraph';
import { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { ToolCall } from '@langchain/core/dist/messages/tool';
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

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
    workflow: null as unknown as StateGraph<any, any, any, any, any, any, any>,
    graph: null as unknown as CompiledStateGraph<any, any, any, any, any, any>,
    checkpoint: null as unknown as BaseCheckpointSaver,
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
    checkpoint?: BaseCheckpointSaver;
  }, dependencies: AgentDependencies) {
    this.id = uuidv4();
    this.model = config.model;
    this.plugins = config.plugins ?? [];
    this.services = config.services ?? [];
    this.dependencies = dependencies;
    this.chatTemplate = config.chatTemplate;
    this.systemMessage = config.systemMessage;
    this.context.tools = [];
    this.context.checkpoint = config.checkpoint;
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
    logger.info(`Initializing model: ${modelConfig.model}`);
    const apiKey = modelConfig.apiKey;
    const settings = getModelSettings(modelConfig, modelConfig.settings);

    this.context.model = new ChatOpenAI({
      ...(apiKey && { openAIApiKey: apiKey }),
      modelName: modelConfig.model,
      ...settings
    });
    logger.debug('Model initialized successfully');
  }

  private async initializeAgent(): Promise<void> {
    logger.info('Initializing agent');
    // const systemMessage = new SystemMessage(
    //   this.systemMessage ?? "You are a helpful AI assistant that can use tools to accomplish tasks. " +
    //   "Always use tools when available and appropriate for the task."
    // );

    type AgentState = typeof StateAnnotation.State;

    // Route after agent response - check for tool calls
    const routeAfterAgent = (state: AgentState) => {
      const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

      // If no tools are called, we can finish (respond to the user)
      if (!lastMessage?.tool_calls?.length) {
        return 'finalAnswer';
      }
      // Otherwise if there are tool calls, we continue to execute them
      return "tools";
    };

    // Route after tool execution - check for human review requirement
    const routeAfterTools = (state: AgentState) => {
      const lastMessage = state.messages[state.messages.length - 1] as ToolMessage;
      try {
        // Check if the tool response requires human confirmation
        if (typeof lastMessage.content === 'string') {
          const toolResponse = JSON.parse(lastMessage.content);
          if (toolResponse?.needHumanConfirmation) {
            return "humanReview";
          }
        }
      } catch (e) {
        // If parsing fails, it's not a JSON response requiring review
      }

      // Continue with agent processing
      return "agent";
    };

    // Optimized model call with error handling
    const callModel = async (state: AgentState) => {
      try {
        const boundModel = this.context.model.bindTools(this.context.tools);
        const responseMessage = await boundModel.invoke(state.messages);
        return { messages: [responseMessage] };
      } catch (error) {
        logger.error('Error calling model:', error);
        throw error;
      }
    };

    const finalAnswerNode = async (state: AgentState) => {
      const messages = state.messages;
      const lastAIMessage = messages[messages.length - 1];

      const message = lastAIMessage.content.toString().split(' ');
      for (const word of message) {
        await new Promise(resolve => setTimeout(resolve, 50));
        await dispatchCustomEvent("final_message", { chunk: { content: word } });
      }

      // const apiKey = getModelApiKey(this.model.config, this.model.provider);
      // const settings = getModelSettings(this.model.config, this.model.config.settings);

      // const finalModel = new ChatOpenAI({
      //   ...(apiKey && { openAIApiKey: apiKey }),
      //   modelName: this.model.config.model,
      //   ...settings
      // }).withConfig({
      //   tags: ['finalAnswer']
      // });
      // const response = await finalModel.invoke([
      //   new SystemMessage("Rewrite this answer"),
      //   new HumanMessage({ content: lastAIMessage.content })
      // ]);
      // // MessagesAnnotation allows you to overwrite messages from the agent
      // // by returning a message with the same id
      // response.id = lastAIMessage.id;
      return { messages: [] };
    };

    // Improved human review node with better type safety and error handling
    const humanReviewNode = async (state: AgentState) => {
      const lastMessage = state.messages[state.messages.length - 1] as ToolMessage;

      type HumanReviewInput = {
        question: string;
        toolCall: MessageContent;
      };

      type HumanReviewOutput = {
        action?: "approve" | "reject" | "default";
        text?: string;
      };

      await dispatchCustomEvent("review_transaction_data", { chunk: {content: lastMessage.content.toString()} });

      const apiKey = this.model.config.apiKey;
      const settings = getModelSettings(this.model.config, this.model.config.settings);

      const reviewModel = new ChatOpenAI({
        ...(apiKey && { openAIApiKey: apiKey }),
        modelName: this.model.config.model,
        ...settings
      });
      const responseReview = await reviewModel.stream([
        new SystemMessage("Write a question that you can ask to human to review this onchain transaction, you must show information in a way that is easy for human to understand"),
        new HumanMessage({ content: "Tool name: " + lastMessage.name + "\n Tool response: " + JSON.stringify(JSON.parse(lastMessage.content.toString()).data) }),
      ]);

      let reviewQuestion = "";

      for await (const chunk of responseReview) {
        reviewQuestion += chunk.content.toString();
        await dispatchCustomEvent("review_transaction_text", { chunk });
      }

      const humanReview = interrupt<HumanReviewInput, HumanReviewOutput>({
        question: reviewQuestion,
        toolCall: lastMessage.content
      });

      let { action, text } = humanReview;

      if (!action) {
        action = "default";
      }

      // Map review outcomes to appropriate messages
      const responseMap = {
        approve: "I approve the tool call",
        reject: "I reject the tool call",
        default: text ?? "Do you want to approve this action?"
      };

      const response = action ? responseMap[action] : responseMap.default;
      return { messages: [new AIMessage({ content: reviewQuestion }), new HumanMessage(response)] };
    };

    // Build optimized workflow
    const workflow = new StateGraph(StateAnnotation)
      .addNode("agent", callModel)
      .addNode("tools", new ToolNode(this.context.tools))
      .addNode("finalAnswer", finalAnswerNode)
      .addNode("humanReview", humanReviewNode)
      .addEdge(START, "agent")
      .addConditionalEdges("agent", routeAfterAgent, {
        "finalAnswer": "finalAnswer",
        "tools": "tools",
      })
      .addConditionalEdges("tools", routeAfterTools, {
        "agent": "agent",
        "humanReview": "humanReview",
      })
      .addEdge("humanReview", "agent")
      .addEdge("finalAnswer", END);

    // Initialize graph with optional checkpoint
    this.context.graph = this.context.checkpoint
      ? workflow.compile({ checkpointer: this.context.checkpoint })
      : workflow.compile();

    logger.debug('Agent initialized successfully');
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
      const modelConfig = this.model.config;
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

  async execute(inputs: any, sessionConfig?: SessionConfig): Promise<IterableReadableStream<any>> {
    if (!this.context.graph) {
      const error = 'Agent not initialized. Call initialize() first.';
      logger.error(error);
      throw new Error(error);
    }

    logger.info('Executing agent with input:', inputs);
    return this.context.graph.streamEvents(
      inputs,
      {
        version: 'v2',
        configurable: {
          thread_id: sessionConfig?.thread_id || uuidv4(),
          user_id: sessionConfig?.user_id || 'anonymous'
        },
        streamMode: 'values'
      }
    );
  }
} 