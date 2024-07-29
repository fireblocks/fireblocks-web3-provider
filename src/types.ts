import { FeeLevel } from "fireblocks-sdk";
import { AxiosProxyConfig } from "axios";

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  KOVAN = 42,
  GOERLI = 5,
  RINKEBY = 4,
  SEPOLIA = 11155111,
  HOLESKY = 17000,
  BSC = 56,
  BSC_TEST = 97,
  POLYGON = 137,
  POLYGON_TEST = 80001,
  POLYGON_AMOY = 80002,
  AVALANCHE = 43114,
  AVALANCHE_TEST = 43113,
  MOONRIVER = 1285, // Moonbeam testnet
  MOONBEAM = 1284,
  SONGBIRD = 19,
  ARBITRUM = 42161,
  ARBITRUM_SEPOLIA = 421614,
  ARBITRUM_RIN = 421611,
  FANTOM = 250,
  RSK = 30,
  RSK_TEST = 31,
  CELO = 42220,
  CELO_BAK = 62320,
  CELO_ALF = 44787,
  OPTIMISM = 10,
  OPTIMISM_SEPOLIA = 11155420,
  OPTIMISM_KOVAN = 69,
  RONIN = 2020,
  CANTO = 7700,
  CANTO_TEST = 7701,
  POLYGON_ZKEVM_TEST = 1442,
  POLYGON_ZKEVM = 1101,
  KAVA = 2222,
  SMARTBCH = 10000,
  SMARTBCH_TEST = 10001,
  HECO = 128,
  AURORA = 1313161554,
  RISEOFTHEWARBOTSTESTNET = 7777,
  EVMOS = 9001,
  ASTAR = 592,
  VELAS = 106,
  ARB_GOERLI = 421613,
  XDC = 50,
  BASE = 8453,
  BASE_SEPOLIA = 84532,
  IVAR = 88888,
  JOC = 81,
  OASYS = 248,
  SHIMMEREVM = 148,
  LINEA = 59144,
  LINEA_TEST = 59140,
  FLARE = 14,
}

export enum ApiBaseUrl {
  Production = "https://api.fireblocks.io",
  Sandbox = "https://sandbox-api.fireblocks.io",
  EU = "https://eu-api.fireblocks.io/v1",
  EU2 = "https://eu2-api.fireblocks.io/v1",
}

export type Asset = {
  assetId: string,
  rpcUrl: string,
}

export enum RawMessageType {
  EIP712 = "EIP712",
  ETH_MESSAGE = "ETH_MESSAGE",
}

export type FireblocksProviderConfig = {
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
   * By default, it uses the Fireblocks API production endpoint
   * When using a sandbox workspace, you should provide the ApiBaseUrl.Sandbox value
   */
  apiBaseUrl?: ApiBaseUrl | string,
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
  /**
   * If you are using a private/custom EVM chain, you can provide its Fireblocks assetId here
   */
  assetId?: string,
  /**
   * Default: false
   * By setting to true, every transaction status change will be logged to the console
   * Same as setting env var `DEBUG=fireblocks-web3-provider:status`
   */
  logTransactionStatusChanges?: boolean,
  /**
   * Default: false
   * By setting to true, every request and response processed by the provider will be logged to the console
   * Same as setting env var `DEBUG=fireblocks-web3-provider:req_res`
   */
  logRequestsAndResponses?: boolean,
  /**
   * Default: true
   * By setting to true, every failed transaction will print additional information
   * helpful for debugging, such as a link to simulate the transaction on Tenderly
   * Same as setting env var `DEBUG=fireblocks-web3-provider:error`
   */
  enhancedErrorHandling?: boolean,
  /**
   * Warning: This is an undocumented experimental flag that is subject to breaking changes
   * Warning: Use at your own risk
   * By default, no contracts are interacted with gaslessly
   * By setting a gaslessGasTankVaultId, all transactions will be sent gaslessly, 
   * relayed via the provided vault account
   */
  gaslessGasTankVaultId?: number,

  /**
   * Proxy path in the format of `http(s)://user:pass@server`.
   * Note that all connections performed via the proxy will be done using CONNECT HTTP method.
   */
  proxyPath?: string,
}

export interface RequestArguments<T = any> {
  method: string;
  params?: T;
}

export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
  payload: RequestArguments;
}
