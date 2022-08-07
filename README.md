[![npm version](https://badge.fury.io/js/@fireblocks%2Ffireblocks-web3-provider.svg)](https://badge.fury.io/js/@fireblocks%2Ffireblocks-web3-provider)

# Fireblocks Web3 Provider
> **Warning**  
> This package is in an early beta stage and should not be used in production environments.  
> The provided interfaces are likely to have breaking changes.  
> For a stable library (with a different paradigm) you can use the DeFi SDK (https://github.com/fireblocks/fireblocks-defi-sdk)


Fireblocks [EIP-1193](eips.ethereum.org/EIPS/eip-1193) Compatible Ethereum JavaScript Provider

## Installation
```bash
npm install @fireblocks/fireblocks-web3-provider
```

## Setup
```js
import { FireblocksWeb3Provider, ChainId } from "@fireblocks/fireblocks-web3-provider";
import { readFileSync } from "fs"

const eip1193Provider = new FireblocksWeb3Provider({
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.ROPSTEN,
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
