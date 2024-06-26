-include .env

.PHONY: all test clean deploy fund help install snapshot format anvil 

DEFAULT_ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

all: clean remove install update build

# Clean the repo
clean  :; forge clean

# Remove modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

# Update Dependencies
update:; forge update

build:; forge build

test :; forge test 

snapshot :; forge snapshot

format :; forge fmt

anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1

coverage :; forge coverage --report debug > coverage.txt

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(DEFAULT_ANVIL_KEY) --broadcast

Deploy:
	@forge script script/DeployFraudBlocker.s.sol:DeployFraudBlocker --rpc-url $(ZIRCUIT_RPC_URL) --account deployer --broadcast

Verify:
	@forge verify-contract --verifier-url https://explorer.zircuit.com/api/contractVerifyHardhat 0xF47B94232B16AB794915cCcCFE4AFf930CcA15FF src/FraudBlocker.sol:FraudBlocker --root . --etherscan-api-key $(ZIRCUIT_API_KEY)