/**
 * Voice Manager - Manages Discord voice connections via HTTP API
 */

class VoiceManager {
  constructor(discordClient) {
    this.discordClient = discordClient;
    this.connection = null;
    this.currentChannel = null;
    this.isMuted = false;
    this.isDeafened = false;
    this.statusPollInterval = null;
  }

  /**
   * Join a voice channel
   * @param {string} guildId - Guild ID
   * @param {string} channelId - Channel ID
   * @returns {Promise<boolean>} Success status
   */
  async joinChannel(guildId, channelId) {
    try {
      const result = await this.discordClient.request('/voice/join', {
        method: 'POST',
        body: JSON.stringify({ guildId, channelId }),
      });

      this.connection = true;
      this.currentChannel = result.channel;
      
      // Start status polling
      this.startStatusPolling();

      console.log('[VoiceManager] Joined channel:', result.channel.name);
      return true;
    } catch (error) {
      console.error('[VoiceManager] Failed to join channel:', error);
      throw error;
    }
  }

  /**
   * Disconnect from current voice channel
   */
  async disconnect() {
    try {
      await this.discordClient.request('/voice/leave', {
        method: 'POST',
      });

      this.connection = null;
      this.currentChannel = null;
      this.stopStatusPolling();
      
      console.log('[VoiceManager] Disconnected from voice channel');
    } catch (error) {
      console.error('[VoiceManager] Error disconnecting:', error);
    }
  }

  /**
   * Toggle mute state
   * @param {boolean} muted - Mute state
   */
  setMute(muted) {
    this.isMuted = muted;
    // Note: Discord API calls for mute would go here
    console.log('[VoiceManager] Mute state changed:', muted);
  }

  /**
   * Toggle deafen state
   * @param {boolean} deafened - Deafen state
   */
  setDeafen(deafened) {
    this.isDeafened = deafened;
    // Note: Discord API calls for deafen would go here
    console.log('[VoiceManager] Deafen state changed:', deafened);
  }

  /**
   * Start polling voice status
   */
  startStatusPolling() {
    if (this.statusPollInterval) return;

    this.statusPollInterval = setInterval(async () => {
      try {
        const result = await this.discordClient.request('/voice/status');
        
        if (!result.connected && this.connection) {
          // Lost connection
          this.connection = null;
          this.currentChannel = null;
        } else if (result.connected) {
          this.connection = true;
          this.currentChannel = result.channel;
        }
      } catch (error) {
        console.error('[VoiceManager] Status poll error:', error);
      }
    }, 3000); // Poll every 3 seconds
  }

  /**
   * Stop status polling
   */
  stopStatusPolling() {
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
      this.statusPollInterval = null;
    }
  }

  /**
   * Get current connection status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      connected: this.connection !== null,
      channel: this.currentChannel,
      muted: this.isMuted,
      deafened: this.isDeafened,
    };
  }

  /**
   * Check if currently in a voice channel
   * @returns {boolean}
   */
  isConnected() {
    return this.connection !== null;
  }

  /**
   * Get current channel info
   * @returns {Object|null}
   */
  getCurrentChannel() {
    return this.currentChannel;
  }
}

export default VoiceManager;
