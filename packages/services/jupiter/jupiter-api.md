## Jupiter API Documentation

### GET /quote
Sends a GET request to the Jupiter API to fetch the best-priced quote.

#### Query Parameters
- **inputMint** (`string`, **REQUIRED**): Input token mint address.
- **outputMint** (`string`, **REQUIRED**): Output token mint address.
- **amount** (`integer`, **REQUIRED**): The amount to swap, factoring in token decimals.
- **slippageBps** (`integer`): Slippage in basis points (BPS). Default is `50` unless `autoSlippage` is set to `true`. If the output token amount exceeds the slippage, the swap transaction fails.
- **swapMode** (`string`): Defaults to `ExactIn`. Possible values:
  - `ExactIn`: For swaps where the input amount is fixed.
  - `ExactOut`: For cases needing an exact output token amount, such as payments.
- **dexes** (`string[]`): Specify DEXes to include, separated by commas. Defaults to all DEXes.
- **excludeDexes** (`string[]`): Specify DEXes to exclude, separated by commas. Defaults to none.
- **restrictIntermediateTokens** (`boolean`): Restrict intermediate tokens to a stable set to reduce high slippage errors. Default is `false`.
- **onlyDirectRoutes** (`boolean`): Default is `false`. Limits routing to single-hop routes.
- **asLegacyTransaction** (`boolean`): Default is `false`. Uses legacy transactions instead of versioned transactions.
- **platformFeeBps** (`integer`): Fee percentage in BPS, taken from the output token.
- **maxAccounts** (`integer`): Estimate of the maximum accounts used for the quote.
- **autoSlippage** (`boolean`): Default is `false`. Enables smart slippage suggestions. Includes:
  - `computedAutoSlippage`: Computed result.
  - `maxAutoSlippageBps`: Maximum allowable slippage in BPS.
  - `autoSlippageCollisionUsdValue`: Default is `1000 USD`. Allows customization of collision value.
- **maxAutoSlippageBps** (`integer`): Maximum allowable slippage returned by the API when `autoSlippage` is enabled.
- **autoSlippageCollisionUsdValue** (`integer`): USD value for calculating smart slippage. Default is `1000`.

#### Responses
- **200 Successful Response**
  - **Schema** (optional):
    - `inputMint` (`string`)
    - `inAmount` (`string`)
    - `outputMint` (`string`)
    - `outAmount` (`string`)
    - `swapMode` (`string`): Possible values: `ExactIn`, `ExactOut`.
    - Additional fields: `slippageBps`, `platformFee`, `priceImpactPct`, `routePlan`, `swapInfo`, and more.

---

### POST /swap
Generates a transaction based on a quote obtained from `/quote`.

#### Request Body
- **userPublicKey** (`string`, **REQUIRED**): The user's public key.
- **wrapAndUnwrapSol** (`boolean`): Default is `true`. Automatically wraps/unwraps SOL. Ignored if `destinationTokenAccount` is set.
- **useSharedAccounts** (`boolean`): Default depends on the route. Enables shared program accounts.
- **feeAccount** (`string`): Fee token account. Must match the mint type (`inputMint` or `outputMint`).
- **trackingAccount** (`string`): Public key for tracking transactions.
- **computeUnitPriceMicroLamports** (`integer`): Compute unit price for transaction prioritization.
- **prioritizationFeeLamports** (`integer`): Fee in lamports for transaction prioritization.
- **asLegacyTransaction** (`boolean`): Default is `false`. Requests a legacy transaction.
- **useTokenLedger** (`boolean`): Default is `false`. Useful for pre-swap transfers.
- **destinationTokenAccount** (`string`): Token account to receive output tokens. Defaults to the user's ATA if not provided.
- **dynamicComputeUnitLimit** (`boolean`): Default is `false`. Simulates swaps to set compute unit limits.
- **skipUserAccountsRpcCalls** (`boolean`): Default is `false`. Disables RPC checks on user accounts.
- **dynamicSlippage** (`object`): Dynamic slippage estimation.
  - `minBps` (`int32`): Minimum slippage.
  - `maxBps` (`int32`): Maximum slippage.
- **quoteResponse** (`object`, **REQUIRED**):
  - Fields include `inputMint`, `inAmount`, `outputMint`, `outAmount`, `swapMode`, and more.

#### Responses
- **200 Successful Response**
  - **Schema** (optional):
    - Includes `swapTransaction`, `lastValidBlockHeight`, `dynamicSlippageReport`, and more.

---

### POST /swap-instructions
Generates instructions for swaps based on a quote from `/quote`.

#### Request Body
- **userPublicKey** (`string`, **REQUIRED**): The user's public key.
- **wrapAndUnwrapSol** (`boolean`): Default is `true`. Handles SOL wrapping/unwrapping.
- **useSharedAccounts** (`boolean`): Enables shared program accounts.
- **feeAccount** (`string`): Fee token account.
- **trackingAccount** (`string`): Public key for tracking transactions.
- **computeUnitPriceMicroLamports** (`integer`): Compute unit price for prioritization.
- **prioritizationFeeLamports** (`integer`): Fee in lamports for prioritization.
- **asLegacyTransaction** (`boolean`): Default is `false`. Requests a legacy transaction.
- **useTokenLedger** (`boolean`): Default is `false`. Useful for pre-swap transfers.
- **destinationTokenAccount** (`string`): Account for receiving tokens. Defaults to ATA if not set.
- **dynamicComputeUnitLimit** (`boolean`): Default is `false`. Simulates compute unit limits.
- **skipUserAccountsRpcCalls** (`boolean`): Default is `false`. Skips account checks.
- **dynamicSlippage** (`object`):
  - `minBps` (`int32`): Minimum slippage.
  - `maxBps` (`int32`): Maximum slippage.
- **quoteResponse** (`object`, **REQUIRED**): Includes necessary quote details.

#### Responses
- **200 Successful Response**
  - **Schema** (optional):
    - Includes swap and cleanup instructions, lookup table addresses, and other details.
