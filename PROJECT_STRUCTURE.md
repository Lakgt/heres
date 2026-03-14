# Project Structure

This repository is organized around the active Injective MVP.

## Frontend

- [`app`](c:/Users/ADMIN/Desktop/Heres-Protocol/app)
  - App Router pages
  - user-facing screens
  - API routes under `app/api`
- [`components`](c:/Users/ADMIN/Desktop/Heres-Protocol/components)
  - reusable UI
  - wallet UI wrappers
- [`public`](c:/Users/ADMIN/Desktop/Heres-Protocol/public)
  - static assets
  - logos
  - manifest and service worker

## Backend

- [`app/api`](c:/Users/ADMIN/Desktop/Heres-Protocol/app/api)
  - server routes
  - execution helper
  - CRE callback and dispatch endpoints
- [`lib/cre`](c:/Users/ADMIN/Desktop/Heres-Protocol/lib/cre)
  - CRE auth
  - storage
  - delivery orchestration
- [`lib/injective`](c:/Users/ADMIN/Desktop/Heres-Protocol/lib/injective)
  - Injective RPC client
  - executor
  - ABI and runtime types

## Shared Domain

- [`lib/capsule`](c:/Users/ADMIN/Desktop/Heres-Protocol/lib/capsule)
  - chain-agnostic capsule interface
  - adapters
- [`config`](c:/Users/ADMIN/Desktop/Heres-Protocol/config)
  - blockchain target
  - Injective config
- [`types`](c:/Users/ADMIN/Desktop/Heres-Protocol/types)
  - shared app types
- [`utils`](c:/Users/ADMIN/Desktop/Heres-Protocol/utils)
  - parsing
  - validation
  - helpers

## Integrations

- [`contracts`](c:/Users/ADMIN/Desktop/Heres-Protocol/contracts)
  - Injective EVM smart contract
- [`inevm-deploy`](c:/Users/ADMIN/Desktop/Heres-Protocol/inevm-deploy)
  - Hardhat deployment workspace
- [`heres-cre`](c:/Users/ADMIN/Desktop/Heres-Protocol/heres-cre)
  - Chainlink CRE project and workflow

## Tests and Scripts

- [`tests`](c:/Users/ADMIN/Desktop/Heres-Protocol/tests)
  - focused test files
- [`scripts`](c:/Users/ADMIN/Desktop/Heres-Protocol/scripts)
  - local setup and helper scripts

## Notes

- The active blockchain path is Injective EVM.
- The active CRE workflow path is `heres-cre/cre-delivery`.
- The old duplicate `cre-workflow/` tree was removed so the integration story is clearer.
