# ParaPilot

High-throughput policy engine and non-custodial session keys for autonomous AI agents on Monad.

Built for the Monad Metropolis Hackathon 2026, Track 4: Trust, Identity and AI Infrastructure.

Live demo: https://parapilot-ruby.vercel.app/
Code: https://github.com/kevinnft/parapilot

## What it does

An agent that holds a raw private key can be drained by a prompt injection. An agent that asks for a signature on every swap is not autonomous. ParaPilot sits between those two.

The user registers a session key on Monad. `SessionKeyValidator` checks four things before a swap moves any token: the router is whitelisted, the method selector is whitelisted, the token is whitelisted, and the 24-hour spend cap has room. `ParaPilotAccount` holds the funds. The session key signs, but it never holds the tokens. The owner can revoke the key with `revokeSessionKey`. A stranger cannot burn the quota: `validateExecution` only accepts calls from the bound account.

A separate `PasskeyVerifier` checks a WebAuthn ES256 assertion on-chain. Monad testnet does not serve the RIP-7212 P-256 precompile, so verification falls back to OpenZeppelin's Solidity implementation. The public key is an argument, so one contract checks any passkey.

## What is actually deployed

Monad Testnet, chain id 10143. RPC `https://testnet-rpc.monad.xyz`.

| Contract | Address |
| --- | --- |
| SessionKeyValidator v2 | `0x847F5D03c3aFC47DcBCd041D0F02D52EFb242991` |
| ParaPilotAccount v2 | `0xB56586E881a2F0f70A0c221ace4Efe7bD68C2EF7` |
| PasskeyVerifier | `0x5B27bE516faD9f4F37338573aC0EB7CE032f09F0` |
| PasskeyAccount (single-key, earlier) | `0x882CfcBC9Fb35F8f0676ff8d72FA9294DcF64799` |
| MockDEX | `0x191382fF69aaF5f91617644b6281f224D9bA2764` |
| USDC (6 decimals, mock) | `0xd4309703c783E671F5Ef61630Cb576916cE03200` |
| WETH (18 decimals, mock) | `0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0` |
| KURU (18 decimals, mock) | `0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba` |

Explorer prefix: `https://testnet.monadexplorer.com/address/`

There is no `PolicyEngine.sol` and no `EmergencyKillSwitch.sol`. Both behaviours live in `SessionKeyValidator.sol`. An earlier v1 pair (`0x0102...57C4`, `0x8A55...C592`) is retired. Its hashes are in `contracts/verified_onchain_txs.json`.

PasskeyVerifier deploy: `0x8df1d7c89cda3908a41b2857853322b3a7d4e5846eed6f9cf64b6e3ebf14889a` (status 1). A first attempt at 900,000 gas reverted out of gas; the code deposit needs about 1.12M.

## Honest limits

- MockDEX mints the output token. It is not a pool, and the price is fixed in the frontend (MON 3, USDC 1, WETH 2650, KURU 0.20). The policy check is real. The market is not.
- The browser policy panel is a preview. It does not call `registerSessionKey` or `revokeSessionKey`. Those need the owner key, and that key is not in the frontend.
- The quota card reads `currentIntervalSpent` and `maxSpendPerInterval` from the validator, in 18-decimal units, labelled MON. A local slider does not change that number.
- A wallet-extension swap is built as `executeSwapViaSessionKey` on `ParaPilotAccount`. It only succeeds if that wallet address is the registered session key. The demo button signs with the registered key `0x4612...D0cc`.
- Passkey verification proves the device signed a challenge. It does not deploy a funded account for that passkey. `PasskeyAccount` is an earlier single-key contract. New passkeys go through `PasskeyVerifier`.
- ERC-8004 agent identity is not implemented.
- Dynamic and Privy are not integrated. They were removed from `package.json` so the repo does not claim a bounty it does not earn.
- Monad testnet charges `gasLimit * effectiveGasPrice`, not `gasUsed`. Swap gas is capped at 250,000.

## Tests

```bash
cd contracts
npm install
npx hardhat test
```

14 tests: session registration, spend cap, contract and method whitelist, expiry, interval reset, kill-switch, owner bypass, quota isolation, ERC-20 spend scaling, and WebAuthn P-256 accept/reject for any key.

## Run the demo

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and choose Demo Showcase Account. The swap spends `ParaPilotAccount`, not the connected address.

The agent daemon is optional and does not trade unless `LLM_API_KEY` is set and the model returns SWAP:

```bash
cd agent
pip install -r requirements.txt
python main.py
```

Without a key it returns HOLD. That is intentional.

## Gas

EIP-1559 only. `maxFeePerGas = gasPrice * 1.25`, `maxPriorityFeePerGas = 2 gwei`.

| Call | Cap |
| --- | --- |
| swap | 250,000 |
| approve | 100,000 |
| register or mint | 200,000 |
| native transfer | 25,000 |
| ordinary deploy | 900,000 |
| PasskeyVerifier deploy | 1,400,000 |

## Layout

```
contracts/src/SessionKeyValidator.sol   policy, whitelist, kill-switch
contracts/src/ParaPilotAccount.sol      holds funds, builds the router call
contracts/src/PasskeyVerifier.sol       stateless WebAuthn P-256 check
contracts/src/PasskeyAccount.sol        earlier single-key account
contracts/test/                         14 Hardhat tests
frontend/src/app/page.tsx               studio
frontend/src/app/api/execute-swap/      session-key swap
frontend/src/app/api/policy/            live quota read
frontend/src/app/api/passkey-verify/    eth_call into PasskeyVerifier
agent/                                  Zerion, LLM, executor
```

## License

MIT.
