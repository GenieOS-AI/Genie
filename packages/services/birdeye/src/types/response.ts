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

export interface SearchTokenResult {
  name: string;
  symbol: string;
  address: string;
  price: number;
  price_change_24h_percent: number;
  volume_24h_usd: number;
  market_cap: number | null;
  liquidity: number;
  network: string;
  logo_uri: string;
  fdv: number | null;
  decimals?: number;
  buy_24h: number;
  sell_24h: number;
  trade_24h: number;
  unique_wallet_24h: number;
  last_trade_unix_time: number;
  last_trade_human_time: string;
  creation_time?: string;
  verified?: boolean;
}

export interface SearchTokenData {
  items: Array<{
    type: string;
    result: SearchTokenResult[];
  }>;
}

export interface TokenInfoData {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  extensions?: {
    coingeckoId?: string;
    website?: string;
    twitter?: string;
    discord?: string;
  };
  logoURI?: string;
  price: number;
  liquidity: number;
  priceChange24hPercent: number;
  volume_24h: number;
  volume_24h_usd: number;
  market_cap: number;
  holder: number;
  supply: number;
}

export type SearchTokenResponse = ApiResponse<SearchTokenData>;
export type GetTokenInfoResponse = ApiResponse<TokenInfoData>; 