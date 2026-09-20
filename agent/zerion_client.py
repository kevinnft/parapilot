"""
Zerion API Client for ParaPilot Agent
Enriches on-chain raw portfolio data into structured, spam-filtered market intelligence.
"""

import os
import base64
import requests
from typing import Dict, Any, List, Optional

class ZerionClient:
    BASE_URL = "https://api.zerion.io/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ZERION_API_KEY", "")
        # Zerion requires HTTP Basic Auth with API key as username and empty password
        if self.api_key:
            auth_str = base64.b64encode(f"{self.api_key}:".encode()).decode()
            auth_header = f"Basic {auth_str}"
        else:
            auth_header = ""

        self.headers = {
            "accept": "application/json",
            "authorization": auth_header,
            "User-Agent": "ParaPilot-Agent/1.0"
        }

    def get_wallet_positions(self, wallet_address: str, currency: str = "usd") -> List[Dict[str, Any]]:
        """
        Fetches fungible positions for a wallet address, excluding spam/scam tokens.
        """
        url = f"{self.BASE_URL}/wallets/{wallet_address}/positions"
        params = {
            "filter[positions]": "only_simple",
            "currency": currency,
            "filter[trash]": "only_non_trash",
            "sort": "-value"
        }
        
        try:
            resp = requests.get(url, headers=self.headers, params=params, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                positions = []
                for item in data.get("data", []):
                    attrs = item.get("attributes", {})
                    fungible = attrs.get("fungible_info", {})
                    positions.append({
                        "name": fungible.get("name"),
                        "symbol": fungible.get("symbol"),
                        "quantity": attrs.get("quantity", {}).get("float", 0.0),
                        "value_usd": attrs.get("value", 0.0),
                        "price": attrs.get("price", 0.0),
                        "verified": fungible.get("flags", {}).get("verified", False)
                    })
                return positions
            else:
                print(f"[Zerion] Error {resp.status_code}: {resp.text}")
                return []
        except Exception as e:
            print(f"[Zerion] Request failed: {e}")
            return []

    def get_token_price(self, token_address: str, chain: str = "monad") -> Optional[float]:
        """
        Retrieves real-time token price reference.
        """
        # Fallback or direct fungible inquiry
        url = f"{self.BASE_URL}/fungibles/{token_address}"
        try:
            resp = requests.get(url, headers=self.headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                attrs = data.get("data", {}).get("attributes", {})
                return attrs.get("market_data", {}).get("price")
        except Exception as e:
            print(f"[Zerion] Price lookup failed: {e}")
        return None
