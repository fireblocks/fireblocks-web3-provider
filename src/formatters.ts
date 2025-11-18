import { AddressFormatter, FormatterMetadata } from "./types";

/**
 * XDC addresses use 'xdc' prefix instead of '0x'
 * Convert xdc addresses to standard EVM format for compatibility with Ethers.js
 */
const XDC_FORMATTER: AddressFormatter = {
    predicate: (address: string, metadata: FormatterMetadata) =>
        metadata.assetId === "XDC" && address.toLowerCase().startsWith("xdc"),
    format: (address: string) => `0x${address.substring(3)}`,
};

export const ADDRESS_FORMATTERS: AddressFormatter[] = [
    XDC_FORMATTER,
];