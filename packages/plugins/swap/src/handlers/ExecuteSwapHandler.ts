import { Handler, NetworkName } from "@genieos/core";
import { QuoteStatus } from "../types/common";
import { ExecuteSwapHandlerRequest, ExecuteSwapHandlerResponse } from "../types";
import { ExecuteSwapTool } from "../tools/ExecuteSwapTool";

export abstract class ExecuteSwapHandler extends Handler<ExecuteSwapHandlerRequest, ExecuteSwapHandlerResponse> {
    constructor(priority: number, enabled: boolean, networks: NetworkName[]) {
        super(ExecuteSwapTool.TOOL_NAME, priority, enabled, networks);
    }

    /**
     * Validates if a quote is still valid and can be executed
     * @param quoteId The quote ID to validate
     * @returns Quote validation status
     */
    public abstract validateQuote(quoteId: string): Promise<QuoteStatus>;

    /**
     * Retrieves the original quote data for validation
     * @param quoteId The quote ID to lookup
     */
    protected abstract getQuoteData(quoteId: string): Promise<{
        fromToken: string;
        toToken: string;
        amount: string;
        amountType: 'input' | 'output';
        expiryTime: number;
    } | null>;

    async execute(request: ExecuteSwapHandlerRequest): Promise<ExecuteSwapHandlerResponse> {
        // First validate the quote
        const quoteStatus = await this.validateQuote(request.quoteId);
        if (!quoteStatus.valid) {
            return {
                status: 'error',
                message: `Quote is invalid: ${quoteStatus.reason}`
            };
        }

        // Get original quote data for verification
        const quoteData = await this.getQuoteData(request.quoteId);
        if (!quoteData) {
            return {
                status: 'error',
                message: 'Quote data not found'
            };
        }

        // Check if quote has expired
        if (Date.now() > quoteData.expiryTime) {
            return {
                status: 'error',
                message: 'Quote has expired'
            };
        }

        // Implement actual swap execution in derived classes
        return await this.executeSwap(request, quoteData);
    }

    /**
     * Executes the actual swap transaction
     * @param request The swap request
     * @param quoteData The original quote data
     */
    protected abstract executeSwap(
        request: ExecuteSwapHandlerRequest,
        quoteData: NonNullable<Awaited<ReturnType<typeof this.getQuoteData>>>
    ): Promise<ExecuteSwapHandlerResponse>;
} 