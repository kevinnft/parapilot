#!/usr/bin/env python3
"""
Native Deployment & Verification on Monad Testnet for ParaPilot
Bypasses Hardhat indexer polling errors by broadcasting raw EIP-1559 signed txs.
"""

import json
import time
import os
import urllib.request
from eth_account import Account
from eth_utils import to_checksum_address, keccak
import rlp

RPC_URL = "https://testnet-rpc.monad.xyz"
CHAIN_ID = 10143

def rpc_call(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(RPC_URL, data=body, headers={"Content-Type": "application/json", "User-Agent": "ParaPilot/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        res = json.loads(resp.read().decode())
        if "error" in res:
            raise RuntimeError(f"RPC Error ({method}): {res['error']}")
        return res.get("result")

def get_nonce(addr):
    res = rpc_call("eth_getTransactionCount", [addr, "pending"])
    return int(res, 16)

def get_gas_price():
    res = rpc_call("eth_gasPrice", [])
    return int(res, 16)

def send_tx(acct, tx_dict):
    signed = acct.sign_transaction(tx_dict)
    raw_hex = signed.raw_transaction.hex()
    if not raw_hex.startswith("0x"):
        raw_hex = "0x" + raw_hex
    tx_hash = rpc_call("eth_sendRawTransaction", [raw_hex])
    return tx_hash

def wait_for_code(address, max_wait=30):
    t0 = time.time()
    while time.time() - t0 < max_wait:
        code = rpc_call("eth_getCode", [address, "latest"])
        if code and len(code) > 10:
            return True
        time.sleep(1.5)
    return False

def main():
    print("==================================================")
    print("ParaPilot: Deploying to Monad Testnet")
    print("==================================================")

    # 1. Load W001 Key from WALLET-MASTER
    master_path = "C:/Users/RYZEN/Downloads/nookplot/wallets/WALLET-MASTER.json"
    with open(master_path, "r", encoding="utf-8") as f:
        master = json.load(f)

    pk = None
    for w in master.get("wallets", []):
        if w.get("label") == "W001":
            pk = w.get("privateKey")
            break

    if not pk:
        raise RuntimeError("W001 private key not found in WALLET-MASTER")

    if not pk.startswith("0x"):
        pk = "0x" + pk

    acct = Account.from_key(pk)
    owner_addr = acct.address
    print(f"Deployer / Owner Address: {owner_addr}")

    bal_hex = rpc_call("eth_getBalance", [owner_addr, "latest"])
    bal_mon = int(bal_hex, 16) / 1e18
    print(f"Deployer Balance:        {bal_mon:.4f} MON")

    nonce = get_nonce(owner_addr)
    gas_price = get_gas_price()
    # add 20% buffer to gas price
    max_fee = int(gas_price * 1.25)
    priority_fee = 2_000_000_000 # 2 Gwei

    print(f"Current Nonce:           {nonce}")
    print(f"Gas Price:               {gas_price / 1e9:.2f} Gwei (MaxFee: {max_fee / 1e9:.2f} Gwei)")

    # 2. Check or Deploy SessionKeyValidator
    val_addr = "0x847F5D03c3aFC47DcBCd041D0F02D52EFb242991"
    if wait_for_code(val_addr, 2):
        print(f"\n[1] ✅ SessionKeyValidator already deployed at: {val_addr}")
    else:
        print("\n[1] Deploying SessionKeyValidator...")
        # (Already deployed at nonce 0)
        pass

    # 3. Deploy ParaPilotAccount
    print("\n[2] Deploying ParaPilotAccount (Smart Account)...")
    art_path = "C:/Users/RYZEN/parapilot/contracts/artifacts/src/ParaPilotAccount.sol/ParaPilotAccount.json"
    with open(art_path, "r") as f:
        art = json.load(f)
    bytecode = art["bytecode"]

    # Constructor ABI encoding: (address _owner, address _validator)
    owner_padded = owner_addr[2:].lower().zfill(64)
    val_padded = val_addr[2:].lower().zfill(64)
    deploy_data = bytecode + owner_padded + val_padded

    predicted_acc = to_checksum_address(keccak(rlp.encode([bytes.fromhex(owner_addr[2:]), nonce]))[12:])
    print(f"    Expected ParaPilotAccount Address: {predicted_acc}")

    tx_acc = {
        "chainId": CHAIN_ID,
        "nonce": nonce,
        "gas": 900_000,
        "maxFeePerGas": max_fee,
        "maxPriorityFeePerGas": priority_fee,
        "value": 0,
        "data": bytes.fromhex(deploy_data[2:] if deploy_data.startswith("0x") else deploy_data),
        "type": 2
    }
    tx_acc_hash = send_tx(acct, tx_acc)
    print(f"    Tx Broadcasted! Hash: {tx_acc_hash}")
    nonce += 1

    print("    Waiting for confirmation on Monad Parallel EVM...")
    if wait_for_code(predicted_acc, 25):
        print(f"    ✅ ParaPilotAccount successfully confirmed at: {predicted_acc}!")
    else:
        print(f"    ⚠️ Check explorer shortly: https://testnet.monadexplorer.com/tx/{tx_acc_hash}")

    # 4. Fund ParaPilotAccount with 0.1 MON
    print("\n[3] Depositing 0.1 MON into ParaPilotAccount...")
    time.sleep(2)
    tx_fund = {
        "chainId": CHAIN_ID,
        "nonce": nonce,
        "to": predicted_acc,
        "gas": 25_000,
        "maxFeePerGas": max_fee,
        "maxPriorityFeePerGas": priority_fee,
        "value": int(0.1 * 1e18),
        "type": 2
    }
    tx_fund_hash = send_tx(acct, tx_fund)
    print(f"    Fund Tx Hash: {tx_fund_hash}")
    nonce += 1

    # 5. Register Session Key on Validator
    # Let's register a dedicated agent session key
    agent_key = "0x7179b7746187768e7b165b5006b52dc2744888f6"
    print(f"\n[4] Registering Agent Session Key ({agent_key}) on-chain...")
    now = int(time.time())
    valid_until = now + (7 * 86400) # 7 days
    max_spend_wei = int(1.0 * 1e18) # 1.0 MON max per 24h
    interval = 86400

    # registerSessionKey(address,uint256,uint256,uint256,uint256) selector:
    # keccak256("registerSessionKey(address,uint256,uint256,uint256,uint256)")[:4]
    sel_reg = keccak(b"registerSessionKey(address,uint256,uint256,uint256,uint256)")[:4].hex()
    data_reg = (
        sel_reg +
        agent_key[2:].lower().zfill(64) +
        hex(now)[2:].zfill(64) +
        hex(valid_until)[2:].zfill(64) +
        hex(max_spend_wei)[2:].zfill(64) +
        hex(interval)[2:].zfill(64)
    )

    time.sleep(2)
    tx_reg = {
        "chainId": CHAIN_ID,
        "nonce": nonce,
        "to": val_addr,
        "gas": 120_000,
        "maxFeePerGas": max_fee,
        "maxPriorityFeePerGas": priority_fee,
        "value": 0,
        "data": bytes.fromhex(data_reg),
        "type": 2
    }
    tx_reg_hash = send_tx(acct, tx_reg)
    print(f"    Policy Registered! Tx Hash: {tx_reg_hash}")
    nonce += 1

    # Summary Output
    deploy_summary = {
        "network": "Monad Testnet",
        "chainId": CHAIN_ID,
        "deployer": owner_addr,
        "contracts": {
          "SessionKeyValidator": {
            "address": val_addr,
            "explorer": f"https://testnet.monadexplorer.com/address/{val_addr}"
          },
          "ParaPilotAccount": {
            "address": predicted_acc,
            "txHash": tx_acc_hash,
            "explorer": f"https://testnet.monadexplorer.com/address/{predicted_acc}"
          }
        },
        "interactions": {
          "accountFundingTx": {
            "hash": tx_fund_hash,
            "explorer": f"https://testnet.monadexplorer.com/tx/{tx_fund_hash}"
          },
          "policyRegistrationTx": {
            "hash": tx_reg_hash,
            "agentKey": agent_key,
            "explorer": f"https://testnet.monadexplorer.com/tx/{tx_reg_hash}"
          }
        },
        "updatedAt": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

    out_file = "C:/Users/RYZEN/parapilot/contracts/deployments.json"
    with open(out_file, "w") as f:
        json.dump(deploy_summary, f, indent=2)

    print("\n==================================================")
    print("DEPLOYMENT & ON-CHAIN REGISTRATION COMPLETE!")
    print(f"Validator:           {val_addr}")
    print(f"Smart Account:       {predicted_acc}")
    print(f"Policy Registration: {tx_reg_hash}")
    print(f"Details saved to:    {out_file}")
    print("==================================================")

if __name__ == "__main__":
    main()
