'use client'

import { createContext, ReactNode, useContext, useMemo } from 'react'
import { useWallet, type WalletContextState } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useAccount, useDisconnect, useSignMessage, useWalletClient } from 'wagmi'
import { bytesToHex, hexToBytes, type WalletClient } from 'viem'
import { getActiveChain, isInjectiveEvmChain, type SupportedChain } from '@/config/blockchain'

export type AppWalletState = {
  chain: SupportedChain
  connected: boolean
  address: string | null
  publicKey: PublicKey | null
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>
  disconnect: () => Promise<void>
  solanaWallet: WalletContextState | null
  evmWalletClient: WalletClient | null
}

const AppWalletContext = createContext<AppWalletState | null>(null)

const EMPTY_WALLET: AppWalletState = {
  chain: getActiveChain(),
  connected: false,
  address: null,
  publicKey: null,
  disconnect: async () => {},
  solanaWallet: null,
  evmWalletClient: null,
}

export function SolanaAppWalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet()

  const value = useMemo<AppWalletState>(() => ({
    chain: 'solana',
    connected: wallet.connected,
    address: wallet.publicKey?.toBase58() || null,
    publicKey: wallet.publicKey || null,
    signMessage: wallet.signMessage
      ? async (message: Uint8Array) => wallet.signMessage!(message)
      : undefined,
    disconnect: async () => {
      await wallet.disconnect()
    },
    solanaWallet: wallet,
    evmWalletClient: null,
  }), [wallet])

  return <AppWalletContext.Provider value={value}>{children}</AppWalletContext.Provider>
}

export function InjectiveAppWalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { data: walletClient } = useWalletClient()

  const value = useMemo<AppWalletState>(() => ({
    chain: 'injective-evm',
    connected: isConnected,
    address: address || null,
    publicKey: null,
    signMessage: async (message: Uint8Array) => {
      const signature = await signMessageAsync({
        message: { raw: bytesToHex(message) },
      })
      return hexToBytes(signature)
    },
    disconnect: async () => {
      await disconnectAsync()
    },
    solanaWallet: null,
    evmWalletClient: walletClient ?? null,
  }), [address, disconnectAsync, isConnected, signMessageAsync, walletClient])

  return <AppWalletContext.Provider value={value}>{children}</AppWalletContext.Provider>
}

export function EmptyAppWalletProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AppWalletState>(() => ({
    ...EMPTY_WALLET,
    chain: isInjectiveEvmChain() ? 'injective-evm' : 'solana',
  }), [])

  return <AppWalletContext.Provider value={value}>{children}</AppWalletContext.Provider>
}

export function useAppWallet(): AppWalletState {
  const context = useContext(AppWalletContext)
  if (!context) {
    throw new Error('useAppWallet must be used within WalletAppProvider')
  }
  return context
}
