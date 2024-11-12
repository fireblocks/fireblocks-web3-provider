import * as dotenv from 'dotenv'
dotenv.config()
import * as ethers from "ethers"
import { FireblocksWeb3Provider, ChainId } from "../src"
import Web3 from "web3";

export function getFireblocksProviderForTesting(extraConfiguration?: any) {
  if (!process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH ||
    !process.env.FIREBLOCKS_API_KEY) {
    throw new Error("Environment variables FIREBLOCKS_API_PRIVATE_KEY_PATH, FIREBLOCKS_API_KEY, FIREBLOCKS_VAULT_ACCOUNT_IDS must be set")
  }

  const providerConfig = {
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.HOLESKY,
    rpcUrl: process.env.FIREBLOCKS_RPC_URL,
    apiBaseUrl: process.env.FIREBLOCKS_API_BASE_URL,
    ...extraConfiguration
  };

  if (process.env.PROXY_PATH) {
    providerConfig["proxyPath"] = process.env.PROXY_PATH
    if (process.env.PROXY_UNTRUSTED_CERT)
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  }

  const provider = new FireblocksWeb3Provider(providerConfig)

  return provider
}

export function getEthersFireblocksProviderForTesting(extraConfiguration?: any) {
  return new ethers.BrowserProvider(getFireblocksProviderForTesting(extraConfiguration))
}

export function getWeb3FireblocksProviderForTesting(extraConfiguration?: any) {
  return new Web3(getFireblocksProviderForTesting(extraConfiguration))
}
