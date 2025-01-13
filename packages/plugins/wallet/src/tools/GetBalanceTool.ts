import { z } from 'zod';
import { BaseTool, NetworkName, ToolConfig, Agent } from '@genie/core';
import { ethers } from 'ethers';
import { PublicKey } from '@solana/web3.js';
import { GetBalanceHandler } from '../handlers';
import { GetBalanceHandlerRequest, GetBalanceToolInput, GetBalanceToolOutput } from '../types';

export class GetBalanceTool extends BaseTool<GetBalanceToolInput, GetBalanceToolOutput, GetBalanceHandler> {
  constructor(agent: Agent, handlers: GetBalanceHandler[], callback?: (toolName: string, input: GetBalanceToolInput, output: GetBalanceToolOutput) => void) {
    const supportedNetworks = agent.dependencies.network.getSupportedNetworks();
    
    const config: ToolConfig<GetBalanceToolInput> = {
      name: 'get_balance',
      description: 'Get the wallet balance for one or all networks. If network is not specified, returns balances for all supported networks.',
      schema: z.object({
        networks: z.array(z.enum(supportedNetworks as [string, ...string[]])).optional()
          .describe('The networks to get balances for. If not provided, returns balances for all networks.')
      }) as any,
      examples: [
        {
          user: `What is my ${supportedNetworks[0]} balance?`,
          tool: {
            params: { networks: [supportedNetworks[0]] }
          }
        },
        {
          user: 'What are all my wallet balances?',
          tool: {
            params: {}
          }
        }
      ]
    };

    super(agent, config, handlers, callback);
  }

  validateInput(input: GetBalanceToolInput): { status: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    if (input.network) {
      const supportedNetworks = this.agent.dependencies.network.getSupportedNetworks();
      if (!supportedNetworks.includes(input.network)) {
        errors.push(`Invalid network: ${input.network}. Supported networks are: ${supportedNetworks.join(', ')}`);
      }
    }
    
    return {
      status: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
  }

  protected async execute(input: GetBalanceToolInput): Promise<GetBalanceToolOutput> {
    const { wallet } = this.agent.dependencies;
    const networksToQuery = input.networks?.length ? input.networks : this.agent.dependencies.network.getSupportedNetworks();
    
    // Get wallet address for the networks
    const address = await wallet.getAddress(networksToQuery[0]);

    // Create handler request
    const request: GetBalanceHandlerRequest = {
      address,
      networks: networksToQuery
    };

    // Try each handler in priority order until one succeeds
    for (const handler of this.handlers) {
      try {
        // Skip disabled handlers
        if (!handler.enabled) continue;

        // Check if handler supports the requested networks
        const supported = networksToQuery.every(network => handler.isNetworkSupported(network));
        if (!supported) continue;

        const response = await handler.execute(request);
        
        // If handler execution was successful, return the response
        if (response.status === 'success' && response.data) {
          return {
            status: 'success',
            data: response.data
          };
        }
      } catch (error) {
        console.error(`Handler ${handler.constructor.name} failed:`, error);
        // Continue to next handler on error
        continue;
      }
    }

    // If no handler succeeded, return error
    return {
      status: 'error',
      message: 'No handler was able to successfully get balances'
    };
  }
} 