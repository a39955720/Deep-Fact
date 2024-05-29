// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error FraudBlockeer__InsufficientAmount();
error FraudBlockeer__ProjectDoesNotExist();
error FraudBlockeer__ProjectHasEnded();
error FraudBlockeer__YouAreNotAuditor();
error FraudBlockeer__YouAreAlreadyAnAuditor();
error FraudBlockeer__TheUserIsNotAnAuditor();
error FraudBlockeer__TransferFailed();

contract FraudBlockeer is Ownable, ReentrancyGuard {
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

    constructor() Ownable(msg.sender) {
        s_idCounter = 0;
    }

    function submitProject(
        bytes memory _projectName,
        bytes memory _projectLink,
        bytes memory _projectDescription
    ) public payable {
        if (msg.value != 0.003 ether) {
            revert FraudBlockeer__InsufficientAmount();
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
            revert FraudBlockeer__ProjectDoesNotExist();
        }
        if (s_projectData[_projectId].status == Status.Ended) {
            revert FraudBlockeer__ProjectHasEnded();
        }
        if (s_isAuditor[msg.sender] == false) {
            revert FraudBlockeer__YouAreNotAuditor();
        }

        for (uint256 i = 0; i < 3; i++) {
            if (s_projectData[_projectId].auditor[i] == address(0)) {
                s_projectData[_projectId].auditor[i] = msg.sender;
                s_projectData[_projectId].auditResult[i] = _auditResult;
                s_lastAuditTimestamp[msg.sender] = block.timestamp;
                (bool success, ) = msg.sender.call{value: 0.001 ether}("");
                if (!success) {
                    revert FraudBlockeer__TransferFailed();
                }
                break;
            }
        }
    }

    function stakeAsAuditor() public payable {
        if (msg.value != 0.1 ether) {
            revert FraudBlockeer__InsufficientAmount();
        }
        if (s_isAuditor[msg.sender] == true) {
            revert FraudBlockeer__YouAreAlreadyAnAuditor();
        }

        s_isAuditor[msg.sender] = true;
    }

    function revokeAndWithdrawStake() public nonReentrant {
        if (s_isAuditor[msg.sender] == false) {
            revert FraudBlockeer__TheUserIsNotAnAuditor();
        }

        s_isAuditor[msg.sender] = false;

        (bool success, ) = msg.sender.call{value: 0.1 ether}("");
        if (!success) {
            revert FraudBlockeer__TransferFailed();
        }
    }

    function revokeAuditor() public payable onlyOwner nonReentrant {
        if (s_isAuditor[msg.sender] == false) {
            revert FraudBlockeer__TheUserIsNotAnAuditor();
        }
        s_isAuditor[msg.sender] = false;
        (bool success, ) = msg.sender.call{value: 0.1 ether}("");
        if (!success) {
            revert FraudBlockeer__TransferFailed();
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
}
