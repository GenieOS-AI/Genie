import { GetTokenInfoHandler, TokenInfoHandlerRequest, TokenInfoHandlerResponse } from "@genieos/token-plugin";
import { NetworkName } from "@genieos/core";
import { logger } from "@genieos/core";
import { BirdeyeAPI } from "../BirdeyeAPI";
import { getBirdeyeSupportedNetworks, mapNetworkNameToBirdeye } from "../utils/networkMapping";
import { SearchNetwork } from "../types/request";

export class BirdeyeGetTokenInfoHandler extends GetTokenInfoHandler {
    private readonly api: BirdeyeAPI;

    /**
     * Creates a new instance of BirdeyeGetTokenInfoHandler
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
        logger.debug('Creating BirdeyeGetTokenInfoHandler', { priority, enabled });
        // Get validated networks (will throw if any network is not supported)
        const networks = getBirdeyeSupportedNetworks(supportedNetworks);
        logger.debug('Validated supported networks', { networks });
        
        super(priority, enabled, networks);
        this.api = new BirdeyeAPI(apiKey);
        logger.info('BirdeyeGetTokenInfoHandler initialized successfully');
    }

    public async execute(request: TokenInfoHandlerRequest): Promise<TokenInfoHandlerResponse> {
        let birdeyeNetwork = 'all'
        if (request.network) {
            const network = request.network; // Default to 'all' if not specified
            logger.info(`Fetching token info for query: ${request.query} on network: ${network}`);
            
            birdeyeNetwork = mapNetworkNameToBirdeye(network);
            logger.debug(`Mapped network ${network} to Birdeye network: ${birdeyeNetwork}`);
        }

        try {
           
            if (request.query.startsWith('0x') || request.query.length >= 32) {
                logger.debug('Query appears to be an address, searching by address', { 
                    address: request.query, 
                    network: birdeyeNetwork 
                });

                const tokenInfo = (await this.api.getTokenInfo({
                    address: request.query,
                    chain: birdeyeNetwork as SearchNetwork
                })).data;

                logger.debug('Token info received', tokenInfo);

                return {
                    status: 'success',
                    data: {
                        address: tokenInfo.address,
                        name: tokenInfo.name,
                        symbol: tokenInfo.symbol,
                        decimals: tokenInfo.decimals,
                        totalSupply: tokenInfo.supply,
                        network: birdeyeNetwork !== 'all' ? birdeyeNetwork as NetworkName : undefined
                    }
                };
            } 
            // Otherwise search by symbol
            else {
                logger.debug('Query appears to be a symbol, searching tokens', { 
                    symbol: request.query, 
                    network: birdeyeNetwork 
                });

                const searchResults = (await this.api.searchToken({
                    keyword: request.query,
                    chain: birdeyeNetwork as SearchNetwork
                })).data; 

                // Find exact match by symbol
                const exactMatch = searchResults.items.find(
                    token => token.result.find(
                        result => result.symbol.toLowerCase() === request.query.toLowerCase()
                    )
                );

                if (!exactMatch) {
                    logger.debug('No exact symbol match found');
                    return {
                        status: 'error',
                        message: `No token found with symbol ${request.query}`
                    };
                }

                logger.debug('Found exact symbol match', exactMatch);

                return {
                    status: 'success',
                    data: {
                        address: exactMatch.result[0].address,
                        name: exactMatch.result[0].name,
                        symbol: exactMatch.result[0].symbol,
                        decimals: exactMatch.result[0].decimals ?? 0,
                        network: birdeyeNetwork !== 'all' ? birdeyeNetwork as NetworkName : undefined
                    }
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch token info';
            logger.error(`Failed to fetch token info: ${errorMessage}`, error);
            return {
                status: 'error',
                message: errorMessage
            };
        }
    }
} 