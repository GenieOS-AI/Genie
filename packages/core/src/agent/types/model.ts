export interface ModelSettings {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    verbose?: boolean;
  } 

  export enum ModelProvider {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
  } 


export interface ModelConfig {
    endpoint?: string;
    model?: string;
    settings?: ModelSettings;
    apiKeyEnvVarName?: string;
  }
  
  export type ModelConfigurations = {
    [key in ModelProvider]?: ModelConfig;
  }; 