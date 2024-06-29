# Deep-Fact

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
  - [Deploying to IPFS](#deploying-to-ipfs)
- [Smart Contract](#smart-contract)
  - [Requirements](#requirements)
  - [Quickstart](#quickstart)
  - [Testing](#testing)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/a39955720/Deep-Fact
```

2. Install frontend dependencies:

```bash
cd nextjs
yarn install
```

3. Set up environment variables:
   Create a `.env` file in the "nextjs" directory and add the following content:

```plaintext
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## Usage

1. Run the frontend development server:

```bash
yarn run dev
```

2. Visit [http://localhost:3000](http://localhost:3000) to use the application.

## Deployment

### Deploying to IPFS

1. Build static files:

```bash
yarn build
```

2. Export the site:

```bash
yarn next export
```

## Smart Contract

### Requirements

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [foundry](https://getfoundry.sh/)

### Quickstart

```bash
cd foundry
forge build
```

Start a local node:

```bash
make anvil
```

Deploy (defaults to local node):

```bash
make deploy
```

Deploying to Testnet or Mainnet

1. Set up environment variables:
   Create a `.env` file in the project root directory and add the following content:

```plaintext
PRIVATE_KEY=your_ethereum_private_key
ZIRCUIT_RPC_URL=https://zircuit.network/your_rpc_url
ZIRCUIT_API_KEY=your_zircuit_api_key
OPTIMISM_RPC_URL=https://optimism.io/your_rpc_url
OPTIMISM_ETHERSCAN_API_KEY=your_optimism_etherscan_api_key
```

2. Get testnet ETH

3. Deploy:

```bash
make Deploy
# or
make OPTIMISM
```

### Testing

Run tests:

```bash
forge test
```

View test coverage:

```bash
forge coverage
```