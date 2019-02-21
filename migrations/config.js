module.exports = (network) => {
    if (network.match(/development/) || network.match(/testnet/)) {
        return {
            VERSION: "1.0.1",
            TOKENS: {
                WBTC: "0xA1D3EEcb76285B4435550E4D963B8042A8bffbF0",
                REN: "0x2CD647668494c1B15743AB283A0f980d90a87394",
                ZRX: "0x6EB628dCeFA95802899aD3A9EE0C7650Ac63d543",
                OMG: "0x66497ba75dD127b46316d806c077B06395918064",
                USDC: "0x3f0a4aed397c66d7b7dde1d170321f87656b14cc",
                GUSD: "0xA9CF366E9fb4F7959452d7a17A6F88ee2A20e9DA",
                DAI: "0xc4375b7de8af5a38a93548eb8453a498222c4ff2",
                TUSD: "0x525389752ffe6487d33EF53FBcD4E5D3AD7937a0",
                DGX: "0x7d6D31326b12B6CBd7f054231D47CbcD16082b71",
                PAX: "0x3584087444dabf2e0d29284766142ac5c3a9a2b7",
            }
        };
    }

    if (network.match(/mainnet/)) {
        return {
            VERSION: "1.0.1",
            TOKENS: {
                DGX: "0x4f3AfEC4E5a3F2A6a1A411DEF7D7dFe50eE057bF",
                TUSD: "0x8dd5fbCe2F6a956C3022bA3663759011Dd51e73E",
                REN: "0x21C482f153D0317fe85C60bE1F7fa079019fcEbD",
                WBTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
                ZRX: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
                OMG: "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
                USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                GUSD: "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd",
                DAI: "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
                PAX: "0x8e870d67f660d95d5be530380d0ec0bd388289e1",
            }
        };
    }
};