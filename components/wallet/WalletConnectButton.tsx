'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import dynamic from 'next/dynamic'
import { getActiveChain, isInjectiveEvmChain } from '@/config/blockchain'
import { hasInjectiveWalletUiConfig } from '@/config/injective'

const SolanaWalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
)

type WalletConnectButtonProps = {
  className?: string
}

export function WalletConnectButton({ className }: WalletConnectButtonProps) {
  if (isInjectiveEvmChain(getActiveChain())) {
    if (!hasInjectiveWalletUiConfig()) {
      return (
        <button
          type="button"
          disabled
          className={className}
          title="Set NEXT_PUBLIC_INJECTIVE_EVM_RPC_URL, NEXT_PUBLIC_INJECTIVE_EVM_CHAIN_ID, and NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to enable Injective wallets."
        >
          Configure WalletConnect
        </button>
      )
    }

    return (
      <ConnectButton.Custom>
        {({
          account,
          chain,
          mounted,
          openAccountModal,
          openChainModal,
          openConnectModal,
        }) => {
          const ready = mounted
          const connected = ready && !!account && !!chain

          if (!connected) {
            return (
              <button type="button" onClick={openConnectModal} className={className}>
                Connect Wallet
              </button>
            )
          }

          if (chain.unsupported) {
            return (
              <button type="button" onClick={openChainModal} className={className}>
                Wrong Network
              </button>
            )
          }

          return (
            <button type="button" onClick={openAccountModal} className={className}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>{account.displayName}</span>
              </span>
              <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-[11px] uppercase tracking-wide text-Heres-accent">
                {chain.name || 'Injective'}
              </span>
            </button>
          )
        }}
      </ConnectButton.Custom>
    )
  }

  return <SolanaWalletMultiButton className={className} />
}
