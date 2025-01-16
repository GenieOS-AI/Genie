import { Tool, ToolConfig, IAgent, logger } from '@genie/core';
import { GetTokenInfoToolOutput, GetTokenInfoToolInput, TokenQuery } from '../types';
import { GetTokenInfoHandler } from '../handlers';
import { TokenInfoHandlerRequest, TokenInfoHandlerResponse } from '../types/tool-handler';
import { z } from 'zod';

export class GetTokenInfoTool extends Tool<GetTokenInfoToolInput, GetTokenInfoToolOutput, GetTokenInfoHandler> {
  public static readonly TOOL_NAME = 'get_token_info';

  constructor(agent: IAgent, callback?: (toolName: string, input: GetTokenInfoToolInput, output: GetTokenInfoToolOutput) => void) {
    const supportedNetworks = agent.dependencies.network.getSupportedNetworks();
    
    const config: ToolConfig<GetTokenInfoToolInput> = {
      name: GetTokenInfoTool.TOOL_NAME,
      description: 'Get detailed information about multiple tokens by their addresses or symbols',
      schema: z.object({
        tokens: z.array(z.object({
          query: z.string()
            .describe('The token address or symbol to search for'),
          network: z.enum(supportedNetworks as [string, ...string[]])
            .optional()
            .describe('The specific network to search on')
        }))
      }) as any,
      examples: [
        {
          user: 'What is the token info for addresses 0x123 and 0x456?',
          tool: {
            params: {
              tokens: [
                { query: '0x123' },
                { query: '0x456' }
              ]
            }
          }
        },
        {
          user: 'Get info about USDC and USDT tokens',
          tool: {
            params: {
              tokens: [
                { query: 'USDC' },
                { query: 'USDT' }
              ]
            }
          }
        },
        {
          user: `Get info about USDC on ${supportedNetworks[0]} and USDT on ${supportedNetworks[0]}`,
          tool: {
            params: {
              tokens: [
                { query: 'USDC', network: supportedNetworks[0] },
                { query: 'USDT', network: supportedNetworks[0] }
              ]
            }
          }
        }
      ]
    };

    super(agent, config, callback);
  }

  validateInput(input: GetTokenInfoToolInput): { status: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(input.tokens) || input.tokens.length === 0) {
      errors.push('Input must contain a non-empty array of token queries');
      return { status: false, errors };
    }

    input.tokens.forEach((token) => {
      // Validate network if provided
      if (token.network) {
        const supportedNetworks = this.agent.dependencies.network.getSupportedNetworks();
        if (!supportedNetworks.includes(token.network)) {
          errors.push(`Invalid network for query ${token.query}: ${token.network}. Supported networks are: ${supportedNetworks.join(', ')}`);
        }
      }

      // Validate query format if it looks like an address
      if (token.query.startsWith('0x')) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(token.query)) {
          errors.push(`Invalid Ethereum address format for query ${token.query}`);
        }
      } else if (token.query.length >= 32 && token.query.length <= 44) {
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token.query)) {
          errors.push(`Invalid Solana address format for query ${token.query}`);
        }
      }
      // If it's not an address format, assume it's a symbol and validate length
      else if (token.query.length > 20) {
        errors.push(`Token symbol is too long for query ${token.query}`);
      }
    });
    
    return {
      status: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
  }

  protected async execute(input: GetTokenInfoToolInput): Promise<GetTokenInfoToolOutput> {
    const results: TokenInfoHandlerResponse[] = [];
    
    // Process each input query
    for (const token of input.tokens) {
      let queryResult: TokenInfoHandlerResponse = {
        status: 'error',
        message: 'No handler was able to fetch token information for ' + token.query
      };

      // Try each handler for the current input
      for (const handler of this.handlers) {
        try {
          if (!handler.enabled) continue;
          if (token.network && !handler.isNetworkSupported(token.network)) continue;

          logger.info(`Executing handler ${handler.constructor.name} for query: ${token.query}`);
          const handlerRequest: TokenInfoHandlerRequest = {
            query: token.query,
            ...(token.network && { network: token.network })
          };
          const response = await handler.execute(handlerRequest);

          if (response.status === 'success' && response.data) {
            queryResult = response;
            break;
          } else {
            logger.error(`Handler ${handler.constructor.name} failed:`, response);
          }
        } catch (error) {
          logger.error(`Handler ${handler.constructor.name} failed:`, error);
          continue;
        }
      }

      results.push(queryResult);
    }

    return {
      status: 'success',
      data: {
        results
      }
    };
  }
} 