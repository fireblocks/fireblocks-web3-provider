import { EthereumProvider } from "eip1193-provider";
import util from "util";
import {
  RequestArguments,
  formatJsonRpcRequest,
} from "@json-rpc-tools/utils";
import { DestinationTransferPeerPath, FeeLevel, FireblocksSDK, TransactionArguments, TransactionResponse, TransactionStatus } from "fireblocks-sdk";
import { getAssetByChain } from "./utils";
import { readFileSync } from "fs";
import { ChainId, FireblocksProviderConfig, RawMessageType } from "./types";
import { PeerType, TransactionOperation } from "fireblocks-sdk";
import { formatEther, formatUnits } from "ethers/lib/utils";
import { FINAL_TRANSACTION_STATES } from "./constants";


export class FireblocksWeb3Provider extends EthereumProvider {
  private fireblocksApiClient: FireblocksSDK;
  private config: FireblocksProviderConfig;
  private accounts: { [vaultId: number]: string } = {};
  private vaultAccountIds?: number[];
  private assetId?: string;
  private chainId?: number;
  private feeLevel: FeeLevel;
  private note: string;
  private externalTxId: string | undefined;
  private accountsPopulatedPromise: Promise<void>;
  private pollingInterval: number;
  private oneTimeAddressesEnabled: boolean;
  private whitelisted: { [address: string]: { type: string, id: string } } = {};
  private whitelistedPopulatedPromise: Promise<void>;
  private assetAndChainIdPopulatedPromise: Promise<void>;

  constructor(config: FireblocksProviderConfig) {
    const asset = getAssetByChain(config.chainId!);
    if (!asset && !config.rpcUrl) {
      throw Error(`Unsupported chain id: ${config.chainId}. Supported chains ids: ${Object.keys(ChainId).join(', ')}`);
    }

    super(config.rpcUrl || asset.rpcUrl)

    this.fireblocksApiClient = new FireblocksSDK(this.parsePrivateKey(config.privateKey), config.apiKey)
    this.config = config
    this.feeLevel = config.fallbackFeeLevel || FeeLevel.MEDIUM
    this.note = config.note || 'Created by Fireblocks Web3 Provider'
    this.externalTxId = config.externalTxId;
    this.vaultAccountIds = this.parseVaultAccountIds(config.vaultAccountIds)
    this.pollingInterval = config.pollingInterval || 1000
    this.oneTimeAddressesEnabled = config.oneTimeAddressesEnabled || true
    if (config.chainId) {
      this.assetId = asset.assetId
      this.chainId = config.chainId
    }
    this.assetAndChainIdPopulatedPromise = config.chainId ? Promise.resolve() : this.populateAssetAndChainId()
    this.accountsPopulatedPromise = this.populateAccounts()
    this.whitelistedPopulatedPromise = this.oneTimeAddressesEnabled ? Promise.resolve() : this.populateWhitelisted()
  }

  private parsePrivateKey(privateKey: string): string {
    if (privateKey.startsWith('/') || privateKey.startsWith('./')) {
      return readFileSync(privateKey, 'utf8')
    } else {
      return privateKey
    }
  }

  private parseVaultAccountIds(vaultAccountIds: number | number[] | string | string[] | undefined): number[] | undefined {
    if (typeof vaultAccountIds == 'number') {
      return [vaultAccountIds]
    } else if (typeof vaultAccountIds == 'string') {
      return vaultAccountIds.split(',').map(x => parseInt(x))
    } else if (Array.isArray(vaultAccountIds)) {
      return vaultAccountIds.map(x => parseInt(x.toString()))
    } else {
      return vaultAccountIds
    }
  }

  private async getVaultAccounts(): Promise<number[]> {
    await this.assetAndChainIdPopulatedPromise

    return (await this.fireblocksApiClient.getVaultAccounts())
      .filter((x: any) => x.assets.some((a: any) => a.id == this.assetId))
      .map((x: any) => parseInt(x.id))
  }

  // Called by the constructor in case rpcUrl is provided, and chainId not
  private async populateAssetAndChainId() {
    const chainId = await this.requestStrict(formatJsonRpcRequest('eth_chainId', []))

    const asset = getAssetByChain(Number(chainId))
    if (!asset) {
      throw Error(`Unsupported chain id: ${chainId}. Supported chains ids: ${Object.keys(ChainId).join(', ')}`)
    }

    this.assetId = asset.assetId
    this.chainId = Number(chainId)
  }

  private async populateAccounts() {
    if (Object.keys(this.accounts).length > 0) {
      throw new Error("Accounts already populated");
    }

    if (!this.vaultAccountIds) {
      this.vaultAccountIds = await this.getVaultAccounts()
    }

    await this.assetAndChainIdPopulatedPromise

    for (const vaultAccountId of this.vaultAccountIds) {
      try {
        const depositAddresses = await this.fireblocksApiClient.getDepositAddresses(vaultAccountId.toString(), this.assetId!);
        this.accounts[vaultAccountId] = depositAddresses[0].address;
      } catch {
        if (this.config.vaultAccountIds !== undefined) {
          throw new Error(`Failed to find Fireblocks vault account ${vaultAccountId}`);
        }
      }
    }
  }

