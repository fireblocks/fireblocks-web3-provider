import { expect } from "chai";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";

const DUMMY_PEM =
  "-----BEGIN PRIVATE KEY-----\nTHIS_IS_A_TEST_DUMMY_NOT_A_REAL_KEY_FOR_CI_ONLY\n-----END PRIVATE KEY-----\n";

function buildProvider(apiBaseUrl?: string): FireblocksWeb3Provider {
  const provider = new FireblocksWeb3Provider({
    apiKey: "test-api-key",
    privateKey: DUMMY_PEM,
    chainId: ChainId.SEPOLIA,
    apiBaseUrl: (apiBaseUrl ?? ApiBaseUrl.Sandbox) as any,
    pollingInterval: 1,
  } as any);
  (provider as any).accountsPopulatedPromise = async () => {};
  (provider as any).assetAndChainIdPopulatedPromise = async () => {};
  (provider as any).whitelistedPopulatedPromise = async () => {};
  (provider as any).gaslessGasTankAddressPopulatedPromise = async () => {};
  return provider;
}

// ──────────────────────────────────────────────────────────────────────────────
// Group 1 — normalizeApiBaseUrl (private method direct tests)
// ──────────────────────────────────────────────────────────────────────────────

describe("normalizeApiBaseUrl — unit", function () {
  // A single provider instance is enough for all private-method calls
  let provider: FireblocksWeb3Provider;
  before(function () {
    provider = buildProvider();
  });

  // Same code branch (no version suffix → append /v1) for every bare host.
  // Domain name is not branched on; one parametrised test is enough.
  for (const url of [
    "https://sandbox-api.fireblocks.io",
    "https://api.fireblocks.io",
    "https://dev10-developer-api.waterballoons.xyz",
  ]) {
    it(`appends /v1 to bare URL: ${url}`, function () {
      const result = (provider as any).normalizeApiBaseUrl(url);
      expect(result).to.equal(`${url}/v1`);
    });
  }

  it("does NOT double-append /v1 when URL already ends with /v1", function () {
    const result = (provider as any).normalizeApiBaseUrl(
      "https://eu-api.fireblocks.io/v1"
    );
    expect(result).to.equal("https://eu-api.fireblocks.io/v1");
  });

  it("preserves /v2 suffix without modification", function () {
    const result = (provider as any).normalizeApiBaseUrl(
      "https://api.example.com/v2"
    );
    expect(result).to.equal("https://api.example.com/v2");
  });

  it("trims a single trailing slash before appending /v1", function () {
    const result = (provider as any).normalizeApiBaseUrl(
      "https://sandbox-api.fireblocks.io/"
    );
    expect(result).to.equal("https://sandbox-api.fireblocks.io/v1");
  });

  it("removes trailing slash from a URL that already has /v1/ (no double-append)", function () {
    const result = (provider as any).normalizeApiBaseUrl(
      "https://eu-api.fireblocks.io/v1/"
    );
    expect(result).to.equal("https://eu-api.fireblocks.io/v1");
  });

  it("trims multiple trailing slashes before appending /v1", function () {
    const result = (provider as any).normalizeApiBaseUrl(
      "https://example.com//"
    );
    expect(result).to.equal("https://example.com/v1");
  });

  it("appends /v1 even when a mid-path segment looks like /vN (last segment is not a version)", function () {
    const result = (provider as any).normalizeApiBaseUrl(
      "https://proxy.example.com/v1/extra"
    );
    // Last segment is "extra", not vN — so /v1 must be appended.
    expect(result).to.equal("https://proxy.example.com/v1/extra/v1");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Integration test — constructor wires normalizeApiBaseUrl into the SDK client
// ──────────────────────────────────────────────────────────────────────────────

describe("normalizeApiBaseUrl — constructor integration", function () {
  it("constructs Fireblocks SDK client with /v1 appended when apiBaseUrl has no version segment", function () {
    const provider = buildProvider("https://sandbox-api.fireblocks.io");
    const basePath: string = (provider as any).fireblocksApiClient.config
      .basePath;
    expect(basePath).to.match(/\/v1$/);
  });
});
