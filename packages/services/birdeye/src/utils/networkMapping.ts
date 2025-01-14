import { NetworkName } from '@genie/core';
import { Network } from '../types/request';

export const SUPPORTED_NETWORKS: Network[] = [
    'solana',
    'ethereum',
    'arbitrum',
    'avalanche',
    'bsc',
    'optimism',
    'polygon',
    'base',
    'zksync'
];

export function isSupportedBirdeyeNetwork(network: string): network is Network {
    return SUPPORTED_NETWORKS.includes(network as Network);
}

export function validateNetworkSupport(networks: NetworkName[]): void {
    const unsupportedNetworks = networks.filter(network => {
        try {
            mapNetworkNameToBirdeye(network);
            return false;
        } catch {
            return true;
        }
    });

    if (unsupportedNetworks.length > 0) {
        throw new Error(`The following networks are not supported by Birdeye: ${unsupportedNetworks.join(', ')}`);
    }
}

export function mapNetworkNameToBirdeye(networkName: NetworkName): Network {
    const networkMap: Record<NetworkName, Network> = {
        [NetworkName.ETHEREUM]: 'ethereum',
        [NetworkName.POLYGON]: 'polygon',
        [NetworkName.SOLANA]: 'solana'
    };

    const birdeyeNetwork = networkMap[networkName];
    if (!birdeyeNetwork) {
        throw new Error(`Network ${networkName} is not supported by Birdeye`);
    }

    return birdeyeNetwork;
}

export function getBirdeyeSupportedNetworks(networks?: NetworkName[]): NetworkName[] {
    const supportedNetworks = [
        NetworkName.ETHEREUM,
        NetworkName.POLYGON,
        NetworkName.SOLANA
    ];

    if (networks) {
        return networks.filter(network => supportedNetworks.includes(network));
    }

    return supportedNetworks;
} 