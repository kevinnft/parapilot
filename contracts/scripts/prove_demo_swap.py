#!/usr/bin/env python3
"""Drive the exact swap the demo button sends, signed by the demo key itself.

A success here is what the UI could not do before W001 was registered.
"""

import json
import time
import urllib.request
from eth_account import Account
from eth_utils import keccak

RPC = "https://testnet-rpc.monad.xyz"
CHAIN = 10143
TIP = 2_000_000_000
VAL = "0x847F5D03c3aFC47DcBCd041D0F02D52EFb242991"
ACC = "0xB56586E881a2F0f70A0c221ace4Efe7bD68C2EF7"
DEX = "0x191382fF69aaF5f91617644b6281f224D9bA2764"
USDC = "0xd4309703c783E671F5Ef61630Cb576916cE03200"
SWAP = "c3d05443"


def rpc(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type": "application/json", "User-Agent": "ParaPilot/1.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        res = json.loads(resp.read().decode())
    if "error" in res:
        raise RuntimeError(f"{method}: {res['error']}")
    return res["result"]


def word(a):
    return a[2:].lower().zfill(64)


def spent_of(owner):
    sel = keccak(b"sessionPolicies(address,address)")[:4].hex()
    raw = rpc("eth_call", [{"to": VAL, "data": "0x" + sel + word(owner) + word(owner)}, "latest"])
    return int(raw[2 + 64 * 5: 2 + 64 * 6], 16)


def main():
    master = json.load(open("C:/Users/RYZEN/Downloads/nookplot/wallets/WALLET-MASTER.json", encoding="utf-8"))
    demo = Account.from_key(next(w["privateKey"] for w in master["wallets"] if w["label"] == "W001"))
    before = spent_of(demo.address)

    amount = int(0.002e18)
    data = SWAP + word(DEX) + word("0x" + "0" * 40) + word(USDC) + hex(amount)[2:].zfill(64) + hex(1)[2:].zfill(64)
    gp = int(rpc("eth_gasPrice", []), 16)
    nonce = int(rpc("eth_getTransactionCount", [demo.address, "pending"]), 16)
    tx = {"chainId": CHAIN, "nonce": nonce, "to": ACC, "gas": 250_000,
          "maxFeePerGas": int(gp * 125 // 100), "maxPriorityFeePerGas": TIP, "type": 2,
          "value": 0, "data": bytes.fromhex(data)}
    raw = demo.sign_transaction(tx).raw_transaction.hex()
    h = rpc("eth_sendRawTransaction", [raw if raw.startswith("0x") else "0x" + raw])

    rec = None
    for _ in range(25):
        time.sleep(2)
        try:
            rec = rpc("eth_getTransactionReceipt", [h])
        except Exception:
            rec = None
        if rec:
            break
    if not rec:
        raise SystemExit("no receipt " + h)

    after = spent_of(demo.address)
    status = int(rec["status"], 16)
    print(f"status {status} block {int(rec['blockNumber'],16)} gas {int(rec['gasUsed'],16)}")
    print(f"spent {before/1e18:.4f} -> {after/1e18:.4f}")
    print("https://testnet.monadexplorer.com/tx/" + h)
    if status != 1 or after - before != amount:
        raise SystemExit("DEMO SWAP FAILED")
    print("DEMO SWAP OK")


if __name__ == "__main__":
    main()
