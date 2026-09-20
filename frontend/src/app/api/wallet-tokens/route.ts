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

  // 1. Query Monad Testnet Native Balance
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
      // Monad testnet price baseline
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
