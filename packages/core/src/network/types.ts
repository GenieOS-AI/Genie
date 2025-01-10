export type EVMNetworkConfig = {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
};

export type SolanaNetworkConfig = {
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  wsEndpoint?: string;
};

export type NetworkType = 'evm' | 'solana';

export type NetworkConfig = {
  type: NetworkType;
  config: EVMNetworkConfig | SolanaNetworkConfig;
};

export type NetworksConfig = {
  defaultNetwork: string;
  networks: Record<string, NetworkConfig>;
}; 