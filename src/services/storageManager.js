/**
 * Storage Manager - Simple key-value storage wrapper
 */

class StorageManager {
  constructor(prefix = 'discord_qs_') {
    this.prefix = prefix;
  }

  /**
   * Get item from storage
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      if (typeof localStorage !== 'undefined') {
        const value = localStorage.getItem(fullKey);
        return value ? JSON.parse(value) : defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.error('[StorageManager] Get error:', error);
      return defaultValue;
    }
  }

  /**
   * Set item in storage
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  set(key, value) {
    try {
      const fullKey = this.prefix + key;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(fullKey, JSON.stringify(value));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[StorageManager] Set error:', error);
      return false;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key
   * @returns {boolean}
   */
  remove(key) {
    try {
      const fullKey = this.prefix + key;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(fullKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[StorageManager] Remove error:', error);
      return false;
    }
  }

  /**
   * Clear all items with prefix
   * @returns {boolean}
   */
  clear() {
    try {
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[StorageManager] Clear error:', error);
      return false;
    }
  }

  /**
   * Get last connected channels
   * @returns {Array}
   */
  getRecentChannels() {
    return this.get('recent_channels', []);
  }

  /**
   * Save recently connected channel
   * @param {Object} channel - Channel info
   */
  saveRecentChannel(channel) {
    const recent = this.getRecentChannels();
    const filtered = recent.filter(c => 
      !(c.guildId === channel.guildId && c.channelId === channel.channelId)
    );
    filtered.unshift(channel);
    
    // Keep only last 10
    if (filtered.length > 10) {
      filtered.pop();
    }
    
    this.set('recent_channels', filtered);
  }

  /**
   * Get user preferences
   * @returns {Object}
   */
  getPreferences() {
    return this.get('preferences', {
      pushToTalk: true,
      pttButton: 'L4', // L4 or R4
      autoReconnect: true,
    });
  }

  /**
   * Save user preferences
   * @param {Object} preferences
   */
  savePreferences(preferences) {
    this.set('preferences', preferences);
  }
}

export default StorageManager;
