import { BaseAgent, AgentDependencies, ModelProvider, ModelConfig, Plugin, Service } from '@genie/core';

export class WalletAgent extends BaseAgent {
  constructor(config: {
    model: {
      config: ModelConfig;
      provider: ModelProvider;
    };
    plugins?: Plugin[];
    services?: Service[];
  }, dependencies: AgentDependencies) {
    super(config, dependencies);
  }
} 