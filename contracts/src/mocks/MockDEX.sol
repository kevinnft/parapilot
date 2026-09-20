// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockDEX {
    event SwapExecuted(address indexed sender, address indexed tokenOut, uint256 amountIn);

    function swapExactETHForTokens(address tokenOut, uint256 minAmountOut) external payable returns (uint256) {
        require(msg.value > 0, "Zero value");
        emit SwapExecuted(msg.sender, tokenOut, msg.value);
        return minAmountOut;
    }

    function unauthorizedMethod() external pure returns (bool) {
        return true;
    }
}
