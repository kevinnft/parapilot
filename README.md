# ParaPilot ⚡🤖

> **High-Throughput Policy Engine & Non-Custodial Session Keys for Autonomous AI Agents on Monad.**
> Built for the **Monad Metropolis Hackathon 2026** — *Track 4: Trust, Identity & AI Infrastructure*.

---

## 📌 Executive Summary

As AI agents become active economic actors on-chain, delegating transactional authority without compromising wallet security is the primary barrier to adoption. Today, developers either:
1. Give agents **raw private keys**, exposing user balances to catastrophic drain via prompt injections, model bugs, or malicious exploits.
2. Require **manual user signatures** for every action, crippling autonomous high-frequency operations and latency-sensitive strategies.

**ParaPilot** solves this dilemma by introducing a **policy-enforced smart session key architecture** optimized for Monad's Parallel EVM. Users issue scoped, temporary session credentials to autonomous agents with deterministic on-chain guardrails—including maximum spend limits, contract whitelisting, asset restrictions, and instant kill-switches.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   ParaPilot Studio                     │
│         (Passkey / WebAuthn Account Creation)          │
└──────────────────────────┬─────────────────────────────┘
                           │ 1. User configures policy & delegates Session Key
                           ▼
┌────────────────────────────────────────────────────────┐
│             On-Chain Policy Engine (Monad)             │
│  - SessionKeyValidator.sol                             │
│  - PolicyEngine.sol (Spend limits, whitelists, expiry) │
│  - EmergencyKillSwitch.sol                             │
└──────────────────────────▲─────────────────────────────┘
                           │ 3. Policy-gated transaction execution
┌──────────────────────────┴─────────────────────────────┐
│                 ParaPilot Agent Brain                  │
│  - Market Intelligence: Zerion API (Portfolio & Risk)  │
│  - Reasoning Layer: LLM (Qwen / Kimi / DeepSeek)       │
│  - Autonomous Execution Signer (Session Key)           │
└────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

- **🛡️ Scoped On-Chain Permissions**:
  - **Spending Limits**: Enforce maximum token outflows per epoch / per 24 hours.
  - **Contract & Method Whitelists**: Restrict execution strictly to verified DEX routers, lending pools, or protocols.
  - **Asset Whitelist**: Lock interactions to approved tokens (e.g., `MON`, `USDC`, `WETH`), rejecting untrusted tokens automatically.
- **⚡ Parallel Execution on Monad**:
  - Leverages Monad’s 10,000 TPS and sub-second block finality to validate guardrails and settle high-frequency agent actions with near-zero latency.
- **🛑 Emergency Kill-Switch**:
  - The wallet owner retains absolute root authority to revoke, freeze, or replace any active session key in a single transaction.
- **📊 Real-Time Portfolio Intelligence via Zerion API**:
  - Powers the agent's decision loop with enriched transaction history, accurate token pricing, and spam-filtered balances.
- **👤 Passkey-Native Onboarding**:
  - Frictionless user experience using WebAuthn / Passkeys, eliminating seed phrases for everyday operators.

---

## 🌐 Live Verified Deployments on Monad Testnet

All contracts are deployed and verified live on **Monad Testnet (Chain ID: 10143)**:

