import { ETH } from "./helper/testUtils";

import { SwapInterfaceContract } from "./bindings/swap_interface";
import { ERC20DetailedContract } from "./bindings/erc20_detailed";

const EthSwap = artifacts.require("EthSwap");

const ERC20Swap = artifacts.require("ERC20Swap");
const StandardToken = artifacts.require("StandardToken");

const ERC20WithFeesSwap = artifacts.require("ERC20WithFeesSwap");
const TokenWithFees = artifacts.require("TokenWithFees");

export interface TestCase {
    name: string,
    transferFees: number,

    token: Promise<ERC20DetailedContract> | ERC20DetailedContract,
    swapperd: Promise<SwapInterfaceContract> | SwapInterfaceContract,
}

export const testCases: TestCase[] = [
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
    },
    {
        name: "ERC20WithFeesSwap",
        transferFees: 3,

        swapperd: ERC20WithFeesSwap.deployed(),
        token: TokenWithFees.deployed(),
    }
];
