import { INJECTIVE_EVM_CONFIG, hasInjectiveCapsuleManagerAddress, hasInjectiveEvmRuntimeConfig } from '@/config/injective'
import { computeInjectiveCapsuleStatus, type InjectiveCapsuleRecord } from '@/lib/injective/types'
import { heresCapsuleManagerAbi } from '@/lib/injective/abi'
import { createPublicClient, decodeEventLog, http, isAddress, keccak256, parseEther, toHex, type Address, type Hex, type PublicClient, type WalletClient } from 'viem'
import { parseIntentPayload, type AnyIntentData, type IntentData } from '@/utils/intent'
import type { CapsuleRecord } from '@/lib/capsule/types'

const STORAGE_KEYS = {
  latestCapsule: (owner: string) => `injective_capsule_latest:${owner.toLowerCase()}`,
  intentData: (capsuleId: string) => `injective_capsule_intent:${capsuleId}`,
} as const

function bytesToBase64(data: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(data).toString('base64')
  }
  let binary = ''
  for (const value of data) binary += String.fromCharCode(value)
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'))
  }
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function isTokenIntentData(value: AnyIntentData): value is IntentData {
  return !('type' in value && value.type === 'nft')
}

function getPublicClient(): PublicClient {
  if (!hasInjectiveEvmRuntimeConfig()) {
    throw new Error('Injective RPC config is missing.')
  }

  return createPublicClient({
    transport: http(INJECTIVE_EVM_CONFIG.rpcUrl),
  })
}

function getContractAddress(): Address {
  if (!hasInjectiveCapsuleManagerAddress() || !isAddress(INJECTIVE_EVM_CONFIG.capsuleManagerAddress)) {
    throw new Error('NEXT_PUBLIC_INJECTIVE_EVM_CAPSULE_MANAGER is not configured.')
  }
  return INJECTIVE_EVM_CONFIG.capsuleManagerAddress as Address
}

function persistLatestCapsuleId(owner: Address, capsuleId: bigint, intentData?: Uint8Array) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.latestCapsule(owner), capsuleId.toString())
  if (intentData) {
    localStorage.setItem(STORAGE_KEYS.intentData(capsuleId.toString()), bytesToBase64(intentData))
  }
}

function readPersistedLatestCapsuleId(owner: Address): bigint | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEYS.latestCapsule(owner))
  if (!raw) return null
  try {
    return BigInt(raw)
  } catch {
    return null
  }
}

function readPersistedIntentData(capsuleId: bigint): Uint8Array {
  if (typeof window === 'undefined') return new Uint8Array()
  const raw = localStorage.getItem(STORAGE_KEYS.intentData(capsuleId.toString()))
  if (!raw) return new Uint8Array()
  try {
    return base64ToBytes(raw)
  } catch {
    return new Uint8Array()
  }
}

function toAddress(value: string): Address {
  if (!isAddress(value)) {
    throw new Error(`Invalid EVM address: ${value}`)
  }
  return value as Address
}

function normalizeCapsuleRecord(capsuleId: bigint, capsule: {
  owner: Address
  beneficiary: Address
  amount: bigint
  createdAt: bigint
  executeAt: bigint
  heartbeatWindow: bigint
  lastHeartbeatAt: bigint
  metadataHash: Hex
  conditionKind: number
  executed: boolean
  cancelled: boolean
}): InjectiveCapsuleRecord {
  return {
    id: capsuleId,
    owner: capsule.owner,
    beneficiary: capsule.beneficiary,
    amountWei: capsule.amount,
    condition: capsule.conditionKind === 0 ? 'time' : 'heartbeat',
    createdAt: Number(capsule.createdAt),
    executeAt: Number(capsule.executeAt),
    heartbeatWindowSeconds: Number(capsule.heartbeatWindow),
    lastHeartbeatAt: Number(capsule.lastHeartbeatAt),
    metadataHash: capsule.metadataHash,
    executed: capsule.executed,
    cancelled: capsule.cancelled,
  }
}

