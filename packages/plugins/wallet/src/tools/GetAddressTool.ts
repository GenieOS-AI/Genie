import { z } from 'zod';
import { BaseTool, NetworkName, ToolConfig, Agent } from '@genie/core';

interface GetAddressInput extends Record<string, unknown> {
  network?: NetworkName;
}

export class GetAddressTool extends BaseTool<GetAddressInput> {
  constructor(agent: Agent, callback?: (toolName: string, input: GetAddressInput, output: string) => void) {
    const supportedNetworks = agent.dependencies.network.getSupportedNetworks();
    
    const config: ToolConfig<GetAddressInput> = {
      name: 'get_address',
      description: 'Get the wallet address for one or all networks. If network is not specified, returns addresses for all supported networks.',
      schema: z.object({
        network: z.enum(supportedNetworks as [string, ...string[]]).optional()
          .describe('The network to get the address for. If not provided, returns addresses for all networks.')
      }) as any,
      examples: [
        {
          user: `What is my ${supportedNetworks[0]} address?`,
          tool: {
            params: { network: supportedNetworks[0] }
          }
        },
        {
          user: 'What are all my wallet addresses?',
          tool: {
            params: {}
          }
        }
      ]
    };

    super(agent, config, callback);
  }

  validateInput(input: GetAddressInput): { status: boolean; errors?: string[] } {
    const errors: string[] = [];
    const supportedNetworks = this.agent.dependencies.network.getSupportedNetworks();

    if (input.network && !supportedNetworks.includes(input.network)) {
      errors.push(`Network '${input.network}' is not supported. Available networks: ${supportedNetworks.join(', ')}`);
    }

    return {
      status: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
  }

  protected async execute(input: GetAddressInput): Promise<string> {
    const { wallet, network } = this.agent.dependencies;
    
    if (input.network) {
      const address = await wallet.getAddress(input.network);
      return `The wallet address for ${input.network} is: ${address}`;
    }

    // Get addresses for all supported networks
    const supportedNetworks = network.getSupportedNetworks();
    const addresses = await Promise.all(
      supportedNetworks.map(async (networkName) => {
        const address = await wallet.getAddress(networkName);
        return `${networkName}: ${address}`;
      })
    );

    return `Your wallet addresses:\n${addresses.join('\n')}`;
  }
} 