// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {DeployDeepFact} from "../script/DeployDeepFact.s.sol";
import {DeepFact} from "../src/DeepFact.sol";
import {Test, console} from "forge-std/Test.sol";
import {StdCheats} from "forge-std/StdCheats.sol";

contract DeepFactTest is StdCheats, Test {
    DeepFact deepFact;
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
        deepFact.submitProject{value: AUDITFEE}(
            testBytes,
            testBytes,
            testBytes,
            testBytes
        );
        _;
    }

    modifier _stakeAsAuditor() {
        vm.startPrank(AUDITOR1);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        deepFact.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR2);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        deepFact.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR3);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        deepFact.auditProject(0, testBytes);
        vm.stopPrank();
        _;
    }

    modifier _createProposal() {
        vm.prank(OWNER);
        deepFact.createProposal(0, 0);
        _;
    }

    enum Status {
        Pending,
        Ended
    }

    function setUp() external {
        DeployDeepFact deployer = new DeployDeepFact();
        deepFact = deployer.run();
        AUDITFEE = deepFact.getAuditFee();
        AUDITREWARD = deepFact.getAuditReward();
        HANDLINGFEE = deepFact.getHandlingFee();
        STAKEAMOUNT = deepFact.getStakeAmount();
        LOCKUPPERIOD = deepFact.getLockupPeriod();
        VOTINGDURATION = deepFact.getVotingDuration();
        vm.deal(USER, AUDITFEE);
        vm.deal(AUDITOR1, STAKEAMOUNT * 2);
        vm.deal(AUDITOR2, STAKEAMOUNT);
        vm.deal(AUDITOR3, STAKEAMOUNT);
        vm.deal(AUDITOR4, STAKEAMOUNT);
    }

    function testInitialContract() public view {
        assertEq(deepFact.owner(), OWNER);
        assertEq(deepFact.getTotalProject(), 0);
    }

    function testSubmitProjectError() public {
        vm.prank(USER);
        bytes memory customError = abi.encodeWithSignature(
            "DeepFact__InsufficientAmount()"
        );
        vm.expectRevert(customError);
        deepFact.submitProject(testBytes, testBytes, testBytes, testBytes);
    }

    function testSubmitProject() public _submitProject {
        assertEq(deepFact.getTotalProject(), 1);
        assertEq(deepFact.getProjectData(0).id, 0);
        assertEq(
            abi.decode(deepFact.getProjectData(0).aiAuditResult, (string)),
            testString
        );
        assertEq(
            abi.decode(deepFact.getProjectData(0).projectName, (string)),
            testString
        );
        assertEq(
            abi.decode(deepFact.getProjectData(0).projectLink, (string)),
            testString
        );
        assertEq(
            abi.decode(deepFact.getProjectData(0).projectDescription, (string)),
            testString
        );
        assertEq(
            uint(deepFact.getProjectData(0).status),
            uint(DeepFact.Status.Pending)
        );
        assertEq(address(deepFact).balance, AUDITFEE - HANDLINGFEE);
        assertEq(USER.balance, 0 ether);
        assertEq(deepFact.getSubmittedProjects(USER)[0], 0);
    }

    function testAuditProjectError() public _submitProject {
        vm.prank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "DeepFact__YouAreNotAuditor()"
        );
        vm.expectRevert(customError);
        deepFact.auditProject(0, testBytes);

        vm.startPrank(AUDITOR1);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        customError = abi.encodeWithSignature(
            "DeepFact__ProjectDoesNotExist()"
        );
        vm.expectRevert(customError);
        deepFact.auditProject(1, testBytes);
        vm.stopPrank();

        vm.startPrank(AUDITOR1);
        deepFact.auditProject(0, testBytes);
        customError = abi.encodeWithSignature(
            "DeepFact__YouHaveAlreadyAuditedThisProject()"
        );
        vm.expectRevert(customError);
        deepFact.auditProject(0, testBytes);
        vm.stopPrank();

        vm.startPrank(AUDITOR2);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        deepFact.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR3);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        deepFact.auditProject(0, testBytes);
        vm.stopPrank();
        vm.startPrank(AUDITOR4);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        customError = abi.encodeWithSignature("DeepFact__AuditHasEnded()");
        vm.expectRevert(customError);
        deepFact.auditProject(0, testBytes);
        vm.stopPrank();
    }

    function testAuditProject() public _submitProject _stakeAsAuditor {
        assertEq(
            uint(deepFact.getProjectData(0).status),
            uint(DeepFact.Status.Ended)
        );
        assertEq(deepFact.getProjectData(0).auditor[0], AUDITOR1);
        assertEq(deepFact.getProjectData(0).auditResult[0], testBytes);
        assertEq(deepFact.getLastAuditTimestamp(AUDITOR1), block.timestamp);
        assertEq(AUDITOR1.balance, STAKEAMOUNT + AUDITREWARD);
        assertEq(AUDITOR2.balance, AUDITREWARD);
        assertEq(AUDITOR3.balance, AUDITREWARD);
        assertEq(address(deepFact).balance, STAKEAMOUNT * 3);
        assertEq(
            uint(deepFact.getProjectData(0).status),
            uint(DeepFact.Status.Ended)
        );
    }

    function testStakeAsAuditorError() public {
        vm.startPrank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "DeepFact__InsufficientAmount()"
        );
        vm.expectRevert(customError);
        deepFact.stakeAsAuditor();

        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        customError = abi.encodeWithSignature(
            "DeepFact__YouAreAlreadyAnAuditor()"
        );
        vm.expectRevert(customError);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        vm.stopPrank();
    }

    function testStakeAsAuditor() public {
        vm.prank(AUDITOR1);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();

        assertEq(deepFact.getIsAuditor(AUDITOR1), true);
    }

    function testRevokeAndWithdrawStakeError() public _submitProject {
        vm.prank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "DeepFact__TheUserIsNotAnAuditor()"
        );
        vm.expectRevert(customError);
        deepFact.revokeAndWithdrawStake();

        vm.startPrank(AUDITOR1);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        deepFact.auditProject(0, testBytes);
        customError = abi.encodeWithSignature(
            "DeepFact__YouHaveToWaitThreeDaysAfterAuditBeforeRevoke()"
        );
        vm.expectRevert(customError);
        deepFact.revokeAndWithdrawStake();
    }

    function testRevokeAndWithdrawStake() public _submitProject {
        vm.startPrank(AUDITOR1);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
        deepFact.auditProject(0, testBytes);
        vm.warp(block.timestamp + LOCKUPPERIOD);
        deepFact.revokeAndWithdrawStake();
        vm.stopPrank();

        assertEq(deepFact.getIsAuditor(AUDITOR1), false);
        assertEq(AUDITOR1.balance, STAKEAMOUNT * 2 + AUDITREWARD);
        assertEq(
            address(deepFact).balance,
            AUDITFEE - AUDITREWARD - HANDLINGFEE
        );
    }

    function testCreateProposalError() public _submitProject {
        vm.prank(USER);
        bytes memory customError = abi.encodeWithSignature(
            "DeepFact__ProjectDoesNotExist()"
        );
        vm.expectRevert(customError);
        deepFact.createProposal(1, 0);

        vm.prank(USER);
        customError = abi.encodeWithSignature(
            "DeepFact__TheAuditorDoesNotExist()"
        );
        vm.expectRevert(customError);
        deepFact.createProposal(0, 3);
    }

    function testCreateProposal()
        public
        _submitProject
        _stakeAsAuditor
        _createProposal
    {
        (
            ,
            ,
            ,
            uint256 startTime,
            uint256 yesVotes,
            uint256 noVotes,
            DeepFact.Status status
        ) = deepFact.getProposalInfo(0);

        assertEq(startTime, block.timestamp);
        assertEq(deepFact.getTotalProposal(), 1);
        assertEq(yesVotes, 0);
        assertEq(noVotes, 0);
        assertEq(uint(status), uint(DeepFact.Status.Pending));
    }

    function testVoteOnProposalError()
        public
        _submitProject
        _stakeAsAuditor
        _createProposal
    {
        vm.prank(AUDITOR1);
        bytes memory customError = abi.encodeWithSignature(
            "DeepFact__ProjectDoesNotExist()"
        );
        vm.expectRevert(customError);
        deepFact.voteOnProposal(1, true);

        vm.prank(USER);
        customError = abi.encodeWithSignature("DeepFact__YouAreNotAuditor()");
        vm.expectRevert(customError);
        deepFact.voteOnProposal(0, true);

        vm.startPrank(AUDITOR1);
        deepFact.voteOnProposal(0, true);
        customError = abi.encodeWithSignature(
            "DeepFact__YouHaveAlreadyVoted()"
        );
        vm.expectRevert(customError);
        deepFact.voteOnProposal(0, true);
        vm.stopPrank();

        vm.warp(block.timestamp + VOTINGDURATION + 1);
        vm.prank(AUDITOR2);
        deepFact.voteOnProposal(0, true);
        vm.prank(AUDITOR3);
        customError = abi.encodeWithSignature("DeepFact__VotingHasEnded()");
        vm.expectRevert(customError);
        deepFact.voteOnProposal(0, true);

        vm.prank(AUDITOR1);
        customError = abi.encodeWithSignature(
            "DeepFact__YouAreOnTheBlacklist()"
        );
        vm.expectRevert(customError);
        deepFact.stakeAsAuditor{value: STAKEAMOUNT}();
    }

    function testVoteOnProposalPass()
        public
        _submitProject
        _stakeAsAuditor
        _createProposal
    {
        uint256 contractStartBalance = address(deepFact).balance;
        uint256 victimStartBalance = USER.balance;

        vm.prank(AUDITOR1);
        deepFact.voteOnProposal(0, true);
        vm.warp(block.timestamp + VOTINGDURATION + 1);
        vm.prank(AUDITOR2);
        deepFact.voteOnProposal(0, true);

        (
            ,
            ,
            ,
            ,
            uint256 yesVotes,
            uint256 noVotes,
            DeepFact.Status status
        ) = deepFact.getProposalInfo(0);

        assertEq(yesVotes, 2);
        assertEq(noVotes, 0);
        assertEq(uint(status), uint(DeepFact.Status.Ended));
        assertEq(address(deepFact).balance, contractStartBalance - STAKEAMOUNT);
        assertEq(USER.balance, victimStartBalance + STAKEAMOUNT);
        assertEq(deepFact.getIsAuditor(AUDITOR1), false);
        assertEq(deepFact.getIsBlacklist(AUDITOR1), true);
    }

    function testVoteOnProposalDoesNotPass()
        public
        _submitProject
        _stakeAsAuditor
        _createProposal
    {
        uint256 contractStartBalance = address(deepFact).balance;
        uint256 victimStartBalance = USER.balance;

        vm.prank(AUDITOR1);
        deepFact.voteOnProposal(0, false);
        vm.warp(block.timestamp + VOTINGDURATION + 1);
        vm.prank(AUDITOR2);
        deepFact.voteOnProposal(0, false);

        (
            ,
            ,
            ,
            ,
            uint256 yesVotes,
            uint256 noVotes,
            DeepFact.Status status
        ) = deepFact.getProposalInfo(0);

        assertEq(yesVotes, 0);
        assertEq(noVotes, 2);
        assertEq(uint(status), uint(DeepFact.Status.Ended));
        assertEq(address(deepFact).balance, contractStartBalance);
        assertEq(USER.balance, victimStartBalance);
        assertEq(deepFact.getIsAuditor(AUDITOR1), true);
        assertEq(deepFact.getIsBlacklist(AUDITOR1), false);
    }
}
