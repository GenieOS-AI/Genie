import { NetworkName, ToolInput, ToolOutput } from "@genie/core";
import { SwapAmountType, TokenInfo, TokenAmount } from "./common";

export interface SwapQuoteToolInput extends ToolInput {
    fromToken: string;  // Token address or symbol
    toToken: string;    // Token address or symbol
    amount: string;     // Human-readable amount (e.g., "1.5" ETH or "100" USDC)
    amountType: SwapAmountType; // Whether amount is input or output
    network: NetworkName;
    slippage?: number; // Optional slippage in percentage (e.g., 0.5 for 0.5%)
}

export interface SwapQuoteToolOutput extends ToolOutput {
    data?: {
        fromToken: TokenInfo & {
            maxSpent?: string;  // Human-readable amount
            uiAmount: string;   // Human-readable amount
        };
        toToken: TokenInfo & {
            minReceived?: string;  // Human-readable amount
            uiAmount: string;      // Human-readable amount
        };
        exchangeRate: string;
        priceImpact: string;
        estimatedGas?: string;
        route?: string[];
        provider?: string;
        quoteId: string;
        expiryTime: number;
    };
}

export interface ExecuteSwapToolInput extends ToolInput {
    quoteId: string;    // Quote ID from the SwapQuoteTool
    network: NetworkName;
}

export interface ExecuteSwapToolOutput extends ToolOutput {
    data?: {
        transactionHash: string;
        status: 'pending' | 'confirmed' | 'failed';
        fromToken: TokenAmount & {
            uiAmount: string;  // Human-readable amount
        };
        toToken: TokenAmount & {
            uiAmount: string;  // Human-readable amount
        };
    };
} 