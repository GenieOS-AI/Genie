import { NetworkName } from "@genie/core";

import { IHandlerRequest, IHandlerResponse } from "@genie/core";

export interface GetBalanceHandlerRequest extends IHandlerRequest {
    address: string;
    networks: NetworkName[];
}

export interface TokenBalance {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    amount: string;        // Raw amount
    uiAmount: string;      // Formatted amount with decimals
    usdValue?: string;     // Optional USD value
    iconUrl?: string;
    price?: string;
}

export interface NetworkBalance {
    network: NetworkName;
    tokens: TokenBalance[];
    totalUsdValue?: string;  // Optional total USD value for network
}

export interface GetBalanceHandlerResponse extends IHandlerResponse {
    data?: {
        balances: NetworkBalance[];
        totalUsdValue?: string;  // Optional total USD value across all networks
    };
}