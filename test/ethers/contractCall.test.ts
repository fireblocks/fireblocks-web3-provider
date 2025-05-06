import { expect } from "chai"
import * as ethers from "ethers"
import { getEthersFireblocksProviderForTesting } from "../utils"

const minAmount = ethers.parseEther("0.01")
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

async function getFirstSignerWithBalance() {
  const signers = (await provider.listAccounts())
  for (const signer of signers) {
    const balance = await provider.getBalance(signer.address)
    if (balance > minAmount) {
      return signer
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
    this.retries(3);

    const firstSignerWithBalance = await getFirstSignerWithBalance()
    greeterContract = new ethers.Contract(GREETER_ADDRESS, GREETER_ABI, firstSignerWithBalance);
    const tx = await greeterContract.setGreeting(greeting)

    await tx.wait()

    expect(tx.hash).to.be.not.undefined
  })

  it("greet() after", async function () {
    const currentGreeting = await greeterContract.greet()

    expect(currentGreeting).to.be.equal(greeting)
  })
})
