import { NextRequest, NextResponse } from 'next/server'
import { dispatchCreDeliveryForCapsule } from '@/lib/cre/service'
import { verifyCreSignedRequest } from '@/lib/cre/auth'
import { fetchCreCapsuleStateByAddress } from '@/lib/cre/capsule-state'
import { isValidCreOwnerAddress } from '@/lib/cre/wallet-auth'

export async function POST(request: NextRequest) {
  let body: { capsule?: string; owner?: string; timestamp?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const capsuleAddress = body.capsule?.trim()
  const owner = body.owner?.trim()
  const timestamp = Number(body.timestamp)
  const signature = request.headers.get('x-cre-signature')?.trim()

  if (!capsuleAddress || !owner || !signature || !Number.isFinite(timestamp)) {
    return NextResponse.json({ error: 'capsule, owner, timestamp, x-cre-signature are required' }, { status: 400 })
  }

  if (!isValidCreOwnerAddress(owner)) {
    return NextResponse.json({ error: 'Invalid capsule or owner address' }, { status: 400 })
  }

  const capsule = await fetchCreCapsuleStateByAddress(capsuleAddress)
  if (!capsule) {
    return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
  }
  if (capsule.ownerAddress !== owner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isValidSignature = await verifyCreSignedRequest({
    action: 'dispatch',
    owner,
    capsuleAddress,
    timestamp,
    signatureBase64: signature,
  })
  if (!isValidSignature) {
    return NextResponse.json({ error: 'Invalid or expired signature' }, { status: 401 })
  }

  const result = await dispatchCreDeliveryForCapsule(capsuleAddress)
  if (result.ok || result.skipped) {
    return NextResponse.json({ ok: true, status: result.skipped ? 'skipped' : 'dispatched' })
  }
  return NextResponse.json({ error: result.error || 'Dispatch failed' }, { status: 500 })
}
