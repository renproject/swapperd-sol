/// <reference types="../test-ts/typings/truffle" />

const EthSwap = artifacts.require("EthSwap");
const ERC20Swap = artifacts.require("ERC20Swap");
const ERC20WithFeesSwap = artifacts.require("ERC20WithFeesSwap");

const StandardToken = artifacts.require("StandardToken");
const TokenWithFees = artifacts.require("TokenWithFees");

const config = require("./config.js");

module.exports = async function (deployer, network, accounts) {

    const VERSION_STRING = `${network}-${config.VERSION}`;
    const deployerAddress = accounts[0];

    await deployer

        .then(() => deployer.deploy(
            EthSwap,
            VERSION_STRING,
        ))

        // .then(() => deployer.deploy(
        //     RepublicToken,
        // ))

        // .then(() => deployer.deploy(
        //     ERC20Swap,
        //     VERSION_STRING,
        //     RepublicToken,
        // ))

        .then(() => deployer.deploy(
            StandardToken,
        ))
        .then(async () => {
            const standardToken = await StandardToken.at(StandardToken.address);
            await standardToken.mint(deployerAddress, "10000000000");
        })

        .then(() => deployer.deploy(
            TokenWithFees,
        ))
        .then(async () => {
            const tokenWithFees = await TokenWithFees.at(TokenWithFees.address);
            await tokenWithFees.mint(deployerAddress, "100000000000000000000");
        })

        .then(() => deployer.deploy(
            ERC20Swap,
            VERSION_STRING,
            StandardToken.address,
        ))

        .then(() => deployer.deploy(
            ERC20WithFeesSwap,
            VERSION_STRING,
            TokenWithFees.address,
        ));
}