import { Handler, IHandlerRequest, Service, ServiceMetadata, IHandlerResponse, NetworkName } from '@genieos/core';
import packageJson from '../package.json';
import { BirdeyeGetBalanceHandler } from './handlers/BirdeyeGetBalanceHandler';
import { BirdeyeGetTokenInfoHandler } from './handlers/BirdeyeGetTokenInfoHandler';

export class BirdeyeService extends Service {
    public static readonly SERVICE_NAME = 'birdeye';
    private readonly apiKey: string;

    constructor(apiKey: string) {
        const metadata: ServiceMetadata = {
            name: BirdeyeService.SERVICE_NAME,
            version: packageJson.version,
            description: 'Birdeye is a platform that provides real-time data on the performance of your business.',
        };
        const handlers: Handler<IHandlerRequest, IHandlerResponse>[] = [
            new BirdeyeGetBalanceHandler(apiKey),
            new BirdeyeGetTokenInfoHandler(apiKey)
        ];
        super(metadata, handlers, { apiKey });
        this.apiKey = apiKey;
    }
}