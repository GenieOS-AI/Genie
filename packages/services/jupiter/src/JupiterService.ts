import { Connection } from '@solana/web3.js';
import { Service, NetworkName, ServiceMetadata, IHandlerResponse, IHandlerRequest, Handler } from '@genieos/core';
import { SwapQuoteHandler, ExecuteSwapHandler } from '@genieos/swap-plugin';
import { JupiterAPI } from './JupiterAPI';
import packageJson from '../package.json';
import { JupiterExecuteHandler } from './handlers/JupiterExecuteHandler';
import { JupiterQuoteHandler } from './handlers';

export interface JupiterServiceConfig {
    rpcUrl: string;
    cluster: 'mainnet-beta' | 'devnet';
}

export class JupiterService extends Service {
    public static readonly SERVICE_NAME = 'jupiter';
    private connection: Connection;
    private quoteCache: Map<string, any> = new Map();
    private api: JupiterAPI;

    constructor(config: JupiterServiceConfig) {
        const metadata: ServiceMetadata = {
            name: JupiterService.SERVICE_NAME,
            version: packageJson.version,
            description: 'Jupiter is a platform that provides real-time data on the performance of your business.',
        };
        const api = new JupiterAPI();

        const handlers: Handler<IHandlerRequest, IHandlerResponse>[] = [
            new JupiterQuoteHandler(api, 1, true),
            new JupiterExecuteHandler(api, 1, true)
        ];
        super(metadata, handlers, [NetworkName.SOLANA]);
        this.connection = new Connection(config.rpcUrl);
        this.api = api;

    }

    async initialize(): Promise<void> {
        this.handlers.forEach((handler) => {
            if (handler instanceof JupiterQuoteHandler) {
                handler.setService(this);
            }
            if (handler instanceof JupiterExecuteHandler) {
                handler.setService(this);
            }
        });
    }

    getConnection(): Connection {
        return this.connection;
    }

    getApi(): JupiterAPI {
        return this.api;
    }

    cacheQuote(quoteId: string, quote: any): void {
        this.quoteCache.set(quoteId, {
            quote,
            timestamp: Date.now()
        });
    }

    getQuote(quoteId: string): any | null {
        const cached = this.quoteCache.get(quoteId);
        if (!cached) return null;

        // Expire quotes after 30 seconds
        if (Date.now() - cached.timestamp > 30000) {
            this.quoteCache.delete(quoteId);
            return null;
        }

        return cached.quote;
    }
} 