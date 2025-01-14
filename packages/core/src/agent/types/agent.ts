import { ModelConfig, ModelProvider } from './model';
import { ChatOpenAI } from '@langchain/openai';
import { Wallet } from '../../wallet/Wallet';
import { NetworkManager } from '../../network/NetworkManager';
import { AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Plugin } from './plugin';
import { BaseTool } from '../plugins/tools/BaseTool';
import { Handler } from '../../services';
import { IHandlerResponse } from '../../services/types/handler';
import { IHandlerRequest } from '../../services/types/handler';
import { ToolInput, ToolOutput } from './tool';
import { Service } from '../../services/Service';
import { NetworkName } from '../../network';

export interface AgentDependencies {
  wallet: Wallet;
  network: NetworkManager;
}

export interface AgentContext {
  model: ChatOpenAI;
  tools: BaseTool<ToolInput, ToolOutput, Handler<IHandlerRequest, IHandlerResponse>>[];
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

export interface Agent {
  id: string;
  model: {
    config: ModelConfig;
    provider: ModelProvider;
  };
  chatTemplate?: ChatPromptTemplate;
  plugins: Plugin[];
  services: Service[];
  dependencies: AgentDependencies;
  context: AgentContext;
  initialize(): Promise<void>;
  execute(input: string): Promise<string>;
} 