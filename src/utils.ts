import { ASSETS } from "./constants";
import { ChainId, Asset } from "./types";

export function getAssetByChain(chain: ChainId): Asset {
    return ASSETS[chain]
}
