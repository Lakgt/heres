import type { PublicKey } from '@solana/web3.js'

export type CapsuleOwnerRef = PublicKey | string
export type CapsuleAddressRef = PublicKey | string

export type CapsuleBeneficiary = {
  chain?: 'solana' | 'evm'
  address: string
  amount: string
  amountType: string
  destinationChainSelector?: string
}

export type CapsuleRecord = {
  owner: any
  inactivityPeriod: number
  lastActivity: number
  intentData: Uint8Array
  isActive: boolean
  executedAt: number | null
  accountOwner?: any
  mint?: any
  capsuleAddress?: string
  id?: string
  chain?: 'solana' | 'injective-evm'
  beneficiary?: string
  conditionKind?: 'time' | 'heartbeat'
  executeAt?: number
  cancelled?: boolean
}

export type CapsuleClient = {
  createCapsule: (
    wallet: unknown,
    inactivityPeriodSeconds: number,
    intentData: Uint8Array,
    mint?: unknown
  ) => Promise<string>
  recreateCapsule: (
    wallet: unknown,
    inactivityPeriodSeconds: number,
    intentData: Uint8Array,
    mint?: unknown
  ) => Promise<string>
  getCapsule: (owner: CapsuleOwnerRef) => Promise<CapsuleRecord | null>
  getCapsuleByAddress: (address: CapsuleAddressRef) => Promise<CapsuleRecord | null>
  executeIntent: (
    wallet: unknown,
    owner: CapsuleOwnerRef,
    beneficiaries?: CapsuleBeneficiary[],
    mint?: unknown
  ) => Promise<string>
  distributeAssets: (
    wallet: unknown,
    owner: CapsuleOwnerRef,
    beneficiaries?: CapsuleBeneficiary[],
    mint?: unknown
  ) => Promise<string>
  delegateCapsule: (wallet: unknown, validatorPubkey?: unknown) => Promise<string>
  scheduleExecuteIntent: (
    wallet: unknown,
    owner: CapsuleOwnerRef,
    args?: unknown,
    token?: string
  ) => Promise<string>
  initFeeConfig: (wallet: unknown, feeRecipient: unknown, creationFeeLamports?: number, executionFeeBps?: number) => Promise<string>
  updateActivity: (wallet: unknown) => Promise<string>
  restartTimer: (wallet: unknown, owner: CapsuleOwnerRef) => Promise<string>
  cancelCapsule: (wallet: unknown) => Promise<string>
  deactivateCapsule: (wallet: unknown) => Promise<string>
  getCapsuleRouteAddress: (owner: CapsuleOwnerRef) => string
}
