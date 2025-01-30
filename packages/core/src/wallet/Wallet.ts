import { ethers } from 'ethers';
import { 
  Keypair, 
  Transaction as SolanaTransaction, 
  VersionedTransaction, 
  Connection, 
  TransactionSignature,
  SendOptions,
  Commitment
} from '@solana/web3.js';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { NetworkManager } from '../network/NetworkManager';
import { NetworkType, NetworkName } from '../network/types';
import {
  WalletConfig,
  WalletInterface,
  SignMessageParams,
  SignTransactionParams,
  TransactionRequest,
  TransactionReceipt,
} from './types';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

export class Wallet implements WalletInterface {
  #evmWallet: ethers.HDNodeWallet;
  #solanaKeypair: Keypair;
  #networkManager: NetworkManager;

  constructor(config: WalletConfig, networkManager: NetworkManager) {
    this.#networkManager = networkManager;
    
    // Initialize EVM wallet
    this.#evmWallet = ethers.HDNodeWallet.fromPhrase(
      config.seedPhrase,
      `m/44'/60'/0'/0/${config.index}`
    );

    // Initialize Solana wallet
    const seed = mnemonicToSeedSync(config.seedPhrase);
    const derivedPath = `m/44'/501'/${config.index}'/0'`;
    const keyPair = derivePath(derivedPath, seed.toString('hex'));
    this.#solanaKeypair = Keypair.fromSeed(keyPair.key);
  }

  private getNetworkType(network: NetworkName): NetworkType {
    const networkConfig = this.#networkManager.getNetworkConfig(network);
    return networkConfig.type;
  }

  // Helper method to create a transaction receipt
  private createTransactionReceipt(hash: string, waitFn: () => Promise<void>): TransactionReceipt {
    const createNestedReceipt = (h: string): TransactionReceipt => ({
      hash: h,
      wait: async () => {
        throw new Error('Already waited');
      }
    });

    return {
      hash,
      wait: async () => {
        await waitFn();
        return createNestedReceipt(hash);
      }
    };
  }

  // Helper method to wait for Solana transaction
  private async waitForSolanaTransaction(
    connection: Connection,
    signature: string,
    blockhash: string,
    lastValidBlockHeight: number
  ): Promise<void> {
    const result = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    if (result.value.err) {
      throw new Error(`Transaction failed: ${result.value.err.toString()}`);
    }
  }

  // Helper method to handle Solana transaction sending
  private async sendSolanaTransaction(
    connection: Connection,
    transaction: Buffer | SolanaTransaction | VersionedTransaction,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature; blockhash: string; lastValidBlockHeight: number }> {
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

      if (transaction instanceof Buffer) {
        const signature = await connection.sendRawTransaction(transaction, options);
        return { signature, blockhash, lastValidBlockHeight };
      } else if (transaction instanceof VersionedTransaction) {
        const serialized = transaction.serialize();
        const signature = await connection.sendRawTransaction(serialized, options);
        return { signature, blockhash, lastValidBlockHeight };
      } else {
        const signature = await connection.sendTransaction(transaction as SolanaTransaction, [this.#solanaKeypair], options);
        return { signature, blockhash, lastValidBlockHeight };
      }
    } catch (error: any) {
      throw new Error(`Failed to send Solana transaction: ${error?.message || 'Unknown error'}`);
    }
  }

  // Helper method to parse and sign Solana transaction
  private async prepareSolanaTransaction(data: string): Promise<SolanaTransaction | VersionedTransaction> {
    const txBuffer = Buffer.from(data, 'base64');
    try {
      // Try versioned transaction first
      const versionedTx = VersionedTransaction.deserialize(txBuffer);
      versionedTx.sign([this.#solanaKeypair]);
      return versionedTx;
    } catch {
      // Fall back to regular transaction
      const tx = SolanaTransaction.from(txBuffer);
      tx.partialSign(this.#solanaKeypair);
      return tx;
    }
  }

  public async getAddress(network: NetworkName): Promise<string> {
    const networkType = this.getNetworkType(network);
    return networkType === 'evm' 
      ? this.#evmWallet.address 
      : this.#solanaKeypair.publicKey.toString();
  }

  public async signMessage(params: SignMessageParams): Promise<string> {
    const networkType = this.getNetworkType(params.network);
    
    if (networkType === 'evm') {
      return await this.#evmWallet.signMessage(params.message);
    }
    
    const messageBytes = new TextEncoder().encode(params.message);
    const signature = nacl.sign.detached(messageBytes, this.#solanaKeypair.secretKey);
    return bs58.encode(signature);
  }

  public async signTransaction(params: SignTransactionParams): Promise<string> {
    const networkType = this.getNetworkType(params.network);

    if (networkType === 'evm') {
      const evmTx = params.transaction as ethers.Transaction;
      return await this.#evmWallet.signTransaction(evmTx);
    }

    const solanaTx = params.transaction as (SolanaTransaction | VersionedTransaction);
    if (solanaTx instanceof VersionedTransaction) {
      solanaTx.sign([this.#solanaKeypair]);
      return Buffer.from(solanaTx.serialize()).toString('base64');
    } 
    
    if (solanaTx instanceof SolanaTransaction) {
      solanaTx.partialSign(this.#solanaKeypair);
      return Buffer.from(solanaTx.serialize()).toString('base64');
    }
    
    throw new Error('Invalid Solana transaction type');
  }

  public async sendTransaction(network: NetworkName, transaction: TransactionRequest): Promise<TransactionReceipt> {
    const networkType = this.getNetworkType(network);
    
    if (networkType === 'evm') {
      const provider = this.#networkManager.getProvider(network) as ethers.JsonRpcProvider;
      const signer = this.#evmWallet.connect(provider);
      
      try {
        const tx = await signer.sendTransaction({
          to: transaction.to,
          data: transaction.data,
          value: transaction.value,
          gasLimit: transaction.gasLimit,
        });

        return this.createTransactionReceipt(
          tx.hash,
          async () => {
            const receipt = await tx.wait();
            if (!receipt) throw new Error('Transaction failed');
          }
        );
      } catch (error: any) {
        throw new Error(`Failed to send EVM transaction: ${error?.message || 'Unknown error'}`);
      }
    }

    const connection = this.#networkManager.getProvider(network) as Connection;
    
    try {
      const tx = await this.prepareSolanaTransaction(transaction.data!);
      const { signature, blockhash, lastValidBlockHeight } = await this.sendSolanaTransaction(
        connection,
        tx,
        { skipPreflight: false, preflightCommitment: 'confirmed' as Commitment }
      );

      return this.createTransactionReceipt(
        signature,
        async () => {
          await this.waitForSolanaTransaction(connection, signature, blockhash, lastValidBlockHeight);
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to send Solana transaction: ${error?.message || 'Unknown error'}`);
    }
  }

  public async signAndSendTransaction(network: NetworkName, transaction: TransactionRequest): Promise<TransactionReceipt> {
    const networkType = this.getNetworkType(network);
    
    if (networkType === 'evm') {
      const provider = this.#networkManager.getProvider(network) as ethers.JsonRpcProvider;
      const signer = this.#evmWallet.connect(provider);
      
      try {
        const tx = await signer.populateTransaction({
          to: transaction.to,
          data: transaction.data,
          value: transaction.value,
          gasLimit: transaction.gasLimit,
        });
        
        const signedTx = await signer.signTransaction(tx);
        const sentTx = await provider.broadcastTransaction(signedTx);

        return this.createTransactionReceipt(
          sentTx.hash,
          async () => {
            const receipt = await sentTx.wait();
            if (!receipt) throw new Error('Transaction failed');
          }
        );
      } catch (error: any) {
        throw new Error(`Failed to sign and send EVM transaction: ${error?.message || 'Unknown error'}`);
      }
    }

    const connection = this.#networkManager.getProvider(network) as Connection;
    
    try {
      const tx = await this.prepareSolanaTransaction(transaction.data!);
      const { signature, blockhash, lastValidBlockHeight } = await this.sendSolanaTransaction(
        connection,
        tx,
        { skipPreflight: false, preflightCommitment: 'confirmed' as Commitment }
      );

      return this.createTransactionReceipt(
        signature,
        async () => {
          await this.waitForSolanaTransaction(connection, signature, blockhash, lastValidBlockHeight);
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to sign and send Solana transaction: ${error?.message || 'Unknown error'}`);
    }
  }
} 