import { ModelConfig, ModelProvider } from './model';
import { ChatOpenAI } from '@langchain/openai';
import { Wallet } from '../../wallet/Wallet';
import { NetworkManager } from '../../network/NetworkManager';
import { AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { IService } from '../../services';
import { IHandler, IHandlerResponse } from '../../services/types/handler';
import { IHandlerRequest } from '../../services/types/handler';
import { ToolInput, ToolOutput } from './tool';
import { NetworkName } from '../../network';
import { IPlugin, Tool } from '../..';
import { BaseCheckpointSaver, CompiledStateGraph, MemorySaver, StateGraph } from '@langchain/langgraph';
import { IterableReadableStream } from '@langchain/core/utils/stream';

export interface AgentDependencies {
  wallet: Wallet;
  network: NetworkManager;
}

export interface AgentContext {
  model: ChatOpenAI;
  tools: Tool<ToolInput, ToolOutput, IHandler<IHandlerRequest, IHandlerResponse>>[];
  workflow: StateGraph<any, any, any, any, any, any, any>;
  graph: CompiledStateGraph<any, any, any, any, any, any>;
  checkpoint?: BaseCheckpointSaver;
}

export interface AgentPluginConfig {
    plugins?: Array<{
      [pluginName: string]: {
        tools?: string[];
        services?: Array<{
          name: string;
          tools: Array<{
            name: string;
            enabled?: boolean;
            networks?: NetworkName[];
            priority?: number;
          }>;
        }>;
      };
    }>;
  }

export interface SessionConfig {
  thread_id?: string;
  user_id?: string;
}

export interface IAgent {
  readonly id: string;
  readonly model: {
    config: ModelConfig;
    provider: ModelProvider;
  };
  readonly systemMessage?: string;
  readonly chatTemplate?: ChatPromptTemplate;
  readonly plugins: IPlugin[];
  readonly services: IService[];
  readonly dependencies: AgentDependencies;
  readonly context: AgentContext;
  initialize(pluginConfig?: AgentPluginConfig): Promise<void>;
  execute(input: string, sessionConfig?: SessionConfig): Promise<IterableReadableStream<any>>;
} 
