import { AgentFactory, env, ModelProvider, NetworkManager, Wallet, NetworkName } from '@genie/core';
import { WalletAgent, WalletPlugin } from '@genie/wallet-plugin';

async function main() {
  // Setup dependencies
  const network = new NetworkManager({
    defaultNetwork: NetworkName.ETHEREUM,
    networks: {
      [NetworkName.ETHEREUM]: {
        type: 'evm',
        config: {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpcUrl: process.env.ETH_RPC_URL || 'https://rpc.ankr.com/eth',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
        },
      },
    }
  });

  const wallet = new Wallet({
    seedPhrase: process.env.WALLET_SEED_PHRASE || 'test test test test test test test test test test test junk',
    index: 0
  }, network);

  const dependencies = {
    network,
    wallet
  };

  // Initialize the wallet agent with wallet plugin
  const walletAgent = new WalletAgent({
    provider: ModelProvider.OPENAI,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    plugins: [new WalletPlugin()],
  }, dependencies);

  await walletAgent.initialize();

  try {
    // Example workflow:
    // 1. Get wallet address
    // 2. Check wallet balance
    console.log('Getting wallet address...');
    const addressInfo = await walletAgent.execute('What is my wallet address?');
    
    console.log('Checking wallet balance...');
    const balanceInfo = await walletAgent.execute('What is my wallet balance?');

    console.log('\nResults:');
    console.log('Wallet Address:', addressInfo);
    console.log('Wallet Balance:', balanceInfo);
  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 