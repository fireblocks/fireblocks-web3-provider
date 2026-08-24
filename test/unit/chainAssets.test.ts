import { expect } from "chai";
import { ChainId } from "../../src/types";
import { getAssetByChain } from "../../src/utils";

describe("ASSETS — ADI Chain mapping", function () {
  it("maps ADI Chain mainnet (chain id 36900) to ADI_CHAIN", function () {
    expect(ChainId.ADI_CHAIN).to.equal(36900);
    expect(getAssetByChain(36900)).to.deep.equal({
      assetId: "ADI_CHAIN",
      rpcUrl: "https://rpc.adifoundation.ai",
    });
  });

  it("maps ADI Network AB Testnet (chain id 99999) to ADI_CHAIN_TEST", function () {
    expect(ChainId.ADI_CHAIN_TEST).to.equal(99999);
    expect(getAssetByChain(99999)).to.deep.equal({
      assetId: "ADI_CHAIN_TEST",
      rpcUrl: "https://rpc.ab.testnet.adifoundation.ai",
    });
  });
});