function toCapsuleRecord(record: InjectiveCapsuleRecord): CapsuleRecord {
  const status = computeInjectiveCapsuleStatus(record)
  return {
    owner: record.owner,
    inactivityPeriod: record.condition === 'heartbeat'
      ? record.heartbeatWindowSeconds
      : Math.max(record.executeAt - record.createdAt, 0),
    lastActivity: record.lastHeartbeatAt,
    intentData: readPersistedIntentData(record.id),
    isActive: status !== 'executed' && status !== 'cancelled',
    executedAt: record.executed ? record.executeAt : null,
    capsuleAddress: record.id.toString(),
    id: record.id.toString(),
    chain: 'injective-evm',
    beneficiary: record.beneficiary,
    conditionKind: record.condition,
    executeAt: record.executeAt,
    cancelled: record.cancelled,
  }
}

export function buildInjectiveMetadataHash(intentData: Uint8Array): Hex {
  return keccak256(toHex(intentData))
}

export function deriveInjectiveCreateParams(intentData: Uint8Array): {
  beneficiary: Address
  value: bigint
  conditionKind: 0 | 1
  executeAt: bigint
  heartbeatWindow: bigint
  metadataHash: Hex
} {
  const parsed = parseIntentPayload(intentData)
  if (!parsed || !isTokenIntentData(parsed)) {
    throw new Error('Injective MVP currently supports token capsules only.')
  }

  const beneficiaries = Array.isArray(parsed.beneficiaries)
    ? parsed.beneficiaries.filter((item): item is IntentData['beneficiaries'][number] => Boolean(item?.address?.trim()))
    : []

  if (beneficiaries.length === 0) {
    throw new Error('At least one beneficiary is required.')
  }
  if (beneficiaries.length > 1) {
    throw new Error('Injective MVP currently supports one beneficiary per capsule.')
  }

  const beneficiary = beneficiaries[0]
  if ((beneficiary.chain ?? 'evm') !== 'evm' || !isAddress(beneficiary.address)) {
    throw new Error('Injective capsules require one EVM beneficiary address.')
  }

  if (!parsed.totalAmount || Number(parsed.totalAmount) <= 0) {
    throw new Error('Injective capsules require a positive total amount.')
  }

  const now = Math.floor(Date.now() / 1000)
  const inactivitySeconds = Math.max(Number(parsed.inactivityDays || 0) * 24 * 60 * 60, 60)
  const executeAt = BigInt(now + inactivitySeconds)

  return {
    beneficiary: beneficiary.address as Address,
    value: parseEther(parsed.totalAmount),
    conditionKind: 1,
    executeAt,
    heartbeatWindow: BigInt(inactivitySeconds),
    metadataHash: buildInjectiveMetadataHash(intentData),
  }
}