| Component | Monad Testnet Contract Address | Explorer Link |
| :--- | :--- | :--- |
| **SessionKeyValidator** | `0x01022d952087B7FBacc8DA53478B0F555Fe457C4` | [View Contract](https://testnet.monadexplorer.com/address/0x01022d952087B7FBacc8DA53478B0F555Fe457C4) |
| **ParaPilotAccount** | `0x8A55d40977C49D4Ac5C569ebA4631D4e9026C592` | [View Contract](https://testnet.monadexplorer.com/address/0x8A55d40977C49D4Ac5C569ebA4631D4e9026C592) |
| **MockDEX Router (Multi-Token)** | `0x191382fF69aaF5f91617644b6281f224D9bA2764` | [View Contract](https://testnet.monadexplorer.com/address/0x191382fF69aaF5f91617644b6281f224D9bA2764) |
| **USD Coin (USDC, 6 decimals)** | `0xd4309703c783E671F5Ef61630Cb576916cE03200` | [View Token](https://testnet.monadexplorer.com/address/0xd4309703c783E671F5Ef61630Cb576916cE03200) |
| **Wrapped Ether (WETH, 18 decimals)** | `0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0` | [View Token](https://testnet.monadexplorer.com/address/0x7CeEe8e62AfeeD5645cD4024DbfeF3e5F71145e0) |
| **Kuru Token (KURU, 18 decimals)** | `0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba` | [View Token](https://testnet.monadexplorer.com/address/0x15c2cEf5c93AD6cc6158812C2e128579727Dd4ba) |

### ⚡ Verified Live Transactions on Monad Testnet:
- **Policy Registration (W002 Authorized)**: [`0x33c0ce8e...`](https://testnet.monadexplorer.com/tx/0x33c0ce8eeb3658c37500292a23d2714420b37f0ea65fe65ccab9e24f639cae79) (`Status: SUCCESS (0x1)`)
- **Policy-Guarded Agent Swap (MON → USDC)**: [`0xbc8cb198...`](https://testnet.monadexplorer.com/tx/0xbc8cb198433460a5542fa0a303eab62c1b8dda95cc98c4450cada84dadeae5f5) (`Status: SUCCESS (0x1)`)
- **Policy-Guarded Agent Swap (MON → WETH)**: [`0xa5d7878d...`](https://testnet.monadexplorer.com/tx/0xa5d7878d069d5b78a68b834c93873246a76541229fc166bd5ee465d2efdff486) (`Status: SUCCESS (0x1)`)
- **Policy-Guarded Agent Swap (MON → KURU)**: [`0x7785cba3...`](https://testnet.monadexplorer.com/tx/0x7785cba3f6a8495feb5f2eabcaba30f7676cba8068b388ed3048ef7ba4c23b95) (`Status: SUCCESS (0x1)`)
- **Direct User Multi-Token Swap (USDC → WETH)**: [`0x5bf49457...`](https://testnet.monadexplorer.com/tx/0x5bf49457ae9724fe5be4862b14a42bda0b10bb46e92da8801b9ff07b86f6b42c) (`Status: SUCCESS (0x1)`)
- **Direct User Multi-Token Swap (WETH → USDC)**: [`0xf4e92940...`](https://testnet.monadexplorer.com/tx/0xf4e92940c8ee12506a30d8a3cc5a1c828b53023c1362d1caf08f250a4aa20f88) (`Status: SUCCESS (0x1)`)
- **Direct User Multi-Token Swap (USDC → MON)**: [`0x7e054302...`](https://testnet.monadexplorer.com/tx/0x7e054302aeec9d2fec96312d33831588e9d03b1f5f7ca8b98aca0adbff0ca3c7) (`Status: SUCCESS (0x1)`)
- **Live Production App URL**: **`https://parapilot-ruby.vercel.app/`**

---

## 📂 Repository Structure

```
parapilot/
├── contracts/             # Solidity Smart Contracts & Hardhat Suite
│   ├── src/
│   │   ├── SessionKeyValidator.sol   # Core policy validation engine
│   │   ├── ParaPilotAccount.sol      # Policy-guarded smart account
│   │   └── mocks/                    # Mock DEX router & ERC20 tokens
│   ├── test/                         # Comprehensive automated tests (10 passing)
│   └── scripts/deploy.js             # Deployment script for Monad Devnet
├── agent/                 # Autonomous AI Agent Daemon (Python)
│   ├── main.py            # End-to-end agent decision and execution loop
│   ├── brain.py           # LLM reasoning layer (Qwen / Kimi)
│   ├── zerion_client.py   # Live Zerion Builder API portfolio feed
│   └── executor.py        # Monad RPC transaction dispatcher
└── frontend/              # ParaPilot Studio (Next.js 14, Tailwind, Lucide)
    └── src/app/page.tsx   # Interactive policy configurator & live telemetry
```

---

## 🚀 Quick Start & Verification

### Prerequisites
- Node.js >= 18.0.0
- Python >= 3.10
- Git

### 1. Run Smart Contract Test Suite
```bash
cd contracts
npm install
npx hardhat test
```
*Output: 10/10 automated tests passing, verifying spend limits, contract whitelisting, method gating, interval reset, and emergency kill-switch.*

### 2. Run Autonomous Agent Daemon
```bash
cd agent
export ZERION_API_KEY="your_zerion_key"
export USER_WALLET_ADDRESS="0x..."
python3 -u main.py
```
*Live test against real wallet: Successfully queries Zerion API, parses 50+ verified tokens, and feeds structured state into the LLM policy evaluation engine.*

### 3. Launch ParaPilot Studio Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the interactive Studio UI. You can adjust spending sliders, toggle token whitelists, trigger mock trade simulations, and test the emergency kill-switch.

---

## 🏆 Hackathon Bounties Targeted

- **Primary Track**: *Trust, Identity & AI Infrastructure* ($30,000)
- **Sponsor Bounties**:
  - *Best Agent Wallet Plugin* ($2,500)
  - *Best Use of Dynamic / Privy* ($5,000)
  - *Best Builds Powered by Qwen / Kimi*
  - *Best Use of Zerion API*

---

## 📜 License
MIT License. Open source for the decentralized community.
