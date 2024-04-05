import { TransactionStatus } from "fireblocks-sdk";
import { ChainId, Asset } from "./types";

export const ASSETS: { [key: string]: Asset } = {
  [ChainId.MAINNET]: { assetId: 'ETH', rpcUrl: "https://cloudflare-eth.com" },
  [ChainId.ROPSTEN]: { assetId: 'ETH_TEST', rpcUrl: "https://rpc.ankr.com/eth_ropsten" },
  [ChainId.KOVAN]: { assetId: 'ETH_TEST2', rpcUrl: "https://kovan.poa.network" },
  [ChainId.GOERLI]: { assetId: 'ETH_TEST3', rpcUrl: "https://rpc.ankr.com/eth_goerli" },
  [ChainId.RINKEBY]: { assetId: 'ETH_TEST4', rpcUrl: "https://rpc.ankr.com/eth_rinkeby" },
  [ChainId.SEPOLIA]: { assetId: 'ETH_TEST5', rpcUrl: "https://rpc.sepolia.org" },
  [ChainId.HOLESKY]: { assetId: 'ETH_TEST6', rpcUrl: "https://ethereum-holesky.publicnode.com" },
  [ChainId.BSC]: { assetId: 'BNB_BSC', rpcUrl: "https://bsc-dataseed.binance.org" },
  [ChainId.BSC_TEST]: { assetId: 'BNB_TEST', rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545" },
  [ChainId.POLYGON]: { assetId: 'MATIC_POLYGON', rpcUrl: "https://polygon-rpc.com" },
  [ChainId.POLYGON_TEST]: { assetId: 'MATIC_POLYGON_MUMBAI', rpcUrl: "https://rpc-mumbai.maticvigil.com" },
  [ChainId.POLYGON_AMOY]: { assetId: 'AMOY_POLYGON_TEST', rpcUrl: "https://rpc-amoy.polygon.technology" },
  [ChainId.AVALANCHE]: { assetId: 'AVAX', rpcUrl: "https://api.avax.network/ext/bc/C/rpc" },
  [ChainId.AVALANCHE_TEST]: { assetId: 'AVAXTEST', rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc" },
  [ChainId.MOONRIVER]: { assetId: 'MOVR_MOVR', rpcUrl: "https://rpc.moonriver.moonbeam.network" },
  [ChainId.MOONBEAM]: { assetId: 'GLMR_GLMR', rpcUrl: "https://rpc.api.moonbeam.network" },
  [ChainId.SONGBIRD]: { assetId: 'SGB', rpcUrl: "https://songbird.towolabs.com/rpc" },
  [ChainId.ARBITRUM]: { assetId: 'ETH-AETH', rpcUrl: "https://rpc.ankr.com/arbitrum" },
  [ChainId.ARBITRUM_SEPOLIA]: { assetId: 'ETH-AETH_SEPOLIA', rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc" },
  [ChainId.ARBITRUM_RIN]: { assetId: 'ETH-AETH-RIN', rpcUrl: "https://rinkeby.arbitrum.io/rpc" },
  [ChainId.FANTOM]: { assetId: 'FTM_FANTOM', rpcUrl: "https://rpc.ftm.tools/" },
  [ChainId.RSK]: { assetId: 'RBTC', rpcUrl: "https://public-node.rsk.co" },
  [ChainId.RSK_TEST]: { assetId: 'RBTC_TEST', rpcUrl: "https://public-node.testnet.rsk.co" },
  [ChainId.CELO]: { assetId: 'CELO', rpcUrl: "https://rpc.ankr.com/celo" },
  [ChainId.CELO_BAK]: { assetId: 'CELO_BAK', rpcUrl: "https://baklava-blockscout.celo-testnet.org/api/eth-rpc" },
  [ChainId.CELO_ALF]: { assetId: 'CELO_ALF', rpcUrl: "https://alfajores-forno.celo-testnet.org/api/eth-rpc" },
  [ChainId.OPTIMISM]: { assetId: 'ETH-OPT', rpcUrl: "https://rpc.ankr.com/optimism" },
  [ChainId.OPTIMISM_KOVAN]: { assetId: 'ETH-OPT_KOV', rpcUrl: "https://kovan.optimism.io/" },
  [ChainId.OPTIMISM_SEPOLIA]: { assetId: 'ETH-OPT_SEPOLIA', rpcUrl: "https://sepolia.optimism.io/" },
  [ChainId.RONIN]: { assetId: 'RON', rpcUrl: "https://api.roninchain.com/rpc" },
  [ChainId.CANTO]: { assetId: 'CANTO', rpcUrl: "https://canto.gravitychain.io" },
  [ChainId.CANTO_TEST]: { assetId: 'CANTO_TEST', rpcUrl: "https://testnet-archive.plexnode.wtf" },
  [ChainId.POLYGON_ZKEVM]: { assetId: 'ETH_ZKEVM', rpcUrl: "https://zkevm-rpc.com" },
  [ChainId.POLYGON_ZKEVM_TEST]: { assetId: 'ETH_ZKEVM_TEST', rpcUrl: "https://rpc.public.zkevm-test.net" },
  [ChainId.KAVA]: { assetId: 'KAVA_KAVA', rpcUrl: "https://evm.kava.io" },
  [ChainId.SMARTBCH]: { assetId: 'SMARTBCH', rpcUrl: "https://smartbch.greyh.at" },
  [ChainId.SMARTBCH_TEST]: { assetId: 'ETHW', rpcUrl: "https://rpc-testnet.smartbch.org" },
  [ChainId.HECO]: { assetId: 'HT_CHAIN', rpcUrl: "https://http-mainnet.hecochain.com" },
  [ChainId.AURORA]: { assetId: 'AURORA_DEV', rpcUrl: "https://mainnet.aurora.dev" },
  [ChainId.RISEOFTHEWARBOTSTESTNET]: { assetId: 'TKX', rpcUrl: "https://testnet1.rotw.games" },
  [ChainId.EVMOS]: { assetId: 'EVMOS', rpcUrl: "https://eth.bd.evmos.org" },
  [ChainId.ASTAR]: { assetId: 'ASTR_ASTR', rpcUrl: "https://evm.astar.network" },
  [ChainId.VELAS]: { assetId: 'VLX_VLX', rpcUrl: "https://evmexplorer.velas.com/rpc" },
  [ChainId.ARB_GOERLI]: { assetId: 'ETH-AETH_GOERLI', rpcUrl: "https://endpoints.omniatech.io/v1/arbitrum/goerli/public" },
  [ChainId.XDC]: { assetId: 'XDC', rpcUrl: "https://rpc.xdcrpc.com" },
  [ChainId.BASE]: { assetId: 'BASECHAIN_ETH', rpcUrl: "https://mainnet.base.org" },
  [ChainId.BASE_SEPOLIA]: { assetId: 'BASECHAIN_ETH_TEST5', rpcUrl: "https://sepolia.base.org" },
  [ChainId.IVAR]: { assetId: 'CHZ_CHZ2', rpcUrl: "https://mainnet-rpc.ivarex.com" },
  [ChainId.JOC]: { assetId: 'ASTR_TEST', rpcUrl: "https://rpc-1.japanopenchain.org:8545" },
  [ChainId.OASYS]: { assetId: 'OAS', rpcUrl: "https://oasys.blockpi.network/v1/rpc/public" },
  [ChainId.SHIMMEREVM]: { assetId: 'SMR_SMR', rpcUrl: "https://json-rpc.evm.shimmer.network" },
  [ChainId.LINEA]: { assetId: 'LINEA', rpcUrl: "https://rpc.linea.build" },
  [ChainId.LINEA_TEST]: { assetId: 'LINEA_TEST', rpcUrl: "https://rpc.goerli.linea.build" },
  [ChainId.FLARE]: { assetId: 'FLR', rpcUrl: "https://flare-api.flare.network/ext/C/rpc" },
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
export const DEBUG_NAMESPACE_REQUESTS_AND_RESPONSES = `${DEBUG_NAMESPACE}:req_res`
