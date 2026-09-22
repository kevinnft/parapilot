#!/usr/bin/env python3
"""Register the demo signer (W001) as a session key of the v2 account.

The app's swap route signs with W001, but only W002 was registered, so every
demo swap reverted. W001 gets the same router, method and token whitelist as
W002, with a cap a demo can actually spend against.
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
DEX = "0x191382fF69aaF5f91617644b6281f224D9bA2764"
USDC = "0xd4309703c783E671F5Ef61630Cb576916cE03200"
WETH = "0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0"
KURU = "0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba"
# Selectors the account builds internally and the validator checks.
METHODS = ["b79c48e5", "c038847a", "89fe039b"]
CAP = int(1.0e18)  # 1 MON / 24h


def rpc(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(RPC, data=body, headers={"Content-Type": "application/json", "User-Agent": "ParaPilot/1.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        res = json.loads(resp.read().decode())
    if "error" in res:
        raise RuntimeError(f"{method}: {res['error']}")
    return res["result"]


def send(acct, tx):
    raw = acct.sign_transaction(tx).raw_transaction.hex()
    return rpc("eth_sendRawTransaction", [raw if raw.startswith("0x") else "0x" + raw])


def receipt(h):
    for _ in range(25):
        try:
            r = rpc("eth_getTransactionReceipt", [h])
        except Exception:
            r = None
        if r:
            return r
        time.sleep(2)
    raise TimeoutError(h)


def word(addr):
    return addr[2:].lower().zfill(64)


def main():
    master = json.load(open("C:/Users/RYZEN/Downloads/nookplot/wallets/WALLET-MASTER.json", encoding="utf-8"))
    owner = Account.from_key(next(w["privateKey"] for w in master["wallets"] if w["label"] == "W001"))
    gp = int(rpc("eth_gasPrice", []), 16)
    fee = int(gp * 125 // 100)
    nonce = int(rpc("eth_getTransactionCount", [owner.address, "pending"]), 16)

    now = int(time.time()) - 60
    calls = []
    reg = keccak(b"registerSessionKey(address,uint256,uint256,uint256,uint256)")[:4].hex()
    calls.append(reg + word(owner.address) + hex(now)[2:].zfill(64) + hex(now + 30 * 86400)[2:].zfill(64)
                 + hex(CAP)[2:].zfill(64) + hex(86400)[2:].zfill(64))

    wc = keccak(b"setWhitelistedContract(address,address,bool)")[:4].hex()
    calls.append(wc + word(owner.address) + word(DEX) + hex(1)[2:].zfill(64))

    wm = keccak(b"setWhitelistedMethod(address,address,bytes4,bool)")[:4].hex()
    for sel in METHODS:
        calls.append(wm + word(owner.address) + word(DEX) + sel.ljust(64, "0") + hex(1)[2:].zfill(64))

    wt = keccak(b"setWhitelistedToken(address,address,bool)")[:4].hex()
    for token in ("0x" + "0" * 40, USDC, WETH, KURU):
        calls.append(wt + word(owner.address) + word(token) + hex(1)[2:].zfill(64))

    print(f"registering {owner.address} as its own session, {len(calls)} txs, cap 1 MON")
    for data in calls:
        h = send(owner, {"chainId": CHAIN, "nonce": nonce, "to": VAL, "gas": 200_000,
                         "maxFeePerGas": fee, "maxPriorityFeePerGas": TIP, "type": 2, "value": 0,
                         "data": bytes.fromhex(data)})
        nonce += 1
        r = receipt(h)
        if int(r["status"], 16) != 1:
            raise SystemExit("reverted " + h)
    print("registered")

    sel = keccak(b"isSessionValid(address,address)")[:4].hex()
    v = rpc("eth_call", [{"to": VAL, "data": "0x" + sel + word(owner.address) + word(owner.address)}, "latest"])
    print("isSessionValid", int(v, 16) == 1)


if __name__ == "__main__":
    main()
