import { NextRequest, NextResponse } from 'next/server'
import { getActiveChain } from '@/config/blockchain'
import { reconcileCreDeliveries } from '@/lib/cre/service'
import { executeReadyInjectiveCapsules, reconcileInjectiveCreDeliveries } from '@/lib/injective/executor'

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
    if (getActiveChain() === 'injective-evm') {
      const scanLimit = Number(request.nextUrl.searchParams.get('scan') || '100')
      const maxExecutions = Number(request.nextUrl.searchParams.get('maxExecutions') || '5')
      const maxDispatches = Number(request.nextUrl.searchParams.get('maxDispatches') || '10')

      const execution = await timeout(
        executeReadyInjectiveCapsules({ scanLimit, maxExecutions }),
        25000,
        'executeReadyInjectiveCapsules'
      )
      const cre = await timeout(
        reconcileInjectiveCreDeliveries({ scanLimit, maxDispatches }),
        20000,
        'reconcileInjectiveCreDeliveries'
      )

      return NextResponse.json({
        ok: true,
        chain: 'injective-evm',
        execution,
        cre,
      })
    }

    const cre = await timeout(reconcileCreDeliveries(), 45000, 'reconcileCre')
    return NextResponse.json({
      ok: true,
      chain: 'solana',
      crank: {
        skipped: true,
        reason: 'Legacy Solana crank route is not managed by the Injective helper.',
      },
      cre,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
