[![npm version](https://badge.fury.io/js/@fireblocks%2Ffireblocks-web3-provider.svg)](https://badge.fury.io/js/@fireblocks%2Ffireblocks-web3-provider)

# Fireblocks Web3 Provider

Fireblocks [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) Compatible Ethereum JavaScript Provider

## Installation
```bash
npm install @fireblocks/fireblocks-web3-provider
```

## Setup
```js
import { FireblocksWeb3Provider, ChainId } from "@fireblocks/fireblocks-web3-provider";

const eip1193Provider = new FireblocksWeb3Provider({
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.GOERLI,
})
```

## Usage with ethers.js
```js
import * as ethers from "ethers"

const provider = new ethers.providers.Web3Provider(eip1193Provider);
```

## Usage with web3.js
```js
import Web3 from "web3";

const web3 = new Web3(eip1193Provider);
```

## API Documentation

### new FireblocksWeb3Provider(config)

- `config` [FireblocksProviderConfig](#FireblocksProviderConfig)

This class is an [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) Compatible Ethereum JavaScript Provider powered by the [Fireblocks API](https://docs.fireblocks.com/api/)

### FireblocksProviderConfig

```ts
type FireblocksProviderConfig = {
  // ------------- Mandatory fields -------------
  /** 
   * Learn more about creating API users here: 
   * https://developers.fireblocks.com/docs/quickstart#api-user-creation
   */

  /** 
   * Fireblocks API key
   */
  apiKey: string,

  /** 
   * Fireblocks API private key for signing requests
   */
  privateKey: string,

  // Either chainId or rpcUrl must be provided
  /** 
   * If not provided, it is inferred from the rpcUrl 
   */
  chainId?: ChainId,
  /** 
   * If not provided, it is inferred from the chainId 
   */
  rpcUrl?: string,

  // ------------- Optional fields --------------

  /** 
   * By default, the first 20 vault accounts are dynamically loaded from the Fireblocks API
   * It is recommended to provide the vault account ids explicitly because it helps avoid unnecessary API calls
   */
  vaultAccountIds?: number | number[] | string | string[],
  /**
   * By default, the fallback fee level is set to FeeLevel.MEDIUM
   */
  fallbackFeeLevel?: FeeLevel,
  /**
   * By default, the note is set to "Created by Fireblocks Web3 Provider"
   */
  note?: string,
  /**
   * By default, the polling interval is set to 1000ms (1 second)
   * It is the interval in which the Fireblocks API is queried to check the status of transactions
   */
  pollingInterval?: number,
  /**
   * By default, it is assumed that one time addresses are enabled in your workspace
   * If they're not, set this to false
   */
  oneTimeAddressesEnabled?: boolean,
  /**
   * By default, no externalTxId is associated with transactions
   * If you want to set one, you can either provide a function that returns a string, or provide a string directly
   */
  externalTxId?: (() => string) | string,
  /**
   * If you want to prepend an additional product string to the User-Agent header, you can provide it here
   */
  userAgent?: string,
}
```
