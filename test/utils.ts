import * as dotenv from 'dotenv'
dotenv.config()
import * as ethers from "ethers"
import { FireblocksWeb3Provider, ChainId } from "../src"
import Web3 from "web3";

export function getFireblocksProviderForTesting() {
  if (!process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH ||
    !process.env.FIREBLOCKS_API_KEY) {
    throw new Error("Environment variables FIREBLOCKS_API_PRIVATE_KEY_PATH, FIREBLOCKS_API_KEY, FIREBLOCKS_VAULT_ACCOUNT_IDS must be set")
  }

  const provider = new FireblocksWeb3Provider(
    {
      privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
      apiKey: process.env.FIREBLOCKS_API_KEY,
      vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
      chainId: ChainId.GOERLI,
    }
  )

  return provider
}

export function getEthersFireblocksProviderForTesting() {
  return new ethers.providers.Web3Provider(getFireblocksProviderForTesting())
}

export function getWeb3FireblocksProviderForTesting() {
  return new Web3(getFireblocksProviderForTesting())
}
