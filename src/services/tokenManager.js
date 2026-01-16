/**
 * Token Manager - Handles secure storage and retrieval of Discord token
 * Uses Web Crypto API for browser compatibility
 * 
 * Security Notes:
 * - Uses AES-GCM encryption
 * - Random salt generated per token
 * - Key derived from user agent (weak but acceptable for local storage)
 * - WARNING: This provides obfuscation, not true security
 * - For true security, would need hardware-backed key storage
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

class TokenManager {
  constructor(storageKey = 'discord_token_enc') {
    this.storageKey = storageKey;
    this.encryptionKey = null;
  }

  /**
   * Generate encryption key from passphrase and salt
   */
  async deriveKey(passphrase, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt token and store it
   * @param {string} token - Discord user token
   * @returns {Promise<boolean>} Success status
   */
  async encryptAndStore(token) {
    try {
      // Generate random salt for this encryption
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      
      // Use user agent as passphrase (weak but acceptable for obfuscation)
      // In production, consider prompting for a master password
      const passphrase = navigator.userAgent + window.location.origin;
      const key = await this.deriveKey(passphrase, salt);

      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv: iv
        },
        key,
        data
      );

      const encryptedData = {
        salt: Array.from(salt),
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
      };

      // Store in localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(encryptedData));
      } else {
        // Fallback to memory storage for testing
        this._memoryStorage = encryptedData;
      }

      return true;
    } catch (error) {
      console.error('[TokenManager] Encryption error:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt token
   * @returns {Promise<string|null>} Decrypted token or null
   */
  async retrieveAndDecrypt() {
    try {
      let encryptedData;
      
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return null;
        encryptedData = JSON.parse(stored);
      } else {
        // Fallback to memory storage for testing
        encryptedData = this._memoryStorage;
        if (!encryptedData) return null;
      }

      // Retrieve salt and reconstruct key
      const salt = new Uint8Array(encryptedData.salt);
      const passphrase = navigator.userAgent + window.location.origin;
      const key = await this.deriveKey(passphrase, salt);

      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.data);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv
        },
        key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('[TokenManager] Decryption error:', error);
      return null;
    }
  }

  /**
   * Check if token exists
   * @returns {boolean}
   */
  hasToken() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.storageKey) !== null;
    }
    return this._memoryStorage !== null && this._memoryStorage !== undefined;
  }

  /**
   * Delete stored token
   * @returns {Promise<boolean>} Success status
   */
  async deleteToken() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
      this._memoryStorage = null;
      this.encryptionKey = null;
      return true;
    } catch (error) {
      console.error('[TokenManager] Delete error:', error);
      return false;
    }
  }
}

export default TokenManager;
