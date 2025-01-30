import { AgentDependencies, ModelProvider, ModelConfig, Agent, IService, IPlugin } from '@genie/core';
import { BaseCheckpointSaver } from '@langchain/langgraph';

export class SwapAgent extends Agent {
  constructor(config: {
    model: {
      config: ModelConfig;
      provider: ModelProvider;
    };
    plugins?: IPlugin[];
    services?: IService[];
    systemMessage?: string;
    checkpoint?: BaseCheckpointSaver;
  }, dependencies: AgentDependencies) {
    super(config, dependencies);
  }
} 