import { ToolOutput } from "../../agent/types";
import { NetworkName } from "../../network";

export interface IHandlerRequest extends Record<string, unknown> {}
  
export interface IHandlerResponse extends ToolOutput {
}

export interface IHandler<Request extends IHandlerRequest, Response extends IHandlerResponse> {
  priority: number;
  enabled: boolean;
  networks: NetworkName[];
  execute(request: Request): Promise<Response>;
}

