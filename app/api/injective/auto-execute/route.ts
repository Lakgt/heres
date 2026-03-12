import { NextRequest, NextResponse } from 'next/server'
import { getActiveChain } from '@/config/blockchain'
import { executeInjectiveCapsuleIfReady, shouldThrottlePublicInjectiveExecution } from '@/lib/injective/executor'

export async function POST(request: NextRequest) {
  if (getActiveChain() !== 'injective-evm') {
    return NextResponse.json({ error: 'Injective auto-execution is not active.' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const capsuleId = typeof body?.capsuleId === 'string' ? body.capsuleId : ''

    if (!/^\d+$/.test(capsuleId)) {
      return NextResponse.json({ error: 'capsuleId must be a numeric capsule ID.' }, { status: 400 })
    }

    if (shouldThrottlePublicInjectiveExecution(capsuleId)) {
      return NextResponse.json({ ok: true, status: 'throttled', capsuleId })
    }

    const result = await executeInjectiveCapsuleIfReady(capsuleId)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
