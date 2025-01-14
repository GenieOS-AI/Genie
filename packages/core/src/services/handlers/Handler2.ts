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

    /**
     * Set the priority of the handler
     * @param value - The new priority value
     */
    public setPriority(value: number): void {
        this.priority = value;
    }

    /**
     * Set the enabled state of the handler
     * @param value - The new enabled state
     */
    public setEnabled(value: boolean): void {
        this.enabled = value;
    }

    /**
     * Set the supported networks for the handler
     * @param networks - Array of supported network names
     */
    public setNetworks(networks: NetworkName[]): void {
        this.networks = networks;
    }

    public abstract execute(request: Request): Promise<Response>;
}
