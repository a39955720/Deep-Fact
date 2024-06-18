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
    uint256 private AUDITFEE;
    uint256 private AUDITREWARD;
    uint256 private HANDLINGFEE;
    uint256 private STAKEAMOUNT;
    uint256 private LOCKUPPERIOD;

    function setUp() external {
        DeployFraudBlocker deployer = new DeployFraudBlocker();
        fraudBlocker = deployer.run();
        AUDITFEE = fraudBlocker.getAuditFee();
        AUDITREWARD = fraudBlocker.getAuditReward();
        HANDLINGFEE = fraudBlocker.getHandlingFee();
        STAKEAMOUNT = fraudBlocker.getStakeAmount();
        LOCKUPPERIOD = fraudBlocker.getLockupPeriod();
        vm.deal(USER, AUDITFEE);
        vm.deal(AUDITOR1, STAKEAMOUNT * 2);
        vm.deal(AUDITOR2, STAKEAMOUNT);
        vm.deal(AUDITOR3, STAKEAMOUNT);
        vm.deal(AUDITOR4, STAKEAMOUNT);
    }

    function testInitialContract() public {
        assertEq(fraudBlocker.owner(), OWNER);
        assertEq(fraudBlocker.getTotalProject(), 0);
    }

    function testSubmitProjectError() public {
        vm.prank(USER);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__InsufficientAmount()"
        );
        vm.expectRevert(customError);
        fraudBlocker.submitProject(testBytes, testBytes, testBytes, testBytes);
    }

    function testSubmitProject() public {
        vm.prank(USER);
        fraudBlocker.submitProject{value: AUDITFEE}(
            testBytes,
            testBytes,
            testBytes,
            testBytes
        );

        assertEq(fraudBlocker.getTotalProject(), 1);
        assertEq(fraudBlocker.getProjectData(0).id, 0);
        assertEq(
            abi.decode(fraudBlocker.getProjectData(0).aiAuditResult, (string)),
            testString
        );
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
        assertEq(address(fraudBlocker).balance, AUDITFEE - HANDLINGFEE);
        assertEq(USER.balance, 0 ether);
        assertEq(fraudBlocker.getSubmittedProjects(USER)[0], 0);
    }

    function testAuditProjectError() public {
        vm.prank(USER);
        fraudBlocker.submitProject{value: AUDITFEE}(
            testBytes,
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
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
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
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR3);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR4);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        customError = abi.encodeWithSignature("FraudBlocker__AuditHasEnded()");
        vm.expectRevert(customError);
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
    }

    function testAuditProject() public {
        vm.prank(USER);
        fraudBlocker.submitProject{value: AUDITFEE}(
            testBytes,
            testBytes,
            testBytes,
            testBytes
        );

        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR2);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR3);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        fraudBlocker.auditProject(0, testBytes);
        vm.stopPrank();

        assertEq(
            uint(fraudBlocker.getProjectData(0).status),
            uint(FraudBlocker.Status.Ended)
        );
        assertEq(fraudBlocker.getProjectData(0).auditor[0], AUDITOR1);
        assertEq(fraudBlocker.getProjectData(0).auditResult[0], testBytes);
        assertEq(fraudBlocker.getLastAuditTimestamp(AUDITOR1), block.timestamp);
        assertEq(AUDITOR1.balance, STAKEAMOUNT + AUDITREWARD);
        assertEq(AUDITOR2.balance, AUDITREWARD);
        assertEq(AUDITOR3.balance, AUDITREWARD);
        assertEq(address(fraudBlocker).balance, STAKEAMOUNT * 3);
        assertEq(
            uint(fraudBlocker.getProjectData(0).status),
            uint(FraudBlocker.Status.Ended)
        );
    }

    function testStakeAsAuditorError() public {
        vm.startPrank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__InsufficientAmount()"
        );
        vm.expectRevert(customError);
        fraudBlocker.stakeAsAuditor();

        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouAreAlreadyAnAuditor()"
        );
        vm.expectRevert(customError);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        vm.stopPrank();

        vm.prank(OWNER);
        fraudBlocker.blockAuditor(AUDITOR1);
        vm.prank(AUDITOR1);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouAreOnTheBlacklist()"
        );
        vm.expectRevert(customError);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
    }

    function testStakeAsAuditor() public {
        vm.prank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();

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
        fraudBlocker.submitProject{value: AUDITFEE}(
            testBytes,
            testBytes,
            testBytes,
            testBytes
        );
        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        fraudBlocker.auditProject(0, testBytes);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouHaveToWaitThreeDaysAfterAuditBeforeRevoke()"
        );
        vm.expectRevert(customError);
        fraudBlocker.revokeAndWithdrawStake();
    }

    function testRevokeAndWithdrawStake() public {
        vm.prank(USER);
        fraudBlocker.submitProject{value: AUDITFEE}(
            testBytes,
            testBytes,
            testBytes,
            testBytes
        );
        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        fraudBlocker.auditProject(0, testBytes);
        vm.warp(block.timestamp + LOCKUPPERIOD);
        fraudBlocker.revokeAndWithdrawStake();
        vm.stopPrank();

        assertEq(fraudBlocker.getIsAuditor(AUDITOR1), false);
        assertEq(AUDITOR1.balance, STAKEAMOUNT * 2 + AUDITREWARD);
        assertEq(
            address(fraudBlocker).balance,
            AUDITFEE - AUDITREWARD - HANDLINGFEE
        );
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
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        vm.startPrank(OWNER);
        fraudBlocker.blockAuditor(AUDITOR1);

        assertEq(fraudBlocker.getIsAuditor(AUDITOR1), false);
        assertEq(AUDITOR1.balance, STAKEAMOUNT);
        assertEq(address(OWNER).balance, STAKEAMOUNT);
    }
}
