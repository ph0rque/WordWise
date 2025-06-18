/**
 * Encryption utilities for securing sensitive keystroke data
 * Uses Web Crypto API for client-side encryption
 */

// Encryption configuration
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM

/**
 * Generate a cryptographic key for encryption/decryption
 */
export async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Export a CryptoKey to a base64 string for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  const keyArray = new Uint8Array(exported)
  return btoa(String.fromCharCode(...keyArray))
}

/**
 * Import a base64 key string back to a CryptoKey
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0))
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random initialization vector
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * Encrypt a string using AES-GCM
 */
export async function encrypt(plaintext: string, key?: CryptoKey): Promise<string> {
  try {
    // Use provided key or generate a new one
    const encryptionKey = key || await getOrCreateSessionKey()
    
    // Convert string to bytes
    const plaintextBytes = new TextEncoder().encode(plaintext)
    
    // Generate random IV
    const iv = generateIV()
    
    // Encrypt the data
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      encryptionKey,
      plaintextBytes
    )
    
    // Combine IV and ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)
    
    // Return as base64
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt a string using AES-GCM
 */
export async function decrypt(encryptedData: string, key?: CryptoKey): Promise<string> {
  try {
    // Use provided key or get session key
    const decryptionKey = key || await getOrCreateSessionKey()
    
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH)
    const ciphertext = combined.slice(IV_LENGTH)
    
    // Decrypt the data
    const plaintextBytes = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      decryptionKey,
      ciphertext
    )
    
    // Convert back to string
    return new TextDecoder().decode(plaintextBytes)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Get or create a session-specific encryption key
 * This key is stored in sessionStorage and is ephemeral
 */
async function getOrCreateSessionKey(): Promise<CryptoKey> {
  const SESSION_KEY_NAME = 'keystroke_encryption_key'
  
  // Try to get existing key from sessionStorage
  const storedKey = sessionStorage.getItem(SESSION_KEY_NAME)
  
  if (storedKey) {
    try {
      return await importKey(storedKey)
    } catch (error) {
      console.warn('Failed to import stored key, generating new one:', error)
    }
  }
  
  // Generate new key and store it
  const newKey = await generateKey()
  const exportedKey = await exportKey(newKey)
  sessionStorage.setItem(SESSION_KEY_NAME, exportedKey)
  
  return newKey
}

/**
 * Clear the session encryption key
 */
export function clearSessionKey(): void {
  sessionStorage.removeItem('keystroke_encryption_key')
}

/**
 * Hash a string using SHA-256 for data integrity
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  return btoa(String.fromCharCode(...hashArray))
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Encrypt sensitive keystroke session data
 */
export async function encryptKeystrokeSession(session: any): Promise<any> {
  const encryptedSession = { ...session }
  
  // Encrypt sensitive fields in events
  if (encryptedSession.events) {
    for (const event of encryptedSession.events) {
      if (event.key && typeof event.key === 'string') {
        event.key = await encrypt(event.key)
      }
      if (event.value && typeof event.value === 'string') {
        event.value = await encrypt(event.value)
      }
      if (event.data && typeof event.data === 'string') {
        event.data = await encrypt(event.data)
      }
    }
  }
  
  // Mark as encrypted
  encryptedSession.encrypted = true
  encryptedSession.encryptionTimestamp = Date.now()
  
  return encryptedSession
}

/**
 * Decrypt sensitive keystroke session data
 */
export async function decryptKeystrokeSession(encryptedSession: any): Promise<any> {
  if (!encryptedSession.encrypted) {
    return encryptedSession // Not encrypted
  }
  
  const decryptedSession = { ...encryptedSession }
  
  // Decrypt sensitive fields in events
  if (decryptedSession.events) {
    for (const event of decryptedSession.events) {
      try {
        if (event.key && typeof event.key === 'string') {
          event.key = await decrypt(event.key)
        }
        if (event.value && typeof event.value === 'string') {
          event.value = await decrypt(event.value)
        }
        if (event.data && typeof event.data === 'string') {
          event.data = await decrypt(event.data)
        }
      } catch (error) {
        console.warn('Failed to decrypt event field:', error)
        // Leave encrypted data as-is if decryption fails
      }
    }
  }
  
  // Mark as decrypted
  decryptedSession.encrypted = false
  
  return decryptedSession
}

/**
 * Validate encryption capabilities
 */
export function isEncryptionSupported(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.subtle.encrypt === 'function' &&
    typeof crypto.subtle.decrypt === 'function' &&
    typeof crypto.subtle.generateKey === 'function'
  )
}

/**
 * Get encryption info for debugging
 */
export function getEncryptionInfo(): {
  supported: boolean
  algorithm: string
  keyLength: number
  ivLength: number
} {
  return {
    supported: isEncryptionSupported(),
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH,
    ivLength: IV_LENGTH
  }
} 