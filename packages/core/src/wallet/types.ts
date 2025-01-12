import { Transaction as EVMTransaction } from 'ethers';
import { Transaction as SolanaTransaction, VersionedTransaction } from '@solana/web3.js';
import { NetworkName } from '../network/types';

export interface WalletConfig {
  seedPhrase: string;
  index: number;
}

export interface WalletInfo {
  address: string;
  publicKey: string;
}

export interface EVMWalletInfo extends WalletInfo {
  type: 'evm';
}

export interface SolanaWalletInfo extends WalletInfo {
  type: 'solana';
}

export type ChainWalletInfo = EVMWalletInfo | SolanaWalletInfo;

export interface SignMessageParams {
  message: string;
  network: NetworkName;
}

export interface EVMSignTransactionParams {
  transaction: EVMTransaction;
  network: NetworkName;
}

export interface SolanaSignTransactionParams {
  transaction: SolanaTransaction | VersionedTransaction;
  network: NetworkName;
}

export type SignTransactionParams = EVMSignTransactionParams | SolanaSignTransactionParams;

export interface WalletInterface {
  getAddress(network: NetworkName): Promise<string>;
  signMessage(params: SignMessageParams): Promise<string>;
  signTransaction(params: SignTransactionParams): Promise<string>;
} 