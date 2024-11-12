import { expect } from "chai"
import * as ethers from "ethers"
import { getEthersFireblocksProviderForTesting } from "../utils"
import GaslessTokenAbi from "../abi/GaslessToken.json";

if (process.env.FIREBLOCKS_GAS_TANK_VAULT_ID === undefined) {
  throw new Error("FIREBLOCKS_GAS_TANK_VAULT_ID environment variable must be set for gasless tests")
}

const gaslessTokenAddress = "0x4533728af60e915108f244fb884945c14fd13cca"
const mintAmount = ethers.parseEther("10")
const provider = getEthersFireblocksProviderForTesting({ gaslessGasTankVaultId: parseInt(process.env.FIREBLOCKS_GAS_TANK_VAULT_ID!) })

describe("Gasless: should be able to send a transaction using a gasless relay server", function () {
  this.timeout(600_000)

  it("Mint", async function () {
    const signer = await provider.getSigner()
    const signerAddress = await signer.getAddress()

    const GaslessToken = new ethers.Contract(gaslessTokenAddress, GaslessTokenAbi, signer)

    const startingBalance = await GaslessToken.balanceOf(signerAddress)

    const transferTransaction = await GaslessToken.mint(
      signerAddress,
      mintAmount,
    )
    await transferTransaction.wait()

    const endingBalance = await GaslessToken.balanceOf(signerAddress)

    expect(endingBalance.eq(startingBalance.add(mintAmount)))
  })
})
