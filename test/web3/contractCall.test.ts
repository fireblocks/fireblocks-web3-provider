import { expect } from "chai"
import { getWeb3FireblocksProviderForTesting } from "../utils"

const GREETER_ADDRESS = "0x8A470A36a1BDE8B18949599a061892f6B2c4fFAb"
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
    ]
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
    "outputs": []
  }
]
const provider = getWeb3FireblocksProviderForTesting()
const greeting = (new Date()).toISOString()
// @ts-ignore
const greeterContract = new provider.eth.Contract(GREETER_ABI, GREETER_ADDRESS)

async function getFirstAddressWithBalance() {
  const addresses = await provider.eth.getAccounts()
  for (const address of addresses) {
    const balance = await provider.eth.getBalance(address)
    if (BigInt(balance) > BigInt(provider.utils.toWei('0.01', 'ether'))) {
      return address.toLowerCase()
    }
  }

  throw new Error(`No vault has balance`)
}

describe("Web3: Should be able to call a contract method", function () {
  this.timeout(60_000)

  it("greet() before", async function () {
    const currentGreeting = await greeterContract.methods.greet().call()

    expect(currentGreeting).to.not.be.equal(greeting)
  })

  it("setGreeting(greeting)", async function () {
    const receipt = await greeterContract.methods.setGreeting(greeting).send({ from: await getFirstAddressWithBalance() })

    expect(receipt.transactionHash).to.be.not.undefined
  })
  
  it("greet() after", async function () {
    const currentGreeting = await greeterContract.methods.greet().call()

    expect(currentGreeting).to.be.equal(greeting)
  })
})
