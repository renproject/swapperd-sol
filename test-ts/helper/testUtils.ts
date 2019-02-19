import BN from "bn.js";
// import { TimeContract } from "../bindings/time";

import BigNumber from "bignumber.js";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiBigNumber from "chai-bignumber";
import { TransactionReceipt, EventLog } from "web3-core/types";
import { ERC20DetailedContract } from "../bindings/erc20_detailed";
import { TimeContract } from "../bindings/time";

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

export const secondsFromNow = async (seconds: number): Promise<BN> => {
    const time = await Time.deployed();
    await time.newBlock();
    const currentTime = new BN(await time.currentTime());
    return currentTime.add(new BN(seconds));
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const second = 1000;

export const increaseTime = async (seconds: number) => {
    await new Promise((resolve, reject) => {
        web3.currentProvider.send(
            { jsonrpc: "2.0", method: "evm_increaseTime", params: [seconds], id: 0 },
            (err: any, value: any) => {
                if (err) {
                    reject(err);
                }
                resolve(value);
            }
        );
    });
};

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

export const subFees = (value: BN | number | string, fee: number): BN => {
    value = new BN(value);
    return value.sub((value.mul(new BN(fee))).div(new BN(1000)));
};