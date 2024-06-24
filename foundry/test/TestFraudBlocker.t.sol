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
    uint256 private VOTINGDURATION;

    modifier _submitProject() {
        vm.prank(USER);
        fraudBlocker.submitProject{value: AUDITFEE}(
            testBytes,
            testBytes,
            testBytes,
            testBytes
        );
        _;
    }

    modifier _stakeAsAuditor() {
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
        _;
    }

    modifier _createProposal() {
        vm.prank(OWNER);
        fraudBlocker.createProposal(0, 0);
        _;
    }

    enum Status {
        Pending,
        Ended
    }

    function setUp() external {
        DeployFraudBlocker deployer = new DeployFraudBlocker();
        fraudBlocker = deployer.run();
        AUDITFEE = fraudBlocker.getAuditFee();
        AUDITREWARD = fraudBlocker.getAuditReward();
        HANDLINGFEE = fraudBlocker.getHandlingFee();
        STAKEAMOUNT = fraudBlocker.getStakeAmount();
        LOCKUPPERIOD = fraudBlocker.getLockupPeriod();
        VOTINGDURATION = fraudBlocker.getVotingDuration();
        vm.deal(USER, AUDITFEE);
        vm.deal(AUDITOR1, STAKEAMOUNT * 2);
        vm.deal(AUDITOR2, STAKEAMOUNT);
        vm.deal(AUDITOR3, STAKEAMOUNT);
        vm.deal(AUDITOR4, STAKEAMOUNT);
    }

    function testInitialContract() public view {
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

    function testSubmitProject() public _submitProject {
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

    function testAuditProjectError() public _submitProject {
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

    function testAuditProject() public _submitProject _stakeAsAuditor {
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
    }

    function testStakeAsAuditor() public {
        vm.prank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();

        assertEq(fraudBlocker.getIsAuditor(AUDITOR1), true);
    }

    function testRevokeAndWithdrawStakeError() public _submitProject {
        vm.prank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__TheUserIsNotAnAuditor()"
        );
        vm.expectRevert(customError);
        fraudBlocker.revokeAndWithdrawStake();

        vm.startPrank(AUDITOR1);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
        fraudBlocker.auditProject(0, testBytes);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouHaveToWaitThreeDaysAfterAuditBeforeRevoke()"
        );
        vm.expectRevert(customError);
        fraudBlocker.revokeAndWithdrawStake();
    }

    function testRevokeAndWithdrawStake() public _submitProject {
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

    function testCreateProposalError() public _submitProject {
        vm.prank(USER);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__ProjectDoesNotExist()"
        );
        vm.expectRevert(customError);
        fraudBlocker.createProposal(1, 0);

        vm.prank(USER);
        customError = abi.encodeWithSignature(
            "FraudBlocker__TheAuditorDoesNotExist()"
        );
        vm.expectRevert(customError);
        fraudBlocker.createProposal(0, 3);
    }

    function testCreateProposal()
        public
        _submitProject
        _stakeAsAuditor
        _createProposal
    {
        (
            uint256 startTime,
            uint256 yesVotes,
            uint256 noVotes,
            FraudBlocker.Status status
        ) = fraudBlocker.getProposalInfo(0);

        assertEq(startTime, block.timestamp);
        assertEq(yesVotes, 0);
        assertEq(noVotes, 0);
        assertEq(uint(status), uint(FraudBlocker.Status.Pending));
    }

    function testVoteOnProposalError()
        public
        _submitProject
        _stakeAsAuditor
        _createProposal
    {
        vm.prank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "FraudBlocker__ProjectDoesNotExist()"
        );
        vm.expectRevert(customError);
        fraudBlocker.voteOnProposal(1, true);

        vm.prank(USER);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouAreNotAuditor()"
        );
        vm.expectRevert(customError);
        fraudBlocker.voteOnProposal(0, true);

        vm.startPrank(AUDITOR1);
        fraudBlocker.voteOnProposal(0, true);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouHaveAlreadyVoted()"
        );
        vm.expectRevert(customError);
        fraudBlocker.voteOnProposal(0, true);
        vm.stopPrank();

        vm.warp(block.timestamp + VOTINGDURATION + 1);
        vm.prank(AUDITOR2);
        fraudBlocker.voteOnProposal(0, true);
        vm.prank(AUDITOR3);
        customError = abi.encodeWithSignature("FraudBlocker__VotingHasEnded()");
        vm.expectRevert(customError);
        fraudBlocker.voteOnProposal(0, true);

        vm.prank(AUDITOR1);
        customError = abi.encodeWithSignature(
            "FraudBlocker__YouAreOnTheBlacklist()"
        );
        vm.expectRevert(customError);
        fraudBlocker.stakeAsAuditor{value: STAKEAMOUNT}();
    }

    function testVoteOnProposalPass()
        public
        _submitProject
        _stakeAsAuditor
        _createProposal
    {
        uint256 contractStartBalance = address(fraudBlocker).balance;
        uint256 victimStartBalance = USER.balance;

        vm.prank(AUDITOR1);
        fraudBlocker.voteOnProposal(0, true);
        vm.warp(block.timestamp + VOTINGDURATION + 1);
        vm.prank(AUDITOR2);
        fraudBlocker.voteOnProposal(0, true);

        (
            ,
            uint256 yesVotes,
            uint256 noVotes,
            FraudBlocker.Status status
        ) = fraudBlocker.getProposalInfo(0);

        assertEq(yesVotes, 2);
        assertEq(noVotes, 0);
        assertEq(uint(status), uint(FraudBlocker.Status.Ended));
        assertEq(
            address(fraudBlocker).balance,
            contractStartBalance - STAKEAMOUNT
        );
        assertEq(USER.balance, victimStartBalance + STAKEAMOUNT);
        assertEq(fraudBlocker.getIsAuditor(AUDITOR1), false);
        assertEq(fraudBlocker.getIsBlacklist(AUDITOR1), true);
    }

    function testVoteOnProposalDoesNotPass()
        public
        _submitProject
        _stakeAsAuditor
        _createProposal
    {
        uint256 contractStartBalance = address(fraudBlocker).balance;
        uint256 victimStartBalance = USER.balance;

        vm.prank(AUDITOR1);
        fraudBlocker.voteOnProposal(0, false);
        vm.warp(block.timestamp + VOTINGDURATION + 1);
        vm.prank(AUDITOR2);
        fraudBlocker.voteOnProposal(0, false);

        (
            ,
            uint256 yesVotes,
            uint256 noVotes,
            FraudBlocker.Status status
        ) = fraudBlocker.getProposalInfo(0);

        assertEq(yesVotes, 0);
        assertEq(noVotes, 2);
        assertEq(uint(status), uint(FraudBlocker.Status.Ended));
        assertEq(address(fraudBlocker).balance, contractStartBalance);
        assertEq(USER.balance, victimStartBalance);
        assertEq(fraudBlocker.getIsAuditor(AUDITOR1), true);
        assertEq(fraudBlocker.getIsBlacklist(AUDITOR1), false);
    }
}
