import axios from 'axios';
import { GetPortfolioRequest, SearchTokenRequest, GetTokenInfoRequest } from './types/request';
import { GetPortfolioResponse, SearchTokenResponse, GetTokenInfoResponse } from './types/response';
import { BASE_URL, ENDPOINTS, SEARCH_DEFAULTS } from './constants';

export class BirdeyeAPI {
    private readonly baseUrl = BASE_URL;
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async searchToken(request: SearchTokenRequest): Promise<SearchTokenResponse> {
        const { data } = await axios.get<SearchTokenResponse>(
            `${this.baseUrl}${ENDPOINTS.SEARCH}`,
            {
                params: {
                    chain: request.chain || SEARCH_DEFAULTS.CHAIN,
                    keyword: request.keyword,
                    target: request.target || SEARCH_DEFAULTS.TARGET,
                    sort_by: request.sort_by || SEARCH_DEFAULTS.SORT_BY,
                    sort_type: request.sort_type || SEARCH_DEFAULTS.SORT_TYPE,
                    verify_token: request.verify_token,
                    markets: request.markets,
                    offset: request.offset || SEARCH_DEFAULTS.OFFSET,
                    limit: request.limit || SEARCH_DEFAULTS.LIMIT
                },
                headers: {
                    'X-API-KEY': this.apiKey,
                    'accept': 'application/json'
                }
            }
        );
        return data;
    }

    async getPortfolio(request: GetPortfolioRequest): Promise<GetPortfolioResponse> {
        const { data } = await axios.get<GetPortfolioResponse>(
            `${this.baseUrl}${ENDPOINTS.TOKEN_LIST}`,
            {
                params: {
                    wallet: request.wallet,
                },
                headers: {
                    'X-API-KEY': this.apiKey,
                    'accept': 'application/json',
                    'x-chain': request.chain
                }
            }
        );
        return data;
    }

    async getTokenInfo(request: GetTokenInfoRequest): Promise<GetTokenInfoResponse> {
        const { data } = await axios.get<GetTokenInfoResponse>(
            `${this.baseUrl}${ENDPOINTS.TOKEN_OVERVIEW}`,
            {
                params: {
                    address: request.address,
                },
                headers: {
                    'X-API-KEY': this.apiKey,
                    'accept': 'application/json',
                    'x-chain': request.chain
                }
            }
        );
        return data;
    }
}