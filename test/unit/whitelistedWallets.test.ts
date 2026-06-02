import { expect } from "chai";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";
import { TransferPeerPathType } from "@fireblocks/ts-sdk";

const DUMMY_PEM =
  "-----BEGIN PRIVATE KEY-----\nTHIS_IS_A_TEST_DUMMY_NOT_A_REAL_KEY_FOR_CI_ONLY\n-----END PRIVATE KEY-----\n";

function buildProvider(): FireblocksWeb3Provider {
  const provider = new FireblocksWeb3Provider({
    apiKey: "test-api-key",
    privateKey: DUMMY_PEM,
    chainId: ChainId.SEPOLIA,
    apiBaseUrl: ApiBaseUrl.Sandbox,
    pollingInterval: 1,
  } as any);
  (provider as any).accountsPopulatedPromise = async () => {};
  (provider as any).assetAndChainIdPopulatedPromise = async () => {};
  (provider as any).whitelistedPopulatedPromise = async () => {};
  (provider as any).gaslessGasTankAddressPopulatedPromise = async () => {};
  return provider;
}

// ──────────────────────────────────────────────────────────────────────────────
// Group 3 — getWhitelistedWallets adapter
// ──────────────────────────────────────────────────────────────────────────────

describe("getWhitelistedWallets — adapter unit tests", function () {
  let provider: FireblocksWeb3Provider;

  before(function () {
    provider = buildProvider();
  });

  it("filters out wallets that have no asset matching the given assetId", async function () {
    // 3 wallets: only the second has a matching ETH_TEST5 asset
    const wallets = [
      {
        id: "w1",
        name: "Wallet 1",
        assets: [{ id: "BTC", address: "bc1qxyz" }],
      },
      {
        id: "w2",
        name: "Wallet 2",
        assets: [{ id: "ETH_TEST5", address: "0xaabbcc" }],
      },
      {
        id: "w3",
        name: "Wallet 3",
        assets: [{ id: "USDC", address: "0xdeadbeef" }],
      },
    ];
    const matchingWallet = wallets[1];

    const walletsPromise = Promise.resolve(wallets);
    const result = await (provider as any).getWhitelistedWallets(
      walletsPromise,
      TransferPeerPathType.ExternalWallet,
      matchingWallet.assets[0].id
    );

    expect(result).to.have.lengthOf(1);
    expect(result[0].id).to.equal(matchingWallet.id);
  });

  it("handles wallet items with missing assets array without throwing (optional chaining fix)", async function () {
    const matchingWallet = {
      id: "w1",
      name: "Wallet 1",
      assets: [{ id: "ETH_TEST5", address: "0x111" }],
    };
    // One wallet with assets, one without (assets is undefined)
    const wallets = [matchingWallet, { id: "w2", name: "Wallet 2" }];

    // The ?.find optional chain must handle undefined assets without throwing.
    // If the ?. is removed, this await would reject.
    const result = await (provider as any).getWhitelistedWallets(
      Promise.resolve(wallets),
      TransferPeerPathType.ExternalWallet,
      matchingWallet.assets[0].id
    );

    // Only the wallet with a matching asset is included
    expect(result).to.have.lengthOf(1);
    expect(result[0].id).to.equal(matchingWallet.id);
  });

  it("returns the matching asset's address in the result item", async function () {
    const matchingAsset = { id: "ETH_TEST5", address: "0xCaFeBeEfCaFeBeEf" };
    const wallets = [{ id: "w5", name: "My Wallet", assets: [matchingAsset] }];

    const result = await (provider as any).getWhitelistedWallets(
      Promise.resolve(wallets),
      TransferPeerPathType.ExternalWallet,
      matchingAsset.id
    );

    expect(result).to.have.lengthOf(1);
    expect(result[0].address).to.equal(matchingAsset.address);
  });

  it("returns empty array when no wallets match the given assetId", async function () {
    const wallets = [
      {
        id: "w1",
        name: "Wallet 1",
        assets: [{ id: "BTC", address: "bc1qxyz" }],
      },
    ];

    const result = await (provider as any).getWhitelistedWallets(
      Promise.resolve(wallets),
      TransferPeerPathType.ExternalWallet,
      "ETH_TEST5"
    );

    expect(result).to.have.lengthOf(0);
  });

  it("preserves type and id fields in the returned items", async function () {
    const inputWallet = {
      id: "ext-42",
      name: "External Wallet",
      assets: [{ id: "ETH_TEST5", address: "0xabcdef" }],
    };

    const result = await (provider as any).getWhitelistedWallets(
      Promise.resolve([inputWallet]),
      TransferPeerPathType.ExternalWallet,
      inputWallet.assets[0].id
    );

    expect(result[0].type).to.equal(TransferPeerPathType.ExternalWallet);
    expect(result[0].id).to.equal(inputWallet.id);
    expect(result[0].name).to.equal(inputWallet.name);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Group 4 — populateWhitelisted calls all three sub-APIs
// ──────────────────────────────────────────────────────────────────────────────

describe("populateWhitelisted — calls all three sub-APIs", function () {
  this.timeout(5000);

  it("invokes externalWallets, internalWallets, and contracts APIs exactly once each", async function () {
    const provider = buildProvider();

    const externalWalletsCalls: number[] = [];
    const internalWalletsCalls: number[] = [];
    const contractsCalls: number[] = [];

    // Pre-populate assetId so the method doesn't need to fetch it
    (provider as any).assetId = "ETH_TEST5";

    (provider as any).fireblocksApiClient = {
      externalWallets: {
        getExternalWallets: () => {
          externalWalletsCalls.push(1);
          return Promise.resolve({ data: [] });
        },
      },
      internalWallets: {
        getInternalWallets: () => {
          internalWalletsCalls.push(1);
          return Promise.resolve({ data: [] });
        },
      },
      contracts: {
        getContracts: () => {
          contractsCalls.push(1);
          return Promise.resolve({ data: [] });
        },
      },
    } as any;

    // accounts must be pre-populated so accountsPopulatedPromise doesn't call the real API
    (provider as any).accounts = { 0: "0xaabbcc" };

    await (provider as any).populateWhitelisted();

    expect(externalWalletsCalls).to.have.lengthOf(1);
    expect(internalWalletsCalls).to.have.lengthOf(1);
    expect(contractsCalls).to.have.lengthOf(1);
  });
});
