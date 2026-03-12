export type SupportedChain = 'solana' | 'injective-evm'
export type SupportedSignatureScheme = 'solana' | 'injective-evm'

const DEFAULT_CHAIN: SupportedChain = 'solana'

function normalizeChainTarget(value: string | undefined): SupportedChain {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'injective' || normalized === 'injective-evm') {
    return 'injective-evm'
  }
  return DEFAULT_CHAIN
}

export const ACTIVE_CHAIN = normalizeChainTarget(process.env.NEXT_PUBLIC_BLOCKCHAIN_TARGET)

function normalizeSignatureScheme(value: string | undefined): SupportedSignatureScheme | null {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'injective' || normalized === 'injective-evm') {
    return 'injective-evm'
  }
  if (normalized === 'solana') {
    return 'solana'
  }
  return null
}

export function getActiveChain(): SupportedChain {
  return ACTIVE_CHAIN
}

export function isSolanaChain(chain: SupportedChain = ACTIVE_CHAIN): boolean {
  return chain === 'solana'
}

export function isInjectiveEvmChain(chain: SupportedChain = ACTIVE_CHAIN): boolean {
  return chain === 'injective-evm'
}

export function getActiveSignatureScheme(): SupportedSignatureScheme {
  const explicitScheme = normalizeSignatureScheme(
    process.env.CRE_WALLET_SIGNATURE_SCHEME || process.env.NEXT_PUBLIC_CRE_WALLET_SIGNATURE_SCHEME
  )
  if (explicitScheme) {
    return explicitScheme
  }
  return isInjectiveEvmChain() ? 'injective-evm' : 'solana'
}

export function getActiveChainLabel(chain: SupportedChain = ACTIVE_CHAIN): string {
  return chain === 'injective-evm' ? 'Injective EVM' : 'Solana'
}
