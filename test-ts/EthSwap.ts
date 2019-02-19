import BN from "bn.js";
import HEX from "crypto-js/enc-hex";

import { SHA256 } from "crypto-js";
import { randomID, second, getFee, secondsFromNow, sleep, Ox0, ETH } from "./helper/testUtils";
import { Transaction } from "web3-core/types";

import { SwapInterfaceContract } from "./bindings/swap_interface";
import { ERC20DetailedContract } from "./bindings/erc20_detailed";

const EthSwap = artifacts.require("EthSwap");
const ERC20Swap = artifacts.require("ERC20Swap");
const StandardToken = artifacts.require("StandardToken");

interface TestCase {
    name: string,
    transferFees: number,

    token: Promise<ERC20DetailedContract> | ERC20DetailedContract,
    swapperd: Promise<SwapInterfaceContract> | SwapInterfaceContract,
}

const textContract = (testCase: TestCase) => {
    contract(testCase.name, (accounts: string[]) => {

        let swapperd: SwapInterfaceContract;
        let token: ERC20DetailedContract;
        const alice = accounts[1];
        const bob = accounts[2];
        const broker = accounts[3];

        before(async function () {
            swapperd = await testCase.swapperd;
            token = await testCase.token;

            const decimals = new BN(await token.decimals()).toNumber();
            await token.transfer(alice, 1 * 10 ** decimals);
        });

        it("can perform atomic swap", async () => {

            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const timeLock = await secondsFromNow(60 * 60 * 24);

            const value = 1000;

            const aliceInitial = new BN(await token.balanceOf(alice));
            await token.approve(swapperd.address, value, { from: alice });
            const initiateTx = await swapperd.initiate(
                swapID, bob, secretLock, timeLock, value, { from: alice, value: token === ETH ? value : 0 },
            );

            let aliceFinal = new BN(await token.balanceOf(alice));
            let txFee = token === ETH ? await getFee(initiateTx) : new BN(0);
            aliceInitial.sub(aliceFinal).sub(txFee)
                .should.bignumber.equal(value);

            const swapAudit = await swapperd.audit(swapID);
            swapAudit[0].should.bignumber.equal(timeLock);
            swapAudit[1].should.bignumber.equal(value);
            swapAudit[2].should.equal(bob);
            swapAudit[3].should.bignumber.equal(0);
            swapAudit[4].should.equal('0x0000000000000000000000000000000000000000');
            swapAudit[5].should.equal(alice);
            swapAudit[6].should.equal(secretLock);

            const bobInitial = new BN(await token.balanceOf(bob));
            const redeemTx = await swapperd.redeem(swapID, bob, secret, { from: bob });
            const bobFinal = new BN(await token.balanceOf(bob));
            txFee = token === ETH ? await getFee(redeemTx) : new BN(0);
            bobFinal.sub(bobInitial).add(txFee)
                .should.bignumber.equal(value);

            await swapperd.auditSecret(swapID);
        });

        it("can perform atomic swap with fees", async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const timeLock = await secondsFromNow(60 * 60 * 24)

            const value = 100000;
            const brokerFee = 200;

            const aliceInitial = new BN(await token.balanceOf(alice));
            await token.approve(swapperd.address, value, { from: alice });
            const initiateTx = await swapperd.initiateWithFees(
                swapID, bob, broker, brokerFee, secretLock, timeLock, value, { from: alice, value: token === ETH ? value : 0 }
            );
            const aliceFinal = new BN(await token.balanceOf(alice));
            const initiateTxFee = token === ETH ? await getFee(initiateTx) : new BN(0);
            aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(value);

            const swapAudit = await swapperd.audit(swapID);
            swapAudit[0].should.bignumber.equal(timeLock);
            swapAudit[1].should.bignumber.equal(99800);
            swapAudit[2].should.equal(bob);
            swapAudit[3].should.bignumber.equal(brokerFee);
            swapAudit[4].should.equal(broker);
            swapAudit[5].should.equal(alice);
            swapAudit[6].should.equal(secretLock);

            const bobInitial = new BN(await token.balanceOf(bob));
            const redeemTx = await swapperd.redeem(swapID, bob, secret, { from: bob });
            const bobFinal = new BN(await token.balanceOf(bob));
            const redeemTxFee = token === ETH ? await getFee(redeemTx) : new BN(0);
            bobFinal.sub(bobInitial).add(redeemTxFee).should.bignumber.equal(value - brokerFee);

            await swapperd.auditSecret(swapID);
        });

        it("can refund an atomic swap", async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const timeLock = await secondsFromNow(0);

            const value = 100000

            const aliceInitial = new BN(await token.balanceOf(alice));
            await token.approve(swapperd.address, value, { from: alice });
            const initiateTx = await swapperd.initiate(
                swapID, bob, secretLock, timeLock, value, { from: alice, value: token === ETH ? value : 0 }
            );
            const aliceFinal = new BN(await token.balanceOf(alice));
            const initiateTxFee = token === ETH ? await getFee(initiateTx) : new BN(0);

            aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(value);

            const refundTx = await swapperd.refund(swapID, { from: alice });
            const aliceRefunded = new BN(await token.balanceOf(alice));
            const refundTxFee = token === ETH ? await getFee(refundTx) : new BN(0);
            aliceRefunded.sub(aliceFinal).add(refundTxFee).should.bignumber.equal(value);
        });

        it("can refund an atomic swap with fees", async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const timeLock = await secondsFromNow(0);

            const value = 100000;

            const aliceInitial = new BN(await token.balanceOf(alice));
            await token.approve(swapperd.address, value, { from: alice });
            const initiateTx = await swapperd.initiateWithFees(
                swapID, bob, broker, 200, secretLock, timeLock, value, { from: alice, value: token === ETH ? value : 0 }
            );
            const aliceFinal = new BN(await token.balanceOf(alice));
            const initiateTxFee = token === ETH ? await getFee(initiateTx) : new BN(0);

            aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(value);

            const refundTx = await swapperd.refund(swapID, { from: alice });
            const aliceRefunded = new BN(await token.balanceOf(alice));
            const refundTxFee = token === ETH ? await getFee(refundTx) : new BN(0);
            aliceRefunded.sub(aliceFinal).add(refundTxFee).should.bignumber.equal(value);
        });

        it("operations check order status", async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

            const value = 100000;

            // Can only initiateWithFees for INVALID swaps
            await token.approve(swapperd.address, value, { from: alice });
            await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), value, { from: alice, value: token === ETH ? value : 0 });
            await token.approve(swapperd.address, value, { from: alice });
            await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), value, { from: alice, value: token === ETH ? value : 0 })
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
            const value = 100000;
            await token.approve(swapperd.address, value, { from: alice });
            await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(2), value, { from: alice, value: token === ETH ? value : 0 });

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
            const value = 200;
            await token.approve(swapperd.address, value, { from: alice });
            await swapperd.initiateWithFees(swapID, bob, broker, 201, secretLock, await secondsFromNow(2), value, { from: alice, value: token === ETH ? value : 0 })
                .should.be.rejectedWith(null, /((revert)|(fee must be less than value))\.?$/);
        });

        it("eth amount must match value", async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

            const value = 100000;

            await token.approve(swapperd.address, value - 1, { from: alice });
            await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(2), value, { from: alice, value: token === ETH ? value - 1 : 0 })
                .should.be.rejectedWith(null, /((revert)|(eth amount must match value))\.?$/);
        });

        it("can return details", async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

            // Before initiating
            (await swapperd.initiatable(swapID)).should.be.true;
            (await swapperd.refundable(swapID)).should.be.false;
            (await swapperd.redeemable(swapID)).should.be.false;

            const value = 100000;
            await token.approve(swapperd.address, value, { from: alice });
            await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), value, { from: alice, value: token === ETH ? value : 0 });

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

            const brokerInitial = new BN(await token.balanceOf(broker));

            const tx = await swapperd.withdrawBrokerFees(fees, { from: broker });
            const brokerFinal = new BN(await token.balanceOf(broker));
            const txFees = token === ETH ? await getFee(tx) : new BN(0);
            brokerFinal.sub(brokerInitial).add(txFees).should.bignumber.equal(fees);
        });
    });
};

context("Swap contracts", () => {

    const tests: TestCase[] = [
        {
            name: "EthSwap",
            transferFees: 0,

            swapperd: EthSwap.deployed(),
            token: ETH,
        },
        {
            name: "ERC20Swap",
            transferFees: 0,

            swapperd: ERC20Swap.deployed(),
            token: StandardToken.deployed(),
        }
    ];

    for (const test of tests) {
        textContract(test);
    }
});