import * as HEX from "crypto-js/enc-hex";

import { SHA256 } from "crypto-js";

import { randomID, second, getFee, secondsFromNow, sleep } from "./helper/testUtils";
import { BN } from "bn.js";
import { format } from "path";

// import { EthSwapContract } from "./bindings/swapperd_eth";

const EthSwapContract = artifacts.require("EthSwapContract");

contract("EthSwapContract", function (accounts: string[]) {

    let swapperd: any;
    const alice = accounts[1];
    const bob = accounts[2];
    const broker = accounts[3];

    before(async function () {
        swapperd = await EthSwapContract.deployed();
    });

    it("can perform atomic swap", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        const timeLock = await secondsFromNow(60 * 60 * 24)

        const aliceInitial = new BN(await web3.eth.getBalance(alice));
        const initiateTx = await swapperd.initiate(
            swapID, bob, secretLock, timeLock, 100000, { from: alice, value: 100000 }
        );
        const aliceFinal = new BN(await web3.eth.getBalance(alice));
        const initiateTxFee = await getFee(initiateTx)
        aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(100000);

        const swapAudit = await swapperd.audit(swapID);
        swapAudit[0].should.bignumber.equal(timeLock);
        swapAudit[1].should.bignumber.equal(100000);
        swapAudit[2].should.equal(bob);
        swapAudit[3].should.bignumber.equal(0);
        swapAudit[4].should.equal('0x0000000000000000000000000000000000000000');
        swapAudit[5].should.equal(alice);
        swapAudit[6].should.equal(secretLock);

        const bobInitial = new BN(await web3.eth.getBalance(bob));
        const redeemTx = await swapperd.redeem(swapID, bob, secret, { from: bob });
        const bobFinal = new BN(await web3.eth.getBalance(bob));
        const redeemTxFee = await getFee(redeemTx)
        bobFinal.sub(bobInitial).add(redeemTxFee).should.bignumber.equal(100000);

        await swapperd.auditSecret(swapID);
    });

    it("can perform atomic swap with fees", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        const timeLock = await secondsFromNow(60 * 60 * 24)

        const aliceInitial = new BN(await web3.eth.getBalance(alice));
        const initiateTx = await swapperd.initiateWithFees(
            swapID, bob, broker, 200, secretLock, timeLock, 100000, { from: alice, value: 100000 }
        );
        const aliceFinal = new BN(await web3.eth.getBalance(alice));
        const initiateTxFee = await getFee(initiateTx)
        aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(100000);

        const swapAudit = await swapperd.audit(swapID);
        swapAudit[0].should.bignumber.equal(timeLock);
        swapAudit[1].should.bignumber.equal(99800);
        swapAudit[2].should.equal(bob);
        swapAudit[3].should.bignumber.equal(200);
        swapAudit[4].should.equal(broker);
        swapAudit[5].should.equal(alice);
        swapAudit[6].should.equal(secretLock);

        const bobInitial = new BN(await web3.eth.getBalance(bob));
        const redeemTx = await swapperd.redeem(swapID, bob, secret, { from: bob });
        const bobFinal = new BN(await web3.eth.getBalance(bob));
        const redeemTxFee = await getFee(redeemTx)
        bobFinal.sub(bobInitial).add(redeemTxFee).should.bignumber.equal(99800);

        await swapperd.auditSecret(swapID);
    });

    it("can refund an atomic swap", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        const timeLock = await secondsFromNow(0);

        const aliceInitial = new BN(await web3.eth.getBalance(alice));
        const initiateTx = await swapperd.initiate(
            swapID, bob, secretLock, timeLock, 100000, { from: alice, value: 100000 }
        );
        const aliceFinal = new BN(await web3.eth.getBalance(alice));
        const initiateTxFee = await getFee(initiateTx)
        aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(100000);

        const refundTx = await swapperd.refund(swapID, { from: alice });
        const aliceRefunded = new BN(await web3.eth.getBalance(alice));
        const refundTxFee = await getFee(refundTx)
        aliceRefunded.sub(aliceFinal).add(refundTxFee).should.bignumber.equal(100000);
    });

    it("can refund an atomic swap with fees", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        const timeLock = await secondsFromNow(0);

        const aliceInitial = new BN(await web3.eth.getBalance(alice));
        const initiateTx = await swapperd.initiateWithFees(
            swapID, bob, broker, 200, secretLock, timeLock, 100000, { from: alice, value: 100000 }
        );
        const aliceFinal = new BN(await web3.eth.getBalance(alice));
        const initiateTxFee = await getFee(initiateTx)
        aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(100000);

        const refundTx = await swapperd.refund(swapID, { from: alice });
        const aliceRefunded = new BN(await web3.eth.getBalance(alice));
        const refundTxFee = await getFee(refundTx)
        aliceRefunded.sub(aliceFinal).add(refundTxFee).should.bignumber.equal(100000);
    });

    it("operations check order status", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

        // Can only initiateWithFees for INVALID swaps
        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice, value: 100000 });
        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice, value: 100000 })
            .should.be.rejectedWith(null, /revert/);
        // .should.be.rejectedWith(null, /swap opened previously/);

        await swapperd.auditSecret(swapID)
            .should.be.rejectedWith(null, /revert/);

        await swapperd.refund(swapID, { from: alice })
            .should.be.rejectedWith(null, /revert/);
        // .should.be.rejectedWith(null, /swap not expirable/);

        // Can only redeem for OPEN swaps and with valid key
        await swapperd.redeem(swapID, bob, secretLock, { from: bob })
            .should.be.rejectedWith(null, /revert/);
        // .should.be.rejectedWith(null, /invalid secret/);
        await swapperd.redeem(swapID, bob, secret, { from: bob });
        await swapperd.redeem(swapID, bob, secret, { from: bob })
            .should.be.rejectedWith(null, /revert/);
        // .should.be.rejectedWith(null, /swap not open/);
    });

    it("can return details", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

        // Before initiating
        (await swapperd.initiatable(swapID)).should.be.true;
        (await swapperd.refundable(swapID)).should.be.false;
        (await swapperd.redeemable(swapID)).should.be.false;

        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice, value: 100000 });

        (await swapperd.initiatable(swapID)).should.be.false;
        (await swapperd.refundable(swapID)).should.be.false;
        (await swapperd.redeemable(swapID)).should.be.true;

        await sleep(3 * second);

        (await swapperd.initiatable(swapID)).should.be.false;
        (await swapperd.refundable(swapID)).should.be.true;
        (await swapperd.redeemable(swapID)).should.be.true;

        await swapperd.redeem(swapID, bob, secret, { from: bob });

        (await swapperd.initiatable(swapID)).should.be.false;
        (await swapperd.refundable(swapID)).should.be.false;
        (await swapperd.redeemable(swapID)).should.be.false;
    });

    it("can calculate swap ID", async () => {
        const secretLock = randomID();
        const timeLock = await secondsFromNow(0);
        const swapID = web3.utils.soliditySha3(secretLock, timeLock);

        (await swapperd.swapID(secretLock, timeLock))
            .should.equal(swapID);
    });

    it("can withdraw broker fees", async () => {
        const fees = await swapperd.brokerFees(broker);
        const brokerInitial = new BN(await web3.eth.getBalance(broker));
        const tx = await swapperd.withdrawBrokerFees(fees, { from: broker });
        const brokerFinal = new BN(await web3.eth.getBalance(broker));
        const txFees = await getFee(tx)
        brokerFinal.sub(brokerInitial).add(txFees).should.bignumber.equal(fees);
    });
});