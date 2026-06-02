import { expect } from "chai";
import * as ethers from "ethers";
import { getFireblocksProviderForTesting } from "../utils";

/**
 * Integration test: exercises `populateWhitelisted()` which was rewritten in the
 * FA-7921 migration.
 *
 * Legacy (@fireblocks/fireblocks-sdk):
 *   getExternalWallets() / getInternalWallets() / getContractWallets()  — returned bare arrays
 *
 * New   (@fireblocks/ts-sdk):
 *   externalWallets.getExternalWallets().then(r => r.data)
 *   internalWallets.getInternalWallets().then(r => r.data)
 *   contracts.getContracts().then(r => r.data)      ← also renamed from getContractWallets
 *
 * If the `.data` unwrapping or the method rename is ever silently reverted, this
 * test will surface the breakage before it hits customers.
 *
 * Requires env vars: FIREBLOCKS_API_PRIVATE_KEY_PATH, FIREBLOCKS_API_KEY.
 * When they are absent, `before()` throws (same fail-loud pattern as all other IT files).
 */
describe("Ethers: populateWhitelisted via ts-sdk (oneTimeAddressesEnabled: false)", function () {
  this.timeout(120_000);

  let rawProvider: ReturnType<typeof getFireblocksProviderForTesting>;
  let ethersProvider: ethers.BrowserProvider;

  before(function () {
    // getFireblocksProviderForTesting() throws when creds are absent — that is
    // the established IT pattern; we don't suppress it here so the CI log is clear.
    rawProvider = getFireblocksProviderForTesting({
      oneTimeAddressesEnabled: false,
    });
    ethersProvider = new ethers.BrowserProvider(rawProvider);
  });

  it("populateWhitelisted resolves without error and provider returns accounts", async function () {
    // eth_accounts triggers initialized() → populateWhitelisted() (because
    // oneTimeAddressesEnabled is false) which calls the three ts-sdk endpoints.
    const accounts = await ethersProvider.listAccounts();
    expect(accounts).to.be.an("array");
    expect(accounts.length).to.be.greaterThan(
      0,
      "expected at least one vault account"
    );
  });

  it("whitelisted map exists and has correct shape after populateWhitelisted", async function () {
    // Trigger initialization if not yet done.
    await ethersProvider.listAccounts();

    // The whitelisted field is always an object (never undefined) — guards against
    // the field being dropped in a future refactor.
    const whitelisted: Record<string, { type: string; id: string }> = (
      rawProvider as any
    ).whitelisted;

    expect(
      whitelisted,
      "whitelisted must be an object after initialization"
    ).to.be.an("object");

    // If there ARE any whitelisted entries, every entry must have a non-empty
    // type and id — guards against shape regressions in the UnmanagedWallet mapping.
    for (const [address, entry] of Object.entries(whitelisted)) {
      expect(entry, `entry for ${address} must be an object`).to.be.an(
        "object"
      );
      expect(entry.type, `entry for ${address} must have a type`)
        .to.be.a("string")
        .and.not.equal("");
      expect(entry.id, `entry for ${address} must have an id`)
        .to.be.a("string")
        .and.not.equal("");
    }
  });

  it("eth_sendTransaction to a whitelisted destination completes without routing error", async function () {
    await ethersProvider.listAccounts();

    const whitelisted: Record<string, { type: string; id: string }> =
      (rawProvider as any).whitelisted ?? {};

    const accounts = await ethersProvider.listAccounts();
    const fromAddress = accounts[0]?.address?.toLowerCase();

    // Find a whitelisted address that is NOT the sender (we need an external destination)
    const destination = Object.keys(whitelisted).find(
      (addr) => addr.toLowerCase() !== fromAddress
    );

    if (!destination) {
      // Workspace has no whitelisted destinations other than vault accounts.
      // Skip rather than fail — this is a valid workspace configuration.
      this.skip();
    }

    const signer = await ethersProvider.getSigner(fromAddress);

    // Tiny value to avoid draining test wallets.
    const tx = await signer.sendTransaction({
      to: destination,
      value: BigInt(1),
    });

    // Wait for the transaction to land on-chain. status === 1 means success;
    // 0 would indicate a revert, which `.to.exist` would not catch.
    const receipt = await tx.wait();
    expect(receipt).to.exist;
    expect(receipt!.status).to.equal(1);
  });
});
