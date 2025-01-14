import { z } from 'zod';
import { BaseTool, NetworkName, ToolConfig, Agent } from '@genie/core';
import { ethers } from 'ethers';
import { PublicKey } from '@solana/web3.js';
import { GetBalanceHandler } from '../handlers';
import { GetBalanceHandlerRequest, GetBalanceToolInput, GetBalanceToolOutput, NetworkBalance } from '../types';
import { log } from 'console';

export class GetBalanceTool extends BaseTool<GetBalanceToolInput, GetBalanceToolOutput, GetBalanceHandler> {
  public static readonly TOOL_NAME = 'get_balance';
  constructor(agent: Agent, callback?: (toolName: string, input: GetBalanceToolInput, output: GetBalanceToolOutput) => void) {
    const supportedNetworks = agent.dependencies.network.getSupportedNetworks();
    
    const config: ToolConfig<GetBalanceToolInput> = {
      name: GetBalanceTool.TOOL_NAME,
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

    super(agent, config, callback);
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
    
    // Get addresses for each network
    const networkAddresses = await Promise.all(
      networksToQuery.map(async (network) => ({
        network,
        address: await wallet.getAddress(network)
      }))
    );

    let allBalances: NetworkBalance[] = [];
    let totalUsdValue: string | undefined;

    // Try each handler for each network
    for (const { network, address } of networkAddresses) {
      const request: GetBalanceHandlerRequest = {
        address,
        networks: [network]
      };

      console.log('Request:', request);

      let networkHandled = false;

      // Try each handler in priority order until one succeeds for this network
      for (const handler of this.handlers) {
        try {
          // Skip disabled handlers
          if (!handler.enabled) continue;

          // Check if handler supports this network
          if (!handler.isNetworkSupported(network)) continue;

          const response = await handler.execute(request);

          // If handler execution was successful, store the balance
          if (response.status === 'success' && response.data) {
            allBalances = [...allBalances, ...response.data.balances];
            if (response.data.totalUsdValue) {
              totalUsdValue = totalUsdValue 
                ? (parseFloat(totalUsdValue) + parseFloat(response.data.totalUsdValue)).toString()
                : response.data.totalUsdValue;
            }
            networkHandled = true;
            break;
          } else {
            console.log('Handler failed:', response);
          }
        } catch (error) {
          console.error(`Handler ${handler.constructor.name} failed for network ${network}:`, error);
          // Continue to next handler on error
          continue;
        }
      }

      if (!networkHandled) {
        console.warn(`No handler was able to get balance for network ${network}`);
      }
    }

    // Return error only if no balances were retrieved at all
    if (allBalances.length === 0) {
      return {
        status: 'error',
        message: 'No handler was able to successfully get any balances'
      };
    }

    return {
      status: 'success',
      data: {
        balances: allBalances,
        ...(totalUsdValue && { totalUsdValue })
      }
    };
  }
} 