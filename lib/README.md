# Lib Layer

This folder is grouped by responsibility.

## `lib/injective`

Injective-specific runtime:

- contract reads and writes
- ABI
- executor
- Injective status logic

## `lib/cre`

Chainlink CRE support:

- wallet auth
- delivery storage
- dispatch service
- callback reconciliation

## `lib/capsule`

Shared capsule abstraction:

- chain-agnostic client surface
- adapter selection
- capsule record types

This is the main backend/shared logic layer of the project.
