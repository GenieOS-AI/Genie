export type Network = 
  | 'solana'
  | 'ethereum'
  | 'arbitrum'
  | 'avalanche'
  | 'bsc'
  | 'optimism'
  | 'polygon'
  | 'base'
  | 'zksync';

export type SearchNetwork = Network | 'all';

export interface GetTokenPriceRequest {
  address: string;
}

export interface GetPortfolioRequest {
  wallet: string;
  chain?: Network;
}

export interface SearchTokenRequest {
  chain?: SearchNetwork;
  keyword?: string;
  target?: string;
  sort_by?: string;
  sort_type?: string;
  verify_token?: boolean;
  markets?: string;
  offset?: number;
  limit?: number;
}

export interface GetTokenInfoRequest {
    address: string;
    chain?: SearchNetwork;
} 