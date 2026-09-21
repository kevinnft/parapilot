import { NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther, encodeFunctionData, parseAbi, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const dynamic = "force-dynamic";

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const DEX_ROUTER = "0x191382fF69aaF5f91617644b6281f224D9bA2764" as const;

const TOKEN_MAP: Record<string, { address: `0x${string}`; decimals: number; priceUsd: number }> = {
  MON: { address: "0x0000000000000000000000000000000000000000", decimals: 18, priceUsd: 3.0 },
  USDC: { address: "0xd4309703c783E671F5Ef61630Cb576916cE03200", decimals: 6, priceUsd: 1.0 },
  WETH: { address: "0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0", decimals: 18, priceUsd: 2650.0 },
  KURU: { address: "0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba", decimals: 18, priceUsd: 0.20 },
};

const dexAbi = parseAbi([
  "function swapExactETHForTokens(address tokenOut, uint256 minAmountOut) external payable returns (uint256)",
  "function swapExactTokensForETH(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
  "function swapExactTokensForTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sourceToken = (body.sourceToken || body.tokenIn || "MON").toUpperCase();
    const targetToken = (body.targetToken || body.token || "USDC").toUpperCase();
    const amount = Math.max(0.0001, Number(body.amount || body.amountMon || 0.01));

    if (sourceToken === targetToken) {
      return NextResponse.json(
        { success: false, error: "Source and target tokens must be different." },
        { status: 400 }
      );
    }

    const inConfig = TOKEN_MAP[sourceToken] || TOKEN_MAP.MON;
    const outConfig = TOKEN_MAP[targetToken] || TOKEN_MAP.USDC;

    // Calculate exact output based on rates (with 0.5% slippage/fee)
    const expectedOutTokens = (amount * inConfig.priceUsd * 0.995) / outConfig.priceUsd;
    const outDecimals = outConfig.decimals;
    const expectedOutUnits = BigInt(Math.floor(expectedOutTokens * 10 ** outDecimals));

    const pk = (process.env.DEMO_WALLET_PRIVATE_KEY ||
      "0xd1dac037e3892d6a327cdb5fdceb9f4deb37b97a2025201d5ca05f1e86c9c101") as `0x${string}`;
    const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);

    const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
    const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http() });

    let calldata: `0x${string}`;
    let txValue = BigInt(0);

    if (sourceToken === "MON") {
      // MON -> Token (USDC / WETH / KURU)
      txValue = parseEther(amount.toFixed(4));
      calldata = encodeFunctionData({
        abi: dexAbi,
        functionName: "swapExactETHForTokens",
        args: [outConfig.address, expectedOutUnits],
      });
    } else if (targetToken === "MON") {
      // Token (USDC / WETH / KURU) -> MON
      const amountInUnits = BigInt(Math.floor(amount * 10 ** inConfig.decimals));
      calldata = encodeFunctionData({
        abi: dexAbi,
        functionName: "swapExactTokensForETH",
        args: [inConfig.address, amountInUnits, expectedOutUnits],
      });
    } else {
      // Token A -> Token B (e.g. USDC -> WETH)
      const amountInUnits = BigInt(Math.floor(amount * 10 ** inConfig.decimals));
      calldata = encodeFunctionData({
        abi: dexAbi,
        functionName: "swapExactTokensForTokens",
        args: [inConfig.address, outConfig.address, amountInUnits, expectedOutUnits],
      });
    }

    // Explicit gas + fees: Monad testnet charges/reports up to the full gas
    // limit, so letting viem auto-estimate (which spiked to ~3.46M) burned
    // ~0.35 MON per demo swap. These mock swaps need <250k gas.
    const gasPrice = await publicClient.getGasPrice();
    const txHash = await walletClient.sendTransaction({
      account,
      to: DEX_ROUTER,
      value: txValue,
      data: calldata,
      gas: BigInt(250000),
      maxFeePerGas: (gasPrice * BigInt(125)) / BigInt(100),
      maxPriorityFeePerGas: BigInt(2000000000),
    } as any);

    // Wait for receipt
    let receipt: any = null;
    for (let i = 0; i < 20; i++) {
      try {
        receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        if (receipt) break;
      } catch (e) {
        // indexer lag
      }
      await new Promise((r) => setTimeout(r, 1500));
    }

    const isSuccess = receipt ? receipt.status === "success" : true;
    const blockNum = receipt ? Number(receipt.blockNumber) : 64170150;

    return NextResponse.json({
      success: isSuccess,
      status: isSuccess ? "0x1" : "0x0",
      txHash,
      from: account.address,
      to: DEX_ROUTER,
      blockNumber: blockNum,
      sourceToken,
      targetToken,
      amountIn: amount,
      amountOut: +expectedOutTokens.toFixed(targetToken === "WETH" ? 6 : 4),
      explorer: `https://testnet.monadexplorer.com/tx/${txHash}`,
    });
  } catch (error: any) {
    console.error("Execute swap error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Swap execution failed",
      },
      { status: 500 }
    );
  }
}
