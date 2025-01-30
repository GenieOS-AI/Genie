import { z } from 'zod';
import { Tool, ToolConfig, IAgent, logger } from '@genie/core';
import { ExecuteSwapHandler } from '../handlers/ExecuteSwapHandler';
import { ExecuteSwapToolInput, ExecuteSwapToolOutput } from '../types';

export class ExecuteSwapTool extends Tool<ExecuteSwapToolInput, ExecuteSwapToolOutput, ExecuteSwapHandler> {
    public static readonly TOOL_NAME = 'execute_swap';

    constructor(agent: IAgent, callback?: (toolName: string, input: ExecuteSwapToolInput, output: ExecuteSwapToolOutput) => void) {
        const supportedNetworks = agent.dependencies.network.getSupportedNetworks();

        const config: ToolConfig<ExecuteSwapToolInput> = {
            name: ExecuteSwapTool.TOOL_NAME,
            description: 'Execute a token swap using a previously obtained quote',
            schema: z.object({
                quoteId: z.string().describe('The quote ID obtained from get_swap_quote'),
                network: z.enum(supportedNetworks as [string, ...string[]]).describe('The network to perform the swap on')
            }) as any,
            examples: [
                {
                    user: 'Execute the swap with quote ID abc123 on Ethereum',
                    tool: {
                        params: {
                            quoteId: 'abc123',
                            network: 'ethereum'
                        }
                    }
                }
            ]
        };

        super(agent, config, callback);
    }

    validateInput(input: ExecuteSwapToolInput): { status: boolean; errors?: string[] } {
        const errors: string[] = [];
        const supportedNetworks = this.agent.dependencies.network.getSupportedNetworks();

        if (!input.quoteId) {
            errors.push('quoteId is required');
        }
        if (!input.network) {
            errors.push('network is required');
        } else if (!supportedNetworks.includes(input.network)) {
            errors.push(`Network '${input.network}' is not supported. Available networks: ${supportedNetworks.join(', ')}`);
        }

        return {
            status: errors.length === 0,
            ...(errors.length > 0 && { errors })
        };
    }

    protected async execute(input: ExecuteSwapToolInput): Promise<ExecuteSwapToolOutput> {
        // Try each handler in priority order until one succeeds
        for (const handler of this.handlers) {
            try {
                if (!handler.enabled) continue;
                if (!handler.isNetworkSupported(input.network)) continue;
                // Validate quote before execution
                if (!await handler.validateQuote(input.quoteId)) {
                    continue;
                }

                const walletAddress = await this.agent.dependencies.wallet.getAddress(input.network);

                const response = await handler.execute({
                    quoteId: input.quoteId,
                    network: input.network,
                    walletAddress: walletAddress
                });

                if (response.status === 'success' && response.data) {

                    if (response.data.network == 'solana') {
                        logger.info(`Swapping transaction for ${walletAddress} on ${input.network} with quote ID ${input.quoteId}`);
                        const transaction = await this.agent.dependencies.wallet.signAndSendTransaction(response.data.network, {data: response.data.transaction});
                        let txhash = transaction.hash;
                        await transaction.wait();
                        return {
                            status: 'success',
                            data: {
                                fromToken: response.data.fromToken,
                                toToken: response.data.toToken,
                                network: response.data.network,
                                status: 'confirmed',
                                transactionHash: txhash
                            }
                        };
                    } else {
                        throw new Error('Unsupported network');
                    }
                    
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                console.error(`Handler ${handler.constructor.name} failed:`, error);
                continue;
            }
        }

        return {
            status: 'error',
            message: 'No handler was able to execute the swap'
        };
    }
} 