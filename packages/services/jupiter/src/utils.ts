import { v4 as uuidv4 } from 'uuid';

export function generateQuoteId(): string {
    return uuidv4();
}

export function formatUiAmount(amount: string, decimals: number): string {
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toFixed(decimals);
}

export function parseUiAmount(amount: string, decimals: number): string {
    return (Number(amount) * 10 ** decimals).toString();
} 