import { expect } from "chai";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";
// Read version from package.json to avoid hardcoding, same pattern as the source file itself.
import { version as PKG_VERSION } from "../../package.json";

const DUMMY_PEM =
  "-----BEGIN PRIVATE KEY-----\nTHIS_IS_A_TEST_DUMMY_NOT_A_REAL_KEY_FOR_CI_ONLY\n-----END PRIVATE KEY-----\n";

/**
 * Regression guard: the migration from fireblocks-sdk (legacy) to @fireblocks/ts-sdk changed
 * how the userAgent is threaded into the HTTP client.
 *
 * Legacy (fireblocks-sdk):  top-level positional arg  { userAgent, httpsAgent }
 * New   (@fireblocks/ts-sdk): additionalOptions.userAgent
 *
 * Inside AxiosManager (axiosManager.ts):
 *   constructor(private apiKey, private secretKey, private additionalOptions?: AdditionalOptions)
 *   getUserAgent() prepends additionalOptions.userAgent when set.
 *
 * The additionalOptions object is readable at:
 *   (fireblocksApiClient as any).axiosManager.additionalOptions.userAgent
 *
 * The provider's own getUserAgent() builds:
 *   `${config.userAgent} fireblocks-web3-provider/<version>`   (with custom prefix)
 *   `fireblocks-web3-provider/<version>`                        (without custom prefix)
 */
describe("userAgent wired through to ts-sdk's additionalOptions", function () {
  const EXPECTED_PACKAGE_TOKEN = `fireblocks-web3-provider/${PKG_VERSION}`;

  function readUserAgentOption(
    provider: FireblocksWeb3Provider
  ): string | undefined {
    // axiosManager is a private field; access via any cast
    return (provider as any).fireblocksApiClient?.axiosManager
      ?.additionalOptions?.userAgent;
  }

  it("without config.userAgent: ts-sdk additionalOptions.userAgent equals the package token", function () {
    const provider = new FireblocksWeb3Provider({
      apiKey: "test-api-key",
      privateKey: DUMMY_PEM,
      chainId: ChainId.SEPOLIA,
      apiBaseUrl: ApiBaseUrl.Sandbox,
      // no userAgent
    } as any);

    const ua = readUserAgentOption(provider);

    expect(ua, "additionalOptions.userAgent must be set").to.exist;
    expect(ua).to.equal(
      EXPECTED_PACKAGE_TOKEN,
      `expected exact package token '${EXPECTED_PACKAGE_TOKEN}', got '${ua}'`
    );
  });

  it("with config.userAgent: ts-sdk additionalOptions.userAgent starts with the custom prefix and contains the package token", function () {
    const CUSTOM_PREFIX = "my-app/2.0";
    const provider = new FireblocksWeb3Provider({
      apiKey: "test-api-key",
      privateKey: DUMMY_PEM,
      chainId: ChainId.SEPOLIA,
      apiBaseUrl: ApiBaseUrl.Sandbox,
      userAgent: CUSTOM_PREFIX,
    } as any);

    const ua = readUserAgentOption(provider);

    // Exact composed string — guards both the prefix wiring AND the package-name+version composition.
    expect(ua).to.equal(`${CUSTOM_PREFIX} ${EXPECTED_PACKAGE_TOKEN}`);
  });
});
