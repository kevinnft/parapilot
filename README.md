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

## 📂 Repository Structure

```
parapilot/
├── contracts/             # Solidity Smart Contracts (Foundry / Hardhat)
│   ├── SessionKeyValidator.sol
│   ├── PolicyEngine.sol
│   └── interfaces/
├── agent/                 # Autonomous AI Agent Daemon (Python / TypeScript)
│   ├── brain.py           # LLM reasoning loop
│   ├── zerion_client.py   # Portfolio & market data feeds
│   └── executor.py        # Monad RPC transaction dispatcher
├── frontend/              # ParaPilot Studio (Next.js, Tailwind, Dynamic/Privy)
└── scripts/               # Deployment and testing scripts for Monad Devnet
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Python >= 3.10
- Git

### 1. Clone Repository
```bash
git clone https://github.com/kevinnft/parapilot.git
cd parapilot
```

### 2. Smart Contract Setup
```bash
cd contracts
npm install
```

### 3. Agent Runtime Setup
```bash
cd ../agent
pip install -r requirements.txt
```

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
