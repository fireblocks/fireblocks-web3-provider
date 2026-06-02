import { expect } from "chai";
import { HttpsProxyAgent } from "https-proxy-agent";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";

const DUMMY_PEM =
  "-----BEGIN PRIVATE KEY-----\nTHIS_IS_A_TEST_DUMMY_NOT_A_REAL_KEY_FOR_CI_ONLY\n-----END PRIVATE KEY-----\n";

/**
 * Regression guard: the migration from fireblocks-sdk (legacy) to @fireblocks/ts-sdk changed
 * how the httpsAgent is threaded into the HTTP client.
 *
 * Legacy (fireblocks-sdk):  positional 5th arg  { userAgent, httpsAgent }
 * New   (@fireblocks/ts-sdk): additionalOptions.baseOptions.httpsAgent
 *
 * Inside the Fireblocks client constructor (client.ts line ~135):
 *   this.config = new Configuration({ basePath, baseOptions: conf.additionalOptions?.baseOptions });
 *
 * So the agent should be readable at:
 *   (client as any).config.baseOptions.httpsAgent
 */
describe("httpsAgent wired through to ts-sdk's axios baseOptions", function () {
  it("stores the HttpsProxyAgent under config.baseOptions.httpsAgent when proxyPath is set", function () {
    const provider = new FireblocksWeb3Provider({
      apiKey: "test-api-key",
      privateKey: DUMMY_PEM,
      chainId: ChainId.SEPOLIA,
      apiBaseUrl: ApiBaseUrl.Sandbox,
      proxyPath: "http://proxy.example.com:8080",
    } as any);

    const client = (provider as any).fireblocksApiClient;

    // The Configuration object lives at client.config (private, accessed via any cast)
    const baseOptions = (client as any).config?.baseOptions;

    expect(baseOptions, "config.baseOptions must be set when proxyPath is provided").to.exist;
    expect(
      baseOptions.httpsAgent,
      "config.baseOptions.httpsAgent must be defined — if this fails the proxy agent is silently dropped"
    ).to.exist;
    expect(baseOptions.httpsAgent).to.be.an.instanceof(
      HttpsProxyAgent,
      "config.baseOptions.httpsAgent must be an HttpsProxyAgent instance"
    );
  });

  it("does NOT set config.baseOptions.httpsAgent when no proxyPath is provided", function () {
    const provider = new FireblocksWeb3Provider({
      apiKey: "test-api-key",
      privateKey: DUMMY_PEM,
      chainId: ChainId.SEPOLIA,
      apiBaseUrl: ApiBaseUrl.Sandbox,
      // no proxyPath
    } as any);

    const client = (provider as any).fireblocksApiClient;
    const baseOptions = (client as any).config?.baseOptions;

    // Either baseOptions is absent, or httpsAgent inside it is undefined/null
    const httpsAgent = baseOptions?.httpsAgent;
    expect(httpsAgent, "httpsAgent should be absent when no proxyPath is given").to.not.exist;
  });
});
