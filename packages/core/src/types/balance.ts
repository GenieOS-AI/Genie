import { NetworkName } from "../network";
import { TokenInfo } from "./token";

export type TokenBalanceInfo = {
    address: string;
    network: NetworkName;
    amount: string;
    token?: TokenInfo;
    usdValue?: number;
}