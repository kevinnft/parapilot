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

The core contracts are deployed and verified live on **Monad Testnet (Chain ID: 10143)**:

| Component | Monad Testnet Address / Tx | Explorer Link |
| :--- | :--- | :--- |
| **SessionKeyValidator** | `0x01022d952087B7FBacc8DA53478B0F555Fe457C4` | [View on Explorer](https://testnet.monadexplorer.com/address/0x01022d952087B7FBacc8DA53478B0F555Fe457C4) |
| **ParaPilotAccount** | `0x8A55d40977C49D4Ac5C569ebA4631D4e9026C592` | [View on Explorer](https://testnet.monadexplorer.com/address/0x8A55d40977C49D4Ac5C569ebA4631D4e9026C592) |
| **Policy Registration Tx** | `0xffc34acf9931...` | [View Tx](https://testnet.monadexplorer.com/tx/0xffc34acf99310ecc27de96fad223a742fa31defa607e07dce61bf1cf3bec26fd) |
| **Autonomous Agent Execution Tx** | `0x1d7455621263...` | [View Tx](https://testnet.monadexplorer.com/tx/0x1d745562126303ca67dcbb9c8694b40df963de08917deaf52d3e9ec30a997364) |

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
