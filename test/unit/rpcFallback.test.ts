import { expect } from "chai";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";
import { formatJsonRpcRequest } from "../../src/jsonRpcUtils";
const HttpProvider = require("web3-providers-http");

const DUMMY_PEM =
  "-----BEGIN PRIVATE KEY-----\nTHIS_IS_A_TEST_DUMMY_NOT_A_REAL_KEY_FOR_CI_ONLY\n-----END PRIVATE KEY-----\n";

const PRIMARY = "https://polygon-bor-rpc.publicnode.com";
const FALLBACK = "https://polygon.drpc.org";

function buildProvider(
  extraConfig: Record<string, unknown> = {}
): FireblocksWeb3Provider {
  return new FireblocksWeb3Provider({
    apiKey: "test-api-key",
    privateKey: DUMMY_PEM,
    chainId: ChainId.POLYGON,
    apiBaseUrl: ApiBaseUrl.Sandbox,
    ...extraConfig,
  } as any);
}

const ok = { jsonrpc: "2.0", id: 1, result: "0x89" };

describe("RPC fallback", function () {
  const originalSend = HttpProvider.prototype.send;
  let calledHosts: string[];

  // Stubs the HTTP transport: responder decides the outcome per host
  function stubTransport(responder: (host: string) => { error?: Error; response?: any }) {
    HttpProvider.prototype.send = function (this: any, _payload: any, callback: (err: any, res?: any) => void) {
      calledHosts.push(this.host);
      const { error, response } = responder(this.host);
      setImmediate(() => callback(error ?? null, response));
    };
  }

  beforeEach(function () {
    calledHosts = [];
  });

  afterEach(function () {
    HttpProvider.prototype.send = originalSend;
  });

  it("falls back on a connection error and keeps using the fallback", async function () {
    stubTransport((host) =>
      host === PRIMARY ? { error: new Error("CONNECTION ERROR") } : { response: ok }
    );
    const provider = buildProvider();

    expect(await (provider as any).rpcSend(formatJsonRpcRequest("eth_chainId", []))).to.deep.equal(ok);
    expect(await (provider as any).rpcSend(formatJsonRpcRequest("eth_chainId", []))).to.deep.equal(ok);
    expect(calledHosts).to.deep.equal([PRIMARY, FALLBACK, FALLBACK]);
  });

  it("falls back when the endpoint returns a non-JSON-RPC error body", async function () {
    stubTransport((host) =>
      host === PRIMARY
        ? { response: { error: "API key disabled" } }
        : { response: ok }
    );
    const provider = buildProvider();

    expect(await (provider as any).rpcSend(formatJsonRpcRequest("eth_chainId", []))).to.deep.equal(ok);
    expect(calledHosts).to.deep.equal([PRIMARY, FALLBACK]);
  });

  it("falls back on a rate limit error", async function () {
    stubTransport((host) =>
      host === PRIMARY
        ? { response: { jsonrpc: "2.0", id: 1, error: { code: -32005, message: "limit exceeded" } } }
        : { response: ok }
    );
    const provider = buildProvider();

    expect(await (provider as any).rpcSend(formatJsonRpcRequest("eth_chainId", []))).to.deep.equal(ok);
    expect(calledHosts).to.deep.equal([PRIMARY, FALLBACK]);
  });

  it("does not fall back on a JSON-RPC error from the chain", async function () {
    const revert = { jsonrpc: "2.0", id: 1, error: { code: 3, message: "execution reverted" } };
    stubTransport(() => ({ response: revert }));
    const provider = buildProvider();

    expect(await (provider as any).rpcSend(formatJsonRpcRequest("eth_call", []))).to.deep.equal(revert);
    expect(calledHosts).to.deep.equal([PRIMARY]);
  });

  it("only uses the user-provided rpcUrl", async function () {
    const customUrl = "https://my-node.example.com";
    stubTransport(() => ({ error: new Error("CONNECTION ERROR") }));
    const provider = buildProvider({ rpcUrl: customUrl });

    try {
      await (provider as any).rpcSend(formatJsonRpcRequest("eth_chainId", []));
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.message).to.equal("CONNECTION ERROR");
    }
    expect(calledHosts).to.deep.equal([customUrl]);
  });

  it("throws the last error when all endpoints fail", async function () {
    stubTransport((host) => ({ error: new Error(`failed ${host}`) }));
    const provider = buildProvider();

    try {
      await (provider as any).rpcSend(formatJsonRpcRequest("eth_chainId", []));
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.message).to.equal(`failed ${FALLBACK}`);
    }
    expect(calledHosts).to.deep.equal([PRIMARY, FALLBACK]);
  });
});
