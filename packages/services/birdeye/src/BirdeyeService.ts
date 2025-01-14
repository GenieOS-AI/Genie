export class BirdeyeService {
    public readonly name: string = 'birdeye';
    public readonly description: string = 'Birdeye is a platform that provides real-time data on the performance of your business.';
    public readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }
}
