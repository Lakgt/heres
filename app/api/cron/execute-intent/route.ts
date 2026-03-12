import { NextRequest, NextResponse } from 'next/server'
import { reconcileCreDeliveries } from '@/lib/cre/service'

export async function GET(request: NextRequest) {
  return handleCron(request)
}

export async function POST(request: NextRequest) {
  return handleCron(request)
}

async function handleCron(request: NextRequest) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || !secret.trim()) {
    return NextResponse.json({ error: 'CRON_SECRET is required' }, { status: 503 })
  }

  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
    Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
    ])

  try {
    const cre = await timeout(reconcileCreDeliveries(), 45000, 'reconcileCre')
    return NextResponse.json({
      ok: true,
      chain: 'injective-evm',
      crank: {
        skipped: true,
        reason: 'Legacy Solana crank is disabled in Injective mode.',
      },
      cre,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
