#!/usr/bin/env python3
"""Arm W002 on the v2 account, then prove the policy is real.

1. A 0.01 MON swap through executeSwapViaSessionKey succeeds and the on-chain
   spend counter moves.
2. A swap bigger than the remaining cap reverts with SpendLimitExceeded and
   moves no funds.
"""

import json
import time
import urllib.request
from eth_account import Account
from eth_utils import keccak, to_checksum_address

RPC = "https://testnet-rpc.monad.xyz"
CHAIN = 10143
TIP = 2_000_000_000
DEX = "0x191382fF69aaF5f91617644b6281f224D9bA2764"
USDC = "0xd4309703c783E671F5Ef61630Cb576916cE03200"
WETH = "0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0"
KURU = "0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba"
SWAP_SEL = "c3d05443"  # executeSwapViaSessionKey on the account
DEX_SWAP_SEL = "b79c48e5"  # swapExactETHForTokens, the selector the validator actually checks


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


def receipt(h, tries=25):
    for _ in range(tries):
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
    dep = json.load(open("C:/Users/RYZEN/parapilot/contracts/deployments.json", encoding="utf-8"))
    val = dep["contracts"]["SessionKeyValidator"]["address"]
    acc = dep["contracts"]["ParaPilotAccount"]["address"]

    master = json.load(open("C:/Users/RYZEN/Downloads/nookplot/wallets/WALLET-MASTER.json", encoding="utf-8"))
    owner = Account.from_key(next(w["privateKey"] for w in master["wallets"] if w["label"] == "W001"))
    agent = Account.from_key(next(w["privateKey"] for w in master["wallets"] if w["label"] == "W002"))

    gp = int(rpc("eth_gasPrice", []), 16)
    fee = int(gp * 125 // 100)
    nonce = int(rpc("eth_getTransactionCount", [owner.address, "pending"]), 16)

    # The agent only needs enough MON for its own gas, never for the swap itself.
    agent_bal = int(rpc("eth_getBalance", [agent.address, "latest"]), 16)
    if agent_bal < int(0.05e18):
        h = send(owner, {"chainId": CHAIN, "nonce": nonce, "to": agent.address, "gas": 25_000,
                         "maxFeePerGas": fee, "maxPriorityFeePerGas": TIP, "type": 2, "value": int(0.1e18)})
        nonce += 1
        receipt(h)
        print("agent funded", h)

    now = int(time.time()) - 60
    cap = int(0.02e18)  # 0.02 MON per 24h, small on purpose so the revert is cheap to prove
    calls = []

    reg = keccak(b"registerSessionKey(address,uint256,uint256,uint256,uint256)")[:4].hex()
    calls.append(reg + word(agent.address) + hex(now)[2:].zfill(64) + hex(now + 7 * 86400)[2:].zfill(64)
                 + hex(cap)[2:].zfill(64) + hex(86400)[2:].zfill(64))

    wc = keccak(b"setWhitelistedContract(address,address,bool)")[:4].hex()
    calls.append(wc + word(agent.address) + word(DEX) + hex(1)[2:].zfill(64))

    wm = keccak(b"setWhitelistedMethod(address,address,bytes4,bool)")[:4].hex()
    calls.append(wm + word(agent.address) + word(DEX) + DEX_SWAP_SEL.ljust(64, "0") + hex(1)[2:].zfill(64))

    wt = keccak(b"setWhitelistedToken(address,address,bool)")[:4].hex()
    for token in ("0x" + "0" * 40, USDC, WETH, KURU):
        calls.append(wt + word(agent.address) + word(token) + hex(1)[2:].zfill(64))

    print(f"arming policy: cap 0.02 MON, {len(calls)} txs")
    for data in calls:
        h = send(owner, {"chainId": CHAIN, "nonce": nonce, "to": val, "gas": 200_000,
                         "maxFeePerGas": fee, "maxPriorityFeePerGas": TIP, "type": 2, "value": 0,
                         "data": bytes.fromhex(data)})
        nonce += 1
        r = receipt(h)
        if int(r["status"], 16) != 1:
            raise SystemExit("policy tx reverted " + h)
    print("policy armed")

    def swap(amount_wei):
        data = (SWAP_SEL + word(DEX) + word("0x" + "0" * 40) + word(USDC)
                + hex(amount_wei)[2:].zfill(64) + hex(1)[2:].zfill(64))
        n = int(rpc("eth_getTransactionCount", [agent.address, "pending"]), 16)
        h = send(agent, {"chainId": CHAIN, "nonce": n, "to": acc, "gas": 250_000,
                         "maxFeePerGas": fee, "maxPriorityFeePerGas": TIP, "type": 2, "value": 0,
                         "data": bytes.fromhex(data)})
        r = receipt(h)
        return h, int(r["status"], 16), int(r["gasUsed"], 16)

    ok_hash, ok_status, ok_gas = swap(int(0.01e18))
    print(f"WITHIN CAP  status {ok_status} gas {ok_gas} {ok_hash}")

    bad_hash, bad_status, bad_gas = swap(int(0.02e18))
    print(f"OVER CAP    status {bad_status} gas {bad_gas} {bad_hash}")

    # sessionPolicies(owner, agent): currentIntervalSpent is the 5th word.
    sel = keccak(b"sessionPolicies(address,address)")[:4].hex()
    raw = rpc("eth_call", [{"to": val, "data": "0x" + sel + word(owner.address) + word(agent.address)}, "latest"])
    spent = int(raw[2 + 64 * 5: 2 + 64 * 6], 16)
    print(f"on-chain spent {spent/1e18:.4f} MON of 0.0200 cap")

    if ok_status != 1 or bad_status != 0 or spent != int(0.01e18):
        raise SystemExit("POLICY PROOF FAILED")
    print("POLICY PROOF OK")
    print("https://testnet.monadexplorer.com/tx/" + ok_hash)
    print("https://testnet.monadexplorer.com/tx/" + bad_hash)


if __name__ == "__main__":
    main()
