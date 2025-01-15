import { z } from 'zod';
import { Tool, ToolConfig, IAgent } from '@genie/core';
import { SwapQuoteHandler } from '../handlers/SwapQuoteHandler';
import { SwapQuoteToolInput, SwapQuoteToolOutput, SwapAmountType } from '../types';

export class GetSwapQuoteTool extends Tool<SwapQuoteToolInput, SwapQuoteToolOutput, SwapQuoteHandler> {
    public static readonly TOOL_NAME = 'get_swap_quote';

    constructor(agent: IAgent, callback?: (toolName: string, input: SwapQuoteToolInput, output: SwapQuoteToolOutput) => void) {
        const supportedNetworks = agent.dependencies.network.getSupportedNetworks();

        const config: ToolConfig<SwapQuoteToolInput> = {
            name: GetSwapQuoteTool.TOOL_NAME,
            description: 'Get a quote for swapping tokens on a specific network. Can specify either input or output amount.',
            schema: z.object({
                fromToken: z.string().describe('The token to swap from (address or symbol)'),
                toToken: z.string().describe('The token to swap to (address or symbol)'),
                amount: z.string().describe('The amount to swap in human-readable format (e.g., "1.5" ETH or "100" USDC)'),
                amountType: z.enum(['input', 'output']).describe('Whether the amount is for input or output token'),
                network: z.enum(supportedNetworks as [string, ...string[]]).describe('The network to perform the swap on'),
                slippage: z.number().optional().describe('Optional slippage in percentage')
            }) as any,
            examples: [
                {
                    user: 'Get a quote to swap 1.5 ETH for USDC on Ethereum',
                    tool: {
                        params: {
                            fromToken: 'ETH',
                            toToken: 'USDC',
                            amount: '1.5',
                            amountType: 'input',
                            network: 'ethereum',
                            slippage: 0.5
                        }
                    }
                },
                {
                    user: 'Get a quote to get exactly 1000 USDC by swapping ETH on Ethereum',
                    tool: {
                        params: {
                            fromToken: 'ETH',
                            toToken: 'USDC',
                            amount: '1000',
                            amountType: 'output',
                            network: 'ethereum',
                            slippage: 0.5
                        }
                    }
                }
            ]
        };

        super(agent, config, callback);
    }

    validateInput(input: SwapQuoteToolInput): { status: boolean; errors?: string[] } {
        const errors: string[] = [];
        const supportedNetworks = this.agent.dependencies.network.getSupportedNetworks();

        if (!input.fromToken) {
            errors.push('fromToken is required');
        }
        if (!input.toToken) {
            errors.push('toToken is required');
        }
        if (!input.amount) {
            errors.push('amount is required');
        } else {
            // Validate amount is a valid number
            const amount = Number(input.amount);
            if (isNaN(amount) || amount <= 0) {
                errors.push('amount must be a positive number');
            }
        }
        if (!input.amountType) {
            errors.push('amountType is required (must be "input" or "output")');
        }
        if (!input.network) {
            errors.push('network is required');
        } else if (!supportedNetworks.includes(input.network)) {
            errors.push(`Network '${input.network}' is not supported. Available networks: ${supportedNetworks.join(', ')}`);
        }
        if (input.slippage !== undefined && (input.slippage <= 0 || input.slippage > 100)) {
            errors.push('slippage must be between 0 and 100');
        }

        return {
            status: errors.length === 0,
            ...(errors.length > 0 && { errors })
        };
    }

    protected async execute(input: SwapQuoteToolInput): Promise<SwapQuoteToolOutput> {
        // Try each handler in priority order until one succeeds
        for (const handler of this.handlers) {
            try {
                if (!handler.enabled) continue;
                if (!handler.isNetworkSupported(input.network)) continue;

                const response = await handler.execute(input);
                if (response.status === 'success' && response.data) {
                    const { fromToken, toToken, exchangeRate, priceImpact, ...rest } = response.data;
                    return {
                        status: 'success',
                        data: {
                            fromToken: {
                                ...fromToken,
                                maxSpent: input.amountType === 'output' ? 
                                    fromToken.maxSpent || fromToken.uiAmount : undefined
                            },
                            toToken: {
                                ...toToken,
                                minReceived: input.amountType === 'input' ? 
                                    toToken.minReceived || toToken.uiAmount : undefined
                            },
                            exchangeRate,
                            priceImpact,
                            ...rest
                        }
                    };
                }
            } catch (error) {
                console.error(`Handler ${handler.constructor.name} failed:`, error);
                continue;
            }
        }

        return {
            status: 'error',
            message: 'No handler was able to get a swap quote'
        };
    }
} 