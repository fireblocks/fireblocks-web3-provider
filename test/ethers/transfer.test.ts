import { expect } from "chai"
import * as ethers from "ethers"
import { getEthersFireblocksProviderForTesting } from "../utils"

const transferAmount = ethers.parseEther("0.00000000001")
const minAmount = ethers.parseEther("0.001")
const provider = getEthersFireblocksProviderForTesting()

async function getFirstAddressWithBalance() {
  const addresses = (await provider.listAccounts()).map(x => x.address.toLowerCase())
  for (const address of addresses) {
    const balance = await provider.getBalance(address)
    if (balance > minAmount) {
      return address
    }
  }

  throw new Error(`No vault has balance greater than ${transferAmount.toString()}`)
}

describe("Ethers: Should be able to transfer ETH", function () {
  this.timeout(600_000)

  it("Transfer", async function () {
    const addresses = (await provider.listAccounts()).map(x => x.address.toLowerCase())
    const firstAddressWithBalance = await getFirstAddressWithBalance()
    const toAddress = addresses.find(x => x != firstAddressWithBalance)

    if (!toAddress) {
      throw new Error('No toAddress found')
    }

    const fromSigner = await provider.getSigner(firstAddressWithBalance)
    const toAddressStartingBalance = await provider.getBalance(toAddress)

    const transferTransaction = await fromSigner.sendTransaction({
      to: toAddress,
      value: transferAmount,
    })
    await transferTransaction.wait()

    const toAddressEndingBalance = await provider.getBalance(toAddress)

    expect(toAddressEndingBalance == (toAddressStartingBalance - transferAmount))
  })
})
