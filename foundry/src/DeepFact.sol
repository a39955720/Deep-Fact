// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error DeepFact__InsufficientAmount();
error DeepFact__ProjectDoesNotExist();
error DeepFact__AuditHasEnded();
error DeepFact__VotingHasEnded();
error DeepFact__YouAreNotAuditor();
error DeepFact__YouAreAlreadyAnAuditor();
error DeepFact__TheUserIsNotAnAuditor();
error DeepFact__TransferFailed();
error DeepFact__YouAreOnTheBlacklist();
error DeepFact__YouHaveAlreadyAuditedThisProject();
error DeepFact__YouHaveAlreadyVoted();
error DeepFact__YouHaveToWaitThreeDaysAfterAuditBeforeRevoke();
error DeepFact__TheAuditorDoesNotExist();
error DeepFact__TheProposalIsCreated();

contract DeepFact is Ownable, ReentrancyGuard {
    enum Status {
        Pending,
        Ended
    }

    struct ProjectData {
        uint256 id;
        address submitter;
        bytes projectName;
        bytes projectLink;
        bytes projectDescription;
        bytes aiAuditResult;
        address[3] auditor;
        bytes[3] auditResult;
        Status status;
    }

    struct Proposal {
        uint256 id;
        uint256 projectId;
        uint8 reportedAuditor;
        uint256 startTime;
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => bool) isVoted;
        Status status;
    }

    uint256 private s_idCounter;
    uint256 private s_proposalIdCounter;
    uint256 private constant AUDITFEE = 0.004 ether;
    uint256 private constant AUDITREWARD = 0.001 ether;
    uint256 private constant HANDLINGFEE = 0.001 ether;
    uint256 private constant STAKEAMOUNT = 0.1 ether;
    uint256 private constant LOCKUPPERIOD = 15 days;
    uint256 private constant VOTINGDURATION = 3 days;

    mapping(uint256 => ProjectData) private s_projectData;
    mapping(uint256 => Proposal) private s_proposals;
    mapping(address => uint256[]) private s_submittedProjects;
    mapping(address => uint256) private s_lastAuditTimestamp;
    mapping(address => bool) private s_isAuditor;
    mapping(address => bool) private s_blacklist;
    mapping(uint256 => bool) private s_isCreated;

    constructor() Ownable(msg.sender) {
        s_idCounter = 0;
        s_proposalIdCounter = 0;
    }

    function withadrawAll__ForTest() public onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        if (!success) {
            revert DeepFact__TransferFailed();
        }
    }

    function submitProject(
        bytes memory _projectName,
        bytes memory _projectLink,
        bytes memory _projectDescription,
        bytes memory _aiAuditResult
    ) public payable {
        if (msg.value != AUDITFEE) {
            revert DeepFact__InsufficientAmount();
        }

        s_projectData[s_idCounter].id = s_idCounter;
        s_projectData[s_idCounter].submitter = msg.sender;
        s_projectData[s_idCounter].projectName = _projectName;
        s_projectData[s_idCounter].projectLink = _projectLink;
        s_projectData[s_idCounter].projectDescription = _projectDescription;
        s_projectData[s_idCounter].status = Status.Pending;
        s_projectData[s_idCounter].aiAuditResult = _aiAuditResult;

        s_submittedProjects[msg.sender].push(s_idCounter);
        s_idCounter++;

        (bool success, ) = owner().call{value: HANDLINGFEE}("");
        if (!success) {
            revert DeepFact__TransferFailed();
        }
    }

    function auditProject(
        uint256 _projectId,
        bytes memory _auditResult
    ) public nonReentrant {
        if (_projectId >= s_idCounter) {
            revert DeepFact__ProjectDoesNotExist();
        }
        if (s_projectData[_projectId].status == Status.Ended) {
            revert DeepFact__AuditHasEnded();
        }
        if (s_isAuditor[msg.sender] == false) {
            revert DeepFact__YouAreNotAuditor();
        }

        for (uint256 i = 0; i < 3; i++) {
            if (s_projectData[_projectId].auditor[i] == address(0)) {
                for (uint256 j = 0; j < i; j++) {
                    if (s_projectData[_projectId].auditor[j] == msg.sender) {
                        revert DeepFact__YouHaveAlreadyAuditedThisProject();
                    }
                }
                s_projectData[_projectId].auditor[i] = msg.sender;
                s_projectData[_projectId].auditResult[i] = _auditResult;
                s_lastAuditTimestamp[msg.sender] = block.timestamp;
                if (i == 2) {
                    s_projectData[_projectId].status = Status.Ended;
                }
                (bool success, ) = msg.sender.call{value: AUDITREWARD}("");
                if (!success) {
                    revert DeepFact__TransferFailed();
                }
                break;
            }
        }
    }

    function stakeAsAuditor() public payable {
        if (msg.value != STAKEAMOUNT) {
            revert DeepFact__InsufficientAmount();
        }
        if (s_isAuditor[msg.sender] == true) {
            revert DeepFact__YouAreAlreadyAnAuditor();
        }
        if (s_blacklist[msg.sender] == true) {
            revert DeepFact__YouAreOnTheBlacklist();
        }

        s_isAuditor[msg.sender] = true;
    }

    function revokeAndWithdrawStake() public nonReentrant {
        if (s_isAuditor[msg.sender] == false) {
            revert DeepFact__TheUserIsNotAnAuditor();
        }

        if (s_lastAuditTimestamp[msg.sender] + LOCKUPPERIOD > block.timestamp) {
            revert DeepFact__YouHaveToWaitThreeDaysAfterAuditBeforeRevoke();
        }

        s_isAuditor[msg.sender] = false;

        (bool success, ) = msg.sender.call{value: STAKEAMOUNT}("");
        if (!success) {
            revert DeepFact__TransferFailed();
        }
    }

    function createProposal(uint256 _projectId, uint8 _reportedAuditor) public {
        if (_projectId >= s_idCounter) {
            revert DeepFact__ProjectDoesNotExist();
        }

        if (_reportedAuditor > 2) {
            revert DeepFact__TheAuditorDoesNotExist();
        }

        if (s_isCreated[_projectId]) {
            revert DeepFact__TheProposalIsCreated();
        }

        s_isCreated[_projectId] = true;
        s_proposals[s_proposalIdCounter].id = s_proposalIdCounter;
        s_proposals[s_proposalIdCounter].projectId = _projectId;
        s_proposals[s_proposalIdCounter].reportedAuditor = _reportedAuditor;
        s_proposals[s_proposalIdCounter].startTime = block.timestamp;
        s_proposals[s_proposalIdCounter].status = Status.Pending;
        s_proposalIdCounter++;
    }

    function voteOnProposal(uint256 _proposalId, bool _vote) public {
        if (_proposalId >= s_proposalIdCounter) {
            revert DeepFact__ProjectDoesNotExist();
        }
        if (s_proposals[_proposalId].status == Status.Ended) {
            revert DeepFact__VotingHasEnded();
        }
        if (s_isAuditor[msg.sender] == false) {
            revert DeepFact__YouAreNotAuditor();
        }
        if (s_proposals[_proposalId].isVoted[msg.sender] == true) {
            revert DeepFact__YouHaveAlreadyVoted();
        }

        if (_vote) {
            s_proposals[_proposalId].yesVotes++;
        } else {
            s_proposals[_proposalId].noVotes++;
        }

        s_proposals[_proposalId].isVoted[msg.sender] = true;

        if (
            s_proposals[_proposalId].startTime + VOTINGDURATION <
            block.timestamp
        ) {
            if (
                s_proposals[_proposalId].yesVotes >
                s_proposals[_proposalId].noVotes
            ) {
                blockAuditor(
                    s_projectData[s_proposals[_proposalId].projectId].auditor[
                        s_proposals[_proposalId].reportedAuditor
                    ],
                    s_projectData[s_proposals[_proposalId].projectId].submitter
                );
            }
            s_proposals[_proposalId].status = Status.Ended;
        }
    }

    function blockAuditor(
        address auditor,
        address victim
    ) private nonReentrant {
        s_isAuditor[auditor] = false;
        s_blacklist[auditor] = true;
        (bool success, ) = victim.call{value: STAKEAMOUNT}("");
        if (!success) {
            revert DeepFact__TransferFailed();
        }
    }

    function getTotalProject() public view returns (uint256) {
        return s_idCounter;
    }

    function getTotalProposal() public view returns (uint256) {
        return s_proposalIdCounter;
    }

    function getProjectData(
        uint256 _id
    ) public view returns (ProjectData memory) {
        return s_projectData[_id];
    }

    function getProposalInfo(
        uint256 _id
    )
        public
        view
        returns (
            uint256 id,
            uint256 projectId,
            uint8 reportedAuditor,
            uint256 startTime,
            uint256 yesVotes,
            uint256 noVotes,
            Status status
        )
    {
        Proposal storage proposal = s_proposals[_id];
        return (
            proposal.id,
            proposal.projectId,
            proposal.reportedAuditor,
            proposal.startTime,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.status
        );
    }

    function getLastAuditTimestamp(
        address _auditor
    ) public view returns (uint256) {
        return s_lastAuditTimestamp[_auditor];
    }

    function getIsBlacklist(address _auditor) public view returns (bool) {
        return s_blacklist[_auditor];
    }

    function getIsAuditor(address _auditor) public view returns (bool) {
        return s_isAuditor[_auditor];
    }

    function getSubmittedProjects(
        address _submitter
    ) public view returns (uint256[] memory) {
        return s_submittedProjects[_submitter];
    }

    function getAuditFee() public pure returns (uint256) {
        return AUDITFEE;
    }

    function getAuditReward() public pure returns (uint256) {
        return AUDITREWARD;
    }

    function getHandlingFee() public pure returns (uint256) {
        return HANDLINGFEE;
    }

    function getStakeAmount() public pure returns (uint256) {
        return STAKEAMOUNT;
    }

    function getLockupPeriod() public pure returns (uint256) {
        return LOCKUPPERIOD;
    }

    function getVotingDuration() public pure returns (uint256) {
        return VOTINGDURATION;
    }
}
