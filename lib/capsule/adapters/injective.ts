import type { CapsuleClient } from '@/lib/capsule/types'
import { cancelInjectiveCapsule, createInjectiveCapsule, executeInjectiveCapsule, getInjectiveCapsuleByOwner, heartbeatInjectiveCapsule, readInjectiveCapsule } from '@/lib/injective/client'

const notImplemented = (): never => {
  throw new Error('Injective capsule client is not implemented yet.')
}

export const injectiveCapsuleClient: CapsuleClient = {
  async createCapsule(wallet, _inactivityPeriodSeconds, intentData) {
    const evmWallet = wallet as { address?: string | null; evmWalletClient?: any }
    if (!evmWallet.address || !evmWallet.evmWalletClient) {
      throw new Error('Injective wallet client is not connected.')
    }
    return createInjectiveCapsule(evmWallet.evmWalletClient, evmWallet.address as `0x${string}`, intentData)
  },
  async recreateCapsule(wallet, inactivityPeriodSeconds, intentData, mint) {
    return injectiveCapsuleClient.createCapsule(wallet, inactivityPeriodSeconds, intentData, mint)
  },
  async getCapsule(owner) {
    if (typeof owner !== 'string') return null
    return getInjectiveCapsuleByOwner(owner)
  },
  async getCapsuleByAddress(address) {
    if (typeof address !== 'string') return null
    if (/^\d+$/.test(address)) {
      return readInjectiveCapsule(BigInt(address))
    }
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return getInjectiveCapsuleByOwner(address)
    }
    return null
  },
  async executeIntent(wallet, owner) {
    const evmWallet = wallet as { evmWalletClient?: any }
    if (!evmWallet.evmWalletClient) {
      throw new Error('Injective wallet client is not connected.')
    }
    return executeInjectiveCapsule(evmWallet.evmWalletClient, String(owner))
  },
  async distributeAssets(wallet, owner) {
    return injectiveCapsuleClient.executeIntent(wallet, owner)
  },
  delegateCapsule: notImplemented as CapsuleClient['delegateCapsule'],
  scheduleExecuteIntent: notImplemented as CapsuleClient['scheduleExecuteIntent'],
  initFeeConfig: notImplemented as CapsuleClient['initFeeConfig'],
  async updateActivity(wallet, owner) {
    const evmWallet = wallet as { address?: string | null; evmWalletClient?: any }
    if (!evmWallet.address || !evmWallet.evmWalletClient) {
      throw new Error('Injective wallet client is not connected.')
    }
    return heartbeatInjectiveCapsule(evmWallet.evmWalletClient, typeof owner === 'string' ? owner : evmWallet.address)
  },
  async restartTimer(wallet, owner) {
    return injectiveCapsuleClient.updateActivity(wallet, owner)
  },
  async cancelCapsule(wallet, owner) {
    const evmWallet = wallet as { address?: string | null; evmWalletClient?: any }
    if (!evmWallet.address || !evmWallet.evmWalletClient) {
      throw new Error('Injective wallet client is not connected.')
    }
    return cancelInjectiveCapsule(evmWallet.evmWalletClient, typeof owner === 'string' ? owner : evmWallet.address)
  },
  async deactivateCapsule(wallet, owner) {
    return injectiveCapsuleClient.cancelCapsule(wallet, owner)
  },
  getCapsuleRouteAddress(owner) {
    return String(owner)
  },
}
