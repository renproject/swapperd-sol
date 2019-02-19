import BN from "bn.js";
// import { TimeContract } from "../bindings/time";

import BigNumber from "bignumber.js";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiBigNumber from "chai-bignumber";
import { TransactionReceipt, EventLog } from "web3-core/types";

const Time = artifacts.require("Time");

chai.use(chaiAsPromised);
chai.use(chaiBigNumber(BigNumber));
chai.should();


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

interface TxOut { receipt: TransactionReceipt; tx: string; logs: EventLog[]; }
export async function getFee(txP: TxOut | Promise<TxOut>) {
    const tx = await txP;
    const gasAmount = new BN(tx.receipt.gasUsed);
    const gasPrice = new BN((await web3.eth.getTransaction(tx.tx)).gasPrice);
    return gasPrice.mul(gasAmount);
}