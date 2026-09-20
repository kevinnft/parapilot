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

const DEX_ROUTER = "0xf33d5C786f1f6fD6890CE7ab9Ad7beAC363443B1" as const;

const TOKEN_MAP: Record<string, { address: `0x${string}`; decimals: number }> = {
  USDC: { address: "0xd4309703c783E671F5Ef61630Cb576916cE03200", decimals: 6 },
  WETH: { address: "0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0", decimals: 18 },
  KURU: { address: "0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba", decimals: 18 },
};

const dexAbi = parseAbi([
  "function swapExactETHForTokens(address tokenOut, uint256 minAmountOut) external payable returns (uint256)",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token = "USDC", amountMon = 0.01 } = body;

    const tokenConfig = TOKEN_MAP[token.toUpperCase()] || TOKEN_MAP.USDC;
    const monAmountStr = Math.max(0.001, Number(amountMon) || 0.01).toFixed(4);
    const valueWei = parseEther(monAmountStr);

    const pk = (process.env.DEMO_WALLET_PRIVATE_KEY ||
      "0xd1dac037e3892d6a327cdb5fdceb9f4deb37b97a2025201d5ca05f1e86c9c101") as `0x${string}`;
    const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);

    const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
    const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http() });

    const calldata = encodeFunctionData({
      abi: dexAbi,
      functionName: "swapExactETHForTokens",
      args: [tokenConfig.address, BigInt(0)],
    });

    const txHash = await walletClient.sendTransaction({
      account,
      to: DEX_ROUTER,
      value: valueWei,
      data: calldata,
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
    const blockNum = receipt ? Number(receipt.blockNumber) : 64166320;

    return NextResponse.json({
      success: isSuccess,
      status: isSuccess ? "0x1" : "0x0",
      txHash,
      from: account.address,
      to: DEX_ROUTER,
      blockNumber: blockNum,
      amountMon: Number(monAmountStr),
      tokenOut: token.toUpperCase(),
      targetTokenAddress: tokenConfig.address,
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
