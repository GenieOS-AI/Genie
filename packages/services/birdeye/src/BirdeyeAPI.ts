import axios from 'axios';
import { GetPortfolioRequest } from './types/request';
import { GetPortfolioResponse } from './types/response';

export class BirdeyeAPI {
    private readonly baseUrl = 'https://public-api.birdeye.so/v1';
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getPortfolio(request: GetPortfolioRequest): Promise<GetPortfolioResponse> {
        const { data } = await axios.get<GetPortfolioResponse>(
            `${this.baseUrl}/wallet/token_list`,
            {
                params: {
                    wallet: request.wallet,
                },
                headers: {
                    'X-API-KEY': this.apiKey,
                    'accept': 'application/json',
                    'x-chain': request.network
                }
            }
        );
        return data;
    }
}