export type InjectiveCapsuleCondition = 'time' | 'heartbeat'
export type InjectiveCapsuleStatus = 'active' | 'ready' | 'executed' | 'cancelled'

export interface InjectiveCapsuleRecord {
  id: bigint
  owner: string
  beneficiary: string
  amountWei: bigint
  condition: InjectiveCapsuleCondition
  createdAt: number
  executeAt: number
  heartbeatWindowSeconds: number
  lastHeartbeatAt: number
  metadataHash: string
  executed: boolean
  cancelled: boolean
}

export function computeInjectiveCapsuleStatus(
  capsule: InjectiveCapsuleRecord,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): InjectiveCapsuleStatus {
  if (capsule.cancelled) return 'cancelled'
  if (capsule.executed) return 'executed'

  if (capsule.condition === 'time') {
    return nowSeconds >= capsule.executeAt ? 'ready' : 'active'
  }

  const heartbeatDeadline = capsule.lastHeartbeatAt + capsule.heartbeatWindowSeconds
  return nowSeconds >= heartbeatDeadline ? 'ready' : 'active'
}
