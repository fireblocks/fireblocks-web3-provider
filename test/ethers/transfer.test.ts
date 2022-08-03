import { expect } from "chai"
import * as ethers from "ethers"
import { getEthersFireblocksProviderForTesting } from "../utils"

const transferAmount = ethers.utils.parseEther("0.00000000001")
const minAmount = ethers.utils.parseEther("0.001")
const provider = getEthersFireblocksProviderForTesting()

async function getFirstAddressWithBalance() {
  const addresses = await provider.listAccounts()
  for (const address of addresses) {
    const balance = await provider.getBalance(address)
    if (balance.gt(minAmount)) {
      return address.toLowerCase()
    }
  }

  throw new Error(`No vault has balance greater than ${transferAmount.toString()}`)
}

describe("Ethers: Should be able to transfer ETH", function () {
  this.timeout(600_000)

  it("Transfer", async function () {
    const addresses = await provider.listAccounts()
    const firstAddressWithBalance = await getFirstAddressWithBalance()
    const toAddress = addresses.find(x => x.toLowerCase() != firstAddressWithBalance)

    if (!toAddress) {
      throw new Error('No toAddress found')
    }

    const fromSigner = provider.getSigner(firstAddressWithBalance)
    const toAddressStartingBalance = await provider.getBalance(toAddress)

    const transferTransaction = await fromSigner.sendTransaction({
      to: toAddress,
      value: transferAmount,
    })
    await transferTransaction.wait()

    const toAddressEndingBalance = await provider.getBalance(toAddress)

    expect(toAddressEndingBalance.eq(toAddressStartingBalance.sub(transferAmount)))
  })
})
