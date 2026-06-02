import { expect } from "chai";
import * as ethers from "ethers";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId, RawMessageType } from "../../src/types";
import { TransactionStateEnum } from "@fireblocks/ts-sdk";
import { TransactionOperation } from "@fireblocks/ts-sdk";

const DUMMY_PEM =
  "-----BEGIN PRIVATE KEY-----\nTHIS_IS_A_TEST_DUMMY_NOT_A_REAL_KEY_FOR_CI_ONLY\n-----END PRIVATE KEY-----\n";

// Ephemeral random key for the round-trip test. We don't pin a value — the test
// asserts the recovered address matches whatever address this wallet has.
const KNOWN_WALLET = ethers.Wallet.createRandom();

function buildProvider() {
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

  // Map vault id 0 → the address of KNOWN_WALLET (used as the "signer" address)
  (provider as any).accounts = { 0: KNOWN_WALLET.address };
  return provider;
}

function mockClientWithSignature(signature: { r: string; s: string; v: number }) {
  return {
    transactions: {
      createTransaction: async () => ({ data: { id: "tx-1" } }),
      getTransaction: async () => ({
        data: {
          id: "tx-1",
          status: TransactionStateEnum.Completed,
          signedMessages: [{ signature }],
        },
      }),
    },
  } as any;
}

describe("createPersonalSign — signature v-byte handling", function () {
  this.timeout(5000);

  it("produces a 65-byte hex string for v=0 (canonical v=27)", async function () {
    const provider = buildProvider();
    const r = "aa".repeat(32);
    const s = "bb".repeat(32);
    const v = 0;
    (provider as any).fireblocksApiClient = mockClientWithSignature({ r, s, v });

    const sig: string = await (provider as any).createPersonalSign(
      KNOWN_WALLET.address,
      "0xdeadbeef",
      TransactionOperation.TypedMessage,
      RawMessageType.ETH_MESSAGE
    );

    expect(sig.startsWith("0x")).to.equal(true);
    // 0x + 64 hex (r) + 64 hex (s) + 2 hex (v) = 132 chars
    expect(sig.length).to.equal(132);
    // Trailing byte = v + 27 in hex (0 -> 0x1b)
    expect(sig.slice(-2)).to.equal((27 + v).toString(16));
    expect(sig.slice(2, 66)).to.equal(r);
    expect(sig.slice(66, 130)).to.equal(s);
  });

  it("produces a 65-byte hex string for v=1 (canonical v=28)", async function () {
    const provider = buildProvider();
    const r = "cc".repeat(32);
    const s = "dd".repeat(32);
    const v = 1;
    (provider as any).fireblocksApiClient = mockClientWithSignature({ r, s, v });

    const sig: string = await (provider as any).createPersonalSign(
      KNOWN_WALLET.address,
      "0xdeadbeef",
      TransactionOperation.TypedMessage,
      RawMessageType.ETH_MESSAGE
    );

    expect(sig.length).to.equal(132);
    expect(sig.slice(-2)).to.equal((27 + v).toString(16));
  });

  it("recovers to the signer address for a real ETH_MESSAGE signature (round-trip)", async function () {
    const provider = buildProvider();
    const message = "hello fireblocks";
    // Sign the message off-line with the known key to produce a real r/s/v
    const realSig = await KNOWN_WALLET.signMessage(message);
    const split = ethers.Signature.from(realSig);

    // Fireblocks returns v as 0 or 1 (parity), and the provider adds +27
    const fireblocksV = split.v - 27;

    (provider as any).fireblocksApiClient = mockClientWithSignature({
      r: split.r.slice(2),
      s: split.s.slice(2),
      v: fireblocksV,
    });

    // Drive through createPersonalSign with the raw message bytes (provider strips 0x prefix)
    const messageHex =
      "0x" + Buffer.from(message, "utf8").toString("hex");
    const sig: string = await (provider as any).createPersonalSign(
      KNOWN_WALLET.address,
      messageHex,
      TransactionOperation.TypedMessage,
      RawMessageType.ETH_MESSAGE
    );

    const recovered = ethers.verifyMessage(message, sig);
    expect(recovered.toLowerCase()).to.equal(KNOWN_WALLET.address.toLowerCase());
  });
});
