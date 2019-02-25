/// <reference types="../test-ts/typings/truffle" />

const Time = artifacts.require("Time");
const EthSwap = artifacts.require("EthSwap");
const ERC20Swap = artifacts.require("ERC20Swap");
const ERC20WithFeesSwap = artifacts.require("ERC20WithFeesSwap");

module.exports = async function (deployer, network, _accounts) {
    const config = require("./config.js")(network);

    if (network === "development") {
        return;
    }

    // const ETHSwap = await deployer.deploy(EthSwap, config.VERSION);
    const WBTCSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.WBTC);
    const RENSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.REN);
    const TUSDSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.TUSD);
    const OMGSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.OMG);
    const ZRXSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.ZRX);
    const DGXSwap = await deployer.deploy(ERC20WithFeesSwap, config.VERSION, config.TOKENS.DGX);
    const USDCSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.USDC);
    const GUSDSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.GUSD);
    const DAISwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.DAI);
    const PAXSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.PAX);

    console.log(JSON.stringify({
        // ETHSwap: ETHSwap ? ETHSwap.address : "",
        WBTCSwap: WBTCSwap ? WBTCSwap.address : "",
        RENSwap: RENSwap ? RENSwap.address : "",
        TUSDSwap: TUSDSwap ? TUSDSwap.address : "",
        OMGSwap: OMGSwap ? OMGSwap.address : "",
        ZRXSwap: ZRXSwap ? ZRXSwap.address : "",
        DGXSwap: DGXSwap ? DGXSwap.address : "",
        USDCSwap: USDCSwap ? USDCSwap.address : "",
        GUSDSwap: GUSDSwap ? GUSDSwap.address : "",
        DAISwap: DAISwap ? DAISwap.address : "",
        PAXSwap: PAXSwap ? PAXSwap.address : "",
    }, undefined, "    "))
}