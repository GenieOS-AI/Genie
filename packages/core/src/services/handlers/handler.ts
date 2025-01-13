import { NetworkName } from "../../network";
import { IHandler, IHandlerRequest, IHandlerResponse } from "../types/handler";

export abstract class Handler<Request extends IHandlerRequest, Response extends IHandlerResponse> implements IHandler<Request, Response> {
    public priority: number;
    public enabled: boolean;
    public networks: NetworkName[];

    constructor(priority: number, enabled: boolean, networks: NetworkName[]) {
        this.priority = priority;
        this.enabled = enabled;
        this.networks = networks;
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
