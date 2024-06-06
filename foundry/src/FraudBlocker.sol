// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error FraudBlocker__InsufficientAmount();
error FraudBlocker__ProjectDoesNotExist();
error FraudBlocker__AuditHasEnded();
error FraudBlocker__YouAreNotAuditor();
error FraudBlocker__YouAreAlreadyAnAuditor();
error FraudBlocker__TheUserIsNotAnAuditor();
error FraudBlocker__TransferFailed();
error FraudBlocker__YouAreOnTheBlacklist();
error FraudBlocker__YouHaveAlreadyAuditedThisProject();
error FraudBlocker__YouHaveToWaitThreeDaysAfterAuditBeforeRevoke();

contract FraudBlocker is Ownable, ReentrancyGuard {
    enum Status {
        Pending,
        Ended
    }

    struct ProjectData {
        uint256 id;
        bytes projectName;
        bytes projectLink;
        bytes projectDescription;
        address[3] auditor;
        bytes[3] auditResult;
        Status status;
    }

    uint256 private s_idCounter;

    mapping(uint256 => ProjectData) private s_projectData;
    mapping(address => uint256[]) private s_submittedProjects;
    mapping(address => uint256) private s_lastAuditTimestamp;
    mapping(address => bool) private s_isAuditor;
    mapping(address => bool) private s_blacklist;

    constructor() Ownable(msg.sender) {
        s_idCounter = 0;
    }

    function submitProject(
        bytes memory _projectName,
        bytes memory _projectLink,
        bytes memory _projectDescription
    ) public payable {
        if (msg.value != 0.003 ether) {
            revert FraudBlocker__InsufficientAmount();
        }

        s_projectData[s_idCounter].id = s_idCounter;
        s_projectData[s_idCounter].projectName = _projectName;
        s_projectData[s_idCounter].projectLink = _projectLink;
        s_projectData[s_idCounter].projectDescription = _projectDescription;
        s_projectData[s_idCounter].status = Status.Pending;

        s_submittedProjects[msg.sender].push(s_idCounter);
        s_idCounter++;
    }

    function auditProject(
        uint256 _projectId,
        bytes memory _auditResult
    ) public nonReentrant {
        if (_projectId >= s_idCounter) {
            revert FraudBlocker__ProjectDoesNotExist();
        }
        if (s_projectData[_projectId].status == Status.Ended) {
            revert FraudBlocker__AuditHasEnded();
        }
        if (s_isAuditor[msg.sender] == false) {
            revert FraudBlocker__YouAreNotAuditor();
        }

        for (uint256 i = 0; i < 3; i++) {
            if (s_projectData[_projectId].auditor[i] == address(0)) {
                for (uint256 j = 0; j < i; j++) {
                    if (s_projectData[_projectId].auditor[j] == msg.sender) {
                        revert FraudBlocker__YouHaveAlreadyAuditedThisProject();
                    }
                }
                s_projectData[_projectId].auditor[i] = msg.sender;
                s_projectData[_projectId].auditResult[i] = _auditResult;
                s_lastAuditTimestamp[msg.sender] = block.timestamp;
                if (i == 2) {
                    s_projectData[_projectId].status = Status.Ended;
                }
                (bool success, ) = msg.sender.call{value: 0.001 ether}("");
                if (!success) {
                    revert FraudBlocker__TransferFailed();
                }
                break;
            }
        }
    }

    function stakeAsAuditor() public payable {
        if (msg.value != 0.1 ether) {
            revert FraudBlocker__InsufficientAmount();
        }
        if (s_isAuditor[msg.sender] == true) {
            revert FraudBlocker__YouAreAlreadyAnAuditor();
        }
        if (s_blacklist[msg.sender] == true) {
            revert FraudBlocker__YouAreOnTheBlacklist();
        }

        s_isAuditor[msg.sender] = true;
    }

    function revokeAndWithdrawStake() public nonReentrant {
        if (s_isAuditor[msg.sender] == false) {
            revert FraudBlocker__TheUserIsNotAnAuditor();
        }

        if (s_lastAuditTimestamp[msg.sender] + 3 days > block.timestamp) {
            revert FraudBlocker__YouHaveToWaitThreeDaysAfterAuditBeforeRevoke();
        }

        s_isAuditor[msg.sender] = false;

        (bool success, ) = msg.sender.call{value: 0.1 ether}("");
        if (!success) {
            revert FraudBlocker__TransferFailed();
        }
    }

    function blockAuditor(
        address auditor
    ) public payable onlyOwner nonReentrant {
        if (s_isAuditor[auditor] == false) {
            revert FraudBlocker__TheUserIsNotAnAuditor();
        }
        s_isAuditor[auditor] = false;
        s_blacklist[auditor] = true;
        (bool success, ) = msg.sender.call{value: 0.1 ether}("");
        if (!success) {
            revert FraudBlocker__TransferFailed();
        }
    }

    function getTotalProject() public view returns (uint256) {
        return s_idCounter;
    }

    function getProjectData(
        uint256 _id
    ) public view returns (ProjectData memory) {
        return s_projectData[_id];
    }

    function getLastAuditTimestamp(
        address _auditor
    ) public view returns (uint256) {
        return s_lastAuditTimestamp[_auditor];
    }

    function getIsAuditor(address _auditor) public view returns (bool) {
        return s_isAuditor[_auditor];
    }

    function getSubmittedProjects(
        address _submitter
    ) public view returns (uint256[] memory) {
        return s_submittedProjects[_submitter];
    }
}
