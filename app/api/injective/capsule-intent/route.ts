import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, isAddress } from 'viem'
import { INJECTIVE_EVM_CONFIG } from '@/config/injective'
import { heresCapsuleManagerAbi } from '@/lib/injective/abi'
import { buildInjectiveMetadataHash } from '@/lib/injective/client'
import { upsertInjectiveIntentRecord } from '@/lib/cre/store'

type LinkIntentBody = {
  capsuleId?: string
  owner?: string
  intentDataBase64?: string
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'base64'))
}

export async function POST(request: NextRequest) {
  let body: LinkIntentBody
  try {
    body = (await request.json()) as LinkIntentBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const capsuleId = body.capsuleId?.trim()
  const owner = body.owner?.trim()
  const intentDataBase64 = body.intentDataBase64?.trim()

  if (!capsuleId || !/^\d+$/.test(capsuleId) || !owner || !isAddress(owner) || !intentDataBase64) {
    return NextResponse.json({ error: 'capsuleId, owner, and intentDataBase64 are required' }, { status: 400 })
  }

  if (!INJECTIVE_EVM_CONFIG.rpcUrl || !INJECTIVE_EVM_CONFIG.capsuleManagerAddress || !isAddress(INJECTIVE_EVM_CONFIG.capsuleManagerAddress)) {
    return NextResponse.json({ error: 'Injective runtime config is missing' }, { status: 503 })
  }

  try {
    const intentData = decodeBase64(intentDataBase64)
    const metadataHash = buildInjectiveMetadataHash(intentData)
    const publicClient = createPublicClient({
      transport: http(INJECTIVE_EVM_CONFIG.rpcUrl),
    })

    const capsule = await publicClient.readContract({
      address: INJECTIVE_EVM_CONFIG.capsuleManagerAddress,
      abi: heresCapsuleManagerAbi,
      functionName: 'getCapsule',
      args: [BigInt(capsuleId)],
    })

    if (capsule.owner.toLowerCase() !== owner.toLowerCase()) {
      return NextResponse.json({ error: 'Owner mismatch' }, { status: 403 })
    }

    if (capsule.metadataHash.toLowerCase() !== metadataHash.toLowerCase()) {
      return NextResponse.json({ error: 'metadataHash mismatch' }, { status: 409 })
    }

    const now = Date.now()
    await upsertInjectiveIntentRecord({
      capsuleAddress: capsuleId,
      owner,
      metadataHash,
      intentDataBase64,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ ok: true, capsuleId, metadataHash })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
