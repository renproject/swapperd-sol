import BN from "bn.js";

import { ETH, NO_TOKEN } from "./helper/testUtils";

import { SwapInterfaceContract } from "./bindings/swap_interface";
import { ERC20DetailedContract } from "./bindings/erc20_detailed";

const BaseSwap = artifacts.require("BaseSwap");

const EthSwap = artifacts.require("EthSwap");

const ERC20Swap = artifacts.require("ERC20Swap");
const StandardToken = artifacts.require("StandardToken");

const ERC20WithFeesSwap = artifacts.require("ERC20WithFeesSwap");
const TokenWithFees = artifacts.require("TokenWithFees");

export interface TestCaseDetails {
    transferFees: number,

    token: ERC20DetailedContract,
    swapperd: SwapInterfaceContract,
}
export interface TestCase {
    name: string,
    details: () => Promise<TestCaseDetails>,
}

export const testCases: Array<TestCase> = [
    {
        name: "BaseSwap",
        details: async () => ({
            transferFees: 0,
            swapperd: await BaseSwap.new("TEST-VERSION"),
            token: NO_TOKEN,
        }),
    },
    {
        name: "EthSwap",
        details: async () => ({
            transferFees: 0,
            swapperd: await EthSwap.new("TEST-VERSION"),
            token: ETH,
        }),
    },
    {
        name: "ERC20Swap",
        details: async () => {
            const token = await StandardToken.new();
            return {
                transferFees: 0,
                swapperd: await ERC20Swap.new("TEST-VERSION", token.address),
                token: token,
            }
        },
    },
    {
        name: "ERC20WithFeesSwap",
        details: async () => {
            const token = await TokenWithFees.new();
            return {
                transferFees: new BN(await token.feeBps()).toNumber(),
                swapperd: await ERC20WithFeesSwap.new("TEST-VERSION", token.address),
                token: token,
            }
        },
    },
];
