import { expect } from "chai";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";
import { TransactionStateEnum } from "@fireblocks/ts-sdk";

const DUMMY_PEM =
  "-----BEGIN PRIVATE KEY-----\nTHIS_IS_A_TEST_DUMMY_NOT_A_REAL_KEY_FOR_CI_ONLY\n-----END PRIVATE KEY-----\n";

const DUMMY_ADDRESS = "0xaAbBcCdDeEfF001122334455667788990011aAbB";

function buildProvider(
  extraConfig: Record<string, unknown> = {}
): FireblocksWeb3Provider {
  const provider = new FireblocksWeb3Provider({
    apiKey: "test-api-key",
    privateKey: DUMMY_PEM,
    chainId: ChainId.SEPOLIA,
    apiBaseUrl: ApiBaseUrl.Sandbox,
    pollingInterval: 1,
    ...extraConfig,
  } as any);
  (provider as any).accountsPopulatedPromise = async () => {};
  (provider as any).assetAndChainIdPopulatedPromise = async () => {};
  (provider as any).whitelistedPopulatedPromise = async () => {};
  (provider as any).gaslessGasTankAddressPopulatedPromise = async () => {};
  return provider;
}

// A minimal mock that returns a COMPLETED transaction with the given signedMessages payload.
function completedTxClient(signedMessages: any) {
  return {
    transactions: {
      createTransaction: async () => ({ data: { id: "tx-1" } }),
      getTransaction: async () => ({
        data: {
          id: "tx-1",
          status: TransactionStateEnum.Completed,
          signedMessages,
        },
      }),
    },
  } as any;
}

// ──────────────────────────────────────────────────────────────────────────────
// Group A — Validation error paths
// ──────────────────────────────────────────────────────────────────────────────

describe("populateGaslessGasTankAddress — validation", function () {
  this.timeout(5000);

  it("throws when first address entry has no address field", async function () {
    const provider = buildProvider({ gaslessGasTankVaultId: 999 });
    (provider as any).assetId = "ETH_TEST5";
    (provider as any).fireblocksApiClient = {
      vaults: {
        getVaultAccountAssetAddressesPaginated: async () => ({
          data: { addresses: [{}] }, // address field missing
        }),
      },
    } as any;

    try {
      await (provider as any).populateGaslessGasTankAddress();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err).to.be.instanceOf(Error);
    }
  });
});

describe("populateAccounts — validation", function () {
  this.timeout(5000);

  it("throws when vaultAccountIds is explicit and no address is returned", async function () {
    const vaultId = 42;
    const provider = buildProvider({ vaultAccountIds: [vaultId] });
    (provider as any).assetId = "ETH_TEST5";
    (provider as any).fireblocksApiClient = {
      vaults: {
        getVaultAccountAssetAddressesPaginated: async () => ({
          data: { addresses: [] },
        }),
      },
    } as any;

    try {
      await (provider as any).populateAccounts();
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.include(String(vaultId));
    }
  });

  it("silently skips (does not throw) when vaultAccountIds not set and address is missing", async function () {
    // Simulate auto-discovery path: vaultAccountIds is injected directly,
    // but config.vaultAccountIds is undefined so the guard doesn't fire.
    const provider = buildProvider(); // no vaultAccountIds in config
    (provider as any).assetId = "ETH_TEST5";
    // Manually set vaultAccountIds on the instance as the auto-discovery would
    (provider as any).vaultAccountIds = [7];
    (provider as any).fireblocksApiClient = {
      vaults: {
        getVaultAccountAssetAddressesPaginated: async () => ({
          data: { addresses: [] },
        }),
      },
    } as any;

    // Should resolve without throwing — account 7 is just skipped
    await (provider as any).populateAccounts();
    // accounts dict should remain empty
    expect((provider as any).accounts).to.deep.equal({});
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Group B — SDK call-shape regression
// ──────────────────────────────────────────────────────────────────────────────

describe("createTransaction — SDK call shape", function () {
  this.timeout(5000);

  it("wraps the request in { transactionRequest } when calling createTransaction", async function () {
    const provider = buildProvider();
    let capturedArg: any;

    (provider as any).fireblocksApiClient = {
      transactions: {
        createTransaction: async (arg: any) => {
          capturedArg = arg;
          return { data: { id: "tx-1" } };
        },
        getTransaction: async () => ({
          data: { id: "tx-1", status: TransactionStateEnum.Completed },
        }),
      },
    } as any;

    const fakeRequest = { operation: "TRANSFER", assetId: "ETH_TEST5" };
    await (provider as any).createTransaction(fakeRequest);

    expect(capturedArg).to.deep.equal({ transactionRequest: fakeRequest });
  });

  it("calls getTransaction with object { txId } (not a positional string)", async function () {
    const provider = buildProvider();
    let capturedGetArg: any;

    (provider as any).fireblocksApiClient = {
      transactions: {
        createTransaction: async () => ({ data: { id: "tx-1" } }),
        getTransaction: async (arg: any) => {
          capturedGetArg = arg;
          return {
            data: { id: "tx-1", status: TransactionStateEnum.Completed },
          };
        },
      },
    } as any;

    await (provider as any).createTransaction({});

    expect(capturedGetArg).to.deep.equal({ txId: "tx-1" });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Group C — getDestination mapping
// ──────────────────────────────────────────────────────────────────────────────

describe("getDestination — one-time-address mode", function () {
  it("returns ONE_TIME_ADDRESS destination with the given address", function () {
    const provider = buildProvider({ oneTimeAddressesEnabled: true });
    const result = (provider as any).getDestination("0xabc123");
    expect(result).to.deep.equal({
      type: "ONE_TIME_ADDRESS",
      oneTimeAddress: { address: "0xabc123" },
    });
  });

  it("returns ONE_TIME_ADDRESS with 0x0 for empty/falsy address (contract creation)", function () {
    const provider = buildProvider({ oneTimeAddressesEnabled: true });
    const result = (provider as any).getDestination("");
    expect(result).to.deep.equal({
      type: "ONE_TIME_ADDRESS",
      oneTimeAddress: { address: "0x0" },
    });
  });
});

describe("getDestination — whitelisted mode", function () {
  it("returns whitelisted destination with case-insensitive lookup", function () {
    const provider = buildProvider({ oneTimeAddressesEnabled: false });
    (provider as any).whitelisted = {
      "0xaabbccddee": { type: "EXTERNAL_WALLET", id: "wallet-id-1" },
    };

    const result = (provider as any).getDestination("0xAABBCCDDEE");
    expect(result).to.deep.equal({
      type: "EXTERNAL_WALLET",
      id: "wallet-id-1",
    });
  });

  it("throws for unknown (non-whitelisted) address", function () {
    const provider = buildProvider({ oneTimeAddressesEnabled: false });
    (provider as any).whitelisted = {};
    const unknownAddress = "0xdeadbeefdeadbeef";

    try {
      (provider as any).getDestination(unknownAddress);
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.include(unknownAddress);
    }
  });
});