import { Agent, AgentConfig, AgentDependencies } from './types/agent';
import { BaseAgent } from './BaseAgent';

export class AgentFactory {
  static createAgent(
    config: AgentConfig,
    dependencies: AgentDependencies
  ): Agent {
    // For now, we only have BaseAgent implementation
    // In the future, we can add different agent types based on use cases
    return new BaseAgent(config, dependencies);
  }

  static async createAndInitializeAgent(
    config: AgentConfig,
    dependencies: AgentDependencies
  ): Promise<Agent> {
    const agent = AgentFactory.createAgent(config, dependencies);
    await agent.initialize();
    return agent;
  }
} 