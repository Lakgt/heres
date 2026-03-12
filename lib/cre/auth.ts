import { createHash, timingSafeEqual } from 'crypto'
import { buildCreSignedMessage } from '../../utils/creAuth.ts'
import type { CreSignedAction } from '../../utils/creAuth.ts'
import { isValidCreOwnerAddress, verifyCreWalletMessage } from './wallet-auth'

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000

type VerifyCreRequestInput = {
  action: CreSignedAction
  owner: string
  timestamp: number
  signatureBase64: string
  capsuleAddress?: string
  recipientEmailHash?: string
  encryptedPayloadHash?: string
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function safeEqualHex(a: string, b: string): boolean {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b)) return false
  const aBuf = Buffer.from(a, 'hex')
  const bBuf = Buffer.from(b, 'hex')
  if (aBuf.length === 0 || bBuf.length === 0 || aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export function isRecentTimestamp(timestamp: number): boolean {
  if (!Number.isFinite(timestamp)) return false
  const now = Date.now()
  return Math.abs(now - timestamp) <= SIGNATURE_MAX_AGE_MS
}

export async function verifyCreSignedRequest(input: VerifyCreRequestInput): Promise<boolean> {
  if (!isRecentTimestamp(input.timestamp)) return false
  if (!isValidCreOwnerAddress(input.owner)) return false
  const message = buildCreSignedMessage({
    action: input.action,
    owner: input.owner,
    timestamp: input.timestamp,
    capsuleAddress: input.capsuleAddress,
    recipientEmailHash: input.recipientEmailHash,
    encryptedPayloadHash: input.encryptedPayloadHash,
  })
  return verifyCreWalletMessage({
    owner: input.owner,
    message,
    signature: input.signatureBase64,
  })
}
