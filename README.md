# Heres

Heres is a capsule protocol on Injective EVM. Users create capsules, assign a beneficiary, define a time-based or inactivity-based execution condition, and let the system release funds when that condition is met. Chainlink CRE is used for encrypted intent-statement delivery after execution.

## MVP Scope

- Create capsule
- Assign beneficiary
- Choose time-based or heartbeat-based inactivity execution
- View public capsule status in the dashboard
- Execute on-chain when the condition is met
- Dispatch encrypted intent delivery through CRE

## Current Stack

- Frontend: Next.js, React, TypeScript, Tailwind
- Wallet: WalletConnect via RainbowKit and wagmi
- Chain: Injective EVM
- Contract: `contracts/HeresCapsuleManager.sol`
- CRE workflow: `heres-cre/cre-delivery`
- Deployment workspace: `inevm-deploy`

## Project Structure

- `app/` - pages and API routes
- `components/` - UI and wallet wrappers
- `config/` - chain and runtime configuration
- `contracts/` - Injective EVM capsule contract
- `heres-cre/` - CRE project and delivery workflow
- `inevm-deploy/` - Hardhat deployment workspace for Injective EVM
- `lib/injective/` - Injective reads, writes, and executor logic

## Environment

Main app:

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

Deploy workspace:

- `INJECTIVE_EVM_RPC_URL`
- `INJECTIVE_EVM_CHAIN_ID`
- `INJECTIVE_EVM_PRIVATE_KEY`

## Deploy Flow

1. Deploy `HeresCapsuleManager` from `inevm-deploy`
2. Put the deployed contract address into app env
3. Deploy the Next.js app
4. Set CRE callback URL to your deployed app domain
5. Configure an executor wallet and scheduler for unattended execution

## Notes

- Capsule execution is permissionless on-chain
- Automated execution requires a funded backend executor wallet or an external scheduler
- CRE simulation works locally; real CRE deployment depends on Chainlink access approval
