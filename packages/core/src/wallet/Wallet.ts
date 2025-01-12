import { ethers } from 'ethers';
import { Keypair, Transaction as SolanaTransaction, VersionedTransaction } from '@solana/web3.js';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { NetworkManager } from '../network/NetworkManager';
import { NetworkType, NetworkName } from '../network/types';
import {
  WalletConfig,
  WalletInterface,
  SignMessageParams,
  SignTransactionParams,
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

  public async getAddress(network: NetworkName): Promise<string> {
    const networkType = this.getNetworkType(network);
    
    if (networkType === 'evm') {
      return this.#evmWallet.address;
    } else {
      return this.#solanaKeypair.publicKey.toString();
    }
  }

  public async signMessage(params: SignMessageParams): Promise<string> {
    const networkType = this.getNetworkType(params.network);
    
    if (networkType === 'evm') {
      return await this.#evmWallet.signMessage(params.message);
    } else {
      const messageBytes = new TextEncoder().encode(params.message);
      const signature = nacl.sign.detached(
        messageBytes,
        this.#solanaKeypair.secretKey
      );
      return bs58.encode(signature);
    }
  }

  public async signTransaction(params: SignTransactionParams): Promise<string> {
    const networkType = this.getNetworkType(params.network);

    if (networkType === 'evm') {
      const evmTx = params.transaction as ethers.Transaction;
      const signedTx = await this.#evmWallet.signTransaction(evmTx);
      return signedTx;
    } else {
      const solanaTx = params.transaction as (SolanaTransaction | VersionedTransaction);
      if (solanaTx instanceof VersionedTransaction) {
        solanaTx.sign([this.#solanaKeypair]);
        return Buffer.from(solanaTx.serialize()).toString('base64');
      } else if (solanaTx instanceof SolanaTransaction) {
        solanaTx.partialSign(this.#solanaKeypair);
        return Buffer.from(solanaTx.serialize()).toString('base64');
      }
      throw new Error('Invalid Solana transaction type');
    }
  }
} 