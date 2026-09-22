#!/usr/bin/env python3
"""Deploy the policy-enforcing ParaPilotAccount + SessionKeyValidator to Monad testnet.

The previous deployments cannot be upgraded, so this publishes a fresh pair and
points deployments.json at them. Gas caps are tight because the testnet bills
the full gas limit.
"""

import json
import time
import urllib.request
import rlp
from eth_account import Account
from eth_utils import keccak, to_checksum_address

RPC = "https://testnet-rpc.monad.xyz"
CHAIN = 10143
ROOT = "C:/Users/RYZEN/parapilot/contracts"
TIP = 2_000_000_000


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


def wait_code(addr, tries=25):
    for _ in range(tries):
        code = rpc("eth_getCode", [addr, "latest"])
        if code and len(code) > 10:
            return True
        time.sleep(2)
    return False


def main():
    master = json.load(open("C:/Users/RYZEN/Downloads/nookplot/wallets/WALLET-MASTER.json", encoding="utf-8"))
    pk = next(w["privateKey"] for w in master["wallets"] if w["label"] == "W001")
    owner = Account.from_key(pk if pk.startswith("0x") else "0x" + pk)
    agent = Account.from_key(next(w["privateKey"] for w in master["wallets"] if w["label"] == "W002"))

    gp = int(rpc("eth_gasPrice", []), 16)
    max_fee = int(gp * 125 // 100)
    nonce = int(rpc("eth_getTransactionCount", [owner.address, "pending"]), 16)
    print(f"owner {owner.address} nonce {nonce} gas {gp/1e9:.1f} gwei")

    val_art = json.load(open(f"{ROOT}/artifacts/src/SessionKeyValidator.sol/SessionKeyValidator.json"))
    acc_art = json.load(open(f"{ROOT}/artifacts/src/ParaPilotAccount.sol/ParaPilotAccount.json"))

    val_addr = to_checksum_address(keccak(rlp.encode([bytes.fromhex(owner.address[2:]), nonce]))[12:])
    print("validator ->", val_addr)
    h = send(owner, {
        "chainId": CHAIN, "nonce": nonce, "gas": 900_000,
        "maxFeePerGas": max_fee, "maxPriorityFeePerGas": TIP, "type": 2, "value": 0,
        "data": bytes.fromhex(val_art["bytecode"][2:]),
    })
    nonce += 1
    if not wait_code(val_addr):
        raise SystemExit("validator not confirmed: " + h)
    print("validator live", h)

    ctor = owner.address[2:].lower().zfill(64) + val_addr[2:].lower().zfill(64)
    acc_addr = to_checksum_address(keccak(rlp.encode([bytes.fromhex(owner.address[2:]), nonce]))[12:])
    print("account ->", acc_addr)
    h = send(owner, {
        "chainId": CHAIN, "nonce": nonce, "gas": 900_000,
        "maxFeePerGas": max_fee, "maxPriorityFeePerGas": TIP, "type": 2, "value": 0,
        "data": bytes.fromhex(acc_art["bytecode"][2:] + ctor),
    })
    nonce += 1
    if not wait_code(acc_addr):
        raise SystemExit("account not confirmed: " + h)
    print("account live", h)

    # Fund the account so a session-key swap has something to spend.
    h = send(owner, {
        "chainId": CHAIN, "nonce": nonce, "to": acc_addr, "gas": 25_000,
        "maxFeePerGas": max_fee, "maxPriorityFeePerGas": TIP, "type": 2,
        "value": int(0.5 * 1e18),
    })
    nonce += 1
    print("funded 0.5 MON", h)

    dep = json.load(open(f"{ROOT}/deployments.json", encoding="utf-8"))
    dep["contracts"]["SessionKeyValidator"] = {
        "address": val_addr,
        "explorer": f"https://testnet.monadexplorer.com/address/{val_addr}",
        "note": "v2: token whitelist enforced, validateExecution restricted to the bound account",
    }
    dep["contracts"]["ParaPilotAccount"] = {
        "address": acc_addr,
        "explorer": f"https://testnet.monadexplorer.com/address/{acc_addr}",
        "note": "v2: executeSwapViaSessionKey counts every token toward the 24h cap",
    }
    dep["sessionKey"] = agent.address
    dep["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    json.dump(dep, open(f"{ROOT}/deployments.json", "w"), indent=2)
    print("deployments.json updated")
    print(f"validator {val_addr}\naccount   {acc_addr}")


if __name__ == "__main__":
    main()
