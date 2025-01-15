export interface JupiterServiceConfig {
    rpcUrl: string;
    cluster: 'mainnet-beta' | 'devnet';
}

export interface CachedQuote {
    quote: any;
    timestamp: number;
}

export interface TokenInfo {
    symbol: string;
    decimals: number;
    address: string;
    chainId?: number;
    name?: string;
    logoURI?: string;
    tags?: string[];
} 