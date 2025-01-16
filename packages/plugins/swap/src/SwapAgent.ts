import { AgentDependencies, ModelProvider, ModelConfig, Agent, IService, IPlugin } from '@genie/core';

export class SwapAgent extends Agent {
  constructor(config: {
    model: {
      config: ModelConfig;
      provider: ModelProvider;
    };
    plugins?: IPlugin[];
    services?: IService[];
    systemMessage?: string;
  }, dependencies: AgentDependencies) {
    super(config, dependencies);
  }
} 