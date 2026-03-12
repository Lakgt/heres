import 'server-only'

import { getActiveChain } from '@/config/blockchain'
import { INJECTIVE_EVM_CONFIG } from '@/config/injective'
import { fetchCapsuleStateByAddress, fetchCapsuleStateByOwner } from '@/lib/cre/solana'

export type CreCapsuleState = {
  capsuleAddress: string
  ownerAddress: string
  inactivityPeriod: number
  lastActivity: number
  intentData: Uint8Array
  isActive: boolean
  executedAt: number | null
  accountOwnerAddress: string
}

export async function fetchCreCapsuleStateByAddress(capsuleAddress: string): Promise<CreCapsuleState | null> {
  switch (getActiveChain()) {
    case 'injective-evm': {
      const { getInjectiveCapsuleByOwner, readInjectiveCapsule } = await import('@/lib/injective/client')
      const capsule = /^\d+$/.test(capsuleAddress)
        ? await readInjectiveCapsule(BigInt(capsuleAddress))
        : await getInjectiveCapsuleByOwner(capsuleAddress)

      if (!capsule) return null

      return {
        capsuleAddress: capsule.capsuleAddress || capsule.id || capsuleAddress,
        ownerAddress: String(capsule.owner),
        inactivityPeriod: capsule.inactivityPeriod,
        lastActivity: capsule.lastActivity,
        intentData: capsule.intentData,
        isActive: capsule.isActive,
        executedAt: capsule.executedAt,
        accountOwnerAddress: INJECTIVE_EVM_CONFIG.capsuleManagerAddress || '',
      }
    }
    case 'solana':
    default: {
      const { PublicKey } = await import('@solana/web3.js')
      let pubkey: InstanceType<typeof PublicKey>
      try {
        pubkey = new PublicKey(capsuleAddress)
      } catch {
        return null
      }
      const capsule = await fetchCapsuleStateByAddress(pubkey)
      if (!capsule) return null
      return {
        capsuleAddress: capsule.capsuleAddress,
        ownerAddress: capsule.owner.toBase58(),
        inactivityPeriod: capsule.inactivityPeriod,
        lastActivity: capsule.lastActivity,
        intentData: capsule.intentData,
        isActive: capsule.isActive,
        executedAt: capsule.executedAt,
        accountOwnerAddress: capsule.accountOwner.toBase58(),
      }
    }
  }
}

export async function fetchCreCapsuleStateByOwner(ownerAddress: string): Promise<CreCapsuleState | null> {
  switch (getActiveChain()) {
    case 'injective-evm': {
      const { getInjectiveCapsuleByOwner } = await import('@/lib/injective/client')
      const capsule = await getInjectiveCapsuleByOwner(ownerAddress)
      if (!capsule) return null

      return {
        capsuleAddress: capsule.capsuleAddress || capsule.id || ownerAddress,
        ownerAddress: String(capsule.owner),
        inactivityPeriod: capsule.inactivityPeriod,
        lastActivity: capsule.lastActivity,
        intentData: capsule.intentData,
        isActive: capsule.isActive,
        executedAt: capsule.executedAt,
        accountOwnerAddress: INJECTIVE_EVM_CONFIG.capsuleManagerAddress || '',
      }
    }
    case 'solana':
    default: {
      const { PublicKey } = await import('@solana/web3.js')
      let pubkey: InstanceType<typeof PublicKey>
      try {
        pubkey = new PublicKey(ownerAddress)
      } catch {
        return null
      }
      const capsule = await fetchCapsuleStateByOwner(pubkey)
      if (!capsule) return null
      return {
        capsuleAddress: capsule.capsuleAddress,
        ownerAddress: capsule.owner.toBase58(),
        inactivityPeriod: capsule.inactivityPeriod,
        lastActivity: capsule.lastActivity,
        intentData: capsule.intentData,
        isActive: capsule.isActive,
        executedAt: capsule.executedAt,
        accountOwnerAddress: capsule.accountOwner.toBase58(),
      }
    }
  }
}
