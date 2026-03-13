'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock3, Shield, User } from 'lucide-react'
import { useAppWallet } from '@/components/wallet/AppWalletContext'
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'
import { getActiveChainLabel, isInjectiveEvmChain } from '@/config/blockchain'
import { getCapsule } from '@/lib/capsule/client'
import { listInjectiveCapsules } from '@/lib/injective/client'
import type { CapsuleRecord } from '@/lib/capsule/types'

function maskAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

function getCapsuleStatus(capsule: CapsuleRecord) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (capsule.executedAt) return 'Executed'
  if (capsule.cancelled) return 'Cancelled'
  if (capsule.conditionKind === 'time') {
    return capsule.executeAt && capsule.executeAt <= nowSeconds ? 'Expired' : 'Active'
  }
  return capsule.lastActivity + capsule.inactivityPeriod <= nowSeconds ? 'Expired' : 'Active'
}

export default function CapsulesEntryPage() {
  const wallet = useAppWallet()
  const injectiveMode = isInjectiveEvmChain()
  const ownerRef = wallet.publicKey ?? wallet.address
  const [capsules, setCapsules] = useState<CapsuleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (injectiveMode && !wallet.connected) {
      setCapsules([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        if (injectiveMode) {
          const records = await listInjectiveCapsules({
            owner: wallet.address ?? null,
            limit: 100,
          })
          if (!cancelled) setCapsules(records)
          return
        }

        if (!ownerRef) {
          if (!cancelled) setCapsules([])
          return
        }

        const capsule = await getCapsule(ownerRef)
        if (!cancelled) setCapsules(capsule ? [capsule] : [])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setCapsules([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [injectiveMode, ownerRef, wallet.address])

  const title = 'My Capsules'

  const subtitle = injectiveMode
    ? 'All capsules created by your connected Injective wallet.'
    : `Connect your wallet to manage your capsule on ${getActiveChainLabel()}.`

  const sortedCapsules = useMemo(() => {
    return [...capsules].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
  }, [capsules])

  return (
    <div className="min-h-screen bg-hero pt-24 pb-16 px-4">
      <div className="mx-auto max-w-5xl">
        <section className="card-Heres p-8 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-Heres-white">{title}</h1>
              <p className="mt-2 text-Heres-muted">{subtitle}</p>
            </div>
            {wallet.connected && (
              <Link
                href="/create"
                className="inline-flex items-center justify-center rounded-xl border border-Heres-accent bg-Heres-accent/10 px-4 py-3 text-sm font-medium text-Heres-accent hover:bg-Heres-accent/20"
              >
                Create Capsule
              </Link>
            )}
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!wallet.connected ? (
          <div className="card-Heres p-10 text-center">
            <Shield className="mx-auto mb-6 h-14 w-14 text-Heres-accent" />
            <h2 className="mb-3 text-2xl font-bold text-Heres-white">Connect Wallet</h2>
            <p className="mb-6 text-Heres-muted">
              Connect your wallet to view and manage your capsules.
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="wallet-menu-container flex justify-center">
                <WalletConnectButton />
              </div>
              <Link
                href="/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-Heres-accent bg-Heres-accent/10 px-6 py-3 text-sm font-semibold text-Heres-accent hover:bg-Heres-accent/20"
              >
                Create Capsule
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="card-Heres p-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-Heres-accent border-t-transparent" />
            <p className="text-Heres-muted">Loading capsules from chain...</p>
          </div>
        ) : sortedCapsules.length === 0 ? (
          <div className="card-Heres p-10 text-center">
            <Shield className="mx-auto mb-6 h-14 w-14 text-Heres-accent" />
            <h2 className="mb-3 text-2xl font-bold text-Heres-white">No Capsules Found</h2>
            <p className="mb-6 text-Heres-muted">
              {injectiveMode
                ? wallet.connected
                  ? 'No capsules were found for this wallet yet.'
                  : 'Connect your wallet to view your capsules.'
                : 'You do not have a capsule yet.'}
            </p>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-Heres-accent bg-Heres-accent/10 px-6 py-3 text-sm font-semibold text-Heres-accent hover:bg-Heres-accent/20"
            >
              Create Capsule
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedCapsules.map((capsule) => {
              const status = getCapsuleStatus(capsule)
              const capsuleId = capsule.id ?? capsule.capsuleAddress ?? ''
              const expiryText = capsule.conditionKind === 'time'
                ? capsule.executeAt
                  ? new Date(capsule.executeAt * 1000).toLocaleString()
                  : 'Scheduled'
                : formatDuration(capsule.inactivityPeriod)

              return (
                <Link
                  key={capsuleId}
                  href={`/capsules/${capsuleId}`}
                  className="card-Heres p-6 transition-colors hover:border-Heres-accent/40"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-Heres-white">Capsule {capsuleId}</h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          status === 'Executed'
                            ? 'bg-green-500/10 text-green-400'
                            : status === 'Expired'
                              ? 'bg-amber-500/10 text-amber-400'
                              : status === 'Cancelled'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-Heres-accent/10 text-Heres-accent'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-Heres-muted">
                        {capsule.conditionKind === 'time' ? 'Time condition' : 'Heartbeat condition'} · {' '}
                        {capsule.conditionKind === 'time' ? `Executes at ${expiryText}` : `Inactivity window ${expiryText}`}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm sm:min-w-[240px]">
                      <div className="rounded-xl border border-Heres-border bg-Heres-card/80 px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-Heres-muted">Owner</p>
                        <p className="mt-1 font-mono text-Heres-white">{typeof capsule.owner === 'string' ? maskAddress(capsule.owner) : 'Unknown'}</p>
                      </div>
                      <div className="rounded-xl border border-Heres-border bg-Heres-card/80 px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-Heres-muted">Beneficiary</p>
                        <p className="mt-1 font-mono text-Heres-white">{capsule.beneficiary ? maskAddress(capsule.beneficiary) : 'Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-Heres-muted">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      Last activity {new Date(capsule.lastActivity * 1000).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Open capsule details
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
