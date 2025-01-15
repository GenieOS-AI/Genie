import { PublicKey } from '@solana/web3.js';
import { NetworkName } from '@genie/core';
import { SwapQuoteHandler, SwapQuoteHandlerRequest, SwapQuoteHandlerResponse } from '@genie/swap-plugin';
import { JupiterService } from '../JupiterService';
import { generateQuoteId } from '../utils';
import { JupiterAPI } from '../JupiterAPI';
import { JupiterError } from '../types';
import { parseUiAmount } from '../utils';

export class JupiterQuoteHandler extends SwapQuoteHandler {
    private service!: JupiterService;
    private api: JupiterAPI;

    constructor(api: JupiterAPI, priority: number, enabled: boolean) {
        super(priority, enabled, [NetworkName.SOLANA]);
        this.api = api;
    }

    public setService(service: JupiterService): void {
        this.service = service;
    }

    async execute(request: SwapQuoteHandlerRequest): Promise<SwapQuoteHandlerResponse> {
        try {
            const inputMint = new PublicKey(request.fromToken);
            const outputMint = new PublicKey(request.toToken);
            const slippageBps = request.slippage ? Math.floor(request.slippage * 100) : 50;

            // Get quote from Jupiter API
            const quoteResponse = await this.service.getApi().getQuote({
                inputMint,
                outputMint,
                amount: request.amount,
                slippageBps,
                swapMode: request.amountType === 'input' ? 'ExactIn' : 'ExactOut'
            });

            // Check for error response
            if ('error' in quoteResponse) {
                return {
                    status: 'error',
                    message: quoteResponse.message || quoteResponse.error
                };
            }

            const quoteId = generateQuoteId();
            this.service.cacheQuote(quoteId, quoteResponse);

            // Get token info for decimals
            const tokens = await this.service.getApi().getTokens();
            if ('error' in tokens) {
                return {
                    status: 'error',
                    message: tokens.message || tokens.error
                };
            }

            const fromToken = tokens.find(t => t.address === request.fromToken);
            const toToken = tokens.find(t => t.address === request.toToken);

            if (!fromToken || !toToken) {
                return {
                    status: 'error',
                    message: 'Token not found'
                };
            }

            return {
                status: 'success',
                data: {
                    fromToken: {
                        address: request.fromToken,
                        symbol: fromToken.symbol,
                        decimals: fromToken.decimals,
                        amount: quoteResponse.inAmount,
                        uiAmount: (Number(quoteResponse.inAmount) / 10 ** fromToken.decimals).toString()
                    },
                    toToken: {
                        address: request.toToken,
                        symbol: toToken.symbol,
                        decimals: toToken.decimals,
                        amount: quoteResponse.outAmount,
                        uiAmount: (Number(quoteResponse.outAmount) / 10 ** toToken.decimals).toString()
                    },
                    exchangeRate: (Number(quoteResponse.outAmount) / Number(quoteResponse.inAmount)).toString(),
                    priceImpact: (quoteResponse.priceImpactPct * 100).toString(),
                    estimatedGas: quoteResponse.otherAmountThreshold,
                    route: quoteResponse.routePlan.map(r => r.swapInfo.label),
                    provider: JupiterService.SERVICE_NAME,
                    quoteId,
                    expiryTime: Date.now() + 30000 // 30 seconds
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
} 