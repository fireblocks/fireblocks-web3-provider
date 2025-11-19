import { expect } from "chai";
import { normalizeAddress } from "../../dist/src/utils";

describe("Address Normalization", function () {
  describe("XDC Address Formatting", function () {
    it("should convert xdc prefix to 0x when assetId is XDC", function () {
      const address = "xdc0197504f6fA1E89707D1A2bb4208bFDd799618aF";
      const result = normalizeAddress(address, "XDC");
      expect(result).to.equal("0x0197504f6fA1E89707D1A2bb4208bFDd799618aF");
    });

    it("should convert XDC prefix (uppercase) to 0x when assetId is XDC", function () {
      const address = "XDC0197504f6fA1E89707D1A2bb4208bFDd799618aF";
      const result = normalizeAddress(address, "XDC");
      expect(result).to.equal("0x0197504f6fA1E89707D1A2bb4208bFDd799618aF");
    });

    it("should not change xdc address when assetId is not XDC", function () {
      const address = "xdc0197504f6fA1E89707D1A2bb4208bFDd799618aF";
      const result = normalizeAddress(address, "ETH");
      expect(result).to.equal("xdc0197504f6fA1E89707D1A2bb4208bFDd799618aF");
    });

    it("should not change xdc address when assetId is undefined", function () {
      const address = "xdc0197504f6fA1E89707D1A2bb4208bFDd799618aF";
      const result = normalizeAddress(address, undefined);
      expect(result).to.equal("xdc0197504f6fA1E89707D1A2bb4208bFDd799618aF");
    });

    it("should not change ETH addresses", function () {
      const address = "0x0197504f6fA1E89707D1A2bb4208bFDd799618aF";
      const result = normalizeAddress(address, "ETH");
      expect(result).to.equal("0x0197504f6fA1E89707D1A2bb4208bFDd799618aF");
    });

    it("should not change addresses for other assets", function () {
      const address = "0x0197504f6fA1E89707D1A2bb4208bFDd799618aF";
      const result = normalizeAddress(address, "MATIC_POLYGON");
      expect(result).to.equal("0x0197504f6fA1E89707D1A2bb4208bFDd799618aF");
    });
  });
});
