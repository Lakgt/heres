# Heres - Capsule Protocol on Injective EVM

> **People disappear. Intent should not.**

Heres is a capsule protocol on **Injective EVM** where users create on-chain capsules, define beneficiaries, choose execution conditions, and let funds release automatically when those conditions are met. Beyond on-chain execution, Heres uses **Chainlink CRE (Chainlink Runtime Environment)** to deliver encrypted off-chain *Intent Statements* such as recovery notes, credentials, or personal instructions after execution.

---

## Background

As digital asset ownership grows, a serious gap keeps showing up: **what happens to your crypto and your intent when you can no longer manage them?** Traditional estate planning rarely covers bearer assets controlled by wallets. Wills and executors often lack both the technical access and the operational clarity to handle digital assets. At the same time, sensitive off-chain instructions such as account credentials or recovery notes cannot simply be placed on a public blockchain.

Heres sits in that gap. It combines:

- **on-chain capsule execution** on Injective EVM
- **beneficiary-driven asset release**
- **time-based or inactivity-based automation**
- **encrypted off-chain delivery** through Chainlink CRE

The result is a digital succession flow where the user defines intent once, the chain enforces asset execution, and CRE handles encrypted off-chain delivery when needed.

---

## Market Context

Our design is based on a practical view of digital asset succession:

- **Digital inheritance is still poorly handled**. Users hold increasingly meaningful value in wallets, but most inheritance planning still assumes bank accounts, lawyers, and account recovery flows.
- **Bearer assets require pre-committed logic**. If no one knows your wallet structure, seed phrase practices, or intended beneficiaries, funds can remain stranded permanently.
- **Off-chain secrets matter too**. Digital estates are not just tokens. They also include passwords, access notes, and instructions that must stay confidential until the right time.
- **Automation matters**. If execution depends on the owner manually confirming from a phone, the inheritance promise fails. Automated or delegated execution is essential.

Heres focuses on **programmatic intent**:

- define the capsule once
- encode the beneficiary and execution condition
- let on-chain state determine readiness
- let a backend executor or scheduler handle the final transaction

---

## Overview

**Heres** lets a user create an **Intent Capsule** on Injective EVM:

- lock value on-chain
- assign a beneficiary
- choose a **time-based** or **inactivity-based** execution condition
- attach an encrypted *Intent Statement* for later delivery

When the condition is met:

1. the capsule becomes executable on-chain
2. an executor calls the contract
3. funds are released to the beneficiary
4. CRE can dispatch the encrypted off-chain intent flow

No third party needs to hold the user’s keys, and no beneficiary has to guess how the user wanted funds and instructions to be handled.

| Layer | Technology | Role |
|-------|------------|------|
| **Settlement** | **Injective EVM** | Stores capsule state, beneficiary, execution condition, and releases funds on-chain. |
| **Execution Helper** | **Backend executor + scheduler** | Calls `executeCapsule()` when a capsule is ready, without requiring the owner’s wallet at execution time. |
| **Confidential Delivery** | **Chainlink CRE** | Receives delivery requests and posts callback status for encrypted intent delivery. |

---

## Problem

1. **Digital asset succession is operationally broken**  
   Crypto is a bearer asset. If the owner disappears, heirs often cannot access anything unless the plan was encoded in advance.

2. **Execution should not depend on the owner being present**  
   A system that still needs wallet confirmation at execution time is not reliable enough for real succession use cases.

3. **Off-chain instructions remain unsolved**  
   Sensitive instructions, recovery notes, and private information cannot safely live on public chain state.

4. **Users need a clean product, not a manual ritual**  
   People need a simple experience: create capsule, define conditions, check status, and trust the system to execute when the time comes.

---

## Solution

Heres combines three working layers:

1. **Persistent on-chain capsules on Injective EVM**  
   A smart contract stores capsule state: owner, beneficiary, amount, timestamps, condition kind, and execution status.

2. **Automated execution flow**  
   Capsules become permissionlessly executable when their condition is met. A backend executor wallet or external scheduler can submit the on-chain execution without needing the owner’s wallet.

3. **Encrypted off-chain delivery with Chainlink CRE**  
   The app registers encrypted delivery data, and after capsule execution, a CRE workflow can deliver the linked intent payload and callback delivery status.

Result: **execution is deterministic, delivery remains confidential, and the user experience stays simple.**

---

## Key Features

- **Capsule creation on Injective EVM**  
  Users create on-chain capsules from the web app.

- **Beneficiary assignment**  
  Each capsule defines a beneficiary address for release.

- **Two execution modes**  
  - time-based execution
  - inactivity-based execution using heartbeat windows

- **Automated execution path**  
  Capsules do not require the owner’s phone or wallet confirmation once they are ready.

- **Public dashboard visibility**  
  Capsule state can be monitored through the dashboard and capsule detail pages.

- **CRE-based encrypted delivery**  
  Intent statements can be registered for delivery after execution.

---

## How It Works

1. **Create**  
   The user connects an Injective-compatible EVM wallet, enters intent details, assigns a beneficiary, sets a condition, and creates the capsule on-chain.

2. **Monitor**  
   The dashboard and capsule detail pages read capsule state directly from Injective RPC.

3. **Heartbeat (for inactivity mode)**  
   If the user is still active, they can send a heartbeat to extend the inactivity deadline.

4. **Execution**  
   Once a capsule is ready, anyone can execute it on-chain, but in production the expected path is a funded backend executor wallet triggered by a scheduler.

