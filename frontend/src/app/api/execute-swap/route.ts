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

const ACCOUNT = "0xB56586E881a2F0f70A0c221ace4Efe7bD68C2EF7" as const;
const VALIDATOR = "0x847F5D03c3aFC47DcBCd041D0F02D52EFb242991" as const;
const DEX_ROUTER = "0x191382fF69aaF5f91617644b6281f224D9bA2764" as const;

const TOKEN_MAP: Record<string, { address: `0x${string}`; decimals: number; priceUsd: number }> = {
  MON: { address: "0x0000000000000000000000000000000000000000", decimals: 18, priceUsd: 3.0 },
  USDC: { address: "0xd4309703c783E671F5Ef61630Cb576916cE03200", decimals: 6, priceUsd: 1.0 },
  WETH: { address: "0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0", decimals: 18, priceUsd: 2650.0 },
  KURU: { address: "0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba", decimals: 18, priceUsd: 0.20 },
};

const accountAbi = parseAbi([
  "function executeSwapViaSessionKey(address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (bytes)",
]);

const POLICY_REVERTS: Record<string, string> = {
  "27406db9": "SessionNotActive",
  "1fd05a4a": "SessionExpired",
  "c754637f": "SessionNotYetValid",
  "bfcd8a7c": "ContractNotWhitelisted",
  "540d2134": "MethodNotWhitelisted",
  "f84835a0": "TokenNotWhitelisted",
  "9bd0c545": "SpendLimitExceeded",
  "b7150de5": "NotAccount",
};

async function tokenBalance(token: `0x${string}` | null, holder: string): Promise<bigint> {
  const body = token
    ? { method: "eth_call", params: [{ to: token, data: "0x70a08231" + holder.slice(2).toLowerCase().padStart(64, "0") }, "latest"] }
    : { method: "eth_getBalance", params: [holder, "latest"] };
  const res = await fetch("https://testnet-rpc.monad.xyz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, ...body }),
    cache: "no-store",
  });
  const json = await res.json();
  return BigInt(json.result || "0x0");
}

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

    const expectedOutTokens = (amount * inConfig.priceUsd * 0.995) / outConfig.priceUsd;
    const expectedOutUnits = BigInt(Math.floor(expectedOutTokens * 10 ** outConfig.decimals));
    const amountInUnits = sourceToken === "MON"
      ? parseEther(amount.toFixed(4))
      : BigInt(Math.floor(amount * 10 ** inConfig.decimals));

    // The swap spends the account's balance, not the connected wallet's.
    const held = await tokenBalance(sourceToken === "MON" ? null : inConfig.address, ACCOUNT);
    if (held < amountInUnits) {
      const human = Number(held) / 10 ** inConfig.decimals;
      return NextResponse.json(
        { success: false, error: `ParaPilotAccount holds ${human} ${sourceToken}, but this swap spends ${amount}. Send ${sourceToken} to ${ACCOUNT} first.` },
        { status: 400 }
      );
    }

    // The session key signs, but the account holds the funds and the validator
    // checks router, method, token and the 24h cap before anything moves.
    const routed = encodeFunctionData({
      abi: accountAbi,
      functionName: "executeSwapViaSessionKey",
      args: [DEX_ROUTER, inConfig.address, outConfig.address, amountInUnits, expectedOutUnits],
    });

    if (body.prepare) {
      return NextResponse.json({ to: ACCOUNT, data: routed, gas: "0x3D090" });
    }

    const pk = (process.env.SESSION_PRIVATE_KEY || process.env.DEMO_WALLET_PRIVATE_KEY ||
      "0xd1dac037e3892d6a327cdb5fdceb9f4deb37b97a2025201d5ca05f1e86c9c101") as `0x${string}`;
    const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);

    const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
    const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http() });

    const gasPrice = await publicClient.getGasPrice();
    const txHash = await walletClient.sendTransaction({
      account,
      to: ACCOUNT,
      value: BigInt(0),
      data: routed,
      gas: BigInt(250000),
      maxFeePerGas: (gasPrice * BigInt(125)) / BigInt(100),
      maxPriorityFeePerGas: BigInt(2000000000),
    } as any);

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

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: "Broadcast, but the receipt was not indexed in time.", txHash,
          explorer: `https://testnet.monadexplorer.com/tx/${txHash}` },
        { status: 504 }
      );
    }

    const isSuccess = receipt.status === "success";
    return NextResponse.json({
      success: isSuccess,
      status: isSuccess ? "0x1" : "0x0",
      txHash,
      from: account.address,
      to: ACCOUNT,
      router: DEX_ROUTER,
      validator: VALIDATOR,
      blockNumber: Number(receipt.blockNumber),
      sourceToken,
      targetToken,
      amountIn: amount,
      amountOut: +expectedOutTokens.toFixed(targetToken === "WETH" ? 6 : 4),
      explorer: `https://testnet.monadexplorer.com/tx/${txHash}`,
      error: isSuccess ? undefined : "Reverted by the on-chain policy.",
    });
  } catch (error: any) {
    console.error("Execute swap error:", error);
    const reason = POLICY_REVERTS[(error?.data as string | undefined)?.slice(2, 10) ?? ""]
      ?? error?.message
      ?? "Swap execution failed";
    return NextResponse.json({ success: false, error: reason }, { status: 500 });
  }
}
