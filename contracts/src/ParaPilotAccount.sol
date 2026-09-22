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

    // MockDEX selectors. Kept here so the account, not the session key, builds the swap.
    bytes4 private constant SWAP_ETH_FOR_TOKENS = 0xb79c48e5;
    bytes4 private constant SWAP_TOKENS_FOR_ETH = 0xc038847a;
    bytes4 private constant SWAP_TOKENS_FOR_TOKENS = 0x89fe039b;
    bytes4 private constant APPROVE = 0x095ea7b3;
    bytes4 private constant DECIMALS = 0x313ce567;

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
        validator.bindAccount(_owner);
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
        validator.validateExecution(owner, msg.sender, target, selector, value, address(0));

        // Execute target transaction
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        if (!success) {
            revert ExecutionFailed(returnData);
        }

        emit ExecutionSuccess(msg.sender, target, value, data);
        return returnData;
    }

    /**
     * @notice Swap through a whitelisted router. The session key never holds the
     *         tokens: this account approves the router, and the validator counts the
     *         spend in 18-decimal units whichever token goes out.
     */
    function executeSwapViaSessionKey(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (bytes memory) {
        bytes memory data;
        uint256 value;
        uint256 spend;
        address spent;

        if (tokenIn == address(0)) {
            value = amountIn;
            spend = amountIn;
            spent = address(0);
            data = abi.encodeWithSelector(SWAP_ETH_FOR_TOKENS, tokenOut, minAmountOut);
        } else {
            uint8 dec = _decimals(tokenIn);
            spend = dec >= 18 ? amountIn : amountIn * (10 ** (18 - dec));
            spent = tokenIn;
            _approveMax(tokenIn, router);
            data = tokenOut == address(0)
                ? abi.encodeWithSelector(SWAP_TOKENS_FOR_ETH, tokenIn, amountIn, minAmountOut)
                : abi.encodeWithSelector(SWAP_TOKENS_FOR_TOKENS, tokenIn, tokenOut, amountIn, minAmountOut);
        }

        validator.validateExecution(owner, msg.sender, router, bytes4(data), spend, spent);
        (bool success, bytes memory returnData) = router.call{value: value}(data);
        if (!success) revert ExecutionFailed(returnData);
        emit ExecutionSuccess(msg.sender, router, value, data);
        return returnData;
    }

    function _decimals(address token) internal view returns (uint8) {
        (bool ok, bytes memory ret) = token.staticcall(abi.encodeWithSelector(DECIMALS));
        if (ok && ret.length >= 32) return abi.decode(ret, (uint8));
        return 18;
    }

    function _approveMax(address token, address router) internal {
        (bool ok, bytes memory ret) = token.call(abi.encodeWithSelector(APPROVE, router, type(uint256).max));
        if (!ok || (ret.length > 0 && !abi.decode(ret, (bool)))) revert ExecutionFailed(ret);
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
