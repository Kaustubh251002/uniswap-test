# Quoting with multiple calls

## Overview

The main changes to the quoting function have been made in [quote.ts](./src/libs/quote.ts) where the ABI of multicall contract has been concatinated to the qouter contract ABI.
The system is still not fully functional but the base framework is in place.

## Configuration

This application is a read only quoting application that communicates with the Ethereum mainnet. To configure the input token/amount and output token, edit the [configuration](./src/config.ts) file. The code should need no further modification to function.

## Setup

### Install dependencies

1. Run `yarn install` to install the project dependencies
2. Run `yarn install:chain` to download and install Foundry

### Get a mainnet RPC URL

1. Create aun API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, eg `https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721`
2. Set that as the value of the `mainnet` `rpc` vale inside the [config](./src/config.ts).

### Start the web interface

Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/)
