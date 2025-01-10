export interface ModelSettings {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  } 

  export enum ModelProvider {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
  } 


export interface ModelConfig {
    endpoint?: string;
    apiKey?: string;
    settings?: ModelSettings;
  }
  
  export type ModelConfigurations = {
    [key in ModelProvider]?: ModelConfig;
  }; 