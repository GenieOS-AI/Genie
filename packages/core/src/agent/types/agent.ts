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

export interface AgentDependencies {
  wallet: Wallet;
  network: NetworkManager;
}

export interface AgentContext {
  model: ChatOpenAI;
  tools: Tool<ToolInput, ToolOutput, IHandler<IHandlerRequest, IHandlerResponse>>[];
  executor?: AgentExecutor;
  memory?: any;
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
  execute(input: string): Promise<string>;
} 