import { BaseAgent, AgentConfig, AgentDependencies } from '@genie/core';

export class WalletAgent extends BaseAgent {
  constructor(config: AgentConfig, dependencies: AgentDependencies) {
    super(config, dependencies);
  }
} 