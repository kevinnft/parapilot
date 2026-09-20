// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SessionKeyValidator
 * @notice Enforces on-chain policy guardrails for autonomous AI agent session keys on Monad.
 * @dev Enables scoped delegation with spend limits, target whitelisting, method gating, and kill-switches.
 */
contract SessionKeyValidator {
    struct SessionPolicy {
        uint256 validAfter;
        uint256 validUntil;
        uint256 maxSpendPerInterval;    // In wei / smallest unit
        uint256 intervalDuration;       // Interval duration in seconds (e.g., 86400 for 24h)
        uint256 currentIntervalStart;
        uint256 currentIntervalSpent;
        bool isActive;
    }

    // walletOwner => sessionKey => SessionPolicy
    mapping(address => mapping(address => SessionPolicy)) public sessionPolicies;

    // walletOwner => sessionKey => targetContract => isAllowed
    mapping(address => mapping(address => mapping(address => bool))) public whitelistedContracts;

    // walletOwner => sessionKey => targetContract => functionSelector => isAllowed
    mapping(address => mapping(address => mapping(address => mapping(bytes4 => bool)))) public whitelistedMethods;

    // walletOwner => sessionKey => token => isAllowed
    mapping(address => mapping(address => mapping(address => bool))) public whitelistedTokens;

    // Events
    event SessionKeyRegistered(address indexed owner, address indexed sessionKey, uint256 validUntil, uint256 maxSpend);
    event SessionKeyRevoked(address indexed owner, address indexed sessionKey);
    event ContractWhitelisted(address indexed owner, address indexed sessionKey, address indexed target, bool allowed);
    event MethodWhitelisted(address indexed owner, address indexed sessionKey, address indexed target, bytes4 selector, bool allowed);
    event ExecutionValidated(address indexed owner, address indexed sessionKey, address indexed target, uint256 spendAmount);

    // Errors
    error SessionNotActive();
    error SessionExpired();
    error SessionNotYetValid();
    error ContractNotWhitelisted();
    error MethodNotWhitelisted();
    error SpendLimitExceeded();
    error Unauthorized();

    /**
     * @notice Registers or updates a session key for an AI agent with specified guardrails.
     */
    function registerSessionKey(
        address sessionKey,
        uint256 validAfter,
        uint256 validUntil,
        uint256 maxSpendPerInterval,
        uint256 intervalDuration
    ) external {
        require(sessionKey != address(0), "Invalid session key");
        require(validUntil > validAfter, "Invalid timeframe");

        sessionPolicies[msg.sender][sessionKey] = SessionPolicy({
            validAfter: validAfter,
            validUntil: validUntil,
            maxSpendPerInterval: maxSpendPerInterval,
            intervalDuration: intervalDuration,
            currentIntervalStart: block.timestamp,
            currentIntervalSpent: 0,
            isActive: true
        });

        emit SessionKeyRegistered(msg.sender, sessionKey, validUntil, maxSpendPerInterval);
    }

    /**
     * @notice Emergency kill-switch: revokes an active session key instantly.
     */
    function revokeSessionKey(address sessionKey) external {
        sessionPolicies[msg.sender][sessionKey].isActive = false;
        emit SessionKeyRevoked(msg.sender, sessionKey);
    }

    /**
     * @notice Whitelists or blacklists a target smart contract for a session key.
     */
    function setWhitelistedContract(address sessionKey, address target, bool allowed) external {
        whitelistedContracts[msg.sender][sessionKey][target] = allowed;
        emit ContractWhitelisted(msg.sender, sessionKey, target, allowed);
    }

    /**
     * @notice Whitelists or blacklists a specific function selector for a contract.
     */
    function setWhitelistedMethod(address sessionKey, address target, bytes4 selector, bool allowed) external {
        whitelistedMethods[msg.sender][sessionKey][target][selector] = allowed;
        emit MethodWhitelisted(msg.sender, sessionKey, target, selector, allowed);
    }

    /**
     * @notice Validates whether an agent's execution complies with the owner's policy.
     * @param owner The wallet owner who delegated the authority.
     * @param sessionKey The address of the agent's session key.
     * @param target The target contract being called.
     * @param selector The 4-byte function selector of the call.
     * @param spendAmount The amount of native or designated token being spent.
     */
    function validateExecution(
        address owner,
        address sessionKey,
        address target,
        bytes4 selector,
        uint256 spendAmount
    ) external returns (bool) {
        SessionPolicy storage policy = sessionPolicies[owner][sessionKey];

        if (!policy.isActive) revert SessionNotActive();
        if (block.timestamp < policy.validAfter) revert SessionNotYetValid();
        if (block.timestamp > policy.validUntil) revert SessionExpired();

        // Validate whitelisted contract
        if (!whitelistedContracts[owner][sessionKey][target]) revert ContractNotWhitelisted();

        // Validate whitelisted selector if method gating is configured
        if (!whitelistedMethods[owner][sessionKey][target][selector]) revert MethodNotWhitelisted();

        // Validate and update spending interval
        if (policy.maxSpendPerInterval > 0 && spendAmount > 0) {
            if (block.timestamp >= policy.currentIntervalStart + policy.intervalDuration) {
                policy.currentIntervalStart = block.timestamp;
                policy.currentIntervalSpent = 0;
            }

            if (policy.currentIntervalSpent + spendAmount > policy.maxSpendPerInterval) {
                revert SpendLimitExceeded();
            }

            policy.currentIntervalSpent += spendAmount;
        }

        emit ExecutionValidated(owner, sessionKey, target, spendAmount);
        return true;
    }

    /**
     * @notice View function to check if a session key is currently valid.
     */
    function isSessionValid(address owner, address sessionKey) external view returns (bool) {
        SessionPolicy memory policy = sessionPolicies[owner][sessionKey];
        return (policy.isActive && block.timestamp >= policy.validAfter && block.timestamp <= policy.validUntil);
    }
}
