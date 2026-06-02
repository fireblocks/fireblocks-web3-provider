import { expect } from "chai";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";

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

// Helper to call the private method directly
function callCreateFireblocksError(
  provider: FireblocksWeb3Provider,
  axiosLikeError: any
) {
  return (provider as any).createFireblocksError(axiosLikeError);
}

// ──────────────────────────────────────────────────────────────────────────────
// Group 2 — createFireblocksError envelope-parsing variants
// ──────────────────────────────────────────────────────────────────────────────

describe("createFireblocksError — direct unit tests", function () {
  let provider: FireblocksWeb3Provider;

  before(function () {
    provider = buildProvider();
  });

  it("maps HTTP 401 response to provider error code 4100", function () {
    const axiosError: any = new Error("Unauthorized");
    axiosError.response = {
      status: 401,
      data: { message: "Unauthorized" },
      headers: {},
    };

    const err = callCreateFireblocksError(provider, axiosError);

    expect(err.code).to.equal(4100);
  });

  it("non-401 errors fall back to code -32603 (EIP-1193 internal error)", function () {
    const axiosError: any = new Error("Internal Server Error");
    axiosError.response = {
      status: 503,
      data: { message: "Service Unavailable" },
      headers: {},
    };

    const err = callCreateFireblocksError(provider, axiosError);

    expect(err.code).to.equal(-32603);
  });

  it("appends (Error code: N) when response.data.code is present", function () {
    const axiosError: any = new Error("bad request");
    axiosError.response = {
      status: 400,
      data: { message: "bad request", code: -15 },
      headers: {},
    };

    const err = callCreateFireblocksError(provider, axiosError);

    expect(err.message).to.include(String(axiosError.response.data.code));
  });

  it("appends (Request ID: ...) when x-request-id header is present", function () {
    const axiosError: any = new Error("not found");
    axiosError.response = {
      status: 404,
      data: { message: "not found" },
      headers: { "x-request-id": "req-abc-123" },
    };

    const err = callCreateFireblocksError(provider, axiosError);

    expect(err.message).to.include(axiosError.response.headers["x-request-id"]);
  });

  it("uses error.message when response.data.message is absent", function () {
    const axiosError: any = new Error("plain JS error, no response");

    const err = callCreateFireblocksError(provider, axiosError);

    expect(err.message).to.include(axiosError.message);
  });

  it("combines Error code and Request ID in the same message when both present", function () {
    const axiosError: any = new Error("full error");
    axiosError.response = {
      status: 400,
      data: { message: "full error", code: 42 },
      headers: { "x-request-id": "rid-xyz" },
    };

    const err = callCreateFireblocksError(provider, axiosError);

    expect(err.message).to.include(String(axiosError.response.data.code));
    expect(err.message).to.include(axiosError.response.headers["x-request-id"]);
  });
});
