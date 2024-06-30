# DeepFact

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
  - [Deploying to IPFS](#deploying-to-ipfs)
- [Smart Contract](#smart-contract)
  - [Requirements](#requirements)
  - [Quickstart](#quickstart)
  - [Testing](#testing)

## Description

### Overview

In today’s society, fraud is growing rapidly. DeepFact aims to create a decentralized anti-fraud community through blockchain mechanisms, bringing together experts and professional institutions to combat fraud. This platform also provides beginners and victims with a transparent and open channel for seeking help.

### Initial Phase

In the initial phase, users must pay to submit project questions on the platform. This information will be sent to smart contracts, and various miners, who are participants willing to answer questions, will choose to respond. The user fees will be rewarded to the responders, a mechanism we call “proof of analysis (POA).”

### Reporting and Accountability

If users do not receive appropriate responses, they can report the miner who answered the question. The case will then be passed to all miners to vote on whether the answer is inadequate. If the vote passes, the reported individual’s staked ETH will be confiscated.

### Future Plans

In the future, we aim to allow users to receive help without paying by utilizing a Treasury fund. Miners who help answer questions will receive rewards. Additionally, we plan to issue tokens to reward the miners who answer questions, further strengthening the community.

### Collaboration with Experts

We will collaborate with cybersecurity teams and experts, having them become early miners to answer user questions. Through encryption technology, we will train AI models to help users receive immediate responses. If the AI cannot answer a question, we will use RAG (Retrieval-Augmented Generation) technology to retrieve historical data on the platform to find similar data for the answer. If the AI still cannot provide an answer, the question will be passed to the cybersecurity team.

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
ZIRCUIT_RPC_URL='https://zircuit1.p2pify.com/'
ZIRCUIT_API_KEY=your_zircuit_api_key
OPTIMISM_RPC_URL='https://sepolia.optimism.io'
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
