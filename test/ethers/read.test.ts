import { expect } from "chai"
import { getEthersFireblocksProviderForTesting } from "../utils"

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const provider = getEthersFireblocksProviderForTesting()

describe("Ethers: Should be able to read data from Ethereum", function () {
  this.timeout(60_000)
  
  it("getBalance", async function () {
    const nullAddressBalance = await provider.getBalance(NULL_ADDRESS)

    expect(nullAddressBalance.gt(99999999999999))
  })
  it("getBlockNumber", async function () {
    const blockNumber = await provider.getBlockNumber()

    expect(blockNumber).to.be.greaterThan(10_000)
  })
})
