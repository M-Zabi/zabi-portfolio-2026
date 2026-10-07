/**
 * Password-locked content for a static site, with no server.
 *
 * Private pages are not hidden behind a password *check* (anyone could read the answer out
 * of the bundle) — their content is encrypted. A key is derived from the password with
 * PBKDF2-SHA-256 and the JSON payload is sealed with AES-256-GCM. Without the password the
 * bundle only contains ciphertext; a wrong password fails GCM's authentication tag.
 *
 * The routes are hidden the same way: a vault is addressed by the SHA-256 of its path, so the
 * path itself never appears in the code.
 *
 * Pure Web Crypto — runs in the browser and in Node (the `vault:seal` script). Keep it free of
 * TypeScript-only runtime syntax: Node executes the seal script with type stripping.
 */

export interface SealedVault {
  v: 1
  /** SHA-256 (hex) of the normalised path that opens this vault. */
  id: string
  iterations: number
  /** Base64. */
  salt: string
  iv: string
  data: string
}

/** OWASP's 2023 guidance for PBKDF2-HMAC-SHA256. Also gives the unlock a natural beat. */
export const DEFAULT_ITERATIONS = 600_000

export class VaultLockedError extends Error {
  constructor() {
    super('That password doesn’t open this vault.')
    this.name = 'VaultLockedError'
  }
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

/** `/Secret/` and `/secret` open the same vault. */
export function normalizeVaultPath(path: string): string {
  const trimmed = path.trim().toLowerCase().replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed || '/' : `/${trimmed}`
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function vaultId(path: string): Promise<string> {
  return sha256Hex(normalizeVaultPath(path))
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function sealVault(
  path: string,
  payload: unknown,
  password: string,
  iterations = DEFAULT_ITERATIONS,
): Promise<SealedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt, iterations)
  const id = await vaultId(path)
  // The id is bound in as additional data, so a payload can't be moved to another path.
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(id) },
    key,
    encoder.encode(JSON.stringify(payload)),
  )
  return { v: 1, id, iterations, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(new Uint8Array(ciphertext)) }
}

/** Decrypts a vault. Throws `VaultLockedError` for a wrong password (or tampered data). */
export async function openVault<T>(sealed: SealedVault, password: string): Promise<T> {
  const key = await deriveKey(password, fromBase64(sealed.salt), sealed.iterations)
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(sealed.iv), additionalData: encoder.encode(sealed.id) },
      key,
      fromBase64(sealed.data),
    )
    return JSON.parse(decoder.decode(plaintext)) as T
  } catch {
    throw new VaultLockedError()
  }
}
