import { NextResponse } from "next/server";
import { encodeAbiParameters, parseAbiParameters } from "viem";

export const dynamic = "force-dynamic";

const RPC = "https://testnet-rpc.monad.xyz";
const VERIFIER = "0x5B27bE516faD9f4F37338573aC0EB7CE032f09F0";
// verify(bytes32,bytes32,uint256,uint256,(bytes,string,bytes32,bytes32))
const SELECTOR = "0x5d962d0f";

const hex = (value: string) => (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    for (const key of ["challenge", "rpIdHash", "pubX", "pubY", "authenticatorData", "clientDataJson", "r", "s"]) {
      if (typeof body[key] !== "string" || !body[key]) {
        return NextResponse.json({ error: `missing ${key}` }, { status: 400 });
      }
    }

    const encoded = encodeAbiParameters(
      parseAbiParameters("bytes32, bytes32, uint256, uint256, (bytes, string, bytes32, bytes32)"),
      [
        hex(body.challenge),
        hex(body.rpIdHash),
        BigInt(hex(body.pubX)),
        BigInt(hex(body.pubY)),
        [hex(body.authenticatorData), body.clientDataJson, hex(body.r), hex(body.s)],
      ],
    );

    const res = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: VERIFIER, data: SELECTOR + encoded.slice(2) }, "latest"],
      }),
      cache: "no-store",
    });
    const json = await res.json();
    if (!json.result) {
      return NextResponse.json(
        { verified: false, verifier: VERIFIER, error: json.error?.message || "eth_call failed" },
        { status: 502 },
      );
    }
    return NextResponse.json({
      verified: BigInt(json.result) === BigInt(1),
      verifier: VERIFIER,
    });
  } catch (error: any) {
    return NextResponse.json({ verified: false, error: error?.message || "verify failed" }, { status: 500 });
  }
}
