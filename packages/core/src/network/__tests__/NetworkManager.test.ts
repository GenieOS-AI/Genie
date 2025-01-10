import { ethers } from 'ethers';
import { Connection } from '@solana/web3.js';
import { NetworkManager } from '../NetworkManager';
import { NetworksConfig } from '../types';

describe('NetworkManager', () => {
  const mockConfig: NetworksConfig = {
    defaultNetwork: 'ethereum',
    networks: {
      ethereum: {
        type: 'evm',
        config: {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpcUrl: 'https://eth-mainnet.mock.url',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
        },
      },
      solana: {
        type: 'solana',
        config: {
          name: 'Solana Mainnet',
          rpcUrl: 'https://solana-mainnet.mock.url',
        },
      },
    },
  };

  let networkManager: NetworkManager;

  beforeEach(() => {
    networkManager = new NetworkManager(mockConfig);
  });

  describe('initialization', () => {
    it('should create instance with provided config', () => {
      expect(networkManager).toBeInstanceOf(NetworkManager);
    });
  });

  describe('getProvider', () => {
    it('should return EVM provider for ethereum network', () => {
      const provider = networkManager.getProvider('ethereum');
      expect(provider).toBeInstanceOf(ethers.JsonRpcProvider);
    });

    it('should return Solana connection for solana network', () => {
      const connection = networkManager.getProvider('solana');
      expect(connection).toBeInstanceOf(Connection);
    });

    it('should throw error for non-existent network', () => {
      expect(() => networkManager.getProvider('invalid-network')).toThrow(
        'Network invalid-network not found'
      );
    });
  });

  describe('getNetworkConfig', () => {
    it('should return correct config for ethereum network', () => {
      const config = networkManager.getNetworkConfig('ethereum');
      expect(config.type).toBe('evm');
      expect(config.config).toEqual(mockConfig.networks.ethereum.config);
    });

    it('should return correct config for solana network', () => {
      const config = networkManager.getNetworkConfig('solana');
      expect(config.type).toBe('solana');
      expect(config.config).toEqual(mockConfig.networks.solana.config);
    });

    it('should throw error for non-existent network', () => {
      expect(() => networkManager.getNetworkConfig('invalid-network')).toThrow(
        'Network invalid-network not found'
      );
    });
  });
}); 