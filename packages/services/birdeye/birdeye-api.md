# Birdeye API

## Token Search

### Endpoint
```
GET https://public-api.birdeye.so/defi/v3/search
```

### Description
Search for tokens and market data by matching a pattern or a specific token/market address.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| chain | string | No | "all" | Chain to search on |
| keyword | string | No | - | Search keyword (e.g. "BTC") |
| target | string | No | "all" | Target type to search for |
| sort_by | string | Yes | "volume_24h_usd" | Field to sort results by |
| sort_type | string | Yes | "desc" | Sort direction ("desc" or "asc") |
| verify_token | boolean | No | - | Filter tokens by verification status (Solana only) |
| markets | string | No | - | Comma-separated list of market sources (Solana only). Available options: ['Raydium', 'Raydium CP', 'Raydium Clamm', 'Meteora', 'Meteora DLMM', 'Fluxbeam', 'Pump.fun', 'OpenBook', 'OpenBook V2', 'Orca'] |
| offset | integer | No | 0 | Pagination offset |
| limit | integer | No | 20 | Number of results per page (1-20) |

### Response

The response includes token information such as:
- Name and symbol
- Token address
- Price and price changes
- Volume metrics
- Market cap and liquidity
- Network information
- Trading statistics
- Logo URI

#### Example Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "type": "token",
        "result": [
          {
            "name": "Coinbase Wrapped BTC",
            "symbol": "CBBTC",
            "address": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
            "price": 99525.44866126364,
            "price_change_24h_percent": 3.056607643402538,
            "volume_24h_usd": 366267464.37019217,
            "market_cap": null,
            "liquidity": 45530220.684270315,
            "network": "base",
            "logo_uri": "..."
          }
          // ... more tokens ...
        ]
      }
    ]
  }
}
```

## Token Overview

### Endpoint
```
GET https://public-api.birdeye.so/defi/token_overview
```

### Description
Get detailed overview information for a specific token, including price, market data, trading statistics, and social information.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| address | string | Yes | So11111111111111111111111111111111111111112 | Address of the token |

### Headers

| Header | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| x-chain | string | No | solana | Chain name from supported networks |

### Response

The response includes comprehensive token information such as:
- Basic token details (name, symbol, decimals)
- Social and project information
- Price and price change metrics
- Trading statistics
- Volume metrics
- Unique wallet activity
- Market cap and supply data
- User engagement metrics

#### Example Response
```json
{
  "success": true,
  "data": {
    "address": "So11111111111111111111111111111111111111112",
    "decimals": 9,
    "symbol": "SOL",
    "name": "Wrapped SOL",
    "extensions": {
      "coingeckoId": "solana",
      "website": "https://solana.com/",
      "twitter": "https://twitter.com/solana",
      "discord": "https://discordapp.com/invite/pquxPsq"
    },
    "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    "price": 200.68620634535668,
    "liquidity": 28921925258.26092,
    "priceChange24hPercent": 5.780088318784364,
    "volume_24h": 30574413.610852197,
    "volume_24h_usd": 3100704273.9513597,
    "market_cap": 97233423146.13931,
    "holder": 1036617
    // ... additional metrics available
  }
}
```

