import { GetBalanceHandler, GetBalanceHandlerRequest, GetBalanceHandlerResponse } from "@genie/wallet-plugin";
import { NetworkName } from "@genie/core";
import { logger } from "@genie/core";
import { BirdeyeAPI } from "../BirdeyeAPI";
import { getBirdeyeSupportedNetworks, mapNetworkNameToBirdeye } from "../utils/networkMapping";

export class BirdeyeGetBalanceHandler extends GetBalanceHandler {
    private readonly api: BirdeyeAPI;

    /**
     * Creates a new instance of BirdeyeGetBalanceHandler
     * @param apiKey - Birdeye API key
     * @param priority - Handler priority (default: 1)
     * @param enabled - Whether the handler is enabled (default: true)
     * @param supportedNetworks - List of supported networks (default: all Birdeye supported networks)
     */
    constructor(
        apiKey: string, 
        priority: number = 1, 
        enabled: boolean = true,
        supportedNetworks?: NetworkName[]
    ) {
        logger.debug('Creating BirdeyeGetBalanceHandler', { priority, enabled });
        // Get validated networks (will throw if any network is not supported)
        const networks = getBirdeyeSupportedNetworks(supportedNetworks);
        logger.debug('Validated supported networks', { networks });
        
        super(priority, enabled, networks);
        this.api = new BirdeyeAPI(apiKey);
        logger.info('BirdeyeGetBalanceHandler initialized successfully');
    }

    public async execute(request: GetBalanceHandlerRequest): Promise<GetBalanceHandlerResponse> {
        try {
            const network = request.networks[0];
            logger.info(`Fetching balance for address: ${request.address} on network: ${network}`);
            
            const birdeyeNetwork = mapNetworkNameToBirdeye(network);
            logger.debug(`Mapped network ${network} to Birdeye network: ${birdeyeNetwork}`);

            logger.debug('Calling Birdeye API to get portfolio', { 
                wallet: request.address, 
                network: birdeyeNetwork 
            });

            const portfolio = await this.api.getPortfolio({
                wallet: request.address,
                chain: birdeyeNetwork
            });

            logger.debug('Portfolio data received', { 
                itemCount: portfolio.data.items.length,
                totalUsd: portfolio.data.totalUsd
            });

            const response: GetBalanceHandlerResponse = {
                status: 'success',
                data: {
                    balances: [{
                        network: network,
                        tokens: portfolio.data.items.map(token => ({
                            name: token.name,
                            symbol: token.symbol,
                            address: token.address,
                            decimals: token.decimals,
                            amount: token.balance,
                            uiAmount: token.uiAmount?.toString(),
                            usdValue: token.valueUsd?.toString(),
                            iconUrl: token.logoURI,
                            price: token.priceUsd?.toString()
                        })),
                        totalUsdValue: portfolio.data.totalUsd?.toString()
                    }],
                    totalUsdValue: portfolio.data.totalUsd?.toString()
                }
            };

            const tokenCount = response.data?.balances[0]?.tokens?.length ?? 0;
            logger.info(`Successfully fetched balance with ${tokenCount} tokens`);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
            logger.error(`Failed to fetch balance: ${errorMessage}`, error);
            return {
                status: 'error',
                message: errorMessage
            };
        }
    }
}