import { NetworkName } from "../network";

export type TokenInfo = {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    network?: NetworkName;
    price?: number;
    marketCap?: number;
    volume24h?: number;
    volumeChange24h?: number;
    priceChange24h?: number;
    priceChangePercentage24h?: number;
    circulatingSupply?: number;
    totalSupply?: number;
    maxSupply?: number;
    holders?: number;
}