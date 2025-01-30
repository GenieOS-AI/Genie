import { NetworkName } from "@genie/core";

export interface SwapPluginOptions {
    defaultSlippage?: number;
    providers?: {
        [network in NetworkName]?: string[];
    };
} 