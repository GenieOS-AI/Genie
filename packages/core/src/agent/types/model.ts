export interface ModelSettings {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    verbose?: boolean;
  } 

  export enum ModelProvider {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
    DEEPSEEK = 'deepseek',
    CUSTOM = 'custom',
  } 


export interface ModelConfig {
    endpoint?: string;
    model?: string;
    settings?: ModelSettings;
    apiKey?: string;
  }
  
  export type ModelConfigurations = {
    [key in ModelProvider]?: ModelConfig;
  }; 