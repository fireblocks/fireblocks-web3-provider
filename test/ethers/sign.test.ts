import { expect } from "chai"
import * as ethers from "ethers"
import { getEthersFireblocksProviderForTesting } from "../utils"

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const provider = getEthersFireblocksProviderForTesting()

describe("Ethers: Should be able to sign using Fireblocks", function () {
  this.timeout(60_000)

  it("signMessage", async function () {
    const signer = await provider.getSigner();
    const message = "hello world"

    const signature = await signer.signMessage(message)

    const expectedSignerAddress = await signer.getAddress();
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    expect(recoveredAddress).to.be.equals(expectedSignerAddress)
  })

  it("_signTypedData", async function () {
    const signer = await provider.getSigner();

    const domain = {
      name: "FAKE Coin",
      version: "0",
      chainId: 0,
      verifyingContract: NULL_ADDRESS
    }
    const types = {
      Permit: [
        {
          name: "owner",
          type: "address"
        },
        {
          name: "spender",
          type: "address"
        },
        {
          name: "value",
          type: "uint256"
        },
        {
          name: "nonce",
          type: "uint256"
        },
        {
          name: "deadline",
          type: "uint256"
        }
      ]
    }
    const message = {
      owner: NULL_ADDRESS,
      spender: NULL_ADDRESS,
      value: 1,
      nonce: 1,
      deadline: 1
    }

    const signature = await signer._signTypedData(
      domain,
      types,
      message
    );

    const expectedSignerAddress = await signer.getAddress();
    const recoveredAddress = ethers.utils.verifyTypedData(domain, types, message, signature);

    expect(recoveredAddress).to.be.equals(expectedSignerAddress)
  })
})
