import { IHandlerResponse, NetworkName, TokenInfo } from '@genie/core';

export interface TokenInfoHandlerRequest {
  [key: string]: unknown;
  query: string;
  network?: NetworkName;
}

export interface TokenInfoHandlerResponse extends IHandlerResponse {
  data?: TokenInfo;
} 