export const INJECTIVE_EVM_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_INJECTIVE_EVM_RPC_URL?.trim() || '',
  explorerUrl: process.env.NEXT_PUBLIC_INJECTIVE_EVM_EXPLORER_URL?.trim() || '',
  chainId: process.env.NEXT_PUBLIC_INJECTIVE_EVM_CHAIN_ID?.trim() || '',
  capsuleManagerAddress: process.env.NEXT_PUBLIC_INJECTIVE_EVM_CAPSULE_MANAGER?.trim() || '',
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || '',
} as const

export function hasInjectiveEvmRuntimeConfig(): boolean {
  return Boolean(INJECTIVE_EVM_CONFIG.rpcUrl && INJECTIVE_EVM_CONFIG.chainId)
}

export function hasInjectiveCapsuleManagerAddress(): boolean {
  return Boolean(INJECTIVE_EVM_CONFIG.capsuleManagerAddress)
}

export function hasInjectiveWalletUiConfig(): boolean {
  return Boolean(
    INJECTIVE_EVM_CONFIG.rpcUrl &&
    INJECTIVE_EVM_CONFIG.chainId &&
    INJECTIVE_EVM_CONFIG.walletConnectProjectId
  )
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export function hasInjectiveExplorerUrl(): boolean {
  return Boolean(INJECTIVE_EVM_CONFIG.explorerUrl)
}

export function getInjectiveExplorerAddressUrl(address: string): string | null {
  if (!hasInjectiveExplorerUrl() || !address) return null
  return `${normalizeBaseUrl(INJECTIVE_EVM_CONFIG.explorerUrl)}/address/${address}`
}

export function getInjectiveExplorerTxUrl(txHash: string): string | null {
  if (!hasInjectiveExplorerUrl() || !txHash) return null
  return `${normalizeBaseUrl(INJECTIVE_EVM_CONFIG.explorerUrl)}/tx/${txHash}`
}
