import { BN } from "bn.js";
// import { TimeContract } from "../bindings/time";

import BigNumber from "bignumber.js";

import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as chaiBigNumber from "chai-bignumber";

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

export async function getFee(txP: Promise<{ receipt: any, tx: string; logs: any }>) {
    const tx = await txP;
    const gasAmount = new BN(tx.receipt.gasUsed);
    const gasPrice = new BN((await web3.eth.getTransaction(tx.tx)).gasPrice);
    return gasPrice.mul(gasAmount);
}