  private async getWhitelistedWallets(walletsPromise: Promise<any>, type: PeerType, assetId: string) {
    return (await walletsPromise).map((x: any) => ({
      type,
      id: x.id,
      name: x.name,
      address: x.assets.find((a: any) => a.id == assetId)?.address,
    })).filter((x: any) => x.address)
  }

  private async populateWhitelisted() {
    if (Object.keys(this.whitelisted).length > 0) {
      throw new Error("Whitelisted already populated");
    }

    await this.assetAndChainIdPopulatedPromise

    const [externalWallets, internalWallets, contractWallets] = await Promise.all([
      this.getWhitelistedWallets(this.fireblocksApiClient.getExternalWallets(), PeerType.EXTERNAL_WALLET, this.assetId!),
      this.getWhitelistedWallets(this.fireblocksApiClient.getInternalWallets(), PeerType.INTERNAL_WALLET, this.assetId!),
      this.getWhitelistedWallets(this.fireblocksApiClient.getContractWallets(), PeerType.EXTERNAL_WALLET, this.assetId!),
    ])

    await this.accountsPopulatedPromise

    const vaultWallets = Object.entries(this.accounts).map(([id, address]) => ({
      type: PeerType.VAULT_ACCOUNT,
      id,
      address,
    }))

    const whitelistedList = [...externalWallets, ...internalWallets, ...contractWallets, ...vaultWallets]
    this.whitelisted = whitelistedList.reduce((wl: any, x: any) => {
      wl[x.address.toLowerCase()] = { type: x.type, id: x.id, name: x.name }
      return wl
    }, {})
  }

  private async initialized() {
    await this.assetAndChainIdPopulatedPromise;
    await this.accountsPopulatedPromise
    await this.whitelistedPopulatedPromise
  }

  public async request(
    args: RequestArguments
  ): Promise<any> {
    await this.initialized()

    switch (args.method) {
      case "eth_requestAccounts":
      case "eth_accounts":
        return Object.values(this.accounts);

      case "eth_sendTransaction":
        return await this.createContractCall(args.params[0]);

      case "personal_sign":
        return await this.createPersonalSign(args.params[1], args.params[0], TransactionOperation.TYPED_MESSAGE, RawMessageType.ETH_MESSAGE);

      case "eth_signTypedData":
      case "eth_signTypedData_v1":
      case "eth_signTypedData_v3":
      case "eth_signTypedData_v4":
        return await this.createPersonalSign(args.params[0], args.params[1], TransactionOperation.TYPED_MESSAGE, RawMessageType.EIP712);

      case "eth_signTypedData_v2":
      case "eth_signTransaction":
      case "eth_sign":
        throw new Error(`JSON-RPC method (${args.method}) is not implemented in FireblocksWeb3Provider`);
      default:
        return await this.requestStrict(formatJsonRpcRequest(args.method, args.params || []));
    }
  }

  public send(
    payload: any,
    callback: (error: any, response: any) => void
  ): void {
    return this.sendAsync(payload, callback);
  }


  public sendAsync(
    payload: any,
    callback: (error: any, response: any) => void
  ): void {
    util.callbackify(() => this._sendJsonRpcRequest(payload))(callback);
  }

  private async _sendJsonRpcRequest(
    request: any
  ): Promise<any> {
    const response = {
      id: request.id,
      jsonrpc: "2.0",
    };

    try {
      // @ts-ignore
      response.result = await this.request({
        method: request.method,
        params: request.params,
      });
    } catch (error: any) {
      if (error.code === undefined) {
        // eslint-disable-next-line @nomiclabs/hardhat-internal-rules/only-hardhat-error
        throw error;
      }

      // @ts-ignore
      response.error = {
        code: error.code ? +error.code : -1,
        message: error.message,
        data: {
          stack: error.stack,
          name: error.name,
        },
      };
    }

    return response;
  }

  private getDestination(address: string): DestinationTransferPeerPath {
    if (this.oneTimeAddressesEnabled) {
      return {
        type: PeerType.ONE_TIME_ADDRESS,
        oneTimeAddress: {
          address: address || "0x0" // 0x0 for contract creation transactions
        }
      }
    } else {
      if (!address) {
        throw new Error(`Contract deployment is currently not available without enabling one-time addresses`);
      }

      const whitelistedDesination = this.whitelisted[address.toLowerCase()]
      if (!whitelistedDesination) {
        throw new Error(`Address ${address} is not whitelisted. Whitelisted addresses: ${JSON.stringify(this.whitelisted, undefined, 4)}`)
      }

      return {
        type: whitelistedDesination.type as PeerType,
        id: whitelistedDesination.id,
      }
    }
  }

