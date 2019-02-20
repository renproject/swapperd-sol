import BN from "bn.js";
import HEX from "crypto-js/enc-hex";

import { SHA256 } from "crypto-js";
import { randomID, getFee, secondsFromNow, ETH, subFees, increaseTime } from "./helper/testUtils";

import { SwapInterfaceContract } from "./bindings/swap_interface";
import { ERC20DetailedContract } from "./bindings/erc20_detailed";
import { TestCase, testCases, TestCaseDetails } from "./testCases";

const testContract = (testCase: TestCase) => {
    const skip = (skips: any[], inner: any) => (skips.indexOf(testCase.name) === -1) ? inner : () => { };

    contract(testCase.name, (accounts: string[]) => {

        let testDetails: TestCaseDetails;
        let swapperd: SwapInterfaceContract;
        let token: ERC20DetailedContract;
        const alice = accounts[1];
        const bob = accounts[2];
        const broker = accounts[3];

        before(async function () {
            testDetails = await testCase.details();
            swapperd = testDetails.swapperd;
            token = testDetails.token;

            const decimals = new BN(await token.decimals());
            await token.transfer(alice, new BN(10).pow(decimals));
        });

        it("can perform atomic swap", skip(["BaseSwap"], async () => {

            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const timeLock = await secondsFromNow(60 * 60 * 24);

            const value = 1000;
            const valueAfter1Tx = subFees(value, testDetails.transferFees);
            const valueAfter2Tx = subFees(valueAfter1Tx, testDetails.transferFees);

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
            swapAudit[1].should.bignumber.equal(valueAfter1Tx);
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
                .should.bignumber.equal(valueAfter2Tx);

            await swapperd.auditSecret(swapID);
        }));

        it("can perform atomic swap with fees", skip(["BaseSwap"], async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const timeLock = await secondsFromNow(60 * 60 * 24)

            const value = 100000;
            const brokerFee = 200;
            const valueAfter1Tx = subFees(value, testDetails.transferFees).sub(new BN(brokerFee));
            const valueAfter2Tx = subFees(valueAfter1Tx, testDetails.transferFees);

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
            swapAudit[1].should.bignumber.equal(valueAfter1Tx);
            swapAudit[2].should.equal(bob);
            swapAudit[3].should.bignumber.equal(brokerFee);
            swapAudit[4].should.equal(broker);
            swapAudit[5].should.equal(alice);
            swapAudit[6].should.equal(secretLock);

            const bobInitial = new BN(await token.balanceOf(bob));
            const redeemTx = await swapperd.redeem(swapID, bob, secret, { from: bob });
            const bobFinal = new BN(await token.balanceOf(bob));
            const redeemTxFee = token === ETH ? await getFee(redeemTx) : new BN(0);
            bobFinal.sub(bobInitial).add(redeemTxFee).should.bignumber.equal(valueAfter2Tx);

            await swapperd.auditSecret(swapID);
        }));

        it("can refund an atomic swap", skip(["BaseSwap"], async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const timeLock = await secondsFromNow(0);

            const value = new BN(100000);
            const valueAfter1Tx = subFees(value, testDetails.transferFees);
            const valueAfter2Tx = subFees(valueAfter1Tx, testDetails.transferFees);

            const aliceInitial = new BN(await token.balanceOf(alice));
            await token.approve(swapperd.address, value, { from: alice });
            const initiateTx = await swapperd.initiate(
                swapID, bob, secretLock, timeLock, value, { from: alice, value: token === ETH ? value.toString() : 0 }
            );
            const aliceFinal = new BN(await token.balanceOf(alice));
            const initiateTxFee = token === ETH ? await getFee(initiateTx) : new BN(0);

            aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(value);

            const refundTx = await swapperd.refund(swapID, { from: alice });
            const aliceRefunded = new BN(await token.balanceOf(alice));
            const refundTxFee = token === ETH ? await getFee(refundTx) : new BN(0);

            const expectedFinal = aliceInitial
                // Subtract tx fees
                .sub(initiateTxFee)
                .sub(refundTxFee)
                // Subtract transfer fees
                .sub(value.sub(valueAfter1Tx))
                .sub(valueAfter1Tx.sub(valueAfter2Tx));

            aliceRefunded.should.bignumber.equal(expectedFinal);
        }));

        it("can refund an atomic swap with fees", skip(["BaseSwap"], async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const timeLock = await secondsFromNow(0);

            const value = new BN(100000);
            const brokerFee = 200;
            const valueAfter1Tx = subFees(value, testDetails.transferFees);
            const valueAfter2Tx = subFees(valueAfter1Tx, testDetails.transferFees);

            const aliceInitial = new BN(await token.balanceOf(alice));
            await token.approve(swapperd.address, value, { from: alice });
            const initiateTx = await swapperd.initiateWithFees(
                swapID, bob, broker, brokerFee, secretLock, timeLock, value, { from: alice, value: token === ETH ? value.toString() : 0 }
            );
            const aliceFinal = new BN(await token.balanceOf(alice));
            const initiateTxFee = token === ETH ? await getFee(initiateTx) : new BN(0);

            aliceInitial.sub(aliceFinal).sub(initiateTxFee).should.bignumber.equal(value);

            const refundTx = await swapperd.refund(swapID, { from: alice });
            const aliceRefunded = new BN(await token.balanceOf(alice));
            const refundTxFee = token === ETH ? await getFee(refundTx) : new BN(0);

            const expectedFinal = aliceInitial
                // Subtract tx fees
                .sub(initiateTxFee)
                .sub(refundTxFee)
                // Subtract transfer fees
                .sub(value.sub(valueAfter1Tx))
                .sub(valueAfter1Tx.sub(valueAfter2Tx));

            aliceRefunded.should.bignumber.equal(expectedFinal);
        }));

        it("can return details", async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

            // Before initiating
            (await swapperd.initiatable(swapID)).should.be.true;
            (await swapperd.refundable(swapID)).should.be.false;
            (await swapperd.redeemable(swapID)).should.be.false;

            const value = 100000;
            const timelock = 2;
            await token.approve(swapperd.address, value, { from: alice });
            await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(timelock), value, { from: alice, value: token === ETH ? value : 0 });

            (await swapperd.initiatable(swapID)).should.be.false;
            (await swapperd.refundable(swapID)).should.be.false;
            (await swapperd.redeemable(swapID)).should.be.true;

            await increaseTime(timelock);

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

        it("can retrieve redeem time", async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;
            const value = 100000;
            const timelock = 2;
            await token.approve(swapperd.address, value, { from: alice });
            await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(timelock), value, { from: alice, value: token === ETH ? value : 0 });
            await increaseTime(timelock);
            const now = await secondsFromNow(0);
            await swapperd.redeem(swapID, alice, secret, { from: bob });

            (await swapperd.redeemedAt(swapID))
                .should.bignumber.equal(now);
        });

        it("can withdraw broker fees", skip(["BaseSwap"], async () => {
            const fees = await swapperd.brokerFees(broker);
            const feesAfter1Tx = subFees(fees, testDetails.transferFees);

            await swapperd.withdrawBrokerFees(new BN(fees).add(new BN(1)), { from: broker })
                .should.be.rejectedWith(null, /((revert)|(insufficient withdrawable fees))\.?$/);

            const brokerInitial = new BN(await token.balanceOf(broker));

            const tx = await swapperd.withdrawBrokerFees(fees, { from: broker });
            const brokerFinal = new BN(await token.balanceOf(broker));
            const txFees = token === ETH ? await getFee(tx) : new BN(0);
            brokerFinal.sub(brokerInitial).add(txFees).should.bignumber.equal(feesAfter1Tx);
        }));
    });
};

context.only("Positive Tests", () => {
    for (const test of testCases) {
        testContract(test);
    }
});