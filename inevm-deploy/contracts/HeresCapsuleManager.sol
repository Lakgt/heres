// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract HeresCapsuleManager {
    enum ConditionKind {
        Time,
        Heartbeat
    }

    struct Capsule {
        address owner;
        address beneficiary;
        uint256 amount;
        uint64 createdAt;
        uint64 executeAt;
        uint64 heartbeatWindow;
        uint64 lastHeartbeatAt;
        bytes32 metadataHash;
        ConditionKind conditionKind;
        bool executed;
        bool cancelled;
    }

    error CapsuleNotFound();
    error InvalidBeneficiary();
    error InvalidFundingAmount();
    error InvalidExecutionTime();
    error InvalidHeartbeatWindow();
    error Unauthorized();
    error CapsuleAlreadySettled();
    error CapsuleNotReady();
    error HeartbeatUnavailable();
    error TransferFailed();

    uint256 public nextCapsuleId = 1;

    mapping(uint256 => Capsule) private capsules;

    event CapsuleCreated(
        uint256 indexed capsuleId,
        address indexed owner,
        address indexed beneficiary,
        uint256 amount,
        ConditionKind conditionKind,
        uint64 executeAt,
        uint64 heartbeatWindow,
        bytes32 metadataHash
    );
    event CapsuleHeartbeat(uint256 indexed capsuleId, uint64 heartbeatAt, uint64 executeAfter);
    event CapsuleExecuted(uint256 indexed capsuleId, address indexed executor, address indexed beneficiary, uint256 amount);
    event CapsuleCancelled(uint256 indexed capsuleId, address indexed owner, uint256 amount);

    function createCapsule(
        address beneficiary,
        ConditionKind conditionKind,
        uint64 executeAt,
        uint64 heartbeatWindow,
        bytes32 metadataHash
    ) external payable returns (uint256 capsuleId) {
        if (beneficiary == address(0)) revert InvalidBeneficiary();
        if (msg.value == 0) revert InvalidFundingAmount();

        uint64 createdAt = uint64(block.timestamp);
        uint64 lastHeartbeatAt = createdAt;

        if (conditionKind == ConditionKind.Time) {
            if (executeAt <= createdAt) revert InvalidExecutionTime();
        } else {
            if (heartbeatWindow == 0) revert InvalidHeartbeatWindow();
            executeAt = createdAt + heartbeatWindow;
        }

        capsuleId = nextCapsuleId++;
        capsules[capsuleId] = Capsule({
            owner: msg.sender,
            beneficiary: beneficiary,
            amount: msg.value,
            createdAt: createdAt,
            executeAt: executeAt,
            heartbeatWindow: heartbeatWindow,
            lastHeartbeatAt: lastHeartbeatAt,
            metadataHash: metadataHash,
            conditionKind: conditionKind,
            executed: false,
            cancelled: false
        });

        emit CapsuleCreated(
            capsuleId,
            msg.sender,
            beneficiary,
            msg.value,
            conditionKind,
            executeAt,
            heartbeatWindow,
            metadataHash
        );
    }

    function heartbeat(uint256 capsuleId) external {
        Capsule storage capsule = _requireOpenCapsule(capsuleId);
        if (capsule.owner != msg.sender) revert Unauthorized();
        if (capsule.conditionKind != ConditionKind.Heartbeat) revert HeartbeatUnavailable();

        capsule.lastHeartbeatAt = uint64(block.timestamp);
        capsule.executeAt = capsule.lastHeartbeatAt + capsule.heartbeatWindow;

        emit CapsuleHeartbeat(capsuleId, capsule.lastHeartbeatAt, capsule.executeAt);
    }

    function executeCapsule(uint256 capsuleId) external {
        Capsule storage capsule = _requireOpenCapsule(capsuleId);
        if (!canExecute(capsuleId)) revert CapsuleNotReady();

        capsule.executed = true;
        uint256 amount = capsule.amount;
        capsule.amount = 0;

        (bool ok, ) = payable(capsule.beneficiary).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit CapsuleExecuted(capsuleId, msg.sender, capsule.beneficiary, amount);
    }

    function cancelCapsule(uint256 capsuleId) external {
        Capsule storage capsule = _requireOpenCapsule(capsuleId);
        if (capsule.owner != msg.sender) revert Unauthorized();

        capsule.cancelled = true;
        uint256 amount = capsule.amount;
        capsule.amount = 0;

        (bool ok, ) = payable(capsule.owner).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit CapsuleCancelled(capsuleId, capsule.owner, amount);
    }

    function getCapsule(uint256 capsuleId) external view returns (Capsule memory) {
        Capsule memory capsule = capsules[capsuleId];
        if (capsule.owner == address(0)) revert CapsuleNotFound();
        return capsule;
    }

    function canExecute(uint256 capsuleId) public view returns (bool) {
        Capsule memory capsule = capsules[capsuleId];
        if (capsule.owner == address(0) || capsule.executed || capsule.cancelled) {
            return false;
        }

        return block.timestamp >= capsule.executeAt;
    }

    function _requireOpenCapsule(uint256 capsuleId) private view returns (Capsule storage capsule) {
        capsule = capsules[capsuleId];
        if (capsule.owner == address(0)) revert CapsuleNotFound();
        if (capsule.executed || capsule.cancelled) revert CapsuleAlreadySettled();
    }
}
