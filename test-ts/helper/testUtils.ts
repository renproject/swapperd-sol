import BN from "bn.js";
// import { TimeContract } from "../bindings/time";

import BigNumber from "bignumber.js";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiBigNumber from "chai-bignumber";
import { TransactionReceipt, EventLog } from "web3-core/types";
import { ERC20DetailedContract } from "../bindings/erc20_detailed";

const Time = artifacts.require("Time");

chai.use(chaiAsPromised);
chai.use(chaiBigNumber(BigNumber));
chai.should();

export const NULL = "0x0000000000000000000000000000000000000000";
export const Ox0 = NULL;

var seed = 1;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

export const randomID = () => {
    return web3.utils.sha3(random().toString());
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const second = 1000;

export const secondsFromNow = async (seconds: number): Promise<BN> => {
    const time = await Time.new();
    await time.newBlock();
    const currentTime = new BN(await time.currentTime());
    return currentTime.add(new BN(seconds));
};

// class Value {
//     public value: BN;
//     public unit: string;

//     constructor(value: BN | string | number, unit: string) {
//         this.value = new BN(value);
//         this.unit = unit;
//     }

//     public sub(other: Value) {
//         if (other.unit === this.unit) {
//             return new Value(this.value.sub(other.value), other.unit);
//         }

//         return new Value(this.value, this.unit);
//     }

//     public add(other: Value) {
//         if (other.unit === this.unit) {
//             return new Value(this.value.add(other.value), other.unit);
//         }

//         return new Value(this.value, this.unit);
//     }
// }

export const ETH = {
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: async () => 18,
    approve: async (_to: string, _value: BN | string | number): Promise<void> => null,
    transfer: async (_to: string, _value: BN | string | number): Promise<void> => null,
    balanceOf: async (address: string): Promise<BN | string | number> => web3.eth.getBalance(address),
} as any as ERC20DetailedContract;

interface TxOut { receipt: TransactionReceipt; tx: string; logs: EventLog[]; }
export async function getFee(txP: TxOut | Promise<TxOut>): Promise<BN> {
    const tx = await txP;
    const gasAmount = new BN(tx.receipt.gasUsed);
    const gasPrice = new BN((await web3.eth.getTransaction(tx.tx)).gasPrice);
    return gasPrice.mul(gasAmount);
}