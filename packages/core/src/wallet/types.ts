import { Transaction as EVMTransaction } from 'ethers';
import { Transaction as SolanaTransaction, VersionedTransaction } from '@solana/web3.js';

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
  network: string;
}

export interface EVMSignTransactionParams {
  transaction: EVMTransaction;
  network: string;
}

export interface SolanaSignTransactionParams {
  transaction: SolanaTransaction | VersionedTransaction;
  network: string;
}

export type SignTransactionParams = EVMSignTransactionParams | SolanaSignTransactionParams;

export interface WalletInterface {
  getAddress(network: string): Promise<string>;
  signMessage(params: SignMessageParams): Promise<string>;
  signTransaction(params: SignTransactionParams): Promise<string>;
} 