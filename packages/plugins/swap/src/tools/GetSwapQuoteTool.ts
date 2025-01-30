import { z } from 'zod';
import { Tool, ToolConfig, IAgent, logger } from '@genie/core';
import { SwapQuoteHandler } from '../handlers/SwapQuoteHandler';
import { SwapQuoteToolInput, SwapQuoteToolOutput, SwapAmountType } from '../types';
import { interrupt } from '@langchain/langgraph';

export class GetSwapQuoteTool extends Tool<SwapQuoteToolInput, SwapQuoteToolOutput, SwapQuoteHandler> {
    public static readonly TOOL_NAME = 'get_swap_quote';

    constructor(agent: IAgent, callback?: (toolName: string, input: SwapQuoteToolInput, output: SwapQuoteToolOutput) => void) {
        const supportedNetworks = agent.dependencies.network.getSupportedNetworks();

        const config: ToolConfig<SwapQuoteToolInput> = {
            name: GetSwapQuoteTool.TOOL_NAME,
            description: 'Get a quote for swapping tokens on a specific network. Can specify either input or output amount.',
            schema: z.object({
                fromToken: z.string().describe('The token to swap from (address)'),
                toToken: z.string().describe('The token to swap to (address)'),
                amount: z.string().describe('The amount to swap in human-readable format (e.g., "1.5" ETH or "100" USDC)'),
                amountType: z.enum(['input', 'output']).describe('Whether the amount is for input or output token'),
                network: z.enum(supportedNetworks as [string, ...string[]]).describe('The network to perform the swap on'),
                slippage: z.number().optional().describe('Optional slippage in percentage')
            }) as any,
            examples: [
                {
                    user: 'Get a quote to swap 1.5 ETH (0x0000000000000000000000000000000000000000) for USDC (0x0000000000000000000000000000000000000002) on Ethereum',
                    tool: {
                        params: {
                            fromToken: '0x0000000000000000000000000000000000000000',
                            toToken: '0x0000000000000000000000000000000000000002',
                            amount: '1.5',
                            amountType: 'input',
                            network: 'ethereum',
                            slippage: 0.5
                        }
                    }
                },
                {
                    user: 'Get a quote to get exactly 1000 USDC (0x0000000000000000000000000000000000000002) by swapping ETH (0x0000000000000000000000000000000000000000) on Ethereum',
                    tool: {
                        params: {
                            fromToken: '0x0000000000000000000000000000000000000000',
                            toToken: '0x0000000000000000000000000000000000000002',
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
        logger.info(`Input: ${JSON.stringify(input)}`);
        for (const handler of this.handlers) {
            try {
                if (!handler.enabled) continue;
                if (!handler.isNetworkSupported(input.network)) continue;
                logger.info(`Executing handler ${handler.constructor.name}`);
                const response = await handler.execute(input);
                if (response.status === 'success' && response.data) {
                    const { fromToken, toToken, exchangeRate, priceImpact, ...rest } = response.data;
                    // interrupt("We need confirm the swap quote: ");
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
                        },
                        needHumanConfirmation: true
                    };
                } else {
                    logger.error(`Handler ${handler.constructor.name} returned error:`, response);
                }
            } catch (error) {
                logger.error(`Handler ${handler.constructor.name} failed:`, error);
                continue;
            }
        }

        return {
            status: 'error',
            message: 'No handler was able to get a swap quote'
        };
    }
} 