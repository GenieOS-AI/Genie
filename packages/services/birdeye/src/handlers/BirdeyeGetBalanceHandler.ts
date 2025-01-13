import { GetBalanceHandler, GetBalanceHandlerRequest, GetBalanceHandlerResponse } from "@genie/wallet-plugin";
import { NetworkName } from "@genie/core";
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
        // Get validated networks (will throw if any network is not supported)
        const networks = getBirdeyeSupportedNetworks(supportedNetworks);
        super(priority, enabled, networks);
        this.api = new BirdeyeAPI(apiKey);
    }

    public async execute(request: GetBalanceHandlerRequest): Promise<GetBalanceHandlerResponse> {
        try {
            const network = request.networks[0];
            const birdeyeNetwork = mapNetworkNameToBirdeye(network);

            const portfolio = await this.api.getPortfolio({
                wallet: request.address,
                network: birdeyeNetwork
            });

            return {
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
                            uiAmount: token.uiAmount.toString(),
                            usdValue: token.valueUsd.toString(),
                            iconUrl: token.logoURI,
                            price: token.priceUsd.toString()
                        })),
                        totalUsdValue: portfolio.data.totalUsd.toString()
                    }],
                    totalUsdValue: portfolio.data.totalUsd.toString()
                }
            };
        } catch (error) {
            return {
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to fetch balance'
            };
        }
    }
}