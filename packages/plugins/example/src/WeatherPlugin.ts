import { Plugin, PluginMetadata, IHandlerResponse, IHandlerRequest, IAgent, IHandler } from '@genieos/core';
import { WeatherPluginOptions } from './types';
import { GetWeatherTool } from './tools/GetWeatherTool';
import packageJson from '../package.json';

export class WeatherPlugin extends Plugin {
  public readonly options: WeatherPluginOptions;

  constructor(options: WeatherPluginOptions = {}) {
    const metadata: PluginMetadata = {
      name: 'weather',
      description: 'A plugin for getting weather information',
      version: packageJson.version,
    };
    super(metadata, [GetWeatherTool], options);
    this.options = options;
  }

  public async initialize(agent: IAgent, handlers: IHandler<IHandlerRequest, IHandlerResponse>[]): Promise<void> {
    await super.initialize(agent, handlers);
    if (this.options.apiKey) {
      // Initialize weather API client
    }
  }
} 