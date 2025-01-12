import { z } from 'zod';
import { BaseTool, NetworkName, ToolConfig, Agent } from '@genie/core';
import { ethers } from 'ethers';
import { PublicKey } from '@solana/web3.js';

export interface GetBalanceInput extends Record<string, unknown> {
  network?: NetworkName;
}

export class GetBalanceTool extends BaseTool<GetBalanceInput> {
  constructor(agent: Agent, callback?: (toolName: string, input: GetBalanceInput, output: string) => void) {
    const supportedNetworks = agent.dependencies.network.getSupportedNetworks();
    
    const config: ToolConfig<GetBalanceInput> = {
      name: 'get_balance',
      description: 'Get the wallet balance for one or all networks. If network is not specified, returns balances for all supported networks.',
      schema: z.object({
        network: z.enum(supportedNetworks as [string, ...string[]]).optional().describe('The network to get the balance for. If not provided, returns balances for all networks.')
      }) as any,
      examples: [
        {
          user: `What is my ${supportedNetworks[0]} balance?`,
          tool: {
            params: { network: supportedNetworks[0] }
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

  validateInput(input: GetBalanceInput): { status: boolean; errors?: string[] } {
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

  protected async execute(input: GetBalanceInput): Promise<string> {
    const { wallet, network } = this.agent.dependencies;

    async function getBalanceForNetwork(networkName: NetworkName): Promise<string> {
      const address = await wallet.getAddress(networkName);
      const provider = network.getProvider(networkName);
      const networkType = network.getNetworkConfig(networkName).type;

      let balance: string;
      if (networkType === 'evm') {
        const rawBalance = await (provider as ethers.Provider).getBalance(address);
        balance = ethers.formatEther(rawBalance);
        return `${networkName}: ${balance} ETH`;
      } else {
        const pubKey = new PublicKey(address);
        const connection = provider as any;
        const rawBalance = await connection.getBalance(pubKey);
        balance = (Number(rawBalance) / 1e9).toString();
        return `${networkName}: ${balance} SOL`;
      }
    }

    if (input.network) {
      const balanceStr = await getBalanceForNetwork(input.network);
      return `Your wallet balance: ${balanceStr}`;
    }

    // Get balances for all supported networks
    const supportedNetworks = network.getSupportedNetworks();
    const balances = await Promise.all(
      supportedNetworks.map(getBalanceForNetwork)
    );

    return `Your wallet balances:\n${balances.join('\n')}`;
  }
} 