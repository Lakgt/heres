import 'server-only'

import { createPublicClient, createWalletClient, http, isAddress, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { INJECTIVE_EVM_CONFIG } from '@/config/injective'
import { heresCapsuleManagerAbi } from '@/lib/injective/abi'
import { dispatchCreDeliveryForCapsule } from '@/lib/cre/service'

type ExecuteReadyOptions = {
  scanLimit?: number
  maxExecutions?: number
}

type ReconcileCreOptions = {
  scanLimit?: number
  maxDispatches?: number
}

const publicExecutionThrottle = new Map<string, number>()

function getRpcUrl(): string {
  const rpcUrl = INJECTIVE_EVM_CONFIG.rpcUrl
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_INJECTIVE_EVM_RPC_URL is not configured.')
  }
  return rpcUrl
}

function getContractAddress(): Address {
  const address = INJECTIVE_EVM_CONFIG.capsuleManagerAddress
  if (!address || !isAddress(address)) {
    throw new Error('NEXT_PUBLIC_INJECTIVE_EVM_CAPSULE_MANAGER is not configured.')
  }
  return address as Address
}

function getExecutorPrivateKey(): Hex {
  const privateKey = (process.env.INJECTIVE_EXECUTOR_PRIVATE_KEY || process.env.CRANK_WALLET_PRIVATE_KEY || '').trim()
  if (!privateKey) {
    throw new Error('Set INJECTIVE_EXECUTOR_PRIVATE_KEY or CRANK_WALLET_PRIVATE_KEY to enable Injective auto-execution.')
  }
  const normalized = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new Error('Injective executor private key must be a 32-byte EVM hex private key.')
  }
  return normalized as Hex
}

function getPublicClient() {
  return createPublicClient({
    transport: http(getRpcUrl()),
  })
}

function getWalletClient() {
  const account = privateKeyToAccount(getExecutorPrivateKey())
  return createWalletClient({
    account,
    transport: http(getRpcUrl()),
  })
}

async function getRecentCapsuleIds(scanLimit: number): Promise<bigint[]> {
  const publicClient = getPublicClient()
  const nextCapsuleId = await publicClient.readContract({
    address: getContractAddress(),
    abi: heresCapsuleManagerAbi,
    functionName: 'nextCapsuleId',
  })

  const latestCreatedId = BigInt(nextCapsuleId) - 1n
  if (latestCreatedId < 1n) return []

  const safeLimit = BigInt(Math.max(1, scanLimit))
  const firstId = latestCreatedId > safeLimit ? latestCreatedId - safeLimit + 1n : 1n
  const ids: bigint[] = []
  for (let capsuleId = latestCreatedId; capsuleId >= firstId; capsuleId -= 1n) {
    ids.push(capsuleId)
    if (capsuleId === 1n) break
  }
  return ids
}

