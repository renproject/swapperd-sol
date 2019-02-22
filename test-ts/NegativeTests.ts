import BN from "bn.js";
import HEX from "crypto-js/enc-hex";

import { SHA256 } from "crypto-js";
import { randomID, secondsFromNow, Ox0, ETH } from "./helper/testUtils";

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


        it("eth amount must match value", skip(["BaseSwap"], async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

            const value = 100000;

            await token.approve(swapperd.address, value - 1, { from: alice });
            await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(2), value, { from: alice, value: token === ETH ? value - 1 : 0 })
                .should.be.rejectedWith(null, /((revert)|(eth amount must match value))\.?$/);

            await token.approve(swapperd.address, value - 1, { from: alice });
            await swapperd.initiateWithFees(swapID, bob, broker, 0, secretLock, await secondsFromNow(2), value, { from: alice, value: token === ETH ? value - 1 : 0 })
                .should.be.rejectedWith(null, /((revert)|(eth amount must match value))\.?$/);
        }));

        it("can't send eth for token swap", skip(["EthSwap", "BaseSwap"], async () => {
            const swapID = randomID(), secret = randomID();
            const secretLock = `0x${SHA256(HEX.parse(secret.slice(2))).toString()}`;

            const value = 100000;

            await swapperd.initiate(swapID, bob, secretLock, await secondsFromNow(2), value, { from: alice, value: value })
                .should.be.rejectedWith(null, /((revert)|(eth value must be zero))\.?$/);

            await swapperd.initiateWithFees(swapID, bob, broker, 200, secretLock, await secondsFromNow(2), value, { from: alice, value: value })
                .should.be.rejectedWith(null, /((revert)|(eth value must be zero))\.?$/);
        }));
    });
};

context.only("Negative Tests", () => {
    for (const test of testCases) {
        testContract(test);
    }
});