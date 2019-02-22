// @ts-nocheck

require('dotenv').config()

const HDWalletProvider = require("truffle-hdwallet-provider");

const GWEI = 1000000000;

const KOVAN = (MNEMONIC) => ({
    provider: MNEMONIC ? new HDWalletProvider(MNEMONIC, `https://kovan.infura.io/v3/${process.env.INFURA_TOKEN}`) : undefined,
    network_id: "*",
    gas: 6721975,
    gasPrice: 10 * GWEI,
});

const MAINNET = (MNEMONIC) => ({
    provider: MNEMONIC ? new HDWalletProvider(MNEMONIC, `https://mainnet.infura.io/v3/${process.env.INFURA_TOKEN}`) : undefined,
    network_id: 1,
    gas: 6721975,
    gasPrice: 10 * GWEI,
});

module.exports = {
    solc: {
        version: "native",
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*",
            gas: 6721975,
            gasPrice: 10 * GWEI,
        },
        testnet: KOVAN(process.env.MNEMONIC_TESTNET),
        mainnet: MAINNET(process.env.MNEMONIC_MAINNET),
        verify: MAINNET(process.env.MNEMONIC_TESTNET),
    },
    mocha: {
        // // Use with `npm run test`, not with `npm run coverage`
        // reporter: 'eth-gas-reporter',
        // reporterOptions: {
        //     currency: 'USD',
        //     gasPrice: 21
        // },
        useColors: true,
        bail: true,
        forbidOnly: (process.env.CI == "true")
    },
};