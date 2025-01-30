import { ModelProvider, NetworkManager, Wallet, NetworkName, logger } from '@genie/core';
import { SwapAgent, SwapPlugin, GetSwapQuoteTool, ExecuteSwapTool } from '@genie/swap-plugin';
import { WalletPlugin } from '@genie/wallet-plugin';
import { GetTokenInfoTool, TokenPlugin } from '@genie/token-plugin';
import { JupiterService } from '@genie/jupiter-service';
import { BirdeyeService } from '@genie/birdeye-service';
import { HumanMessage } from '@langchain/core/messages';
import { Command, MemorySaver } from "@langchain/langgraph";


async function main() {
  // Setup dependencies
  const network = new NetworkManager({
    defaultNetwork: NetworkName.SOLANA,
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

  const networkSupported = network.getSupportedNetworks();

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
      new TokenPlugin(),
      new WalletPlugin() // Required by SwapPlugin
    ],
   checkpoint: new MemorySaver(),
    services: [new JupiterService({
        rpcUrl: network.getNetworkConfig(NetworkName.SOLANA).config.rpcUrl,
        cluster: 'mainnet-beta'
    }), new BirdeyeService(process.env.BIRDEYE_API_KEY || '')],
    systemMessage: "Only support networks: " + networkSupported.join(', ') + ". CRITERIAL: Swap token need token address. If you swap token with symbol, you must use the get token info tool to get the token address.",
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
                networks: networkSupported,
                priority: 100,
              },
              {
                name: ExecuteSwapTool.TOOL_NAME,
                enabled: true,
                networks: networkSupported,
                priority: 100,
              }
            ],
          }],
        },
        token: {
          tools: [GetTokenInfoTool.TOOL_NAME],
          services: [{
            name: BirdeyeService.SERVICE_NAME,
            tools: [{
              name: GetTokenInfoTool.TOOL_NAME,
              enabled: true,
              networks: networkSupported,
              priority: 100,
            }],
          }],
        }
      }
    ]
  });

  try {
    // Example workflow:
    // 1. Get a quote for swapping 0.1 SOL to USDC
    logger.info('Getting swap quote...');
    // const quoteInfo = await swapAgent.execute(
    //   'Swapping 0.1 ETH to USDC on Ethereum'
    // ); 
    
    // const quoteInfo = await swapAgent.execute(
    //   {
    //     messages: [
    //       new HumanMessage('Swapping 0.1 SOL to USDC on Solana')
    //     ]
    //   }
    // );

    for await (const chunk of await swapAgent.execute(
      {
        messages: [
          new HumanMessage('Swapping 0.001 SOL to USDC on Solana')
        ]
      },
      {
        thread_id: "123",
        user_id: "456"
      }
    )) {
      // logger.info(chunk);
   }

   logger.info("I waitting the user to approve the swap ----> ");

   for await (const chunk of await swapAgent.execute(
    new Command({ resume: { text: "I approve the swap" } }), 
    {
      thread_id: "123",
      user_id: "456"
    }
 )) {
    // logger.info(chunk);
 }
   
  } catch (error) {
    logger.error('Error during execution:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 