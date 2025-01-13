import { ToolInput, ToolOutput } from "@genie/core";

import { NetworkName } from "@genie/core";
import { NetworkBalance } from "./tool-handler";

export interface GetAddressToolInput extends ToolInput {
    networks?: NetworkName[];
}

export interface GetAddressToolOutput extends ToolOutput {
    data?: Partial<Record<NetworkName, string>>
}

export interface GetBalanceToolInput extends ToolInput {
    networks?: NetworkName[];
}

export interface GetBalanceToolOutput extends ToolOutput {
    data?: {
        balances: NetworkBalance[];
        totalUsdValue?: string;  // Optional total USD value across all networks
    };
}