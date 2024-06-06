// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {DeployFraudBlocker} from "../script/DeployFraudBlocker.s.sol";
import {FraudBlocker} from "../src/FraudBlocker.sol";
import {Test, console} from "forge-std/Test.sol";
import {StdCheats} from "forge-std/StdCheats.sol";

contract FraudBlockerTest is StdCheats, Test {
    FraudBlocker fraudBlocker;
    address USER = makeAddr("user");
    address AUDITOR1 = makeAddr("auditor1");
    address AUDITOR2 = makeAddr("auditor2");
    address AUDITOR3 = makeAddr("auditor3");
    address AUDITOR4 = makeAddr("auditor4");
    address OWNER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    string testString = "TEST";
    bytes testBytes = abi.encode(testString);

    function setUp() external {
        DeployFraudBlocker deployer = new DeployFraudBlocker();
        fraudBlocker = deployer.run();
        vm.warp(block.timestamp + 3 days);
        vm.deal(USER, 0.003 ether);
        vm.deal(AUDITOR1, 0.2 ether);
        vm.deal(AUDITOR2, 0.1 ether);
        vm.deal(AUDITOR3, 0.1 ether);
        vm.deal(AUDITOR4, 0.1 ether);
    }

    function testSubmitProjectError() public {
        vm.prank(USER);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__InsufficientAmount()"
        );
        vm.expectRevert(customError);
        fraudBlocker.submitProject(testBytes, testBytes, testBytes);
    }

    function testSubmitProject() public {
        vm.prank(USER);
        fraudBlocker.submitProject{value: 0.003 ether}(
            testBytes,
            testBytes,
            testBytes
        );

        assertEq(fraudBlocker.getTotalProject(), 1);
        assertEq(fraudBlocker.getProjectData(0).id, 0);
        assertEq(
            abi.decode(fraudBlocker.getProjectData(0).projectName, (string)),
            testString
        );
        assertEq(
            abi.decode(fraudBlocker.getProjectData(0).projectLink, (string)),
            testString
        );
        assertEq(
            abi.decode(
                fraudBlocker.getProjectData(0).projectDescription,
                (string)
            ),
            testString
        );
        assertEq(
            uint(fraudBlocker.getProjectData(0).status),
            uint(FraudBlocker.Status.Pending)
        );
        assertEq(address(fraudBlocker).balance, 0.003 ether);
        assertEq(USER.balance, 0 ether);
    }

    function testAuditProjectError() public {
        vm.prank(USER);
        fraudBlocker.submitProject{value: 0.003 ether}(
            testBytes,
            testBytes,
            testBytes
        );

        vm.prank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__YouAreNotAuditor()"
        );
        vm.expectRevert(customError);
        fraudBlocker.auditProject(0, testBytes);

        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        customError = abi.encodeWithSignature(
            "FraudBlocker__ProjectDoesNotExist()"
        );
        vm.expectRevert(customError);
        fraudBlocker.auditProject(1, testBytes);
        vm.stopPrank();

        vm.startPrank(AUDITOR1);
        fraudBlocker.auditProject(0, testBytes);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouHaveAlreadyAuditedThisProject()"
        );
        vm.expectRevert(customError);
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();

        vm.startPrank(AUDITOR2);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR3);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR4);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        customError = abi.encodeWithSignature("FraudBlocker__AuditHasEnded()");
        vm.expectRevert(customError);
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
    }

    function testAuditProject() public {
        vm.prank(USER);
        fraudBlocker.submitProject{value: 0.003 ether}(
            testBytes,
            testBytes,
            testBytes
        );

        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR2);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR3);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();

        assertEq(
            uint(fraudBlocker.getProjectData(0).status),
            uint(FraudBlocker.Status.Ended)
        );
        assertEq(fraudBlocker.getProjectData(0).auditor[0], AUDITOR1);
        assertEq(fraudBlocker.getProjectData(0).auditResult[0], testBytes);
        assertEq(fraudBlocker.getLastAuditTimestamp(AUDITOR1), block.timestamp);
        assertEq(AUDITOR1.balance, 0.101 ether);
        assertEq(AUDITOR2.balance, 0.001 ether);
        assertEq(AUDITOR3.balance, 0.001 ether);
        assertEq(address(fraudBlocker).balance, 0.3 ether);
    }

    function testStakeAsAuditorError() public {
        vm.startPrank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__InsufficientAmount()"
        );
        vm.expectRevert(customError);
        fraudBlocker.stakeAsAuditor();

        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouAreAlreadyAnAuditor()"
        );
        vm.expectRevert(customError);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        vm.stopPrank();

        vm.prank(OWNER);
        fraudBlocker.blockAuditor(AUDITOR1);
        vm.prank(AUDITOR1);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouAreOnTheBlacklist()"
        );
        vm.expectRevert(customError);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
    }

    function testStakeAsAuditor() public {
        vm.prank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();

        assertEq(fraudBlocker.getIsAuditor(AUDITOR1), true);
    }

    function testRevokeAndWithdrawStakeError() public {
        vm.prank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__TheUserIsNotAnAuditor()"
        );
        vm.expectRevert(customError);
        fraudBlocker.revokeAndWithdrawStake();

        vm.prank(USER);
        fraudBlocker.submitProject{value: 0.003 ether}(
            testBytes,
            testBytes,
            testBytes
        );
        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        fraudBlocker.auditProject(0, testBytes);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouHaveToWaitThreeDaysAfterAuditBeforeRevoke()"
        );
        vm.expectRevert(customError);
        fraudBlocker.revokeAndWithdrawStake();
    }

    function testRevokeAndWithdrawStake() public {
        vm.prank(USER);
        fraudBlocker.submitProject{value: 0.003 ether}(
            testBytes,
            testBytes,
            testBytes
        );
        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        fraudBlocker.auditProject(0, testBytes);
        vm.warp(block.timestamp + 3 days);
        fraudBlocker.revokeAndWithdrawStake();
        vm.stopPrank();

        assertEq(fraudBlocker.getIsAuditor(AUDITOR1), false);
        assertEq(AUDITOR1.balance, 0.201 ether);
        assertEq(address(fraudBlocker).balance, 0.002 ether);
    }

    function testBlockAuditorError() public {
        vm.prank(USER);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", USER)
        );
        fraudBlocker.blockAuditor(AUDITOR1);

        vm.prank(OWNER);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__TheUserIsNotAnAuditor()"
        );
        vm.expectRevert(customError);
        fraudBlocker.blockAuditor(AUDITOR1);
    }

    function testBlockAuditor() public {
        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: 0.1 ether}();
        vm.startPrank(OWNER);
        fraudBlocker.blockAuditor(AUDITOR1);

        assertEq(fraudBlocker.getIsAuditor(AUDITOR1), false);
        assertEq(AUDITOR1.balance, 0.1 ether);
        assertEq(address(OWNER).balance, 0.1 ether);
    }
}
