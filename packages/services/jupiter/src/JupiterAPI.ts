import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
    JupiterQuoteParams,
    JupiterSwapParams,
    JupiterQuoteResponse,
    JupiterSwapResponse,
    JupiterSwapInstructionsParams,
    JupiterSwapInstructionsResponse,
    JupiterResponse,
    JupiterError,
    TokenInfo
} from './types';
import { logger } from '@genie/core';

export class JupiterAPI {
    private api: AxiosInstance;
    private static readonly DEFAULT_BASE_URL = 'https://quote-api.jup.ag/v6';

    constructor(baseUrl: string = JupiterAPI.DEFAULT_BASE_URL) {
        this.api = axios.create({
            baseURL: baseUrl,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    private handleError(error: unknown): JupiterError {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<JupiterError>;
            return {
                error: axiosError.response?.data?.error || axiosError.message,
                message: axiosError.response?.data?.message,
                code: axiosError.response?.status
            };
        }
        return {
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }

    async getQuote(params: JupiterQuoteParams): Promise<JupiterResponse<JupiterQuoteResponse>> {
        try {
            const queryParams = {
                inputMint: params.inputMint.toString(),
                outputMint: params.outputMint.toString(),
                amount: params.amount,
                ...(params.slippageBps !== undefined && { slippageBps: params.slippageBps }),
                ...(params.swapMode && { swapMode: params.swapMode }),
                ...(params.dexes?.length && { dexes: params.dexes.join(',') }),
                ...(params.excludeDexes?.length && { excludeDexes: params.excludeDexes.join(',') }),
                ...(params.restrictIntermediateTokens !== undefined && { restrictIntermediateTokens: params.restrictIntermediateTokens }),
                ...(params.onlyDirectRoutes !== undefined && { onlyDirectRoutes: params.onlyDirectRoutes }),
                ...(params.asLegacyTransaction !== undefined && { asLegacyTransaction: params.asLegacyTransaction }),
                ...(params.platformFeeBps !== undefined && { platformFeeBps: params.platformFeeBps }),
                ...(params.maxAccounts !== undefined && { maxAccounts: params.maxAccounts }),
                ...(params.autoSlippage !== undefined && { autoSlippage: params.autoSlippage }),
                ...(params.maxAutoSlippageBps !== undefined && { maxAutoSlippageBps: params.maxAutoSlippageBps }),
                ...(params.autoSlippageCollisionUsdValue !== undefined && { autoSlippageCollisionUsdValue: params.autoSlippageCollisionUsdValue })
            };

            const response = await this.api.get<JupiterQuoteResponse>('/quote', {
                params: queryParams
            });

            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getSwapTransactions(params: JupiterSwapParams): Promise<JupiterResponse<JupiterSwapResponse>> {
        try {
            const response = await this.api.post<JupiterSwapResponse>('/swap', {
                quoteResponse: params.quoteResponse,
                userPublicKey: params.userPublicKey,
                wrapUnwrapSol: params.wrapUnwrapSol,
                useSharedAccounts: params.useSharedAccounts,
                feeAccount: params.feeAccount,
                trackingAccount: params.trackingAccount,
                computeUnitPriceMicroLamports: params.computeUnitPriceMicroLamports,
                prioritizationFeeLamports: params.prioritizationFeeLamports,
                asLegacyTransaction: params.asLegacyTransaction,
                useTokenLedger: params.useTokenLedger,
                destinationTokenAccount: params.destinationTokenAccount,
                dynamicComputeUnitLimit: params.dynamicComputeUnitLimit,
                skipUserAccountsRpcCalls: params.skipUserAccountsRpcCalls,
                dynamicSlippage: params.dynamicSlippage
            });

            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getSwapInstructions(params: JupiterSwapInstructionsParams): Promise<JupiterResponse<JupiterSwapInstructionsResponse>> {
        try {
            const response = await this.api.post<JupiterSwapInstructionsResponse>('/swap-instructions', {
                quoteResponse: params.quoteResponse,
                userPublicKey: params.userPublicKey,
                wrapUnwrapSol: params.wrapUnwrapSol,
                useSharedAccounts: params.useSharedAccounts,
                feeAccount: params.feeAccount,
                trackingAccount: params.trackingAccount,
                computeUnitPriceMicroLamports: params.computeUnitPriceMicroLamports,
                prioritizationFeeLamports: params.prioritizationFeeLamports,
                asLegacyTransaction: params.asLegacyTransaction,
                useTokenLedger: params.useTokenLedger,
                destinationTokenAccount: params.destinationTokenAccount,
                dynamicComputeUnitLimit: params.dynamicComputeUnitLimit,
                skipUserAccountsRpcCalls: params.skipUserAccountsRpcCalls,
                dynamicSlippage: params.dynamicSlippage
            });

            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getTokens(): Promise<JupiterResponse<TokenInfo[]>> {
        try {
            const response = await this.api.get<TokenInfo[]>('/tokens');
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getIndexedRouteMap(): Promise<JupiterResponse<Record<string, string[]>>> {
        try {
            const response = await this.api.get<Record<string, string[]>>('/indexed-route-map');
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getPrices(): Promise<JupiterResponse<Record<string, number>>> {
        try {
            const response = await this.api.get<Record<string, number>>('/prices');
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }
} 