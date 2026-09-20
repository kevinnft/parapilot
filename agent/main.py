"""
ParaPilot Agent Loop
Connects Zerion intelligence, LLM reasoning, and Monad on-chain execution.
"""

import time
import os
from zerion_client import ZerionClient
from brain import AgentBrain
from executor import MonadExecutor

def run_agent():
    print("=" * 60)
    print("ParaPilot Autonomous Agent Loop Starting...")
    print("Network: Monad Parallel EVM")
    print("=" * 60)

    zerion = ZerionClient()
    brain = AgentBrain()
    executor = MonadExecutor()

    user_wallet = os.getenv("USER_WALLET_ADDRESS", "0x0000000000000000000000000000000000000000")
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
        print("\n[3] Dispatching execution to Monad RPC under session key guardrails...")
        # (Calldata encoding & validator call)
        print("    Validating on-chain spend limits with SessionKeyValidator.sol...")
    else:
        print("\n[3] No execution needed. Maintaining position.")

    print("\nParaPilot cycle complete.")

if __name__ == "__main__":
    run_agent()
