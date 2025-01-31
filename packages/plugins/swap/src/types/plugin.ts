import { NetworkName } from "@genieos/core";

export interface SwapPluginOptions {
    defaultSlippage?: number;
    providers?: {
        [network in NetworkName]?: string[];
    };
} 