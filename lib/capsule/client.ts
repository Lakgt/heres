import { getActiveChain } from '@/config/blockchain'
import { injectiveCapsuleClient } from '@/lib/capsule/adapters/injective'
import { solanaCapsuleClient } from '@/lib/capsule/adapters/solana'
import type { CapsuleClient } from '@/lib/capsule/types'

function getCapsuleClient(): CapsuleClient {
  switch (getActiveChain()) {
    case 'injective-evm':
      return injectiveCapsuleClient
    case 'solana':
    default:
      return solanaCapsuleClient
  }
}

export const createCapsule: CapsuleClient['createCapsule'] = (...args) => getCapsuleClient().createCapsule(...args)
export const recreateCapsule: CapsuleClient['recreateCapsule'] = (...args) => getCapsuleClient().recreateCapsule(...args)
export const getCapsule: CapsuleClient['getCapsule'] = (...args) => getCapsuleClient().getCapsule(...args)
export const getCapsuleByAddress: CapsuleClient['getCapsuleByAddress'] = (...args) => getCapsuleClient().getCapsuleByAddress(...args)
export const executeIntent: CapsuleClient['executeIntent'] = (...args) => getCapsuleClient().executeIntent(...args)
export const distributeAssets: CapsuleClient['distributeAssets'] = (...args) => getCapsuleClient().distributeAssets(...args)
export const delegateCapsule: CapsuleClient['delegateCapsule'] = (...args) => getCapsuleClient().delegateCapsule(...args)
export const scheduleExecuteIntent: CapsuleClient['scheduleExecuteIntent'] = (...args) => getCapsuleClient().scheduleExecuteIntent(...args)
export const initFeeConfig: CapsuleClient['initFeeConfig'] = (...args) => getCapsuleClient().initFeeConfig(...args)
export const updateActivity: CapsuleClient['updateActivity'] = (...args) => getCapsuleClient().updateActivity(...args)
export const restartTimer: CapsuleClient['restartTimer'] = (...args) => getCapsuleClient().restartTimer(...args)
export const cancelCapsule: CapsuleClient['cancelCapsule'] = (...args) => getCapsuleClient().cancelCapsule(...args)
export const deactivateCapsule: CapsuleClient['deactivateCapsule'] = (...args) => getCapsuleClient().deactivateCapsule(...args)
export const getCapsuleRouteAddress: CapsuleClient['getCapsuleRouteAddress'] = (...args) => getCapsuleClient().getCapsuleRouteAddress(...args)
