import { Handler } from './handlers/Handler';
import { IHandlerRequest, IService, ServiceMetadata, ServiceOptions, IHandlerResponse, HandlersConfig } from './types';

export abstract class Service implements IService {
  public readonly metadata: ServiceMetadata;
  protected options: ServiceOptions;
  public readonly handlers: Handler<IHandlerRequest, IHandlerResponse>[];

  constructor(metadata: ServiceMetadata, handlers: Handler<IHandlerRequest, IHandlerResponse>[], options: ServiceOptions = {}) {
    this.metadata = metadata;
    this.options = options;
    this.handlers = handlers;
  }

  public async initialize(configs: HandlersConfig = []): Promise<void> {
    this.handlers.forEach(handler => {
        const config = configs.find(c => c.name === handler.constructor.name);
        if (config) {
            handler.setEnabled(config.enabled ?? handler.enabled);
            handler.setNetworks(config.networks ?? handler.networks);
            handler.setPriority(config.priority ?? handler.priority);
        }
    });
  }
} 