import { AgentFactory, env, ModelProvider, NetworkManager, Wallet, NetworkName } from '@genie/core';
import { WeatherPlugin } from '@genie/plugin-example';

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
          rpcUrl: process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
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

  // Initialize the primary agent with weather plugin
  const primaryAgent = await AgentFactory.createAndInitializeAgent({
    provider: ModelProvider.OPENAI,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    plugins: [new WeatherPlugin()],
  }, dependencies);

  // Initialize the assistant agent
  const assistantAgent = await AgentFactory.createAndInitializeAgent({
    provider: ModelProvider.OPENAI,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  }, dependencies);

  try {
    // Create a simple workflow where:
    // 1. Primary agent gets weather data
    // 2. Assistant agent provides recommendations based on weather
    console.log('Fetching weather data for San Francisco...');
    const weatherData = await primaryAgent.execute('Get current weather for San Francisco');
    
    console.log('Generating recommendations based on weather...');
    const recommendation = await assistantAgent.execute(
      `Based on this weather data: ${JSON.stringify(weatherData)}, what activities would you recommend?`
    );

    console.log('\nResults:');
    console.log('Weather Data:', weatherData);
    console.log('Recommendations:', recommendation);
  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 