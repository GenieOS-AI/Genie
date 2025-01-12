import { ethers } from 'ethers';
import { Connection } from '@solana/web3.js';
import { NetworksConfig, NetworkConfig, EVMNetworkConfig, SolanaNetworkConfig, NetworkName } from './types';

export class NetworkManager {
  #networks: NetworksConfig;
  #evmProviders: Map<NetworkName, ethers.JsonRpcProvider>;
  #solanaConnections: Map<NetworkName, Connection>;

  constructor(config: NetworksConfig) {
    this.#networks = config;
    this.#evmProviders = new Map();
    this.#solanaConnections = new Map();
    this.#initializeNetworks();
  }

  #initializeNetworks() {
    Object.entries(this.#networks.networks).forEach(([networkName, networkConfig]) => {
      this.#initializeNetwork(networkName as NetworkName, networkConfig);
    });
  }

  #initializeNetwork(networkName: NetworkName, networkConfig: NetworkConfig) {
    if (networkConfig.type === 'evm') {
      const evmConfig = networkConfig.config as EVMNetworkConfig;
      const provider = new ethers.JsonRpcProvider(evmConfig.rpcUrl);
      this.#evmProviders.set(networkName, provider);
    } else if (networkConfig.type === 'solana') {
      const solanaConfig = networkConfig.config as SolanaNetworkConfig;
      const connection = new Connection(solanaConfig.rpcUrl);
      this.#solanaConnections.set(networkName, connection);
    }
  }

  public isNetworkSupported(networkName: NetworkName): boolean {
    return networkName in this.#networks.networks;
  }

  public getSupportedNetworks(): NetworkName[] {
    return Object.keys(this.#networks.networks) as NetworkName[];
  }

  public getProvider(networkName: NetworkName): ethers.JsonRpcProvider | Connection {
    const network = this.#networks.networks[networkName];
    if (!network) {
      throw new Error(`Network ${networkName} not found`);
    }

    if (network.type === 'evm') {
      const provider = this.#evmProviders.get(networkName);
      if (!provider) {
        throw new Error(`EVM provider for network ${networkName} not found`);
      }
      return provider;
    } else {
      const connection = this.#solanaConnections.get(networkName);
      if (!connection) {
        throw new Error(`Solana connection for network ${networkName} not found`);
      }
      return connection;
    }
  }

  public getNetworkConfig(networkName: NetworkName): NetworkConfig {
    const config = this.#networks.networks[networkName];
    if (!config) {
      throw new Error(`Network ${networkName} not found`);
    }
    return config;
  }
} 