import { ModelProvider, ModelConfig, ModelConfigurations } from './types';

export const defaultModelConfig: ModelConfigurations = {
  [ModelProvider.OPENAI]: {
    endpoint: 'https://api.openai.com/v1',
    settings: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },
};

export function getModelConfig(provider: ModelProvider): ModelConfig {
  return defaultModelConfig[provider] || {
    settings: {},
  };
}