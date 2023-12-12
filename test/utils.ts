import * as dotenv from 'dotenv'
dotenv.config()
import * as ethers from "ethers"
import { FireblocksWeb3Provider, ChainId } from "../src"
import Web3 from "web3";
import { AxiosProxyConfig } from 'axios';

export function getFireblocksProviderForTesting(extraConfiguration?: any) {
  if (!process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH ||
    !process.env.FIREBLOCKS_API_KEY) {
    throw new Error("Environment variables FIREBLOCKS_API_PRIVATE_KEY_PATH, FIREBLOCKS_API_KEY, FIREBLOCKS_VAULT_ACCOUNT_IDS must be set")
  }

  const providerConfig = {
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.GOERLI,
    rpcUrl: process.env.FIREBLOCKS_RPC_URL,
    apiBaseUrl: process.env.FIREBLOCKS_API_BASE_URL,
    ...extraConfiguration
  };

  if(process.env.PROXY_HOST && process.env.PROXY_PORT){
      if(process.env.PROXY_PASS && !process.env.PROXY_USER){
        throw new Error("PROXY_PASS and PROXY_USER must bother be set, or only PROXY_USER must appear (if auth is required)")
      }

      providerConfig["proxyConfig"] = {
        host: process.env.PROXY_HOST,
        port: parseInt(process.env.PROXY_PORT),
        auth: undefined,
      } as AxiosProxyConfig

      if(process.env.PROXY_USER){
        providerConfig["proxy"]["auth"] = {
          username: process.env.PROXY_USER,
          password: process.env.PROXY_PASS ?? undefined
        }
      }

      if(process.env.PROXY_UNTRUSTED_CERT)
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  } else if ((!process.env.PROXY_HOST && process.env.PROXY_PORT) || (process.env.PROXY_HOST && !process.env.PROXY_PORT)){
    throw new Error("PROXY_HOST and PROXY_PORT must both appear, or neither")
  }

  const provider = new FireblocksWeb3Provider(providerConfig)

  return provider
}

export function getEthersFireblocksProviderForTesting(extraConfiguration?: any) {
  return new ethers.providers.Web3Provider(getFireblocksProviderForTesting(extraConfiguration))
}

export function getWeb3FireblocksProviderForTesting(extraConfiguration?: any) {
  return new Web3(getFireblocksProviderForTesting(extraConfiguration))
}
