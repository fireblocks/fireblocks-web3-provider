import util from "util";
import { DestinationTransferPeerPath, FeeLevel, FireblocksSDK, TransactionArguments, TransactionResponse, TransactionStatus } from "fireblocks-sdk";
import { getAssetByChain } from "./utils";
import { readFileSync } from "fs";
import { ApiBaseUrl, ChainId, FireblocksProviderConfig, ProviderRpcError, RawMessageType, RequestArguments } from "./types";
import { PeerType, TransactionOperation } from "fireblocks-sdk";
import { formatEther, formatUnits } from "@ethersproject/units";
import { FINAL_SUCCESSFUL_TRANSACTION_STATES, FINAL_TRANSACTION_STATES } from "./constants";
import { formatJsonRpcRequest, formatJsonRpcResult } from "./jsonRpcUtils";
import { version as SDK_VERSION } from "../package.json";
const HttpProvider = require("web3-providers-http");

export class FireblocksWeb3Provider extends HttpProvider {
  private fireblocksApiClient: FireblocksSDK;
  private config: FireblocksProviderConfig;
  private accounts: { [vaultId: number]: string } = {};
  private vaultAccountIds?: number[];
  private assetId?: string;
  private chainId?: number;
  private feeLevel: FeeLevel;
  private note: string;
  private externalTxId: (() => string) | string | undefined;
  private accountsPopulatedPromise: Promise<void>;
  private pollingInterval: number;
  private oneTimeAddressesEnabled: boolean;
  private whitelisted: { [address: string]: { type: string, id: string } } = {};
  private whitelistedPopulatedPromise: Promise<void>;
  private assetAndChainIdPopulatedPromise: Promise<void>;

