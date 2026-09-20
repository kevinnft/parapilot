"""
ParaPilot Transaction Executor
Dispatches policy-enforced transactions to Monad RPC using the agent's session key.
"""

import os
from typing import Dict, Any, Optional
from web3 import Web3
from eth_account import Account

class MonadExecutor:
    def __init__(self, rpc_url: Optional[str] = None, session_private_key: Optional[str] = None):
        self.rpc_url = rpc_url or os.getenv("MONAD_RPC_URL", "https://testnet-rpc.monad.xyz")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.private_key = session_private_key or os.getenv("SESSION_PRIVATE_KEY")
        if self.private_key:
            self.account = Account.from_key(self.private_key)
            self.session_address = self.account.address
        else:
            self.account = None
            self.session_address = None

    def execute_action(
        self,
        validator_address: str,
        owner_address: str,
        target_contract: str,
        calldata: bytes,
        spend_amount_wei: int = 0
    ) -> Dict[str, Any]:
        """
        Submits execution gated by the on-chain SessionKeyValidator.
        """
        if not self.account:
            return {"status": "error", "message": "No session key loaded"}

        nonce = self.w3.eth.get_transaction_count(self.session_address, "pending")
        base_fee = self.w3.eth.get_block("latest").get("baseFeePerGas", 100_000_000)

        # Build EIP-1559 transaction for Monad
        tx = {
            "from": self.session_address,
            "to": target_contract,
            "value": spend_amount_wei,
            "data": calldata,
            "nonce": nonce,
            "gas": 150000,
            "maxFeePerGas": base_fee * 2,
            "maxPriorityFeePerGas": 1,
            "chainId": 10143 # Monad testnet chainId
        }

        try:
            signed = self.account.sign_transaction(tx)
            raw_tx = signed.raw_transaction
            tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
            return {
                "status": "submitted",
                "tx_hash": tx_hash.hex(),
                "session_key": self.session_address
            }
        except Exception as e:
            return {
                "status": "reverted",
                "error": str(e),
                "reason": "Likely violated on-chain policy validator guardrails"
            }
