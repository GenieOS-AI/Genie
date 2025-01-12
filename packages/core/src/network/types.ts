export enum NetworkName {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  SOLANA = 'solana'
}

export type EVMNetworkConfig = {
  chainId: number;
  name: string;
  displayName?: string;
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
  displayName?: string;
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
  defaultNetwork: NetworkName;
  networks: Partial<Record<NetworkName, NetworkConfig>>;
}; 