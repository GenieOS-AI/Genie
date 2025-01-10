import { BasePlugin, Agent } from '@genie/core';
import { WeatherPluginOptions } from './types';
import { GetWeatherTool } from './tools/GetWeatherTool';

export class WeatherPlugin extends BasePlugin {
  protected readonly options: WeatherPluginOptions;

  constructor(
    agent: Agent,
    callback?: (pluginName: string, toolName: string, input: Record<string, unknown>, output: string) => void,
    options: WeatherPluginOptions = {}
  ) {
    super(
      agent,
      {
        name: 'weather',
        description: 'A plugin for getting weather information',
        version: '1.0.0',
      },
      [GetWeatherTool],
      callback,
      options
    );
    this.options = options;
  }

  public async initialize(): Promise<void> {
    // Here you would typically initialize any API clients or validate API keys
    if (this.options.apiKey) {
      // Initialize weather API client
    }
  }
} 