export async function createInjectiveCapsule(walletClient: WalletClient, owner: Address, intentData: Uint8Array): Promise<string> {
  const publicClient = getPublicClient()
  const contractAddress = getContractAddress()
  const params = deriveInjectiveCreateParams(intentData)

  const hash = await walletClient.writeContract({
    account: owner,
    address: contractAddress,
    abi: heresCapsuleManagerAbi,
    functionName: 'createCapsule',
    args: [
      params.beneficiary,
      params.conditionKind,
      params.executeAt,
      params.heartbeatWindow,
      params.metadataHash,
    ],
    value: params.value,
    chain: walletClient.chain,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const capsuleId = extractCapsuleIdFromReceipt(receipt.logs)
  if (capsuleId != null) {
    persistLatestCapsuleId(owner, capsuleId, intentData)
  }

  return hash
}

function extractCapsuleIdFromReceipt(logs: readonly { address: Address; data: Hex; topics: readonly Hex[] }[]): bigint | null {
  const contractAddress = getContractAddress().toLowerCase()
  for (const log of logs) {
    if (log.address.toLowerCase() !== contractAddress) continue
    try {
      const decoded = decodeEventLog({
        abi: heresCapsuleManagerAbi,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      })
      if (decoded.eventName === 'CapsuleCreated') {
        return decoded.args.capsuleId ?? null
      }
    } catch {
      continue
    }
  }
  return null
}

export async function findLatestInjectiveCapsuleId(owner: Address): Promise<bigint | null> {
  const persisted = readPersistedLatestCapsuleId(owner)
  if (persisted != null) return persisted

  const publicClient = getPublicClient()
  const nextCapsuleId = await publicClient.readContract({
    address: getContractAddress(),
    abi: heresCapsuleManagerAbi,
    functionName: 'nextCapsuleId',
  })

  const latestCreatedId = BigInt(nextCapsuleId) - 1n
  if (latestCreatedId < 1n) {
    return null
  }

  // Hackathon-safe owner lookup: scan recent capsule IDs directly instead of
  // eth_getLogs, which Injective testnet RPC limits to 10k blocks per query.
  const maxScan = 100n
  const firstId = latestCreatedId > maxScan ? latestCreatedId - maxScan + 1n : 1n

  for (let capsuleId = latestCreatedId; capsuleId >= firstId; capsuleId -= 1n) {
    try {
      const capsule = await publicClient.readContract({
        address: getContractAddress(),
        abi: heresCapsuleManagerAbi,
        functionName: 'getCapsule',
        args: [capsuleId],
      })

      if (capsule.owner.toLowerCase() === owner.toLowerCase()) {
        persistLatestCapsuleId(owner, capsuleId)
        return capsuleId
      }
    } catch {
      continue
    }
  }

  return null
}

export async function readInjectiveCapsule(capsuleId: bigint): Promise<CapsuleRecord | null> {
  const publicClient = getPublicClient()
  try {
    const capsule = await publicClient.readContract({
      address: getContractAddress(),
      abi: heresCapsuleManagerAbi,
      functionName: 'getCapsule',
      args: [capsuleId],
    })

    return toCapsuleRecord(normalizeCapsuleRecord(capsuleId, capsule))
  } catch {
    return null
  }
}

export async function getInjectiveCapsuleByOwner(ownerRef: string): Promise<CapsuleRecord | null> {
  const owner = toAddress(ownerRef)
  const capsuleId = await findLatestInjectiveCapsuleId(owner)
  if (capsuleId == null) return null
  return readInjectiveCapsule(capsuleId)
}

export async function executeInjectiveCapsule(walletClient: WalletClient, owner: Address | string): Promise<string> {
  const capsuleId = typeof owner === 'string' && /^\d+$/.test(owner)
    ? BigInt(owner)
    : await findLatestInjectiveCapsuleId(toAddress(String(owner)))
  if (capsuleId == null) {
    throw new Error('Capsule not found.')
  }
  const hash = await walletClient.writeContract({
    account: walletClient.account!,
    address: getContractAddress(),
    abi: heresCapsuleManagerAbi,
    functionName: 'executeCapsule',
    args: [capsuleId],
    chain: walletClient.chain,
  })
  await getPublicClient().waitForTransactionReceipt({ hash })
  return hash
}

export async function heartbeatInjectiveCapsule(walletClient: WalletClient, owner: Address | string): Promise<string> {
  const capsuleId = typeof owner === 'string' && /^\d+$/.test(owner)
    ? BigInt(owner)
    : await findLatestInjectiveCapsuleId(toAddress(String(owner)))
  if (capsuleId == null) {
    throw new Error('Capsule not found.')
  }
  const hash = await walletClient.writeContract({
    account: walletClient.account!,
    address: getContractAddress(),
    abi: heresCapsuleManagerAbi,
    functionName: 'heartbeat',
    args: [capsuleId],
    chain: walletClient.chain,
  })
  await getPublicClient().waitForTransactionReceipt({ hash })
  return hash
}

export async function cancelInjectiveCapsule(walletClient: WalletClient, owner: Address | string): Promise<string> {
  const capsuleId = typeof owner === 'string' && /^\d+$/.test(owner)
    ? BigInt(owner)
    : await findLatestInjectiveCapsuleId(toAddress(String(owner)))
  if (capsuleId == null) {
    throw new Error('Capsule not found.')
  }
  const hash = await walletClient.writeContract({
    account: walletClient.account!,
    address: getContractAddress(),
    abi: heresCapsuleManagerAbi,
    functionName: 'cancelCapsule',
    args: [capsuleId],
    chain: walletClient.chain,
  })
  await getPublicClient().waitForTransactionReceipt({ hash })
  return hash
}
