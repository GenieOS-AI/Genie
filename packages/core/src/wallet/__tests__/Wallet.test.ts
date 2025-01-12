import { Wallet } from '../Wallet';
import { NetworkManager } from '../../network/NetworkManager';
import { WalletConfig } from '../types';
import { ethers } from 'ethers';
import { Transaction as SolanaTransaction, VersionedTransaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { NetworkName } from '../../network/types';

describe('Wallet', () => {
  let wallet: Wallet;
  let networkManager: NetworkManager;

  beforeEach(() => {
    networkManager = new NetworkManager({
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
        [NetworkName.SOLANA]: {
          type: 'solana',
          config: {
            name: 'Solana',
            rpcUrl: 'http://localhost:8899'
          }
        }
      }
    });

    const config: WalletConfig = {
      seedPhrase: 'diary grass aspect cradle voyage help sick parent fashion coyote guard when online citizen school tank negative summer fashion camp old grocery chunk father',
      index: 0
    };
    wallet = new Wallet(config, networkManager);
  });

  describe('getAddress', () => {
    it('should return correct EVM address', async () => {
      const address = await wallet.getAddress(NetworkName.ETHEREUM);
      expect(address).toBe('0x9A3A775c98135318877Bd08E7babbFcD780BE4e8');
    });

    it('should return correct Solana address', async () => {
      const address = await wallet.getAddress(NetworkName.SOLANA);
      expect(address).toBe('52jKDVLUSk3t8pNFpJfgjEbMuiVhKqvzxsia9CkiCHWJ');
    });
  });

  describe('signMessage', () => {
    it('should sign message for EVM network', async () => {
      const message = 'Hello, World!';
      const signature = await wallet.signMessage({
        network: NetworkName.ETHEREUM,
        message
      });
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should sign message for Solana network', async () => {
      const message = 'Hello, World!';
      const signature = await wallet.signMessage({
        network: NetworkName.SOLANA,
        message
      });
      expect(signature).toMatch(/^[1-9A-HJ-NP-Za-km-z]{87,88}$/);
    });
  });

  describe('signTransaction', () => {
    it('should sign EVM transaction', async () => {
      const tx = ethers.Transaction.from({
        to: '0x1234567890123456789012345678901234567890',
        value: ethers.parseEther('1.0'),
        gasLimit: BigInt(21000),
        nonce: 0,
        chainId: BigInt(1),
        type: 2,
        maxFeePerGas: BigInt(50000000000),
        maxPriorityFeePerGas: BigInt(2000000000),
      });

      const signedTx = await wallet.signTransaction({
        network: NetworkName.ETHEREUM,
        transaction: tx
      });
      expect(signedTx).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should sign Solana transaction', async () => {
      const address = await wallet.getAddress(NetworkName.SOLANA);
      const fromPubkey = new PublicKey(address);
      const tx = new SolanaTransaction();
      tx.recentBlockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
      tx.feePayer = fromPubkey;
      tx.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: fromPubkey,
          lamports: BigInt(1000),
        })
      );

      const signedTx = await wallet.signTransaction({
        network: NetworkName.SOLANA,
        transaction: tx
      });
      expect(signedTx).toBeTruthy();
      expect(Buffer.from(signedTx, 'base64')).toBeTruthy();
    });

    it('should sign Solana versioned transaction', async () => {
      const address = await wallet.getAddress(NetworkName.SOLANA);
      const fromPubkey = new PublicKey(address);
      const regularTx = new SolanaTransaction();
      regularTx.recentBlockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
      regularTx.feePayer = fromPubkey;
      regularTx.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: fromPubkey,
          lamports: BigInt(1000),
        })
      );
      
      const tx = new VersionedTransaction(regularTx.compileMessage());

      const signedTx = await wallet.signTransaction({
        network: NetworkName.SOLANA,
        transaction: tx
      });
      expect(signedTx).toBeTruthy();
      expect(Buffer.from(signedTx, 'base64')).toBeTruthy();
    });

    it('should throw error for invalid Solana transaction type', async () => {
      const invalidTx = {} as SolanaTransaction;
      await expect(wallet.signTransaction({
        network: NetworkName.SOLANA,
        transaction: invalidTx
      })).rejects.toThrow('Invalid Solana transaction type');
    });
  });
}); 