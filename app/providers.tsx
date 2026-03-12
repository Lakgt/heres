'use client'

import { ReactNode } from 'react'
import { WalletAppProvider } from '@/components/wallet/WalletAppProvider'

export function Providers({ children }: { children: ReactNode }) {
  return <WalletAppProvider>{children}</WalletAppProvider>
}
