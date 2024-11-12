import { expect } from "chai"
import * as ethers from "ethers"
import { getEthersFireblocksProviderForTesting } from "../utils"

const provider = getEthersFireblocksProviderForTesting({
  assetId: "ETH_TEST6",
  rpcUrl: "https://ethereum-holesky-rpc.publicnode.com",
  chainId: undefined,
})

describe("Ethers: Should be able to sign using Fireblocks (with assetId configured)", function () {
  this.timeout(60_000)

  it("signMessage", async function () {
    const signer = await provider.getSigner();
    const message = "hello world"

    const signature = await signer.signMessage(message)

    const expectedSignerAddress = await signer.getAddress();
    const recoveredAddress = ethers.verifyMessage(message, signature);

    expect(recoveredAddress).to.be.equals(expectedSignerAddress)
  })

  it("getChainId", async function () {
    const signer = await provider.getSigner();

    const chainId = Number(await signer.provider.getNetwork().then(n => n.chainId))

    expect(chainId).to.be.equals(17000)
  })
})
