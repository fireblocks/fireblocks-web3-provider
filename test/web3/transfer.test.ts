import { expect } from "chai"
import * as ethers from "ethers"
import { getWeb3FireblocksProviderForTesting } from "../utils"

const transferAmount = ethers.utils.parseEther("0.00000000001").toString()
const minAmount = ethers.utils.parseEther("0.001").toString()
const web3 = getWeb3FireblocksProviderForTesting()

async function getFirstAddressWithBalance() {
  const addresses = await web3.eth.getAccounts()
  for (const address of addresses) {
    const balance = await web3.eth.getBalance(address)
    if (BigInt(balance) > BigInt(minAmount)) {
      return address.toLowerCase()
    }
  }

  throw new Error(`No vault has balance greater than ${transferAmount.toString()}`)
}

describe("Web3: Should be able to transfer ETH", function () {
  this.timeout(600_000)

  it("Transfer", async function () {
    const addresses = await web3.eth.getAccounts()
    const fromAddress = await getFirstAddressWithBalance()
    const toAddress = addresses.find(x => x.toLowerCase() != fromAddress)

    if (!toAddress) {
      throw new Error('No toAddress found')
    }

    const toAddressStartingBalance = await web3.eth.getBalance(toAddress)

    await web3.eth.sendTransaction({
      from: fromAddress,
      to: toAddress,
      value: transferAmount,
      gas: 21000,
    })

    const toAddressEndingBalance = await web3.eth.getBalance(toAddress)

    expect(BigInt(toAddressEndingBalance) == (BigInt(toAddressStartingBalance) - BigInt(transferAmount)))
  })
})
