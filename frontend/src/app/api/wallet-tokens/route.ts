import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ZERION_API_KEY = process.env.ZERION_API_KEY || "zk_1d29109b945645ccac3f667e57adac1b";
const MONAD_RPC = "https://testnet-rpc.monad.xyz";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !address.startsWith("0x")) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const tokens: any[] = [];
  let monadNativeBal = 0;

  // 1. Query Monad Testnet Native Balance & On-Chain Tokens
  try {
    const monadRes = await fetch(MONAD_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
      cache: "no-store",
    });
    const monadData = await monadRes.json();
    if (monadData && monadData.result) {
      const wei = BigInt(monadData.result);
      monadNativeBal = Number(wei) / 1e18;
      const monPriceUsd = 3.0;
      tokens.push({
        id: "monad-native",
        symbol: "MON",
        name: "Monad (Testnet)",
        quantity: monadNativeBal,
        quantityFormatted: monadNativeBal.toLocaleString(undefined, { maximumFractionDigits: 4 }),
        priceUsd: monPriceUsd,
        valueUsd: +(monadNativeBal * monPriceUsd).toFixed(2),
        chain: "Monad Testnet",
        verified: true,
        iconUrl: "https://monad.xyz/favicon.ico",
      });
    }

    // Query Monad Testnet ERC20 Tokens (USDC, WETH, KURU)
    const monadTokens = [
      {
        symbol: "USDC",
        name: "USD Coin (Monad Testnet)",
        address: "0xd4309703c783E671F5Ef61630Cb576916cE03200",
        decimals: 6,
        priceUsd: 1.0,
        iconUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
      },
      {
        symbol: "WETH",
        name: "Wrapped Ether (Monad Testnet)",
        address: "0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0",
        decimals: 18,
        priceUsd: 2650.0,
        iconUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
      },
      {
        symbol: "KURU",
        name: "Kuru Token (Monad Testnet)",
        address: "0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba",
        decimals: 18,
        priceUsd: 0.2,
        iconUrl: "https://monad.xyz/favicon.ico",
      },
    ];

    // balanceOf selector = 0x70a08231
    const cleanAddrPadded = address.slice(2).toLowerCase().padStart(64, "0");
    const balCalldata = `0x70a08231${cleanAddrPadded}`;

    for (const t of monadTokens) {
      try {
        const tokenRes = await fetch(MONAD_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_call",
            params: [{ to: t.address, data: balCalldata }, "latest"],
          }),
          cache: "no-store",
        });
        const tokenJson = await tokenRes.json();
        if (tokenJson && tokenJson.result && tokenJson.result !== "0x") {
          const rawBal = BigInt(tokenJson.result);
          const divisor = BigInt(10 ** t.decimals);
          const qty = Number(rawBal) / Number(divisor);
          if (qty > 0) {
            tokens.push({
              id: `${t.symbol}-monad-testnet`,
              symbol: t.symbol,
              name: t.name,
              quantity: qty,
              quantityFormatted: qty.toLocaleString(undefined, { maximumFractionDigits: 4 }),
              priceUsd: t.priceUsd,
              valueUsd: +(qty * t.priceUsd).toFixed(2),
              chain: "Monad Testnet",
              verified: true,
              iconUrl: t.iconUrl,
            });
          }
        }
      } catch (err) {
        // ignore single token error
      }
    }
  } catch (e) {
    console.error("Monad RPC error:", e);
  }

  // 2. Query Zerion API for Multichain Token Positions
  try {
    const authStr = Buffer.from(`${ZERION_API_KEY}:`).toString("base64");
    const url = `https://api.zerion.io/v1/wallets/${address}/positions?currency=usd&filter[trash]=only_non_trash&sort=-value`;
    const zerionRes = await fetch(url, {
      headers: {
        accept: "application/json",
        authorization: `Basic ${authStr}`,
        "User-Agent": "ParaPilot/1.0",
      },
      cache: "no-store",
    });

    if (zerionRes.ok) {
      const zerionData = await zerionRes.json();
      const items = zerionData.data || [];

      for (const it of items) {
        const attrs = it.attributes || {};
        const finfo = attrs.fungible_info || {};
        const chainInfo = it.relationships?.chain?.data?.id || "EVM";
        const sym = finfo.symbol || "UNKNOWN";
        const qty = attrs.quantity?.float || 0;
        const valUsd = attrs.value || 0;
        const price = attrs.price || 0;

        // Avoid duplicate native ETH/MON if value is 0
        if (qty > 0 || valUsd > 0.001) {
          tokens.push({
            id: it.id || `${sym}-${chainInfo}`,
            symbol: sym,
            name: finfo.name || sym,
            quantity: qty,
            quantityFormatted: qty < 0.0001 ? qty.toExponential(3) : qty.toLocaleString(undefined, { maximumFractionDigits: 6 }),
            priceUsd: price,
            valueUsd: +valUsd.toFixed(2),
            chain: chainInfo.charAt(0).toUpperCase() + chainInfo.slice(1),
            verified: finfo.flags?.verified ?? true,
            iconUrl: finfo.icon?.url || null,
          });
        }
      }
    }
  } catch (e) {
    console.error("Zerion API fetch error:", e);
  }

  // Calculate Total Portfolio USD
  const totalValueUsd = tokens.reduce((acc, t) => acc + (t.valueUsd || 0), 0);

  return NextResponse.json({
    address,
    totalValueUsd: +totalValueUsd.toFixed(2),
    tokenCount: tokens.length,
    tokens,
  });
}
