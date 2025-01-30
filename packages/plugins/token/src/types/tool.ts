import { IHandlerResponse, NetworkName, TokenInfo, ToolInput, ToolOutput } from '@genie/core';

export interface TokenQuery extends Record<string, unknown> {
  query: string;
  network?: NetworkName;
}

export interface GetTokenInfoToolInput extends ToolInput {
  tokens: TokenQuery[];
}

export interface GetTokenInfoToolOutput extends ToolOutput {
  data?: {
    results: Array<{
      status: 'success' | 'error';
      data?: TokenInfo;
      message?: string;
    }>;
  };
}