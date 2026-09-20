// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
}

contract MockDEX {
    event SwapExecuted(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    receive() external payable {}

    function getDecimals(address token) internal view returns (uint8) {
        if (token == address(0)) return 18;
        try IERC20Mintable(token).decimals() returns (uint8 d) {
            return d;
        } catch {
            return 18;
        }
    }

    // MON -> Token (USDC, WETH, KURU)
    function swapExactETHForTokens(address tokenOut, uint256 minAmountOut) external payable returns (uint256) {
        require(msg.value > 0, "Zero value");
        uint256 amountOut = minAmountOut;

        if (amountOut == 0 && tokenOut != address(0)) {
            uint8 outDec = getDecimals(tokenOut);
            if (outDec == 6) {
                // e.g. USDC (6 dec): (msg.value in 18 dec) * 3 / 1e12
                amountOut = (msg.value * 3) / 1e12;
            } else {
                amountOut = msg.value * 3;
            }
        }

        if (tokenOut != address(0) && amountOut > 0) {
            try IERC20Mintable(tokenOut).mint(msg.sender, amountOut) {} catch {
                try IERC20Mintable(tokenOut).transfer(msg.sender, amountOut) {} catch {}
            }
        }

        emit SwapExecuted(msg.sender, address(0), tokenOut, msg.value, amountOut);
        return amountOut;
    }

    // Token -> MON (USDC -> MON, WETH -> MON, KURU -> MON)
    function swapExactTokensForETH(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256) {
        require(amountIn > 0, "Zero amount");
        try IERC20Mintable(tokenIn).transferFrom(msg.sender, address(this), amountIn) {} catch {}

        uint256 monOut = minAmountOut;
        if (monOut == 0) {
            uint8 inDec = getDecimals(tokenIn);
            if (inDec == 6) {
                // e.g. USDC (6 dec): (amountIn * 1e12) / 3
                monOut = (amountIn * 1e12) / 3;
            } else {
                monOut = amountIn / 3;
            }
        }

        if (monOut > address(this).balance) {
            monOut = address(this).balance > 0.01 ether ? 0.01 ether : address(this).balance;
        }

        if (monOut > 0) {
            (bool s, ) = msg.sender.call{value: monOut}("");
            require(s, "MON transfer failed");
        }

        emit SwapExecuted(msg.sender, tokenIn, address(0), amountIn, monOut);
        return monOut;
    }

    // Token -> Token (USDC -> WETH, WETH -> USDC, KURU -> USDC, etc.)
    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256) {
        require(amountIn > 0, "Zero amount");
        try IERC20Mintable(tokenIn).transferFrom(msg.sender, address(this), amountIn) {} catch {}

        uint256 amountOut = minAmountOut;
        if (amountOut == 0) {
            uint8 inDec = getDecimals(tokenIn);
            uint8 outDec = getDecimals(tokenOut);
            if (inDec == 6 && outDec == 18) {
                amountOut = amountIn * 1e12;
            } else if (inDec == 18 && outDec == 6) {
                amountOut = amountIn / 1e12;
            } else {
                amountOut = amountIn;
            }
        }

        if (tokenOut != address(0) && amountOut > 0) {
            try IERC20Mintable(tokenOut).mint(msg.sender, amountOut) {} catch {
                try IERC20Mintable(tokenOut).transfer(msg.sender, amountOut) {} catch {}
            }
        }

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }
}