5. **Intent Delivery**  
   If CRE delivery is enabled for that capsule, the app dispatches the delivery request and records callback status.

---

## Automatic Execution

The current production-ready automation model is:

### 1. Permissionless on-chain execution

The contract allows anyone to call `executeCapsule()` once the condition is met.

### 2. Backend executor wallet

The app supports a funded backend EVM wallet via:

- `INJECTIVE_EXECUTOR_PRIVATE_KEY`

This executor submits on-chain execution without requiring the user’s connected wallet.

### 3. External scheduler

On Vercel Hobby, the app uses an external scheduler such as `cron-job.org` to call:

- `/api/cron/execute-intent`

This keeps the auto-execution path working without upgrading hosting plans.

---

## How We Use Injective and Chainlink

| Provider | How we use it | Integration Details |
|---------|----------------|---------------------|
| **Injective EVM** | Core capsule state and execution | `contracts/HeresCapsuleManager.sol`, `lib/injective/client.ts` |
| **WalletConnect / RainbowKit** | Multi-wallet connection flow for Injective-compatible EVM wallets | `components/wallet/*` |
| **Chainlink CRE** | Encrypted intent delivery workflow and callback processing | `heres-cre/cre-delivery`, `lib/cre/*`, `app/api/cre/*` |
| **External Scheduler** | Calls the executor route so expired capsules are executed automatically | `/api/cron/execute-intent` |

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                          Injective EVM                              │
│  HeresCapsuleManager                                                │
│  · Capsule storage: owner, beneficiary, amount, execution condition │
│  · Heartbeat updates                                                │
│  · Permissionless execution                                         │
└───────────────▲──────────────────────────────────────────────────────┘
                │
                │ executeCapsule()
┌───────────────┴──────────────────────────────────────────────────────┐
│                    Backend Executor + Scheduler                     │
│  · Checks readiness via canExecute()                               │
│  · Submits execution with executor wallet                          │
│  · Triggers CRE dispatch after successful execution                │
└───────────────▲──────────────────────────────────────────────────────┘
                │
                │ CRE dispatch
┌───────────────┴────────────────────────────┐    ┌────────────────────┐
│                 Heres App                  │    │    Chainlink CRE    │
│  · Create capsule                          │───►│  Delivery workflow  │
│  · Dashboard / capsule detail              │    │  Callback to app    │
│  · Owner heartbeat                         │    └────────────────────┘
└────────────────────────────────────────────┘
```

---

## Project Structure

Core folders:

- `app/` - frontend pages and API routes
- `components/` - UI and wallet components
- `config/` - blockchain and runtime config
- `lib/` - Injective runtime, CRE logic, capsule abstractions
- `contracts/` - Injective EVM contract
- `inevm-deploy/` - Hardhat deployment workspace
- `heres-cre/` - active Chainlink CRE project

Structure guides:

- `PROJECT_STRUCTURE.md` - repo map across frontend, backend, shared logic, and integrations
- `app/README.md` - frontend pages and API layer
- `lib/README.md` - backend/shared runtime organization
- `contracts/README.md` - smart contract scope
- `heres-cre/README.md` - active CRE project layout

---

## Environment

### Main app

- `NEXT_PUBLIC_BLOCKCHAIN_TARGET=injective-evm`
- `CRE_WALLET_SIGNATURE_SCHEME=injective-evm`
- `NEXT_PUBLIC_INJECTIVE_EVM_RPC_URL`
- `NEXT_PUBLIC_INJECTIVE_EVM_CHAIN_ID`
- `NEXT_PUBLIC_INJECTIVE_EVM_EXPLORER_URL`
- `NEXT_PUBLIC_INJECTIVE_EVM_CAPSULE_MANAGER`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `CHAINLINK_CRE_WEBHOOK_URL`
- `CHAINLINK_CRE_SIGNING_SECRET`
- `CHAINLINK_CRE_CALLBACK_SECRET`
- `CRE_DISPATCH_SECRET`
- `MOCK_CRE_AUTO_CALLBACK`
- `CRON_SECRET`
- `INJECTIVE_EXECUTOR_PRIVATE_KEY`

### Injective deploy workspace

- `INJECTIVE_EVM_RPC_URL`
- `INJECTIVE_EVM_CHAIN_ID`
- `INJECTIVE_EVM_PRIVATE_KEY`

### CRE deploy workspace

- `CRE_ETH_PRIVATE_KEY`

---

## Getting Started

1. **Clone and install**
   ```bash
   git clone <repo>
   cd Heres-Protocol
   npm install
   ```

2. **Configure env**
   Use `.env.example` as the base and set the Injective app variables.

3. **Run locally**
   ```bash
   npm run dev
   ```

4. **Deploy the Injective contract**
   Use the workspace in `inevm-deploy/`.

5. **Configure execution**
   Set a funded `INJECTIVE_EXECUTOR_PRIVATE_KEY` and a `CRON_SECRET`, then attach a scheduler to `/api/cron/execute-intent`.

---

## CRE Local Testing

To test CRE locally before live deployment:

```bash
npm run cre:setup:mock
npm run dev
```

Then create a capsule, let it execute, and trigger delivery-related routes through the app. Mock CRE callback handling will be used until the live CRE workflow is deployed.

---

## Notes

- Capsule execution is permissionless on-chain.
- The current Injective MVP is focused on token/value capsules.
- Real unattended execution requires a funded backend executor wallet plus a scheduler.
- Real CRE deployment depends on Chainlink deployment access approval.

---

## License

MIT.
