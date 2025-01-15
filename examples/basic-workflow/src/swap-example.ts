import { ModelProvider, NetworkManager, Wallet, NetworkName } from '@genie/core';
import { SwapAgent, SwapPlugin, GetSwapQuoteTool, ExecuteSwapTool } from '@genie/swap-plugin';
import { WalletPlugin } from '@genie/wallet-plugin';
import { JupiterService } from '@genie/jupiter-service';

async function main() {
  // Setup dependencies
  const network = new NetworkManager({
    defaultNetwork: NetworkName.SOLANA,
    networks: {
      [NetworkName.SOLANA]: {
        type: 'solana',
        config: {
          name: 'Solana Mainnet',
          rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
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

  // Initialize the swap agent with swap plugin and Jupiter service
  const swapAgent = new SwapAgent({
    model: {
      config: {
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      },
      provider: ModelProvider.OPENAI,
    },
    plugins: [
      new SwapPlugin({
        defaultSlippage: 1.0, // 1% slippage
        providers: {
          [NetworkName.SOLANA]: [JupiterService.SERVICE_NAME]
        }
      }),
      new WalletPlugin() // Required by SwapPlugin
    ],
    services: [new JupiterService({
        rpcUrl: network.getNetworkConfig(NetworkName.SOLANA).config.rpcUrl,
        cluster: 'mainnet-beta'
    })],
  }, dependencies);

  await swapAgent.initialize({
    plugins: [
      {
        swap: {
          tools: [GetSwapQuoteTool.TOOL_NAME, ExecuteSwapTool.TOOL_NAME],
          services: [{
            name: JupiterService.SERVICE_NAME,
            tools: [
              {
                name: GetSwapQuoteTool.TOOL_NAME,
                enabled: true,
                networks: [NetworkName.SOLANA],
                priority: 100,
              },
              {
                name: ExecuteSwapTool.TOOL_NAME,
                enabled: true,
                networks: [NetworkName.SOLANA],
                priority: 100,
              }
            ],
          }],
        }
      }
    ]
  });

  try {
    // Example workflow:
    // 1. Get a quote for swapping 0.1 SOL to USDC
    console.log('Getting swap quote...');
    const quoteInfo = await swapAgent.execute(
      'Get me a quote for swapping 0.1 SOL to USDC on Solana'
    );
    console.log('Quote received:', quoteInfo);

    // 2. Execute the swap if quote looks good
    // console.log('\nExecuting swap...');
    // const swapResult = await swapAgent.execute(
    //   'Execute the swap with the quoted parameters'
    // );
    // console.log('Swap executed:', swapResult);
  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 