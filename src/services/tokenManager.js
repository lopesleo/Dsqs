/**
 * Token Manager - Handles secure storage and retrieval of Discord token
 * Uses Web Crypto API for browser compatibility
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

class TokenManager {
  constructor(storageKey = 'discord_token_enc') {
    this.storageKey = storageKey;
    this.encryptionKey = null;
  }

  /**
   * Generate encryption key from passphrase
   */
  async deriveKey(passphrase) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = encoder.encode('discord-qs-salt-v1'); // Static salt for simplicity
    
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
   * Initialize encryption key
   */
  async initializeKey() {
    if (this.encryptionKey) return;

    // Use a passphrase based on browser info (for simplicity)
    // In production, use hardware ID or similar
    const passphrase = navigator.userAgent + 'discord-qs-key';
    this.encryptionKey = await this.deriveKey(passphrase);
  }

  /**
   * Encrypt token and store it
   * @param {string} token - Discord user token
   * @returns {Promise<boolean>} Success status
   */
  async encryptAndStore(token) {
    try {
      await this.initializeKey();

      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv: iv
        },
        this.encryptionKey,
        data
      );

      const encryptedData = {
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

      await this.initializeKey();

      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.data);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv
        },
        this.encryptionKey,
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
