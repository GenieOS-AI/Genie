import { NetworksConfig } from './types';

export const defaultNetworksConfig: NetworksConfig = {
  defaultNetwork: 'ethereum-mainnet',
  networks: {
    'ethereum-mainnet': {
      type: 'evm',
      config: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
        explorerUrl: 'https://etherscan.io',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
      },
    },
    'ethereum-goerli': {
      type: 'evm',
      config: {
        chainId: 5,
        name: 'Goerli Testnet',
        rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/your-api-key',
        explorerUrl: 'https://goerli.etherscan.io',
        nativeCurrency: {
          name: 'Goerli Ether',
          symbol: 'ETH',
          decimals: 18,
        },
      },
    },
    'polygon-mainnet': {
      type: 'evm',
      config: {
        chainId: 137,
        name: 'Polygon Mainnet',
        rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
        explorerUrl: 'https://polygonscan.com',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
      },
    },
    'solana-mainnet': {
      type: 'solana',
      config: {
        name: 'Solana Mainnet',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        explorerUrl: 'https://explorer.solana.com',
        wsEndpoint: 'wss://api.mainnet-beta.solana.com',
      },
    },
    'solana-devnet': {
      type: 'solana',
      config: {
        name: 'Solana Devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
        wsEndpoint: 'wss://api.devnet.solana.com',
      },
    },
  },
}; 