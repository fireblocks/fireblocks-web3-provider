import { expect } from "chai";
import { FireblocksWeb3Provider } from "../../src/provider";
import { ApiBaseUrl, ChainId } from "../../src/types";
import { TransactionStateEnum } from "@fireblocks/ts-sdk";

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
  // Skip async initialization in tests
  (provider as any).accountsPopulatedPromise = async () => {};
  (provider as any).assetAndChainIdPopulatedPromise = async () => {};
  (provider as any).whitelistedPopulatedPromise = async () => {};
  (provider as any).gaslessGasTankAddressPopulatedPromise = async () => {};
  return provider;
}

function mockClient(opts: {
  createId?: string;
  getTransactionSequence?: Array<{
    status: string;
    subStatus?: string;
    id?: string;
    signedMessages?: any[];
  }>;
  getTransactionErrors?: Error[];
}) {
  let getCallIndex = 0;
  const errors = opts.getTransactionErrors ?? [];
  const sequence = opts.getTransactionSequence ?? [];
  return {
    transactions: {
      createTransaction: async () => ({
        data: { id: opts.createId ?? "tx-1" },
      }),
      getTransaction: async () => {
        if (getCallIndex < errors.length) {
          throw errors[getCallIndex++];
        }
        const relativeIndex = getCallIndex - errors.length;
        getCallIndex++;
        const item = sequence[Math.min(relativeIndex, sequence.length - 1)];
        return { data: { id: opts.createId ?? "tx-1", ...item } };
      },
    },
  } as any;
}

describe("createTransaction polling loop", function () {
  this.timeout(5000);

  describe("terminal status handling", function () {
    it("resolves immediately when first poll returns COMPLETED", async function () {
      const provider = buildProvider();
      (provider as any).fireblocksApiClient = mockClient({
        getTransactionSequence: [{ status: TransactionStateEnum.Completed }],
      });

      const result = await (provider as any).createTransaction({});
      expect(result.status).to.equal(TransactionStateEnum.Completed);
    });

    // Both BROADCASTING and CONFIRMING are treated as final-successful — same branch.
    for (const status of [
      TransactionStateEnum.Broadcasting,
      TransactionStateEnum.Confirming,
    ]) {
      it(`resolves on ${status} (treated as final successful)`, async function () {
        const provider = buildProvider();
        (provider as any).fireblocksApiClient = mockClient({
          getTransactionSequence: [{ status }],
        });

        const result = await (provider as any).createTransaction({});
        expect(result.status).to.equal(status);
      });
    }

    it("polls through non-terminal statuses before reaching a terminal one", async function () {
      const provider = buildProvider();
      let pollCount = 0;
      (provider as any).fireblocksApiClient = {
        transactions: {
          createTransaction: async () => ({ data: { id: "tx-1" } }),
          getTransaction: async () => {
            pollCount++;
            const status =
              pollCount < 3
                ? "PENDING_SIGNATURE"
                : TransactionStateEnum.Completed;
            return { data: { id: "tx-1", status } };
          },
        },
      };

      const result = await (provider as any).createTransaction({});
      expect(result.status).to.equal(TransactionStateEnum.Completed);
      expect(pollCount).to.equal(3);
    });

    for (const terminal of [
      TransactionStateEnum.Failed,
      TransactionStateEnum.Cancelled,
      TransactionStateEnum.Blocked,
      TransactionStateEnum.Rejected,
    ]) {
      it(`throws on terminal failure status ${terminal}`, async function () {
        const provider = buildProvider();
        const subStatus = "INSUFFICIENT_FUNDS";
        (provider as any).fireblocksApiClient = mockClient({
          getTransactionSequence: [{ status: terminal, subStatus }],
        });

        try {
          await (provider as any).createTransaction({});
          expect.fail(`should have thrown for terminal status ${terminal}`);
        } catch (err: any) {
          expect(err.message).to.include(terminal);
          expect(err.message).to.include(subStatus);
        }
      });
    }
  });

  describe("consecutive-error bailout", function () {
    it("bails out after 5 consecutive getTransaction errors", async function () {
      const provider = buildProvider();
      const apiError: any = new Error("network down");
      apiError.response = {
        status: 503,
        data: { message: "Service Unavailable" },
      };
      (provider as any).fireblocksApiClient = mockClient({
        getTransactionErrors: Array(10).fill(apiError),
      });

      try {
        await (provider as any).createTransaction({});
        expect.fail("should have thrown after 5 consecutive errors");
      } catch (err: any) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.include(apiError.response.data.message);
      }
    });

    it("resets error counter on a successful poll", async function () {
      const provider = buildProvider();
      const apiError: any = new Error("transient");
      apiError.response = { status: 500, data: { message: "Transient" } };
      // 4 errors, then success, then 4 errors → must NOT bail (counter resets after success)
      const client = {
        transactions: {
          createTransaction: async () => ({ data: { id: "tx-1" } }),
          getTransaction: (() => {
            let i = 0;
            const seq: Array<"err" | "pending" | "completed"> = [
              "err",
              "err",
              "err",
              "err",
              "pending",
              "err",
              "err",
              "err",
              "err",
              "completed",
            ];
            return async () => {
              const step = seq[Math.min(i, seq.length - 1)];
              i++;
              if (step === "err") throw apiError;
              if (step === "pending")
                return { data: { id: "tx-1", status: "PENDING_SIGNATURE" } };
              return {
                data: { id: "tx-1", status: TransactionStateEnum.Completed },
              };
            };
          })(),
        },
      } as any;
      (provider as any).fireblocksApiClient = client;

      const result = await (provider as any).createTransaction({});
      expect(result.status).to.equal(TransactionStateEnum.Completed);
    });
  });
});
