import { ModelProvider } from './model';
import { ChatOpenAI } from '@langchain/openai';
import { Wallet } from '../../wallet/Wallet';
import { NetworkManager } from '../../network/NetworkManager';
import { AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Plugin } from './plugin';
import { BaseTool } from '../plugins/tools/BaseTool';
import { Handler } from '../../services/handlers/handler';
import { IHandlerResponse } from '../../services/types/handler';
import { IHandlerRequest } from '../../services/types/handler';
import { ToolInput, ToolOutput } from './tool';

export interface AgentConfig {
  provider: ModelProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  verbose?: boolean;
  chatTemplate?: ChatPromptTemplate;
  plugins?: Plugin[];
}

export interface AgentDependencies {
  wallet: Wallet;
  network: NetworkManager;
}

export interface AgentOptions extends AgentConfig {
  dependencies: AgentDependencies;
}

export interface AgentContext {
  model: ChatOpenAI;
  tools: BaseTool<ToolInput, ToolOutput, Handler<IHandlerRequest, IHandlerResponse>>[];
  executor?: AgentExecutor;
  memory?: any;
}

export interface Agent {
  id: string;
  config: AgentConfig;
  dependencies: AgentDependencies;
  context: AgentContext;
  initialize(): Promise<void>;
  execute(input: string): Promise<string>;
  addTool(tool: BaseTool<ToolInput, ToolOutput, Handler<IHandlerRequest, IHandlerResponse>>): void;
  removeTool(toolName: string): void;
} 