// One-off refill: swap demo wallet's USDC -> MON on MockDEX with tight gas
// so viem's preflight balance check passes on the near-empty demo wallet.
const { createWalletClient, createPublicClient, http, defineChain, encodeFunctionData, parseAbi, formatEther } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const DEX = "0x191382fF69aaF5f91617644b6281f224D9bA2764";
const USDC = "0xd4309703c783E671F5Ef61630Cb576916cE03200";
const PK = "0xd1dac037e3892d6a327cdb5fdceb9f4deb37b97a2025201d5ca05f1e86c9c101"; // public demo key (in repo)

const dexAbi = parseAbi([
  "function swapExactTokensForETH(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
]);

(async () => {
  const account = privateKeyToAccount(PK);
  const pub = createPublicClient({ chain: monadTestnet, transport: http() });
  const wal = createWalletClient({ account, chain: monadTestnet, transport: http() });

  const bal = await pub.getBalance({ address: account.address });
  console.log("MON balance before:", formatEther(bal));

  const amountIn = 1492500n; // 1.4925 USDC (6 decimals) - full balance
  const minOut = 450000000000000000n; // 0.45 MON (expected ~0.494)

  const data = encodeFunctionData({
    abi: dexAbi,
    functionName: "swapExactTokensForETH",
    args: [USDC, amountIn, minOut],
  });

  const hash = await wal.sendTransaction({
    account,
    to: DEX,
    data,
    gas: 250000n,
    maxFeePerGas: 115000000000n, // 115 gwei
    maxPriorityFeePerGas: 2000000000n, // 2 gwei
  });
  console.log("tx:", hash);

  // poll eth_getCode style: poll balance change instead of receipt (archive lag)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const b2 = await pub.getBalance({ address: account.address });
    if (b2 !== bal) {
      console.log("MON balance after:", formatEther(b2));
      console.log("REFILL OK, delta:", formatEther(b2 - bal));
      return;
    }
    process.stdout.write(".");
  }
  console.log("\nno balance change detected within timeout — check explorer:", "https://testnet.monadexplorer.com/tx/" + hash);
})().catch((e) => { console.error("FAIL:", e.shortMessage || e.message || e); process.exit(1); });
