// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { vaults } from '@/content/vault'

import { DEFAULT_ITERATIONS, normalizeVaultPath, openVault, sealVault, VaultLockedError, vaultId } from '../vault'

/** Low iteration count keeps the suite fast; production vaults use DEFAULT_ITERATIONS. */
const FAST = 1_000
const payload = { kind: 'home-remix', words: ['one', 'two'] }

describe('normalizeVaultPath', () => {
  it.each([
    ['/Secret/', '/secret'],
    ['secret', '/secret'],
    ['  /secret//  ', '/secret'],
    ['/', '/'],
  ])('%s → %s', (input, output) => expect(normalizeVaultPath(input)).toBe(output))
})

describe('vaultId', () => {
  it('is a stable SHA-256 of the normalised path', async () => {
    const id = await vaultId('/secret')
    expect(id).toMatch(/^[0-9a-f]{64}$/)
    expect(await vaultId('/SECRET/')).toBe(id)
    expect(await vaultId('/other')).not.toBe(id)
  })
})

describe('seal / open', () => {
  it('round-trips the payload with the right password', async () => {
    const sealed = await sealVault('/secret', payload, 'correct horse battery', FAST)
    expect(await openVault(sealed, 'correct horse battery')).toEqual(payload)
  })

  it('never stores the plaintext or the path', async () => {
    const sealed = await sealVault('/secret', payload, 'correct horse battery', FAST)
    const serialised = JSON.stringify(sealed)
    expect(serialised).not.toContain('home-remix')
    expect(serialised).not.toContain('/secret')
  })

  it('uses a fresh salt and IV every time', async () => {
    const a = await sealVault('/secret', payload, 'correct horse battery', FAST)
    const b = await sealVault('/secret', payload, 'correct horse battery', FAST)
    expect(a.salt).not.toBe(b.salt)
    expect(a.iv).not.toBe(b.iv)
    expect(a.data).not.toBe(b.data)
  })

  it('rejects a wrong password with VaultLockedError', async () => {
    const sealed = await sealVault('/secret', payload, 'correct horse battery', FAST)
    await expect(openVault(sealed, 'wrong horse battery')).rejects.toBeInstanceOf(VaultLockedError)
  })

  it('rejects ciphertext moved to another path', async () => {
    const sealed = await sealVault('/secret', payload, 'correct horse battery', FAST)
    const moved = { ...sealed, id: await vaultId('/elsewhere') }
    await expect(openVault(moved, 'correct horse battery')).rejects.toBeInstanceOf(VaultLockedError)
  })

  it('rejects tampered ciphertext', async () => {
    const sealed = await sealVault('/secret', payload, 'correct horse battery', FAST)
    const bytes = atob(sealed.data)
    const flipped = String.fromCharCode(bytes.charCodeAt(0) ^ 1) + bytes.slice(1)
    await expect(openVault({ ...sealed, data: btoa(flipped) }, 'correct horse battery')).rejects.toBeInstanceOf(
      VaultLockedError,
    )
  })
})

describe('sealed vaults shipped with the site', () => {
  it('are well-formed and use the full key-derivation cost', () => {
    for (const vault of vaults.values()) {
      expect(vault.v).toBe(1)
      expect(vault.id).toMatch(/^[0-9a-f]{64}$/)
      expect(vault.iterations).toBeGreaterThanOrEqual(DEFAULT_ITERATIONS)
      expect(atob(vault.iv)).toHaveLength(12)
      expect(atob(vault.salt)).toHaveLength(16)
    }
  })
})
