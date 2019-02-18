# Swapperd Contracts

[![Build Status](https://travis-ci.org/republicprotocol/swapperd-sol.svg?branch=master)](https://travis-ci.org/republicprotocol/swapperd-sol)
[![Coverage Status](https://coveralls.io/repos/github/republicprotocol/swapperd-sol/badge.svg?branch=master)](https://coveralls.io/github/republicprotocol/swapperd-sol?branch=master)


## Development

### Dependencies

RenEx Sol depends on the [OpenZeppelin Solidity library](https://github.com/OpenZeppelin/openzeppelin-solidity).

When using VSCode with the `juanblanco.solidity` extension, add the following to `.vscode/settings.json`:

```json
{
    "solidity.packageDefaultDependenciesContractsDirectory": ""
}
```

### Tests

Install the dependencies.

```
npm install
```

Run the `ganache-cli` or an alternate Ethereum test RPC server on port 8545.

```sh
npx ganache-cli
```

Run the Truffle test suite.

```sh
npm run test
```

### Coverage

Install the dependencies.

```
npm install
```

Run the Truffle test suite with coverage.

```sh
npm run coverage
```
