import { NetworkManager } from '../NetworkManager';
import { NetworksConfig, NetworkName } from '../types';

describe('NetworkManager', () => {
  let networkManager: NetworkManager;

  beforeEach(() => {
    const config: NetworksConfig = {
      defaultNetwork: NetworkName.ETHEREUM,
      networks: {
        [NetworkName.ETHEREUM]: {
          type: 'evm',
          config: {
            chainId: 1,
            name: 'Ethereum',
            rpcUrl: 'http://localhost:8545',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            }
          }
        },
        [NetworkName.POLYGON]: {
          type: 'evm',
          config: {
            chainId: 137,
            name: 'Polygon',
            rpcUrl: 'http://localhost:8545',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18
            }
          }
        },
        [NetworkName.SOLANA]: {
          type: 'solana',
          config: {
            name: 'Solana',
            rpcUrl: 'http://localhost:8899'
          }
        }
      }
    };
    networkManager = new NetworkManager(config);
  });

  describe('getProvider', () => {
    it('should return correct EVM provider', () => {
      const provider = networkManager.getProvider(NetworkName.ETHEREUM);
      expect(provider).toBeDefined();
    });

    it('should return correct Solana connection', () => {
      const connection = networkManager.getProvider(NetworkName.SOLANA);
      expect(connection).toBeDefined();
    });

    it('should throw error for invalid network', () => {
      // @ts-expect-error Testing invalid network
      expect(() => networkManager.getProvider('invalid-network')).toThrow();
    });
  });

  describe('getNetworkConfig', () => {
    it('should return correct config for ethereum network', () => {
      const config = networkManager.getNetworkConfig(NetworkName.ETHEREUM);
      expect(config.type).toBe('evm');
    });

    it('should return correct config for solana network', () => {
      const config = networkManager.getNetworkConfig(NetworkName.SOLANA);
      expect(config.type).toBe('solana');
    });

    it('should throw error for invalid network', () => {
      // @ts-expect-error Testing invalid network
      expect(() => networkManager.getNetworkConfig('invalid-network')).toThrow();
    });
  });
}); 