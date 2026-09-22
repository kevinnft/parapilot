"""
ParaPilot Transaction Executor
Dispatches policy-enforced transactions to Monad RPC using the agent's session key.
"""

import os
from typing import Dict, Any, Optional
from web3 import Web3
from eth_account import Account

# executeSwapViaSessionKey(address,address,address,uint256,uint256)
SWAP_SELECTOR = bytes.fromhex("c3d05443")
ACCOUNT = "0xB56586E881a2F0f70A0c221ace4Efe7bD68C2EF7"


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

    def execute_swap(
        self,
        router: str,
        token_in: str,
        token_out: str,
        amount_in: int,
        min_amount_out: int = 1,
        account: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Swap through ParaPilotAccount so the on-chain policy actually runs.

        The session key signs, but the account holds the funds and
        SessionKeyValidator checks the router, the method, the token and the cap.
        A policy revert comes back as status 'reverted'.
        """
        if not self.account:
            return {"status": "error", "message": "No session key loaded"}

        token_in = (token_in or "").lower()
        token_out = (token_out or "").lower()
        data = (SWAP_SELECTOR
                + bytes.fromhex(router[2:].zfill(40))
                + bytes.fromhex(token_in[2:].zfill(40))
                + bytes.fromhex(token_out[2:].zfill(40))
                + amount_in.to_bytes(32, "big")
                + min_amount_out.to_bytes(32, "big"))

        nonce = self.w3.eth.get_transaction_count(self.session_address, "pending")
        # Monad testnet charges gasLimit * effectiveGasPrice, not gasUsed.
        gas_price = self.w3.eth.gas_price
        max_fee = max(int(gas_price * 125 // 100), 2_000_000_000)

        tx = {
            "from": self.session_address,
            "to": Web3.to_checksum_address(account or ACCOUNT),
            "value": 0,
            "data": data,
            "nonce": nonce,
            "gas": 250_000,
            "maxFeePerGas": max_fee,
            "maxPriorityFeePerGas": 2_000_000_000,
            "chainId": 10143,
            "type": 2,
        }

        try:
            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            return {"status": "submitted", "tx_hash": tx_hash.hex(), "session_key": self.session_address}
        except Exception as e:
            return {"status": "reverted", "error": str(e),
                    "reason": "Rejected by SessionKeyValidator or the router"}
