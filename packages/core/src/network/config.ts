import { NetworksConfig, NetworkName } from './types';

export const defaultNetworksConfig: NetworksConfig = {
  defaultNetwork: NetworkName.ETHEREUM,
  networks: {
    [NetworkName.ETHEREUM]: {
      type: 'evm',
      config: {
        chainId: 1,
        name: 'Ethereum',
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
        explorerUrl: 'https://etherscan.io',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
      },
    },
    [NetworkName.POLYGON]: {
      type: 'evm',
      config: {
        chainId: 137,
        name: 'Polygon',
        rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
        explorerUrl: 'https://polygonscan.com',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
      },
    },
    [NetworkName.SOLANA]: {
      type: 'solana',
      config: {
        name: 'Solana',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        explorerUrl: 'https://explorer.solana.com',
        wsEndpoint: 'wss://api.mainnet-beta.solana.com',
      },
    },
  },
}; 