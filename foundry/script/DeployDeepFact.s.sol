// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {DeepFact} from "../src/DeepFact.sol";

contract DeployDeepFact is Script {
    uint256 public DEFAULT_ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external returns (DeepFact) {
        if (block.chainid == 48899) {
            vm.startBroadcast();
            DeepFact deepFact = new DeepFact();
            vm.stopBroadcast();
            return deepFact;
        } else if (block.chainid == 11155420) {
            vm.startBroadcast();
            DeepFact deepFact = new DeepFact();
            vm.stopBroadcast();
            return deepFact;
        } else {
            vm.startBroadcast(DEFAULT_ANVIL_PRIVATE_KEY);
            DeepFact deepFact = new DeepFact();
            vm.stopBroadcast();
            return deepFact;
        }
    }
}
