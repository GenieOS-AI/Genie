import { BasePlugin, Agent, PluginMetadata } from '@genie/core';
import { WeatherPluginOptions } from './types';
import { GetWeatherTool } from './tools/GetWeatherTool';
import packageJson from '../package.json';

export class WeatherPlugin extends BasePlugin {
  protected readonly options: WeatherPluginOptions;

  constructor(options: WeatherPluginOptions = {}) {
    const metadata: PluginMetadata = {
      name: 'weather',
      description: 'A plugin for getting weather information',
      version: packageJson.version,
    };
    super(metadata, [GetWeatherTool], options);
    this.options = options;
  }

  public async initialize(agent: Agent): Promise<void> {
    super.initialize(agent);
    if (this.options.apiKey) {
      // Initialize weather API client
    }
  }
} 