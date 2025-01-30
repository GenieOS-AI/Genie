import { NetworkName, IHandlerRequest, IHandlerResponse } from "@genie/core";
import { SwapAmountType, TokenInfo, TokenAmount } from "./common";


export interface SwapQuoteHandlerRequest extends IHandlerRequest {
    fromToken: string;
    toToken: string;
    amount: string;
    amountType: SwapAmountType;
    network: NetworkName;
    slippage?: number;
}

export interface SwapQuoteHandlerResponse extends IHandlerResponse {
    data?: {
        fromToken: TokenInfo & { maxSpent?: string; uiAmount: string };
        toToken: TokenInfo & { minReceived?: string; uiAmount: string };
        exchangeRate: string;
        priceImpact: string;
        estimatedGas?: string;
        route?: string[];
        provider?: string;
        quoteId: string;
        expiryTime: number;
    };
}

export interface ExecuteSwapHandlerRequest extends IHandlerRequest {
    quoteId: string;
    walletAddress: string;
    network: NetworkName;
}

export interface ExecuteSwapHandlerResponse extends IHandlerResponse {
    data?: {
        transaction: string;
        network: NetworkName;
        fromToken: TokenAmount & { uiAmount: string };
        toToken: TokenAmount & { uiAmount: string };
    };
} 