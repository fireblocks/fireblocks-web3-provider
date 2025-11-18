import { ASSETS } from "./constants";
import { ADDRESS_FORMATTERS } from "./formatters";
import { ChainId, Asset, FormatterMetadata } from "./types";

export function getAssetByChain(chain: ChainId): Asset {
    return ASSETS[chain]
}

export function promiseToFunction(func: () => Promise<any>): () => Promise<void> {
    let exceptionThrown = false

    const promise = func().catch((e) => {
        exceptionThrown = true
        return e
    });

    return async () => {
        const result = await promise
        if (exceptionThrown)
            throw result
    };
}

export function normalizeAddress(address: string, assetId?: string): string {
    const metadata: FormatterMetadata = { assetId };
    
    for (const formatter of ADDRESS_FORMATTERS) {
        if (formatter.predicate(address, metadata)) {
            return formatter.format(address);
        }
    }
    
    return address;
}
