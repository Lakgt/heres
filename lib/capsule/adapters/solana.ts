import { getCapsulePDA } from '@/lib/program'
import {
  cancelCapsule as cancelSolanaCapsule,
  createCapsule as createSolanaCapsule,
  deactivateCapsule as deactivateSolanaCapsule,
  delegateCapsule as delegateSolanaCapsule,
  distributeAssets as distributeSolanaAssets,
  executeIntent as executeSolanaIntent,
  getCapsule as getSolanaCapsule,
  getCapsuleByAddress as getSolanaCapsuleByAddress,
  initFeeConfig as initSolanaFeeConfig,
  recreateCapsule as recreateSolanaCapsule,
  restartTimer as restartSolanaTimer,
  scheduleExecuteIntent as scheduleSolanaExecution,
  updateActivity as updateSolanaActivity,
} from '@/lib/solana'
import type { CapsuleAddressRef, CapsuleClient, CapsuleOwnerRef } from '@/lib/capsule/types'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'

function toPublicKey(value: CapsuleOwnerRef | CapsuleAddressRef): PublicKey {
  return value instanceof PublicKey ? value : new PublicKey(value)
}

export const solanaCapsuleClient: CapsuleClient = {
  createCapsule(wallet, inactivityPeriodSeconds, intentData, mint) {
    return createSolanaCapsule(wallet as WalletContextState, inactivityPeriodSeconds, intentData, mint as PublicKey | undefined)
  },
  recreateCapsule(wallet, inactivityPeriodSeconds, intentData, mint) {
    return recreateSolanaCapsule(wallet as WalletContextState, inactivityPeriodSeconds, intentData, mint as PublicKey | undefined)
  },
  getCapsule(owner) {
    return getSolanaCapsule(toPublicKey(owner))
  },
  getCapsuleByAddress(address) {
    return getSolanaCapsuleByAddress(toPublicKey(address))
  },
  executeIntent(wallet, owner, beneficiaries, mint) {
    return executeSolanaIntent(wallet as WalletContextState, toPublicKey(owner), beneficiaries, mint as PublicKey | undefined)
  },
  distributeAssets(wallet, owner, beneficiaries, mint) {
    return distributeSolanaAssets(wallet as WalletContextState, toPublicKey(owner), beneficiaries, mint as PublicKey | undefined)
  },
  delegateCapsule(wallet, validatorPubkey) {
    return delegateSolanaCapsule(wallet as WalletContextState, validatorPubkey as PublicKey | undefined)
  },
  scheduleExecuteIntent(wallet, owner, args, token) {
    return scheduleSolanaExecution(wallet as WalletContextState, toPublicKey(owner), args as any, token)
  },
  initFeeConfig(wallet, feeRecipient, creationFeeLamports, executionFeeBps) {
    return initSolanaFeeConfig(wallet as WalletContextState, feeRecipient as PublicKey, creationFeeLamports, executionFeeBps)
  },
  updateActivity(wallet) {
    return updateSolanaActivity(wallet as WalletContextState)
  },
  restartTimer(wallet, owner) {
    return restartSolanaTimer(wallet as WalletContextState, toPublicKey(owner))
  },
  cancelCapsule(wallet) {
    return cancelSolanaCapsule(wallet as WalletContextState)
  },
  deactivateCapsule(wallet) {
    return deactivateSolanaCapsule(wallet as WalletContextState)
  },
  getCapsuleRouteAddress(owner) {
    const [capsulePDA] = getCapsulePDA(toPublicKey(owner))
    return capsulePDA.toBase58()
  },
}
