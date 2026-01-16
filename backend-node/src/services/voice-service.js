import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';
import { getClient } from '../client.js';

// Track current voice connection state
let currentConnection = null;
let currentGuildId = null;
let currentChannelId = null;
let currentMuteState = false;
let currentDeafState = false;

/**
 * Voice service for handling Discord voice operations
 */
export const VoiceService = {
  /**
   * Connects to a voice channel
   * @param {string} guildId - The guild ID
   * @param {string} channelId - The voice channel ID
   * @returns {Promise<Object>} Connection result
   */
  async connect(guildId, channelId) {
    const client = getClient();
    if (!client || !client.isReady()) {
      throw new Error('Discord client is not ready');
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error(`Guild ${guildId} not found`);
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    // Disconnect from existing connection if any
    if (currentConnection) {
      currentConnection.destroy();
    }

    // Create new voice connection
    currentConnection = joinVoiceChannel({
      channelId: channelId,
      guildId: guildId,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    currentGuildId = guildId;
    currentChannelId = channelId;

    // Wait for connection to be ready
    try {
      await entersState(currentConnection, VoiceConnectionStatus.Ready, 30_000);
      return {
        success: true,
        guildId,
        channelId,
        channelName: channel.name,
      };
    } catch (error) {
      currentConnection.destroy();
      currentConnection = null;
      currentGuildId = null;
      currentChannelId = null;
      throw new Error('Failed to connect to voice channel: ' + error.message);
    }
  },

  /**
   * Disconnects from the current voice channel
   * @returns {Object} Disconnection result
   */
  disconnect() {
    if (currentConnection) {
      currentConnection.destroy();
      currentConnection = null;
      currentGuildId = null;
      currentChannelId = null;
      return { success: true };
    }
    return { success: false, reason: 'Not connected to any voice channel' };
  },

  /**
   * Gets the current voice connection status
   * @returns {Object} Connection status
   */
  getStatus() {
    if (!currentConnection) {
      return {
        connected: false,
        guildId: null,
        channelId: null,
      };
    }

    const client = getClient();
    let channelName = null;
    
    if (client && currentGuildId && currentChannelId) {
      const guild = client.guilds.cache.get(currentGuildId);
      if (guild) {
        const channel = guild.channels.cache.get(currentChannelId);
        if (channel) {
          channelName = channel.name;
        }
      }
    }

    return {
      connected: currentConnection.state.status === VoiceConnectionStatus.Ready,
      guildId: currentGuildId,
      channelId: currentChannelId,
      channelName,
      status: currentConnection.state.status,
    };
  },

  /**
   * Helper function to rejoin voice channel with updated audio state.
   * Discord.js voice connections require rejoining to change mute/deafen state.
   * @param {boolean} selfMute - Mute state
   * @param {boolean} selfDeaf - Deafen state
   * @returns {Object} Result with success status
   * @private
   */
  _rejoinWithState(selfMute, selfDeaf) {
    const client = getClient();
    if (!client || !currentGuildId || !currentChannelId) {
      return { success: false, reason: 'Invalid connection state' };
    }

    const guild = client.guilds.cache.get(currentGuildId);
    if (!guild) {
      return { success: false, reason: 'Guild not found' };
    }

    // Destroy and recreate connection with new state
    // Note: This is the recommended approach for discord.js voice connections
    // as they don't expose setSelfMute/setSelfDeaf methods directly
    currentConnection.destroy();
    currentConnection = joinVoiceChannel({
      channelId: currentChannelId,
      guildId: currentGuildId,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: selfDeaf,
      selfMute: selfMute,
    });

    // Update tracked state
    currentMuteState = selfMute;
    currentDeafState = selfDeaf;

    return { success: true };
  },

  /**
   * Sets the mute state for the bot's voice connection
   * @param {boolean} muted - Whether to mute
   * @returns {Object} Result
   */
  setMute(muted) {
    if (!currentConnection) {
      return { success: false, reason: 'Not connected to any voice channel' };
    }

    try {
      const result = this._rejoinWithState(muted, currentDeafState);
      if (result.success) {
        return { success: true, muted };
      }
      return result;
    } catch (error) {
      return { success: false, reason: error.message };
    }
  },

  /**
   * Sets the deafen state for the bot's voice connection
   * @param {boolean} deafened - Whether to deafen
   * @returns {Object} Result
   */
  setDeafen(deafened) {
    if (!currentConnection) {
      return { success: false, reason: 'Not connected to any voice channel' };
    }

    try {
      const result = this._rejoinWithState(currentMuteState, deafened);
      if (result.success) {
        return { success: true, deafened };
      }
      return result;
    } catch (error) {
      return { success: false, reason: error.message };
    }
  },
};

export default VoiceService;