  private async createContractCall(transaction: any) {
    if (transaction.chainId && transaction.chainId != this.chainId) {
      throw new Error(`Chain ID of the transaction (${transaction.chainId}) does not match the chain ID of the FireblocksWeb3Provider (${this.chainId})`);
    }

    if (!transaction.from) {
      throw new Error(`Transaction sent with no "from" field`);
    }

    const vaultAccountId = this.getVaultAccountId(transaction.from);
    if (isNaN(vaultAccountId)) {
      throw new Error(`Transaction sent from an unsupported address: ${transaction.from}. Supported addresses: ${Object.values(this.accounts).join(', ')}`);
    }

    const { gas, gasPrice, maxPriorityFeePerGas, maxFeePerGas } = transaction;
    const fee = formatUnits(gasPrice || 0, "gwei");
    const maxFee = formatUnits(maxFeePerGas || 0, "gwei");
    const priorityFee = formatUnits(maxPriorityFeePerGas || 0, "gwei");
    // if both are provided prefer eip 1559 fees
    const isEip1559Fees: boolean = (Boolean(maxFee) && Boolean(maxPriorityFeePerGas) && Boolean(gas));
    const isLegacyFees: boolean = (Boolean(gasPrice) && Boolean(gas)) && !isEip1559Fees;

    const transactionArguments: TransactionArguments = {
      operation: transaction.data ? TransactionOperation.CONTRACT_CALL : TransactionOperation.TRANSFER,
      assetId: this.assetId,
      source: {
        type: PeerType.VAULT_ACCOUNT,
        id: vaultAccountId.toString(),
      },
      fee: isLegacyFees ? fee : undefined,
      maxFee: isEip1559Fees ? maxFee : undefined,
      priorityFee: isEip1559Fees ? priorityFee : undefined,
      gasLimit: (isEip1559Fees || isLegacyFees) ? Number(gas).toString(10) : undefined,
      feeLevel: (isEip1559Fees || isLegacyFees) ? undefined : this.feeLevel,
      destination: this.getDestination(transaction.to),
      note: this.note,
      externalTxId: this.externalTxId,
      amount: formatEther(transaction.value?.toString() || "0"),
      extraParameters: transaction.data ? {
        contractCallData: transaction.data
      } : undefined,
    }

    const createTransactionResponse = await this.createTransaction(transactionArguments);

    return createTransactionResponse.txHash;
  }

  private async createPersonalSign(address: string, content: any, operation: TransactionOperation, type: RawMessageType): Promise<string> {
    const vaultAccountId = this.getVaultAccountId(address);
    if (isNaN(vaultAccountId)) {
      throw new Error(`Signature request from an unsupported address: ${address}. Supported addresses: ${Object.values(this.accounts).join(', ')}`);
    }

    let finalContent = content;

    if (type === RawMessageType.EIP712) {
      if (typeof content !== 'object') {
        finalContent = JSON.parse(content);
      } else {
        finalContent = content;
      }
    } else if (finalContent.startsWith("0x")) {
      finalContent = finalContent.substring(2);
    }

    let message;
    if (operation === TransactionOperation.TYPED_MESSAGE) {
      message = {
        content: finalContent,
        index: 0,
        type: type,
      };
    } else {
      message = {
        content: finalContent
      };
    }

    const transactionArguments: TransactionArguments = {
      operation: operation,
      assetId: this.assetId,
      source: {
        type: PeerType.VAULT_ACCOUNT,
        id: vaultAccountId.toString(),
      },
      note: this.note,
      externalTxId: this.externalTxId,
      extraParameters: {
        rawMessageData: {
          messages: [message]
        }
      }
    };

    const txInfo = await this.createTransaction(transactionArguments);

    const sig = txInfo!.signedMessages![0].signature;
    const v = 27 + sig.v!;
    return "0x" + sig.r + sig.s + v.toString(16);
  }

  private async createTransaction(transactionArguments: TransactionArguments): Promise<TransactionResponse> {
    const { id } = await this.fireblocksApiClient.createTransaction(transactionArguments);

    let txInfo: TransactionResponse;
    let currentStatus: TransactionStatus = TransactionStatus.QUEUED;

    while (!FINAL_TRANSACTION_STATES.includes(currentStatus)) {
      try {
        txInfo = await this.fireblocksApiClient.getTransactionById(id);
        currentStatus = txInfo.status;
      } catch (err) {
        console.log("error:", err);
      }
      await new Promise(r => setTimeout(r, this.pollingInterval));
    }

    if (currentStatus != TransactionStatus.COMPLETED) {
      throw new Error(`Transaction was not completed successfully. Final Status: ${currentStatus}`);
    }

    return txInfo!
  }

  private getVaultAccountId(address: string): number {
    return parseInt(Object.entries(this.accounts).find(([id, addr]) => addr.toLowerCase() === address.toLowerCase())?.[0] || '');
  }
}
