# Heres Architecture

## Overview

Heres is an Injective EVM capsule application with a web frontend, an on-chain capsule manager contract, a backend execution helper, and a Chainlink CRE delivery workflow.

## Main Flow

1. User connects an EVM wallet
2. User creates a capsule on Injective EVM
3. Capsule stores owner, beneficiary, amount, condition, and metadata hash on-chain
4. Dashboard and capsule pages read capsule state from Injective RPC
5. When a capsule becomes ready, anyone can execute it on-chain
6. After execution, CRE can dispatch encrypted intent-statement delivery

## Components

### Frontend

- Next.js App Router
- React + TypeScript
- Tailwind styling
- RainbowKit + wagmi for wallet connection

### Smart Contract

- `contracts/HeresCapsuleManager.sol`
- Stores:
  - owner
  - beneficiary
  - amount
  - creation timestamp
  - execution timestamp or heartbeat window
  - execution status
  - cancellation status
  - metadata hash

### Chain Client

- `lib/injective/client.ts`
- Handles:
  - create capsule
  - read capsule by ID
  - list recent capsules
  - heartbeat
  - execute
  - contract count and public reads

### Executor

- `lib/injective/executor.ts`
- `app/api/cron/execute-intent/route.ts`
- `app/api/injective/auto-execute/route.ts`

The executor uses a backend EVM wallet to call `executeCapsule()` when a capsule is ready. This avoids requiring the owner’s phone or wallet confirmation at execution time.

### CRE

- `app/api/intent-delivery/*`
- `app/api/cre/callback/route.ts`
- `heres-cre/cre-delivery`

The app signs and dispatches delivery requests to CRE after execution. CRE posts delivery status back to the app callback route.

## Public vs Owner Views

- Dashboard can show public capsule state from chain reads
- Capsule detail is publicly viewable by capsule ID
- Owner-only actions remain wallet-gated:
  - create
  - heartbeat
  - manual execute
  - CRE owner-authenticated status checks where required

## Deployment Pieces

### App

- Next.js app deployed to Vercel

### Contract

- Deployed through `inevm-deploy`

### Automation

- Scheduler calling `/api/cron/execute-intent`
- Server env must include:
  - `CRON_SECRET`
  - `INJECTIVE_EXECUTOR_PRIVATE_KEY`

### CRE

- CRE workflow under `heres-cre/cre-delivery`
- Production callback should point to:
  - `/api/cre/callback`

## Current Constraints

- Injective MVP is token-only
- One beneficiary per capsule
- NFT flow is out of scope
- Real unattended execution depends on a scheduler plus backend executor wallet
- Real CRE deployment depends on Chainlink access approval