  constructor(config: FireblocksProviderConfig) {
    if (config.assetId && !config.rpcUrl) {
      throw Error(`If you supply an assetId, you must also supply an rpcUrl`);
    }
    const asset = config.assetId ? {
      assetId: config.assetId,
      rpcUrl: config.rpcUrl,
    } : getAssetByChain(config.chainId!);
    if (!asset && !config.rpcUrl) {
      throw Error(`Unsupported chain id: ${config.chainId}.\nSupported chains ids: ${Object.keys(ChainId).join(', ')}\nIf you're using a private blockchain, you can specify the blockchain's Fireblocks Asset ID via the "assetId" config param.`);
    }

    super(config.rpcUrl || asset.rpcUrl)

    this.config = config
    this.fireblocksApiClient = new FireblocksSDK(
      this.parsePrivateKey(config.privateKey),
      config.apiKey,
      config.apiBaseUrl || ApiBaseUrl.Production,
      undefined,
      {
        userAgent: this.getUserAgent(),
      })
    this.feeLevel = config.fallbackFeeLevel || FeeLevel.MEDIUM
    this.note = config.note || 'Created by Fireblocks Web3 Provider'
    this.externalTxId = config.externalTxId;
    this.vaultAccountIds = this.parseVaultAccountIds(config.vaultAccountIds)
    this.pollingInterval = config.pollingInterval || 1000
    this.oneTimeAddressesEnabled = config.oneTimeAddressesEnabled ?? true
    this.chainId = config.chainId
    this.assetId = asset?.assetId
    this.assetAndChainIdPopulatedPromise = this.chainId ? Promise.resolve() : this.populateAssetAndChainId()
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

  private getUserAgent(): string {
    let userAgent = `fireblocks-web3-provider/${SDK_VERSION}`;
    if (this.config.userAgent) {
      userAgent = `${this.config.userAgent} ${userAgent}`;
    }
    return userAgent;
  }

  private async getVaultAccounts(): Promise<number[]> {
    await this.assetAndChainIdPopulatedPromise

    return (await this.fireblocksApiClient.getVaultAccountsWithPageInfo(
      {
        assetId: this.assetId,
        orderBy: "ASC",
        limit: 20,
      })).accounts
      .filter((x: any) => x.assets.some((a: any) => a.id == this.assetId))
      .map((x: any) => parseInt(x.id))
  }

  // Called by the constructor in case rpcUrl is provided, and chainId not
  private async populateAssetAndChainId() {
    const chainId = (await util.promisify<any, any>(super.send).bind(this)(formatJsonRpcRequest('eth_chainId', []))).result
    this.chainId = Number(chainId)

    if (!this.assetId) {
      const asset = getAssetByChain(Number(chainId))
      if (!asset) {
        throw this.createError({ message: `Unsupported chain id: ${chainId}.\nSupported chains ids: ${Object.keys(ChainId).join(', ')}\nIf you're using a private blockchain, you can specify the blockchain's Fireblocks Asset ID via the "assetId" config param.` })
      }

      this.assetId = asset.assetId
    }
  }

  private async populateAccounts() {
    if (Object.keys(this.accounts).length > 0) {
      throw this.createError({ message: "Accounts already populated" })
    }

    if (!this.vaultAccountIds) {
      this.vaultAccountIds = await this.getVaultAccounts()
    }

    await this.assetAndChainIdPopulatedPromise

    for (const vaultAccountId of this.vaultAccountIds) {
      try {
        const depositAddresses = await this.fireblocksApiClient.getDepositAddresses(vaultAccountId.toString(), this.assetId!);
        this.accounts[vaultAccountId] = depositAddresses[0].address;
      } catch (e: any) {
        throw this.createFireblocksError(e)
      }
    }
  }

  private createFireblocksError(e: any) {
    const code = e?.response?.status == 401 ? 4100 : undefined
    let message = e?.response?.data?.message || e?.message || 'Unknown error'
    message = `Fireblocks SDK Error: ${message}`
    message = e?.response?.data?.code ? `${message} (Error code: ${e.response.data.code})` : message
    message = e?.response?.headers?.['x-request-id'] ? `${message} (Request ID: ${e.response.headers['x-request-id']})` : message

    return this.createError({ message, code })
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
      throw this.createError({ message: "Whitelisted already populated" })
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

  public send(
    payload: any,
    callback: (error: any, response: any) => void
  ): void {
    (async () => {
      let result;
      let error = null;

      try {
        switch (payload.method) {
          case "eth_requestAccounts":
          case "eth_accounts":
            await this.accountsPopulatedPromise
            result = Object.values(this.accounts);
            break;

          case "eth_sendTransaction":
            result = await this.createContractCall(payload.params[0]);
            break;

          case "personal_sign":
          case "eth_sign":
            result = await this.createPersonalSign(payload.params[1], payload.params[0], TransactionOperation.TYPED_MESSAGE, RawMessageType.ETH_MESSAGE);
            break;

          case "eth_signTypedData":
          case "eth_signTypedData_v1":
          case "eth_signTypedData_v3":
          case "eth_signTypedData_v4":
            result = await this.createPersonalSign(payload.params[0], payload.params[1], TransactionOperation.TYPED_MESSAGE, RawMessageType.EIP712);
            break;

          case "eth_signTypedData_v2":
          case "eth_signTransaction":
            throw this.createError({
              message: `JSON-RPC method (${payload.method}) is not implemented in FireblocksWeb3Provider`,
              code: 4200,
              payload,
            })

          default:
            const jsonRpcResponse = await util.promisify<any, any>(super.send).bind(this)(payload)

            if (jsonRpcResponse.error) {
              console.log(jsonRpcResponse)
              throw this.createError({
                message: jsonRpcResponse.error.message,
                code: jsonRpcResponse.error.code,
                data: jsonRpcResponse.error.data,
                payload,
              })
            }

            return callback(error, jsonRpcResponse)
        }
      } catch (e) {
        error = e;
      }

      callback(error, formatJsonRpcResult(payload.id, result));
    })();
  }

  private createError(errorData: { message: string, code?: number, data?: any, payload?: any }): ProviderRpcError {
    const error = new Error(errorData.message) as ProviderRpcError
    error.code = errorData.code || -32603
    error.data = errorData.data
    error.payload = errorData.payload
    return error
  }

  public sendAsync(
    payload: any,
    callback: (error: any, response: any) => void
  ): void {
    this.send(payload, callback);
  }

  public async request(
    args: RequestArguments
  ): Promise<any> {
    return (await util.promisify(this.send).bind(this)(formatJsonRpcRequest(args.method, args.params))).result;
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
      if (!address || address == "0x0") {
        throw this.createError({ message: "Contract deployment is currently not available without enabling one-time addresses" })
      }

      const whitelistedDestination = this.whitelisted[address.toLowerCase()]
      if (!whitelistedDestination) {
        throw this.createError({ message: `Address ${address} is not whitelisted. Whitelisted addresses: ${JSON.stringify(this.whitelisted, undefined, 4)}` })
      }

      return {
        type: whitelistedDestination.type as PeerType,
        id: whitelistedDestination.id,
      }
    }
  }

  private getVaultAccountIdAndValidateExistence(address: string, errorMessage: string = "Account not found: ") {
    const vaultAccountId = this.getVaultAccountId(address);

    if (isNaN(vaultAccountId)) {
      throw this.createError({
        message: `${errorMessage}${address}. 
${!this.config.vaultAccountIds ? "vaultAccountIds was not provided in the configuration. When that happens, the provider loads the first 20 vault accounts found. It is advised to explicitly pass the required vaultAccountIds in the configuration to the provider." : `vaultAccountIds provided in the configuration: ${this.vaultAccountIds!.join(", ")}`}.
Available addresses: ${Object.values(this.accounts).join(', ')}.`
      })
    }

    return vaultAccountId
  }

  private async createContractCall(transaction: any) {
    await this.initialized()
    if (transaction.chainId && transaction.chainId != this.chainId) {
      throw this.createError({ message: `Chain ID of the transaction (${transaction.chainId}) does not match the chain ID of the FireblocksWeb3Provider (${this.chainId})` })
    }

    if (!transaction.from) {
      throw this.createError({ message: `Transaction sent with no "from" field` })
    }

    const vaultAccountId = this.getVaultAccountIdAndValidateExistence(transaction.from, `Transaction sent from an unsupported address: `);

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
      externalTxId: !this.externalTxId ? undefined : (typeof this.externalTxId == 'function' ? this.externalTxId() : this.externalTxId),
      amount: formatEther(transaction.value?.toString() || "0"),
      extraParameters: transaction.data ? {
        contractCallData: transaction.data
      } : undefined,
    }

    const createTransactionResponse = await this.createTransaction(transactionArguments);

    return createTransactionResponse.txHash;
  }

