"""
ParaPilot Agent Loop
Connects Zerion intelligence, LLM reasoning, and Monad on-chain execution.
"""

import time
import os
from zerion_client import ZerionClient
from brain import AgentBrain
from executor import MonadExecutor

DEX = "0x191382fF69aaF5f91617644b6281f224D9bA2764"
TOKENS = {
    "MON": "0x" + "0" * 40,
    "USDC": "0xd4309703c783E671F5Ef61630Cb576916cE03200",
    "WETH": "0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0",
    "KURU": "0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba",
}

def run_agent():
    print("=" * 60)
    print("ParaPilot Autonomous Agent Loop Starting...")
    print("Network: Monad Parallel EVM")
    print("=" * 60)

    zerion = ZerionClient()
    brain = AgentBrain()
    executor = MonadExecutor()

    user_wallet = os.getenv("USER_WALLET_ADDRESS", "0xb1caec6d89f2d62db3416054096070c340dc2c41")
    policy = {
        "max_spend_usd": 50.0,
        "allowed_tokens": ["MON", "USDC", "WETH"],
        "risk_tier": "moderate"
    }

    print(f"Monitoring Wallet: {user_wallet}")
    print(f"Active Policy: Max ${policy['max_spend_usd']}/24h | Tokens: {policy['allowed_tokens']}")

    # 1. Fetch live enriched portfolio
    print("\n[1] Fetching live portfolio via Zerion API...")
    positions = zerion.get_wallet_positions(user_wallet)
    print(f"    Loaded {len(positions)} verified token positions.")

    # 2. Evaluate strategy with LLM
    print("\n[2] Evaluating strategy via Agent Brain (Qwen / Kimi)...")
    market_signals = {"market_trend": "neutral", "gas_price": "low"}
    decision = brain.evaluate_strategy(positions, policy, market_signals)
    print(f"    Decision: {decision.get('action')} - {decision.get('reasoning')}")

    # 3. If action requires on-chain settlement, dispatch via session key
    if decision.get("action") == "SWAP":
        print("\n[3] Dispatching policy-gated swap to ParaPilotAccount...")
        token_in = decision.get("token_in", "MON")
        token_out = decision.get("token_out", "USDC")
        amount = float(decision.get("amount_in") or 0)
        if amount <= 0:
            print("    Brain returned a swap with no amount. Nothing sent.")
        else:
            decimals = {"MON": 18, "USDC": 6, "WETH": 18, "KURU": 18}
            amount_units = int(amount * 10 ** decimals.get(token_in, 18))
            result = executor.execute_swap(DEX, TOKENS[token_in], TOKENS[token_out], amount_units)
            print(f"    Result: {result['status']} {result.get('tx_hash') or result.get('error')}")
    else:
        print("\n[3] No execution needed. Maintaining position.")

    print("\nParaPilot cycle complete.")

if __name__ == "__main__":
    run_agent()