export async function executeReadyInjectiveCapsules(options: ExecuteReadyOptions = {}) {
  const scanLimit = Math.max(1, options.scanLimit ?? 100)
  const maxExecutions = Math.max(1, options.maxExecutions ?? 5)
  const publicClient = getPublicClient()
  const walletClient = getWalletClient()
  const contractAddress = getContractAddress()
  const capsuleIds = await getRecentCapsuleIds(scanLimit)

  let ready = 0
  let executed = 0
  let failed = 0
  const results: Array<{
    capsuleId: string
    status: 'executed' | 'failed'
    txHash?: string
    error?: string
    cre?: Awaited<ReturnType<typeof dispatchCreDeliveryForCapsule>>
  }> = []

  for (const capsuleId of capsuleIds) {
    if (executed >= maxExecutions) break

    let canExecute = false
    try {
      canExecute = await publicClient.readContract({
        address: contractAddress,
        abi: heresCapsuleManagerAbi,
        functionName: 'canExecute',
        args: [capsuleId],
      })
    } catch {
      continue
    }

    if (!canExecute) continue
    ready += 1

    try {
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: heresCapsuleManagerAbi,
        functionName: 'executeCapsule',
        args: [capsuleId],
        account: walletClient.account,
        chain: walletClient.chain,
      })
      await publicClient.waitForTransactionReceipt({ hash: txHash })
      executed += 1
      const cre = await dispatchCreDeliveryForCapsule(capsuleId.toString())
      results.push({
        capsuleId: capsuleId.toString(),
        status: 'executed',
        txHash,
        cre,
      })
    } catch (error) {
      failed += 1
      results.push({
        capsuleId: capsuleId.toString(),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    scanned: capsuleIds.length,
    ready,
    executed,
    failed,
    results,
  }
}

export async function executeInjectiveCapsuleIfReady(capsuleIdRef: string | bigint) {
  const capsuleId = typeof capsuleIdRef === 'bigint' ? capsuleIdRef : BigInt(capsuleIdRef)
  const publicClient = getPublicClient()
  const walletClient = getWalletClient()
  const contractAddress = getContractAddress()

  const canExecute = await publicClient.readContract({
    address: contractAddress,
    abi: heresCapsuleManagerAbi,
    functionName: 'canExecute',
    args: [capsuleId],
  })

  if (!canExecute) {
    return {
      capsuleId: capsuleId.toString(),
      status: 'not-ready' as const,
    }
  }

  const txHash = await walletClient.writeContract({
    address: contractAddress,
    abi: heresCapsuleManagerAbi,
    functionName: 'executeCapsule',
    args: [capsuleId],
    account: walletClient.account,
    chain: walletClient.chain,
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  const cre = await dispatchCreDeliveryForCapsule(capsuleId.toString())

  return {
    capsuleId: capsuleId.toString(),
    status: 'executed' as const,
    txHash,
    cre,
  }
}

export function shouldThrottlePublicInjectiveExecution(capsuleId: string, windowMs: number = 15000) {
  const now = Date.now()
  const lastRun = publicExecutionThrottle.get(capsuleId) || 0
  if (now - lastRun < windowMs) {
    return true
  }
  publicExecutionThrottle.set(capsuleId, now)
  return false
}

export async function reconcileInjectiveCreDeliveries(options: ReconcileCreOptions = {}) {
  const scanLimit = Math.max(1, options.scanLimit ?? 100)
  const maxDispatches = Math.max(1, options.maxDispatches ?? 10)
  const publicClient = getPublicClient()
  const contractAddress = getContractAddress()
  const capsuleIds = await getRecentCapsuleIds(scanLimit)

  let executedCapsules = 0
  let dispatched = 0
  let failed = 0
  const results: Array<{
    capsuleId: string
    status: 'dispatched' | 'skipped' | 'failed'
    detail?: string
  }> = []

  for (const capsuleId of capsuleIds) {
    if (dispatched >= maxDispatches) break

    try {
      const capsule = await publicClient.readContract({
        address: contractAddress,
        abi: heresCapsuleManagerAbi,
        functionName: 'getCapsule',
        args: [capsuleId],
      })

      if (!capsule.executed || capsule.cancelled) continue
      executedCapsules += 1

      const result = await dispatchCreDeliveryForCapsule(capsuleId.toString())
      if (result.ok && !result.skipped) {
        dispatched += 1
        results.push({ capsuleId: capsuleId.toString(), status: 'dispatched', detail: result.status })
      } else if (result.ok || result.skipped) {
        results.push({ capsuleId: capsuleId.toString(), status: 'skipped', detail: result.reason || result.status })
      } else {
        failed += 1
        results.push({ capsuleId: capsuleId.toString(), status: 'failed', detail: result.error })
      }
    } catch (error) {
      failed += 1
      results.push({
        capsuleId: capsuleId.toString(),
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    scanned: capsuleIds.length,
    executedCapsules,
    dispatched,
    failed,
    results,
  }
}
