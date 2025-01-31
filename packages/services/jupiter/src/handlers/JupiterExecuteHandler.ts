import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { NetworkName } from '@genieos/core';
import { ExecuteSwapHandler, ExecuteSwapHandlerRequest, ExecuteSwapHandlerResponse, QuoteStatus } from '@genieos/swap-plugin';
import { JupiterService } from '../JupiterService';
import { JupiterAPI } from '../JupiterAPI';
import { JupiterError, JupiterQuoteResponse } from '../types';
import { getMint } from '@solana/spl-token';

export class JupiterExecuteHandler extends ExecuteSwapHandler {
    private service!: JupiterService;
    private api: JupiterAPI;

    constructor(api: JupiterAPI, priority: number, enabled: boolean) {
        super(priority, enabled, [NetworkName.SOLANA]);
        this.api = api;
    }

    public setService(service: JupiterService): void {
        this.service = service;
    }

    public async validateQuote(quoteId: string): Promise<QuoteStatus> {
        const quote = this.service.getQuote(quoteId) as JupiterQuoteResponse;
        if (!quote) {
            return { valid: false, reason: 'not_found' };
        }

        try {
            // Re-fetch quote to validate
            const newQuoteResponse = await this.service.getApi().getQuote({
                inputMint: new PublicKey(quote.inputMint),
                outputMint: new PublicKey(quote.outputMint),
                amount: quote.swapMode === 'ExactIn' ? Number(quote.inAmount) : Number(quote.outAmount),
                slippageBps: quote.slippageBps,
                swapMode: quote.swapMode
            });

            if ('error' in newQuoteResponse) {
                return { valid: false, reason: 'insufficient_liquidity' };
            }

            const priceDiff = Math.abs(
                Number(newQuoteResponse.outAmount) - Number(quote.outAmount)
            ) / Number(quote.outAmount);

            if (priceDiff > 0.005) { // 0.5% price difference threshold
                return { valid: false, reason: 'price_changed' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, reason: 'not_found' };
        }
    }

    protected async executeSwap(
        request: ExecuteSwapHandlerRequest,
        quoteData: any
    ): Promise<ExecuteSwapHandlerResponse> {
        try {
            const quote = this.service.getQuote(request.quoteId) as JupiterQuoteResponse;
            if (!quote) {
                return {
                    status: 'error',
                    message: 'Quote not found'
                };
            }

            if (!request.walletAddress) {
                return {
                    status: 'error',
                    message: 'User address is required'
                };
            }

            const connection = await this.service.getConnection();

            // get decimals from the mint accounts
            const [inputMintInfo, outputMintInfo] = await Promise.all([
                getMint(connection, new PublicKey(quote.inputMint)),
                getMint(connection, new PublicKey(quote.outputMint))
            ]);

            // Get serialized transactions from Jupiter API
            const swapResult = await this.service.getApi().getSwapTransactions({
                quoteResponse: quote,
                userPublicKey: request.walletAddress as string
            });

            if ('error' in swapResult) {
                const errorResponse = swapResult as JupiterError;
                return {
                    status: 'error',
                    message: errorResponse.message || errorResponse.error || 'Failed to execute swap'
                };
            }

            return {
                status: 'success',
                data: {
                    network: request.network,
                    transaction: swapResult.swapTransaction,
                    fromToken: {
                        address: quote.inputMint,
                        amount: quote.inAmount,
                        uiAmount: (Number(quote.inAmount) / 10 ** inputMintInfo.decimals).toString()
                    },
                    toToken: {
                        address: quote.outputMint,
                        amount: quote.outAmount,
                        uiAmount: (Number(quote.outAmount) / 10 ** outputMintInfo.decimals).toString()
                    }
                }
            };
        } catch (error) {
            const jupiterError = error as JupiterError;
            return {
                status: 'error',
                message: jupiterError.message || jupiterError.error || 'Unknown error occurred'
            };
        }
    }

    protected async getQuoteData(quoteId: string): Promise<{ fromToken: string; toToken: string; amount: string; amountType: 'input' | 'output'; expiryTime: number; } | null> {
        const quote = this.service.getQuote(quoteId) as JupiterQuoteResponse;
        if (!quote) return Promise.resolve(null);

        return Promise.resolve({
            fromToken: quote.inputMint,
            toToken: quote.outputMint,
            amount: quote.inAmount,
            amountType: 'input',
            expiryTime: Date.now() + 30000 // 30 seconds
        });
    }
} 