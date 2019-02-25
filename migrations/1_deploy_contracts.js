/// <reference types="../test-ts/typings/truffle" />

const Time = artifacts.require("Time");
const EthSwap = artifacts.require("EthSwap");
const ERC20Swap = artifacts.require("ERC20Swap");
const ERC20WithFeesSwap = artifacts.require("ERC20WithFeesSwap");

let ETHSwapAddress;
let WBTCSwapAddress;
let RENSwapAddress;
let TUSDSwapAddress;
let OMGSwapAddress;
let ZRXSwapAddress;
let DGXSwapAddress;
let USDCSwapAddress;
let GUSDSwapAddress;
let DAISwapAddress;
let PAXSwapAddress;

module.exports = async function (deployer, network, _accounts) {
    const config = require("./config.js")(network);

    if (network === "development") {
        return;
    }

    await deployer.deploy(EthSwap, config.VERSION);
    ETHSwapAddress = EthSwap.address;

    const WBTCSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.WBTC);
    WBTCSwapAddress = WBTCSwap ? WBTCSwap.address : "";

    const RENSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.REN);
    RENSwapAddress = RENSwap ? RENSwap.address : "";

    const TUSDSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.TUSD);
    TUSDSwapAddress = TUSDSwap ? TUSDSwap.address : "";

    const OMGSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.OMG);
    OMGSwapAddress = OMGSwap ? OMGSwap.address : "";

    const ZRXSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.ZRX);
    ZRXSwapAddress = ZRXSwap ? ZRXSwap.address : "";

    const DGXSwap = await deployer.deploy(ERC20WithFeesSwap, config.VERSION, config.TOKENS.DGX);
    DGXSwapAddress = DGXSwap ? DGXSwap.address : "";

    const USDCSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.USDC);
    USDCSwapAddress = USDCSwap ? USDCSwap.address : "";

    const GUSDSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.GUSD);
    GUSDSwapAddress = GUSDSwap ? GUSDSwap.address : "";

    const DAISwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.DAI);
    DAISwapAddress = DAISwap ? DAISwap.address : "";

    const PAXSwap = await deployer.deploy(ERC20Swap, config.VERSION, config.TOKENS.PAX);
    PAXSwapAddress = PAXSwap ? PAXSwap.address : "";
}

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log(JSON.stringify({
            ETHSwap: ETHSwapAddress,
            WBTCSwap: WBTCSwapAddress,
            RENSwap: RENSwapAddress,
            TUSDSwap: TUSDSwapAddress,
            OMGSwap: OMGSwapAddress,
            ZRXSwap: ZRXSwapAddress,
            DGXSwap: DGXSwapAddress,
            USDCSwap: USDCSwapAddress,
            GUSDSwap: GUSDSwapAddress,
            DAISwap: DAISwapAddress,
            PAXSwap: PAXSwapAddress,
        }, undefined, "    "))
    }

    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {
    cleanup: true,
}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
    exit: true,
}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {
    exit: true,
}));
process.on('SIGUSR2', exitHandler.bind(null, {
    exit: true,
}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
    exit: true,
}));