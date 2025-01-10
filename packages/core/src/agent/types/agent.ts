import { ModelProvider } from './model';
import { ChatOpenAI } from '@langchain/openai';
import { Wallet } from '../../wallet/Wallet';
import { NetworkManager } from '../../network/NetworkManager';
import { AgentExecutor } from 'langchain/agents';
import { Tool } from '@langchain/core/tools';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export interface AgentConfig {
  provider: ModelProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  verbose?: boolean;
  chatTemplate?: ChatPromptTemplate;
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
  tools: Tool[];
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
  addTool(tool: Tool): void;
  removeTool(toolName: string): void;
} 