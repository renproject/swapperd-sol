const SwapperdETH = artifacts.require("SwapperdETH");
const SwapperdERC20 = artifacts.require("SwapperdERC20");
const WBTC = artifacts.require("WBTC");

// const RepublicToken = artifacts.require("RepublicToken");

const config = require("./config.js");

module.exports = async function (deployer, network, accounts) {

    const VERSION_STRING = `${network}-${config.VERSION}`;
    const deployerAddress = accounts[0];

    await deployer

        .then(() => deployer.deploy(
            SwapperdETH,
            VERSION_STRING,
        ))

        // .then(() => deployer.deploy(
        //     RepublicToken,
        // ))

        // .then(() => deployer.deploy(
        //     SwapperdERC20,
        //     VERSION_STRING,
        //     RepublicToken,
        // ))

        .then(() => deployer.deploy(
            WBTC,
        ))

        .then(async () => {
            const wbtc = await WBTC.at(WBTC.address);
            await wbtc.mint(deployerAddress, 10000000000);
        })

        .then(() => deployer.deploy(
            SwapperdERC20,
            VERSION_STRING,
            WBTC.address,
        ));
}