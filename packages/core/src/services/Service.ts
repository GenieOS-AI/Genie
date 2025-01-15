import { IHandlerRequest, IService, ServiceMetadata, ServiceOptions, IHandlerResponse, HandlersConfig, IHandler } from './types';

export abstract class Service implements IService {
  public metadata: ServiceMetadata;
  public options: ServiceOptions;
  private _handlers: IHandler<IHandlerRequest, IHandlerResponse>[];

  constructor(metadata: ServiceMetadata, handlers: IHandler<IHandlerRequest, IHandlerResponse>[], options: ServiceOptions = {}) {
    this.metadata = metadata;
    this.options = options;
    this._handlers = handlers;
  }

  public async initialize(configs: HandlersConfig = []): Promise<void> {
    this._handlers.forEach(handler => {
        const config = configs.find(c => c.name === handler.constructor.name);
        if (config) {
            handler.enabled = config.enabled ?? handler.enabled;
            handler.networks = config.networks ?? handler.networks;
            handler.priority = config.priority ?? handler.priority;
        }
    });
  } 

  get handlers(): IHandler<IHandlerRequest, IHandlerResponse>[] {
    return this._handlers;
  }
} 