  private async createPersonalSign(address: string, content: any, operation: TransactionOperation, type: RawMessageType): Promise<string> {
    await this.initialized()
    const vaultAccountId = this.getVaultAccountIdAndValidateExistence(address, `Signature request from an unsupported address: `);

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
      externalTxId: !this.externalTxId ? undefined : (typeof this.externalTxId == 'function' ? this.externalTxId() : this.externalTxId),
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
    let currentStatus: TransactionStatus = TransactionStatus.SUBMITTED;

    while (!FINAL_TRANSACTION_STATES.includes(currentStatus)) {
      try {
        txInfo = await this.fireblocksApiClient.getTransactionById(id);

        if (this.config.logTransactionStatusChanges && currentStatus != txInfo.status) {
          console.log(`Fireblocks transaction ${txInfo.id} changed status from ${currentStatus} to ${txInfo.status} ${txInfo.subStatus ? `(${txInfo.subStatus})` : ''}`)
        }
        currentStatus = txInfo.status;
      } catch (err) {
        console.error(this.createFireblocksError(err));
      }
      await new Promise(r => setTimeout(r, this.pollingInterval));
    }

    if (!FINAL_SUCCESSFUL_TRANSACTION_STATES.includes(currentStatus)) {
      throw this.createError({ message: `Fireblocks transaction ${txInfo!.id || ''} was not completed successfully. Final Status: ${currentStatus} ${txInfo!?.subStatus ? `(${txInfo!?.subStatus})` : ''}` })
    }

    return txInfo!
  }

  private getVaultAccountId(address: string): number {
    return parseInt(Object.entries(this.accounts).find(([id, addr]) => addr.toLowerCase() === address.toLowerCase())?.[0] || '');
  }

  public setExternalTxId(externalTxId: (() => string) | string | undefined) {
    this.externalTxId = externalTxId;
  }
}
