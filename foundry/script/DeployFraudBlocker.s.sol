// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {FraudBlocker} from "../src/FraudBlocker.sol";

contract DeployFraudBlockeer is Script {
    uint256 deployerKey = vm.envUint("PRIVATE_KEY");

    function run() external returns (FraudBlocker) {
        vm.startBroadcast(deployerKey);
        FraudBlocker fraudBlocker = new FraudBlocker();
        vm.stopBroadcast();
        return fraudBlocker;
    }
}
