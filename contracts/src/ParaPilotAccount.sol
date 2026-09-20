// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SessionKeyValidator.sol";

/**
 * @title ParaPilotAccount
 * @notice Policy-guarded smart execution account for AI agents on Monad.
 * @dev Holds assets and delegates execution to approved session keys under strict validator rules.
 */
contract ParaPilotAccount {
    address public owner;
    SessionKeyValidator public validator;

    event ExecutionSuccess(address indexed sessionKey, address indexed target, uint256 value, bytes data);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event ValidatorUpdated(address indexed newValidator);

    error NotOwner();
    error ExecutionFailed(bytes returnData);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _owner, address _validator) {
        require(_owner != address(0), "Invalid owner");
        require(_validator != address(0), "Invalid validator");
        owner = _owner;
        validator = SessionKeyValidator(_validator);
    }

    receive() external payable {}

    /**
     * @notice Allows an AI agent session key to execute a call if authorized by the policy validator.
     * @param target Target contract (e.g. DEX router, lending protocol).
     * @param value Native token amount (MON) to transfer/spend.
     * @param data Calldata including function selector and arguments.
     */
    function executeViaSessionKey(
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory) {
        bytes4 selector = bytes4(data[:4]);

        // Validate policy compliance via SessionKeyValidator
        validator.validateExecution(owner, msg.sender, target, selector, value);

        // Execute target transaction
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        if (!success) {
            revert ExecutionFailed(returnData);
        }

        emit ExecutionSuccess(msg.sender, target, value, data);
        return returnData;
    }

    /**
     * @notice Root execution bypass for the wallet owner.
     */
    function executeDirect(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (bytes memory) {
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        if (!success) {
            revert ExecutionFailed(returnData);
        }
        return returnData;
    }

    /**
     * @notice Updates the policy validator contract.
     */
    function setValidator(address _newValidator) external onlyOwner {
        require(_newValidator != address(0), "Invalid validator");
        validator = SessionKeyValidator(_newValidator);
        emit ValidatorUpdated(_newValidator);
    }
}
