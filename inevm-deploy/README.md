# Heres Injective EVM Deploy

This workspace deploys the Heres capsule manager contract to Injective EVM with Hardhat 3 and viem.

## Required env

You can put these values in either:

- `inevm-deploy/.env`
- the repo root `.env`

Required variables:

```bash
INJECTIVE_EVM_RPC_URL=
INJECTIVE_EVM_CHAIN_ID=
INJECTIVE_EVM_PRIVATE_KEY=
```

The private key can be with or without `0x`.

## Commands

Compile:

```bash
npx hardhat compile
```

Deploy with the script:

```bash
npx hardhat run scripts/deploy.ts --network injectiveEvmTestnet
```

Or:

```bash
npm run deploy:injective:testnet
```

Deploy with Ignition:

```bash
npm run deploy:injective:ignition
```

## Output

Successful deployments are saved to `deployments.json`.

## Contract

Primary contract:

- `contracts/HeresCapsuleManager.sol`

Primary deploy script:

- `scripts/deploy.ts`
