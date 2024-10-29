import { expect } from "chai"
import * as ethers from "ethers"
import { getEthersFireblocksProviderForTesting } from "../utils"

const minAmount = ethers.utils.parseEther("0.01")
const provider = getEthersFireblocksProviderForTesting()
const GREETER_ADDRESS = "0x432d810484add7454ddb3b5311f0ac2e95cecea8"
const GREETER_ABI = [
  {
    "type": "function",
    "name": "greet",
    "inputs": [],
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
  },
  {
    "type": "function",
    "name": "setGreeting",
    "inputs": [
      {
        "internalType": "string",
        "name": "_greeting",
        "type": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable",
  }
]
const greeting = (new Date()).toISOString()
let greeterContract = new ethers.Contract(GREETER_ADDRESS, GREETER_ABI, provider);

async function getFirstAddressWithBalance() {
  const addresses = await provider.listAccounts()
  for (const address of addresses) {
    const balance = await provider.getBalance(address)
    if (balance.gt(minAmount)) {
      return address.toLowerCase()
    }
  }

  throw new Error(`No vault has balance greater than ${minAmount.toString()}`)
}

describe("Ethers: Should be able to call a contract method", function () {
  this.timeout(600_000)

  it("greet() before", async function () {
    const currentGreeting = await greeterContract.greet()

    expect(currentGreeting).to.not.be.equal(greeting)
  })

  it("setGreeting(greeting)", async function () {
    const addresses = await provider.listAccounts()
    const firstAddressWithBalance = await getFirstAddressWithBalance()
    const tx = await greeterContract.connect(provider.getSigner(firstAddressWithBalance)).setGreeting(greeting)

    await tx.wait()

    expect(tx.hash).to.be.not.undefined
  })

  it("greet() after", async function () {
    const currentGreeting = await greeterContract.greet()

    expect(currentGreeting).to.be.equal(greeting)
  })
})
