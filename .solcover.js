module.exports = {
    skipFiles: [

        // Contract for building bindings
        "Bindings.sol",

        // Migration contract
        "migrations/Migrations.sol",

        // Libraries that are tested in other repositories
        "libraries/CompatibleERC20.sol",

        // Contracts for assisting the tests
        "test/Time.sol",
        "test/StandardToken.sol",
        "test/TokenWithFees.sol",
    ],
};