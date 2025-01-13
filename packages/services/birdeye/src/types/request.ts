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

export interface GetTokenPriceRequest {
  address: string;
}

export interface GetPortfolioRequest {
  wallet: string;
  network: Network;
} 