import { FeeLevel } from "fireblocks-sdk";

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  KOVAN = 42,
  GOERLI = 5,
  RINKEBY = 4,
  BSC = 56,
  BSC_TEST = 97,
  POLYGON = 137,
  POLYGON_TEST = 80001,
  AVALANCHE = 43114,
  AVALANCHE_TEST = 43113,
  MOONRIVER = 1285, // Moonbeam testnet
  MOONBEAM = 1284,
  SONGBIRD = 19,
  ARBITRUM = 42161,
  ARBITRUM_RIN = 421611,
  FANTOM = 250,
  RSK = 30,
  RSK_TEST = 31,
  CELO = 42220,
  CELO_BAK = 62320,
  CELO_ALF = 44787,
  OPTIMISM = 10,
  OPTIMISM_KOVAN = 69,
  RONIN = 2020,
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
  // # Mandatory fields

  // Learn more about creating API users here: 
  // https://support.fireblocks.io/hc/en-us/articles/4407823826194-Adding-new-API-users
  apiKey: string,
  privateKey: string,
  
  // Either chainId or rpcUrl must be provided
  chainId?: ChainId, // If not provided, it is inferred from the rpcUrl
  rpcUrl?: string, // If not provided, it is inferred from the chainId
  
  // # Optional fields

  // By default, the first 20 vault accounts are dynamically loaded from the Fireblocks API
  // It is recommended to provide the vault account ids explicitly because it helps avoid unnecessary API calls
  vaultAccountIds?: number | number[] | string | string[],
  // By default, the fallback fee level is set to FeeLevel.MEDIUM
  fallbackFeeLevel?: FeeLevel,
  // By default, the note is set to "Created by Fireblocks Web3 Provider"
  note?: string,
  // By default, the polling interval is set to 1000ms (1 second)
  // It is the interval in which the Fireblocks API is queried to check the status of transactions
  pollingInterval?: number,
  // By default, it is assumed that one time addresses are enabled in your workspace
  // If they're not, set this to false
  oneTimeAddressesEnabled?: boolean,
  // By default, no externalTxId is associated with transactions
  // If you want to set one, you can either provide a function that returns a string, or provide a string directly
  externalTxId?: (() => string) | string,
}

export interface RequestArguments<T = any> {
  method: string;
  params?: T;
}
