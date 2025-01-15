import { AgentDependencies, ModelProvider, ModelConfig, Plugin, Service, Agent } from '@genie/core';

export class WalletAgent extends Agent {
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