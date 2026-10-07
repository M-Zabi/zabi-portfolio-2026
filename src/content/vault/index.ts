import type { SealedVault } from '@/lib/vault'

/**
 * Sealed private pages. Each file in ./sealed is written by `npm run vault:seal` and holds only
 * ciphertext plus the SHA-256 of the path that opens it — no slug, no content, no password.
 */
const modules = import.meta.glob<SealedVault>('./sealed/*.ts', { eager: true, import: 'vault' })

export const vaults: ReadonlyMap<string, SealedVault> = new Map(
  Object.values(modules).map((vault) => [vault.id, vault]),
)
