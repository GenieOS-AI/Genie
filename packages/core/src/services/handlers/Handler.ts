import { NetworkName } from "../../network";
import { IHandler, IHandlerRequest, IHandlerResponse } from "../types/handler";

export abstract class Handler<Request extends IHandlerRequest, Response extends IHandlerResponse> implements IHandler<Request, Response> {
    private _tool_name: string;
    public priority: number;
    public enabled: boolean;
    public networks: NetworkName[];


    constructor(tool_name: string, priority: number, enabled: boolean, networks: NetworkName[]) {
        this._tool_name = tool_name;
        this.priority = priority;
        this.enabled = enabled;
        this.networks = networks;
    }

    get tool_name(): string {
        return this._tool_name;
    }

    /**
     * Check if the network is supported
     * @param network - The network to check
     * @returns True if the network is supported, false otherwise
     */
    public isNetworkSupported(network: NetworkName): boolean {
        return this.networks.includes(network);
    }

    public abstract execute(request: Request): Promise<Response>;
}
