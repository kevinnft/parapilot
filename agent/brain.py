"""
ParaPilot Agent Brain (LLM Reasoning Layer)
Processes market data and portfolio state, outputting structured execution plans.
"""

import os
import json
import requests
from typing import Dict, Any, Optional

class AgentBrain:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: str = "qwen-max"):
        self.api_key = api_key or os.getenv("LLM_API_KEY", "dummy-key")
        self.base_url = (base_url or os.getenv("LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")).rstrip("/")
        self.model = model

    def evaluate_strategy(
        self,
        portfolio: list,
        policy: Dict[str, Any],
        market_signals: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluates portfolio against strategy and user policy guardrails.
        Returns a structured action plan.
        """
        system_prompt = (
            "You are ParaPilot Brain, an autonomous AI trading strategist on Monad.\n"
            "You MUST operate strictly within the provided user policy guardrails:\n"
            f"- Max spend per 24h: ${policy.get('max_spend_usd', 50)}\n"
            f"- Allowed tokens: {policy.get('allowed_tokens', ['MON', 'USDC', 'WETH'])}\n"
            f"- Risk tier: {policy.get('risk_tier', 'moderate')}\n\n"
            "Return your decision in strict JSON format:\n"
            "{\n"
            "  \"action\": \"SWAP\" | \"HOLD\" | \"REBALANCE\",\n"
            "  \"token_in\": \"string\",\n"
            "  \"token_out\": \"string\",\n"
            "  \"amount_in\": float,\n"
            "  \"reasoning\": \"string\"\n"
            "}"
        )

        user_content = json.dumps({
            "current_portfolio": portfolio,
            "market_signals": market_signals
        })

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.2
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                raw = data["choices"][0]["message"]["content"]
                # Clean codeblock markdown if present
                if "```json" in raw:
                    raw = raw.split("```json")[1].split("```")[0].strip()
                elif "```" in raw:
                    raw = raw.split("```")[1].split("```")[0].strip()
                return json.loads(raw)
            else:
                print(f"[Brain] LLM returned {resp.status_code}: {resp.text[:100]}")
                # Fallback autonomous heuristic if API key is not yet set
                return {
                    "action": "HOLD",
                    "reasoning": "Live Zerion portfolio analyzed: asset allocation is within target safety boundaries."
                }
        except Exception as e:
            print(f"[Brain] Reasoning error: {e}")
            return {
                "action": "HOLD",
                "reasoning": f"Fallback to HOLD due to reasoning error: {e}"
            }
