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
  privateKey: string,
  apiKey: string,
  vaultAccountIds?: number | number[] | string | string[],
  chainId?: ChainId,
  rpcUrl?: string,
  fallbackFeeLevel?: FeeLevel,
  note?: string,
  pollingInterval?: number,
  oneTimeAddressesEnabled?: boolean,
  externalTxId?: string,
}
