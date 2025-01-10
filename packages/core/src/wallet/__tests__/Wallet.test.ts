import { Wallet } from '../Wallet';
import { NetworkManager } from '../../network/NetworkManager';
import { WalletConfig } from '../types';
import { ethers } from 'ethers';
import { Transaction as SolanaTransaction, VersionedTransaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { log } from 'console';

describe('Wallet', () => {
  let wallet: Wallet;
  let networkManager: NetworkManager;

  beforeEach(() => {
    // Setup a test network manager
    networkManager = new NetworkManager({
      defaultNetwork: 'ethereum',
      networks: {
        'ethereum': {
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
        'solana': {
          type: 'solana',
          config: {
            name: 'Solana',
            rpcUrl: 'http://localhost:8899'
          }
        }
      }
    });

    // Setup wallet with test mnemonic
    const config: WalletConfig = {
      seedPhrase: 'diary grass aspect cradle voyage help sick parent fashion coyote guard when online citizen school tank negative summer fashion camp old grocery chunk father',
      index: 0
    };
    wallet = new Wallet(config, networkManager);
  });

  describe('Private key protection', () => {
    it('should not expose EVM private key', () => {
      // Private fields with # are not enumerable and not accessible
      const walletProperties = Object.keys(wallet);
      expect(walletProperties).not.toContain('#evmWallet');
      expect(walletProperties).not.toContain('evmWallet');
      
      // Private fields should not be accessible via string access
      expect((wallet as any)['#evmWallet']).toBeUndefined();
      expect((wallet as any).evmWallet).toBeUndefined();
      
      // Check that private key is not exposed in stringified form
      const walletString = JSON.stringify(wallet);
      expect(walletString).not.toContain('privateKey');
      expect(walletString).not.toContain('secretKey');
      expect(walletString).not.toContain('#evmWallet');
      expect(walletString).not.toContain('evmWallet');
    });

    it('should not expose Solana private key', () => {
      // Private fields with # are not enumerable and not accessible
      const walletProperties = Object.keys(wallet);
      expect(walletProperties).not.toContain('#solanaKeypair');
      expect(walletProperties).not.toContain('solanaKeypair');
      
      // Private fields should not be accessible via string access
      expect((wallet as any)['#solanaKeypair']).toBeUndefined();
      expect((wallet as any).solanaKeypair).toBeUndefined();
      
      // Check that private key is not exposed in stringified form
      const walletString = JSON.stringify(wallet);
      expect(walletString).not.toContain('privateKey');
      expect(walletString).not.toContain('secretKey');
      expect(walletString).not.toContain('#solanaKeypair');
      expect(walletString).not.toContain('solanaKeypair');
    });

    it('should not expose private keys in JSON stringification', () => {
      const walletJson = JSON.stringify(wallet);
      expect(walletJson).not.toContain('privateKey');
      expect(walletJson).not.toContain('secretKey');
      expect(walletJson).not.toContain('#evmWallet');
      expect(walletJson).not.toContain('evmWallet');
      expect(walletJson).not.toContain('#solanaKeypair');
      expect(walletJson).not.toContain('solanaKeypair');
    });
  });

  describe('getAddress', () => {
    it('should return correct EVM address', async () => {
      const address = await wallet.getAddress('ethereum');
      expect(address).toBe('0x9A3A775c98135318877Bd08E7babbFcD780BE4e8');
    });

    it('should return correct Solana address', async () => {
      const address = await wallet.getAddress('solana');
      expect(address).toBe('52jKDVLUSk3t8pNFpJfgjEbMuiVhKqvzxsia9CkiCHWJ');
    });

    it('should throw error for invalid network', async () => {
      await expect(wallet.getAddress('invalid-network')).rejects.toThrow();
    });
  });

  describe('signMessage', () => {
    it('should sign message for EVM network', async () => {
      const message = 'Hello, World!';
      const signature = await wallet.signMessage({
        network: 'ethereum',
        message
      });
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should sign message for Solana network', async () => {
      const message = 'Hello, World!';
      const signature = await wallet.signMessage({
        network: 'solana',
        message
      });
      expect(signature).toMatch(/^[1-9A-HJ-NP-Za-km-z]{87,88}$/);
    });

    it('should throw error for invalid network', async () => {
      await expect(wallet.signMessage({
        network: 'invalid-network',
        message: 'test'
      })).rejects.toThrow();
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
        maxFeePerGas: BigInt(50000000000), // 50 gwei
        maxPriorityFeePerGas: BigInt(2000000000), // 2 gwei
      });

      const signedTx = await wallet.signTransaction({
        network: 'ethereum',
        transaction: tx
      });
      expect(signedTx).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should sign Solana transaction', async () => {
      const address = await wallet.getAddress('solana');
      const fromPubkey = new PublicKey(address);
      const tx = new SolanaTransaction();
      // Set a dummy recent blockhash for testing
      tx.recentBlockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
      // Set fee payer
      tx.feePayer = fromPubkey;
      tx.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: fromPubkey,
          lamports: BigInt(1000),
        })
      );

      const signedTx = await wallet.signTransaction({
        network: 'solana',
        transaction: tx
      });
      expect(signedTx).toBeTruthy();
      expect(Buffer.from(signedTx, 'base64')).toBeTruthy();
    });

    it('should sign Solana versioned transaction', async () => {
      const address = await wallet.getAddress('solana');
      const fromPubkey = new PublicKey(address);
      const regularTx = new SolanaTransaction();
      // Set a dummy recent blockhash for testing
      regularTx.recentBlockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
      // Set fee payer
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
        network: 'solana',
        transaction: tx
      });
      expect(signedTx).toBeTruthy();
      expect(Buffer.from(signedTx, 'base64')).toBeTruthy();
    });

    it('should throw error for invalid network', async () => {
      const dummyTx = new SolanaTransaction();
      await expect(wallet.signTransaction({
        network: 'invalid-network',
        transaction: dummyTx
      })).rejects.toThrow();
    });

    it('should throw error for invalid Solana transaction type', async () => {
      const invalidTx = {} as SolanaTransaction;
      await expect(wallet.signTransaction({
        network: 'solana',
        transaction: invalidTx
      })).rejects.toThrow('Invalid Solana transaction type');
    });
  });
}); 