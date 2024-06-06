// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {FraudBlocker} from "../src/FraudBlocker.sol";

contract DeployFraudBlocker is Script {
    uint256 public DEFAULT_ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external returns (FraudBlocker) {
        if (block.chainid == 48899) {
            vm.startBroadcast();
            FraudBlocker fraudBlocker = new FraudBlocker();
            vm.stopBroadcast();
            return fraudBlocker;
        } else {
            vm.startBroadcast(DEFAULT_ANVIL_PRIVATE_KEY);
            FraudBlocker fraudBlocker = new FraudBlocker();
            vm.stopBroadcast();
            return fraudBlocker;
        }
    }
}
