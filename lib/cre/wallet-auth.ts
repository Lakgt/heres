import { createPublicKey, verify } from 'crypto'
import { PublicKey } from '@solana/web3.js'
import { toHex, verifyMessage } from 'viem'
import { getActiveSignatureScheme } from '@/config/blockchain'

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

function verifySolanaMessageSignature(owner: string, message: string, signature: string): boolean {
  try {
    const pubkey = new PublicKey(owner)
    const publicKeyDer = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(pubkey.toBytes())])
    const key = createPublicKey({ key: publicKeyDer, format: 'der', type: 'spki' })
    const signatureBuffer = Buffer.from(signature, 'base64')
    if (signatureBuffer.length === 0) return false
    return verify(null, Buffer.from(message, 'utf8'), key, signatureBuffer)
  } catch {
    return false
  }
}

function isValidSolanaWalletAddress(owner: string): boolean {
  try {
    new PublicKey(owner)
    return true
  } catch {
    return false
  }
}

function isValidInjectiveEvmWalletAddress(owner: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(owner)
}

async function verifyInjectiveMessageSignature(owner: string, message: string, signature: string): Promise<boolean> {
  try {
    const signatureBytes = Buffer.from(signature, 'base64')
    if (signatureBytes.length === 0) return false

    return await verifyMessage({
      address: owner as `0x${string}`,
      message: { raw: toHex(Buffer.from(message, 'utf8')) },
      signature: toHex(signatureBytes),
    })
  } catch {
    return false
  }
}

export function isValidCreOwnerAddress(owner: string): boolean {
  return getActiveSignatureScheme() === 'injective-evm'
    ? isValidInjectiveEvmWalletAddress(owner)
    : isValidSolanaWalletAddress(owner)
}

export async function verifyCreWalletMessage(input: {
  owner: string
  message: string
  signature: string
}): Promise<boolean> {
  return getActiveSignatureScheme() === 'injective-evm'
    ? verifyInjectiveMessageSignature(input.owner, input.message, input.signature)
    : Promise.resolve(verifySolanaMessageSignature(input.owner, input.message, input.signature))
}
