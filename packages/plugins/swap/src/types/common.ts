export type SwapAmountType = 'input' | 'output';

export interface TokenInfo {
    address: string;
    symbol: string;
    decimals: number;
    amount: string;
}

export interface TokenAmount {
    address: string;
    amount: string;
}

export interface QuoteInfo {
    quoteId: string;      // Unique identifier for this quote
    expiryTime: number;   // Unix timestamp when this quote expires
    provider: string;     // DEX or aggregator providing this quote
}

// Quote status for validation
export type QuoteStatus = 
    | { valid: true }
    | { valid: false; reason: 'expired' | 'not_found' | 'price_changed' | 'insufficient_liquidity' } 