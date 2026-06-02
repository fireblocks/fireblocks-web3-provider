import { expect } from "chai";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";

const DUMMY_PEM =
  "-----BEGIN PRIVATE KEY-----\nTHIS_IS_A_TEST_DUMMY_NOT_A_REAL_KEY_FOR_CI_ONLY\n-----END PRIVATE KEY-----\n";

/**
 * Migration regression guard for `getVaultAccounts` — covers the rewritten call
 * `vaults.getPagedVaultAccounts({...})` and the `.data.accounts ?? []` unwrap.
 *
 * If the `.data` unwrap or the `?? []` fallback is ever silently reverted, only
 * an integration test against a live workspace would otherwise catch it.
 */
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
  (provider as any).assetId = "ETH_TEST5";
  return provider;
}

describe("getVaultAccounts — ts-sdk call site", function () {
  this.timeout(5000);

  it("returns ids of vault accounts whose assets include the configured assetId", async function () {
    const matchingId = "7";
    const provider = buildProvider();
    const assetId = (provider as any).assetId;

    (provider as any).fireblocksApiClient = {
      vaults: {
        getPagedVaultAccounts: async () => ({
          data: {
            accounts: [
              { id: matchingId, assets: [{ id: assetId }] },
              { id: "9", assets: [{ id: "BTC_TEST" }] }, // non-matching
            ],
          },
        }),
      },
    } as any;

    const ids: number[] = await (provider as any).getVaultAccounts();
    expect(ids).to.deep.equal([parseInt(matchingId)]);
  });

  it("returns an empty array when data.accounts is undefined (the `?? []` fallback)", async function () {
    const provider = buildProvider();
    (provider as any).fireblocksApiClient = {
      vaults: {
        getPagedVaultAccounts: async () => ({ data: {} }), // no `accounts` field
      },
    } as any;

    const ids: number[] = await (provider as any).getVaultAccounts();
    expect(ids).to.deep.equal([]);
  });

  it("handles vault entries with no `assets` field (optional chaining)", async function () {
    const provider = buildProvider();
    (provider as any).fireblocksApiClient = {
      vaults: {
        getPagedVaultAccounts: async () => ({
          data: {
            accounts: [
              { id: "3" }, // no `assets` — must not crash
              { id: "5", assets: [{ id: (provider as any).assetId }] },
            ],
          },
        }),
      },
    } as any;

    const ids: number[] = await (provider as any).getVaultAccounts();
    expect(ids).to.deep.equal([5]);
  });

  it("calls vaults.getPagedVaultAccounts with the expected request shape", async function () {
    const provider = buildProvider();
    let capturedArg: any;

    (provider as any).fireblocksApiClient = {
      vaults: {
        getPagedVaultAccounts: async (arg: any) => {
          capturedArg = arg;
          return { data: { accounts: [] } };
        },
      },
    } as any;

    await (provider as any).getVaultAccounts();
    expect(capturedArg).to.deep.equal({
      assetId: (provider as any).assetId,
      orderBy: "ASC",
      limit: 20,
    });
  });
});
