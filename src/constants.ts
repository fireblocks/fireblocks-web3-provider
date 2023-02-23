import { TransactionStatus } from "fireblocks-sdk";
import { ChainId, Asset } from "./types";

export const ASSETS: { [key: string]: Asset } = {
  [ChainId.MAINNET]: { assetId: 'ETH', rpcUrl: "https://cloudflare-eth.com" },
  [ChainId.ROPSTEN]: { assetId: 'ETH_TEST', rpcUrl: "https://rpc.ankr.com/eth_ropsten" },
  [ChainId.KOVAN]: { assetId: 'ETH_TEST2', rpcUrl: "https://kovan.poa.network" },
  [ChainId.GOERLI]: { assetId: 'ETH_TEST3', rpcUrl: "https://rpc.ankr.com/eth_goerli" },
  [ChainId.RINKEBY]: { assetId: 'ETH_TEST4', rpcUrl: "https://rpc.ankr.com/eth_rinkeby" },
  [ChainId.BSC]: { assetId: 'BNB_BSC', rpcUrl: "https://bsc-dataseed.binance.org" },
  [ChainId.BSC_TEST]: { assetId: 'BNB_TEST', rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545" },
  [ChainId.POLYGON]: { assetId: 'MATIC_POLYGON', rpcUrl: "https://polygon-rpc.com" },
  [ChainId.POLYGON_TEST]: { assetId: 'MATIC_POLYGON_MUMBAI', rpcUrl: "https://rpc-mumbai.maticvigil.com" },
  [ChainId.AVALANCHE]: { assetId: 'AVAX', rpcUrl: "https://api.avax.network/ext/bc/C/rpc" },
  [ChainId.AVALANCHE_TEST]: { assetId: 'AVAXTEST', rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc" },
  [ChainId.MOONRIVER]: { assetId: 'MOVR_MOVR', rpcUrl: "https://rpc.moonriver.moonbeam.network" },
  [ChainId.MOONBEAM]: { assetId: 'GLMR_GLMR', rpcUrl: "https://rpc.api.moonbeam.network" },
  [ChainId.SONGBIRD]: { assetId: 'SGB', rpcUrl: "https://songbird.towolabs.com/rpc" },
  [ChainId.ARBITRUM]: { assetId: 'ETH-AETH', rpcUrl: "https://rpc.ankr.com/arbitrum" },
  [ChainId.ARBITRUM_RIN]: { assetId: 'ETH-AETH-RIN', rpcUrl: "https://rinkeby.arbitrum.io/rpc" },
  [ChainId.FANTOM]: { assetId: 'FTM_FANTOM', rpcUrl: "https://rpc.ftm.tools/" },
  [ChainId.RSK]: { assetId: 'RBTC', rpcUrl: "https://public-node.rsk.co" },
  [ChainId.RSK_TEST]: { assetId: 'RBTC_TEST', rpcUrl: "https://public-node.testnet.rsk.co" },
  [ChainId.CELO]: { assetId: 'CELO', rpcUrl: "https://rpc.ankr.com/celo" },
  [ChainId.CELO_BAK]: { assetId: 'CELO_BAK', rpcUrl: "https://baklava-blockscout.celo-testnet.org/api/eth-rpc" },
  [ChainId.CELO_ALF]: { assetId: 'CELO_ALF', rpcUrl: "https://alfajores-forno.celo-testnet.org/api/eth-rpc" },
  [ChainId.OPTIMISM]: { assetId: 'ETH-OPT', rpcUrl: "https://rpc.ankr.com/optimism" },
  [ChainId.OPTIMISM_KOVAN]: { assetId: 'ETH-OPT_KOV', rpcUrl: "https://kovan.optimism.io/" },
  [ChainId.RONIN]: { assetId: 'RON', rpcUrl: "https://api.roninchain.com/rpc" }
}

export const SIGNER_METHODS = [
  "eth_sendTransaction",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v1",
  "eth_signTypedData_v3",
  "eth_signTypedData_v4",
  "eth_requestAccounts",
  "eth_accounts",
  "eth_sign",
  "eth_signTransaction",
]

export const FINAL_TRANSACTION_STATES = [
  TransactionStatus.COMPLETED,
  TransactionStatus.FAILED,
  TransactionStatus.CANCELLED,
  TransactionStatus.BLOCKED,
  TransactionStatus.REJECTED,
  TransactionStatus.BROADCASTING,
  TransactionStatus.CONFIRMING,
]

export const FINAL_SUCCESSFUL_TRANSACTION_STATES = [
  TransactionStatus.COMPLETED,
  TransactionStatus.BROADCASTING,
  TransactionStatus.CONFIRMING,
]

export const DEBUG_NAMESPACE = 'fireblocks-web3-provider'
export const DEBUG_NAMESPACE_TX_STATUS_CHANGES = `${DEBUG_NAMESPACE}:status`
export const DEBUG_NAMESPACE_ENHANCED_ERROR_HANDLING = `${DEBUG_NAMESPACE}:error`
