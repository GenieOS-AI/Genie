import { HandlersConfig, IHandlerRequest, IHandler, IHandlerResponse } from "./handler";

/**
 * Metadata information for a service
 */
export interface ServiceMetadata {
  /** Unique name of the service */
  name: string;
  /** Semantic version of the service */
  version: string;
  /** Description of what the service does */
  description: string;
  /** Optional author of the service */
  author?: string;
}

/**
 * Configuration options for services
 */
export interface ServiceOptions {
  /** Service-specific configuration options */
  [key: string]: any;
}

export interface IService {
  metadata: ServiceMetadata;
  get handlers(): IHandler<IHandlerRequest, IHandlerResponse>[];
  initialize(configs: HandlersConfig): Promise<void>;
} 