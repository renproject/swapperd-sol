/// <reference types="../test-ts/typings/truffle" />

const Time = artifacts.require("Time");

// const config = require("./config.js");

module.exports = async function (deployer, _network, _accounts) {

    await deployer
        .then(() => deployer.deploy(
            Time,
        ));
}