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

export const DEFAULT_NETWORK: Network = 'solana'; 