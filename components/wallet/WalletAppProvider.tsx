'use client'

import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { injectedWallet, metaMaskWallet, phantomWallet, rabbyWallet, rainbowWallet, safeWallet, trustWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { ReactNode, useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'
import { getActiveChain, isInjectiveEvmChain } from '@/config/blockchain'
import { hasInjectiveWalletUiConfig, INJECTIVE_EVM_CONFIG } from '@/config/injective'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { EmptyAppWalletProvider, InjectiveAppWalletProvider, SolanaAppWalletProvider } from '@/components/wallet/AppWalletContext'

const queryClient = new QueryClient()

function createInjectiveChain() {
  return defineChain({
    id: Number(INJECTIVE_EVM_CONFIG.chainId || 0),
    name: 'Injective EVM',
    nativeCurrency: {
      name: 'Injective',
      symbol: 'INJ',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [INJECTIVE_EVM_CONFIG.rpcUrl] },
      public: { http: [INJECTIVE_EVM_CONFIG.rpcUrl] },
    },
    blockExplorers: INJECTIVE_EVM_CONFIG.explorerUrl
      ? {
          default: {
            name: 'Injective Explorer',
            url: INJECTIVE_EVM_CONFIG.explorerUrl,
          },
        }
      : undefined,
    testnet: true,
  })
}

function createInjectiveWagmiConfig() {
  if (!hasInjectiveWalletUiConfig()) return null

  const injectiveChain = createInjectiveChain()
  const projectId = INJECTIVE_EVM_CONFIG.walletConnectProjectId

  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Recommended',
        wallets: [
          walletConnectWallet,
          metaMaskWallet,
          rabbyWallet,
          trustWallet,
          phantomWallet,
          rainbowWallet,
        ],
      },
      {
        groupName: 'More Wallets',
        wallets: [
          injectedWallet,
          safeWallet,
        ],
      },
    ],
    {
      appName: 'Heres',
      projectId,
      appDescription: 'Capsule protocol on Injective EVM',
      appUrl: 'https://heres.app',
      appIcon: '/logo-white.png',
    }
  )

  return createConfig({
    chains: [injectiveChain],
    connectors,
    transports: {
      [injectiveChain.id]: http(INJECTIVE_EVM_CONFIG.rpcUrl),
    },
    ssr: false,
  })
}

const injectiveWagmiConfig = createInjectiveWagmiConfig()

export function WalletAppProvider({ children }: { children: ReactNode }) {
  const activeChain = getActiveChain()
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => {
    const heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY
    if (heliusApiKey) {
      return `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`
    }
    return clusterApiUrl(network)
  }, [network])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ] as any,
    []
  )

  if (isInjectiveEvmChain(activeChain)) {
    if (!injectiveWagmiConfig) {
      return <EmptyAppWalletProvider>{children}</EmptyAppWalletProvider>
    }

    return (
      <WagmiProvider config={injectiveWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            modalSize="compact"
            theme={darkTheme({
              accentColor: '#4fb3ff',
              accentColorForeground: '#07111f',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small',
            })}
          >
            <InjectiveAppWalletProvider>{children}</InjectiveAppWalletProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    )
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaAppWalletProvider>{children}</SolanaAppWalletProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
