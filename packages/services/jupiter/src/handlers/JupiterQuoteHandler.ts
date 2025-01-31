import { PublicKey } from '@solana/web3.js';
import { logger, NetworkName } from '@genieos/core';
import { SwapQuoteHandler, SwapQuoteHandlerRequest, SwapQuoteHandlerResponse } from '@genieos/swap-plugin';
import { JupiterService } from '../JupiterService';
import { generateQuoteId } from '../utils';
import { JupiterAPI } from '../JupiterAPI';
import { JupiterError } from '../types';
import { getMint } from '@solana/spl-token';

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
            const connection = await this.service.getConnection();
            
            // Get decimals from the mint accounts
            const [inputMintInfo, outputMintInfo] = await Promise.all([
                getMint(connection, inputMint),
                getMint(connection, outputMint)
            ]);

            // Parse amount with correct decimals based on swap mode
            const parsedAmount = request.amountType === 'input'
                ? Math.floor(Number(request.amount) * 10 ** inputMintInfo.decimals)
                : Math.floor(Number(request.amount) * 10 ** outputMintInfo.decimals);

            // Get quote from Jupiter API
            const quoteResponse = await this.service.getApi().getQuote({
                inputMint,
                outputMint,
                amount: parsedAmount,
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

            return {
                status: 'success',
                data: {
                    fromToken: {
                        address: request.fromToken,
                        symbol: request.fromToken || '', // TODO: get symbol from mint info
                        decimals: inputMintInfo.decimals,
                        amount: quoteResponse.inAmount,
                        uiAmount: (Number(quoteResponse.inAmount) / 10 ** inputMintInfo.decimals).toString()
                    },
                    toToken: {
                        address: request.toToken,
                        symbol: request.toToken || '', // TODO: get symbol from mint info
                        decimals: outputMintInfo.decimals,
                        amount: quoteResponse.outAmount,
                        uiAmount: (Number(quoteResponse.outAmount) / 10 ** outputMintInfo.decimals).toString()
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