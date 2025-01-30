import { z } from 'zod';
import { NetworkName, ToolConfig, IAgent, Tool } from '@genie/core';
import { GetAddressToolInput, GetAddressToolOutput } from '../types/tool';

export class GetWalletAddressTool extends Tool<GetAddressToolInput, GetAddressToolOutput, any> {
  public static readonly TOOL_NAME = 'get_wallet_address';
  constructor(agent: IAgent, callback?: (toolName: string, input: GetAddressToolInput, output: GetAddressToolOutput) => void) {
    const supportedNetworks = agent.dependencies.network.getSupportedNetworks();
    
    const config: ToolConfig<GetAddressToolInput> = {
      name: GetWalletAddressTool.TOOL_NAME,
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

  validateInput(input: GetAddressToolInput): { status: boolean; errors?: string[] } {
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

  protected async execute(input: GetAddressToolInput): Promise<GetAddressToolOutput> {
    const { wallet, network } = this.agent.dependencies;
    const networksToQuery = input.networks?.length ? input.networks : network.getSupportedNetworks();
    const addresses: Partial<Record<NetworkName, string>> = {};

    await Promise.all(
      networksToQuery.map(async (networkName) => {
        const address = await wallet.getAddress(networkName);
        addresses[networkName] = address;
      })
    );

    return {
      status: 'success',
      data: addresses
    };
  }
} 