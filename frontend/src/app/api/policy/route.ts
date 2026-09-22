import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RPC = "https://testnet-rpc.monad.xyz";
const VALIDATOR = "0x847F5D03c3aFC47DcBCd041D0F02D52EFb242991";
const OWNER = "0x6E95951bbAc8454950508394EC0F5fcCF6c4d8Bf";

// sessionPolicies(address,address) and isSessionValid(address,address)
const POLICY_SELECTOR = "0xe9957709";
const VALID_SELECTOR = "0x5a2b7f9b";

function word(addr: string) {
  return addr.slice(2).toLowerCase().padStart(64, "0");
}

async function call(data: string): Promise<string> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: VALIDATOR, data }, "latest"] }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.result) throw new Error(json.error?.message || "eth_call failed");
  return json.result as string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get("session") || OWNER;
  if (!/^0x[0-9a-fA-F]{40}$/.test(session)) {
    return NextResponse.json({ error: "bad session address" }, { status: 400 });
  }

  const key = word(OWNER) + word(session);
  const [policyRaw, validRaw] = await Promise.all([
    call(POLICY_SELECTOR + key),
    call(VALID_SELECTOR + key),
  ]);

  const field = (i: number) => BigInt("0x" + policyRaw.slice(2 + i * 64, 2 + (i + 1) * 64));
  const spent = field(5);
  const cap = field(2);

  return NextResponse.json({
    validator: VALIDATOR,
    owner: OWNER,
    session,
    active: field(6) === BigInt(1) && BigInt(validRaw) === BigInt(1),
    spentMon: Number(spent) / 1e18,
    capMon: Number(cap) / 1e18,
    intervalSeconds: Number(field(3)),
    intervalStart: Number(field(4)),
    validAfter: Number(field(0)),
    validUntil: Number(field(1)),
  });
}
