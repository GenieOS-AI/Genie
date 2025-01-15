import { ToolOutput } from "../../agent/types";
import { NetworkName } from "../../network";

export interface IHandlerRequest extends Record<string, unknown> {}
  
export interface IHandlerResponse extends ToolOutput {
}

export interface HandlerConfig {
    name: string;
    enabled?: boolean;
    networks?: NetworkName[];
    priority?: number;
}

export type HandlersConfig = HandlerConfig[];

export interface IHandler<Request extends IHandlerRequest, Response extends IHandlerResponse> {
  priority: number;
  enabled: boolean;
  networks: NetworkName[];
  execute(request: Request): Promise<Response>;
  get tool_name(): string;
  isNetworkSupported(network: NetworkName): boolean;
}

