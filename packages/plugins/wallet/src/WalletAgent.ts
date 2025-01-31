import { AgentDependencies, ModelProvider, ModelConfig, Agent, IService, IPlugin } from '@genieos/core';

export class WalletAgent extends Agent {
  constructor(config: {
    model: {
      config: ModelConfig;
      provider: ModelProvider;
    };
    plugins?: IPlugin[];
    services?: IService[];
  }, dependencies: AgentDependencies) {
    super(config, dependencies);
  }
} 