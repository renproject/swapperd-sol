
import BN from "bn.js";
import HEX from "crypto-js/enc-hex";

import { SHA256 } from "crypto-js";
import { randomID, second, secondsFromNow, sleep, Ox0 } from "./helper/testUtils";
import { ERC20WithFeesSwapContract } from "./bindings/erc20_with_fees_swap";
import { TokenWithFeesContract } from "./bindings/token_with_fees";

const ERC20WithFeesSwap = artifacts.require("ERC20WithFeesSwap");
const TokenWithFees = artifacts.require("TokenWithFees");

contract("ERC20WithFeesSwap", function (accounts: string[]) {

    let swapperd: ERC20WithFeesSwapContract;
    let tokenWithFees: TokenWithFeesContract;
    const alice = accounts[1];
    const bob = accounts[2];
    const broker = accounts[3];

    before(async function () {
        swapperd = await ERC20WithFeesSwap.deployed();
        tokenWithFees = await TokenWithFees.deployed();
        await tokenWithFees.transfer(alice, 100000000);
    });

    it("can perform atomic swap", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        const timeLock = await secondsFromNow(60 * 60 * 24)

        const value = 100000;
        const valueAfter1Tx = value - Math.floor((value * 3) / 1000);
        const valueAfter2Tx = valueAfter1Tx - Math.floor((valueAfter1Tx * 3) / 1000);

        await tokenWithFees.approve(swapperd.address, value, { from: alice })

        const aliceInitial = new BN(await tokenWithFees.balanceOf(alice));
        await swapperd.initiate(
            swapID, bob, secretLock, timeLock, value, { from: alice }
        );
        const aliceFinal = new BN(await tokenWithFees.balanceOf(alice));
        aliceInitial.sub(aliceFinal).should.bignumber.equal(value);

        const swapAudit = await swapperd.audit(swapID);
        swapAudit[0].should.bignumber.equal(timeLock);
        swapAudit[1].should.bignumber.equal(valueAfter1Tx);
        swapAudit[2].should.equal(bob);
        swapAudit[3].should.bignumber.equal(0);
        swapAudit[4].should.equal('0x0000000000000000000000000000000000000000');
        swapAudit[5].should.equal(alice);
        swapAudit[6].should.equal(secretLock);

        const bobInitial = new BN(await tokenWithFees.balanceOf(bob));
        await swapperd.redeem(swapID, bob, secret, { from: bob });
        const bobFinal = new BN(await tokenWithFees.balanceOf(bob));
        bobFinal.sub(bobInitial).should.bignumber.equal(valueAfter2Tx);

        await swapperd.auditSecret(swapID);
    });

    it("can perform atomic swap with fees", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        const timeLock = await secondsFromNow(60 * 60 * 24);

        const value = 100000;
        const fees = 200;
        const valueAfter1Tx = (value - Math.floor((value * 3) / 1000)) - fees;
        const valueAfter2Tx = valueAfter1Tx - Math.floor((valueAfter1Tx * 3) / 1000);

        await tokenWithFees.approve(swapperd.address, value, { from: alice })

        const aliceInitial = new BN(await tokenWithFees.balanceOf(alice));
        await swapperd.initiateWithFees(
            swapID, bob, broker, fees, secretLock, timeLock, value, { from: alice }
        );
        const aliceFinal = new BN(await tokenWithFees.balanceOf(alice));
        aliceInitial.sub(aliceFinal).should.bignumber.equal(value);

        const swapAudit = await swapperd.audit(swapID);
        swapAudit[0].should.bignumber.equal(timeLock);
        swapAudit[1].should.bignumber.equal(valueAfter1Tx);
        swapAudit[2].should.equal(bob);
        swapAudit[3].should.bignumber.equal(fees);
        swapAudit[4].should.equal(broker);
        swapAudit[5].should.equal(alice);
        swapAudit[6].should.equal(secretLock);

        const bobInitial = new BN(await tokenWithFees.balanceOf(bob));
        await swapperd.redeem(swapID, bob, secret, { from: bob });
        const bobFinal = new BN(await tokenWithFees.balanceOf(bob));
        bobFinal.sub(bobInitial).should.bignumber.equal(valueAfter2Tx);

        await swapperd.auditSecret(swapID);
    });

    it("can refund an atomic swap", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        const timeLock = await secondsFromNow(0);

        const value = 100000;
        const valueAfter1Tx = (value - Math.floor((value * 3) / 1000));
        const valueAfter2Tx = (valueAfter1Tx - Math.floor((valueAfter1Tx * 3) / 1000));

        await tokenWithFees.approve(swapperd.address, value, { from: alice });

        const aliceInitial = new BN(await tokenWithFees.balanceOf(alice));
        await swapperd.initiate(
            swapID, bob, secretLock, timeLock, value, { from: alice }
        );
        const aliceFinal = new BN(await tokenWithFees.balanceOf(alice));
        aliceInitial.sub(aliceFinal).should.bignumber.equal(value);

        await swapperd.refund(swapID, { from: alice });
        const aliceRefunded = new BN(await tokenWithFees.balanceOf(alice));
        aliceRefunded.should.bignumber.equal(
            aliceInitial.sub(new BN(valueAfter1Tx)).add(new BN(valueAfter2Tx))
        );
    });

    it("can refund an atomic swap with fees", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
        const timeLock = await secondsFromNow(0);

        await tokenWithFees.approve(swapperd.address, 100000, { from: alice });

        const aliceInitial = new BN(await tokenWithFees.balanceOf(alice));
        await swapperd.initiateWithFees(
            swapID, bob, broker, 200, secretLock, timeLock, 100000, { from: alice }
        );
        const aliceFinal = new BN(await tokenWithFees.balanceOf(alice));
        aliceInitial.sub(aliceFinal).should.bignumber.equal(100000);

        await swapperd.refund(swapID, { from: alice });
        const aliceRefunded = new BN(await tokenWithFees.balanceOf(alice));
        aliceRefunded.sub(aliceFinal).should.bignumber.equal(100000);
    });

    it("operations check order status", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

        // Should approve before initiating an atomic swap
        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice })
            .should.be.rejectedWith(null, /revert/);

        // Can only initiateWithFees for INVALID swaps
        await tokenWithFees.approve(swapperd.address, 100000, { from: alice });
        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice });
        await tokenWithFees.approve(swapperd.address, 100000, { from: alice });
        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice })
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

        await tokenWithFees.approve(swapperd.address, 100000, { from: alice });
        await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(2), 100000, { from: alice });

        // Only Bob can redeem
        await swapperd.redeem(swapID, bob, secret, { from: alice })
            .should.be.rejectedWith(null, /((revert)|(unauthorized spender))\.?$/);

        // Recipient can't be 0x0
        await swapperd.redeem(swapID, Ox0, secret, { from: bob })
            .should.be.rejectedWith(null, /((revert)|(invalid receiver))\.?$/);

        await swapperd.redeem(swapID, alice, secret, { from: bob });
    });

    it("can't send eth for token swap", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

        await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(2), 100000, { from: alice, value: 100000 })
            .should.be.rejectedWith(null, /((revert)|(eth value must be zero))\.?$/);

        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice, value: 100000 })
            .should.be.rejectedWith(null, /((revert)|(eth value must be zero))\.?$/);
    });

    it("can return details", async () => {
        const swapID = randomID(), secret = randomID();
        const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

        await tokenWithFees.approve(swapperd.address, 100000, { from: alice });

        // Before initiating
        (await swapperd.initiatable(swapID)).should.be.true;
        (await swapperd.refundable(swapID)).should.be.false;
        (await swapperd.redeemable(swapID)).should.be.false;

        await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), 100000, { from: alice });

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
        const brokerInitial = new BN(await tokenWithFees.balanceOf(broker));
        await swapperd.withdrawBrokerFees(fees, { from: broker });
        const brokerFinal = new BN(await tokenWithFees.balanceOf(broker));
        brokerFinal.sub(brokerInitial).should.bignumber.equal(fees);
    });
});