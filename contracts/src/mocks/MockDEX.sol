// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
}

contract MockDEX {
    event SwapExecuted(address indexed sender, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    function swapExactETHForTokens(address tokenOut, uint256 minAmountOut) external payable returns (uint256) {
        require(msg.value > 0, "Zero value");
        uint256 amountOut = minAmountOut;
        if (amountOut == 0) {
            amountOut = msg.value * 3;
        }
        if (tokenOut != address(0)) {
            try IERC20Mintable(tokenOut).mint(msg.sender, amountOut) {} catch {
                try IERC20Mintable(tokenOut).transfer(msg.sender, amountOut) {} catch {}
            }
        }
        emit SwapExecuted(msg.sender, tokenOut, msg.value, amountOut);
        return amountOut;
    }

    receive() external payable {}
}
