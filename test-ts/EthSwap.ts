import BN from "bn.js";
import HEX from "crypto-js/enc-hex";

import { SHA256 } from "crypto-js";
import { randomID, second, getFee, secondsFromNow, sleep, Ox0 } from "./helper/testUtils";

import { EthSwapContract } from "./bindings/eth_swap";

const EthSwap = artifacts.require("EthSwap");

contract("EthSwap", function (accounts: string[]) {

    let swapperd: EthSwapContract;
    const alice = accounts[1];
    const bob = accounts[2];
    const broker = accounts[3];

    before(async function () {
        swapperd = await EthSwap.deployed();
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
            .should.be.rejectedWith(null, /((revert)|(swap opened previously))\.?$/);

        await swapperd.auditSecret(swapID)
            .should.be.rejectedWith(null, /((revert)|(swap not redeemed))\.?$/);

        await swapperd.refund(swapID, { from: alice })
            .should.be.rejectedWith(null, /((revert)|(swap not expirable))\.?$/);

        // Can only redeem for OPEN swaps and with valid key
        await swapperd.redeem(swapID, bob, secretLock, { from: bob })
            .should.be.rejectedWith(null, /((revert)|(invalid secret))\.?$/);

        await swapperd.redeem(swapID, bob, secret, { from: bob });
        await swapperd.redeem(swapID, bob, secret, { from: bob })
            .should.be.rejectedWith(null, /((revert)|(swap not open))\.?$/);
    });

    it("recipient checks in in redeem", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(2), 100000, { from: alice, value: 100000 });

        // Only Bob can redeem
        await swapperd.redeem(swapID, bob, secret, { from: alice })
            .should.be.rejectedWith(null, /((revert)|(unauthorized spender))\.?$/);

        // Recipient can't be 0x0
        await swapperd.redeem(swapID, Ox0, secret, { from: bob })
            .should.be.rejectedWith(null, /((revert)|(invalid receiver))\.?$/);

        await swapperd.redeem(swapID, alice, secret, { from: bob });
    });

    it("broker fee must be less than value", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        await swapperd.initiateWithFees(swapID, bob, broker, 201, secretLock, await secondsFromNow(2), 200, { from: alice, value: 200 })
            .should.be.rejectedWith(null, /((revert)|(fee must be less than value))\.?$/);
    });

    it("eth amount must match value", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

        await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(2), 100000, { from: alice, value: 99999 })
            .should.be.rejectedWith(null, /((revert)|(eth amount must match value))\.?$/);

        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice, value: 100001 })
            .should.be.rejectedWith(null, /((revert)|(eth amount must match value))\.?$/);
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

        await swapperd.withdrawBrokerFees(new BN(fees).add(new BN(1)), { from: broker })
            .should.be.rejectedWith(null, /((revert)|(insufficient withdrawable fees))\.?$/);

        const brokerInitial = new BN(await web3.eth.getBalance(broker));

        const tx = await swapperd.withdrawBrokerFees(fees, { from: broker });
        const brokerFinal = new BN(await web3.eth.getBalance(broker));
        const txFees = await getFee(tx)
        brokerFinal.sub(brokerInitial).add(txFees).should.bignumber.equal(fees);
    });
});