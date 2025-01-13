export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TokenPriceData {
  value: number;
  updateUnixTime: number;
  updateTime: string;
}

export interface PortfolioToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  uiAmount: number;
  chainId: string;
  logoURI: string;
  priceUsd: number;
  valueUsd: number;
}

export interface PortfolioData {
  wallet: string;
  totalUsd: number;
  items: PortfolioToken[];
}

export type GetTokenPriceResponse = ApiResponse<TokenPriceData>;
export type GetPortfolioResponse = ApiResponse<PortfolioData>; 