import { ChannelType } from 'discord.js';
import { getClient } from '../client.js';

/**
 * Discord service for handling Discord API operations
 */
export const DiscordService = {
  /**
   * Gets all guilds the bot is a member of
   * @returns {Array} List of guild objects
   */
  getGuilds() {
    const client = getClient();
    if (!client || !client.isReady()) {
      return [];
    }

    return client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 128 }) || null,
      memberCount: guild.memberCount,
    }));
  },

  /**
   * Gets a specific guild by ID
   * @param {string} guildId - The guild ID
   * @returns {Object|null} Guild object or null if not found
   */
  getGuild(guildId) {
    const client = getClient();
    if (!client || !client.isReady()) {
      return null;
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return null;
    }

    return {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 128 }) || null,
      memberCount: guild.memberCount,
    };
  },

  /**
   * Gets all voice channels in a guild
   * @param {string} guildId - The guild ID
   * @returns {Array} List of voice channel objects
   */
  getVoiceChannels(guildId) {
    const client = getClient();
    if (!client || !client.isReady()) {
      return [];
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return [];
    }

    return guild.channels.cache
      .filter(channel => channel.type === ChannelType.GuildVoice)
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        position: channel.position,
        parentId: channel.parentId,
        parentName: channel.parent?.name || null,
        userLimit: channel.userLimit,
        memberCount: channel.members.size,
      }))
      .sort((a, b) => a.position - b.position);
  },

  /**
   * Gets members in a specific voice channel
   * @param {string} guildId - The guild ID
   * @param {string} channelId - The channel ID
   * @returns {Array} List of member objects
   */
  getVoiceChannelMembers(guildId, channelId) {
    const client = getClient();
    if (!client || !client.isReady()) {
      return [];
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return [];
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      return [];
    }

    return channel.members.map(member => ({
      id: member.id,
      username: member.user.username,
      nickname: member.nickname || member.user.username,
      avatar: member.user.avatarURL({ size: 128 }) || member.user.defaultAvatarURL,
      muted: member.voice.mute || member.voice.selfMute,
      deafened: member.voice.deaf || member.voice.selfDeaf,
      speaking: false, // Would need to track speaking state separately
    }));
  },

  /**
   * Gets all members currently in voice channels for a guild
   * @param {string} guildId - The guild ID
   * @returns {Array} List of voice member objects with channel info
   */
  getGuildVoiceMembers(guildId) {
    const client = getClient();
    if (!client || !client.isReady()) {
      return [];
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return [];
    }

    const voiceMembers = [];
    
    guild.channels.cache
      .filter(channel => channel.type === ChannelType.GuildVoice)
      .forEach(channel => {
        channel.members.forEach(member => {
          voiceMembers.push({
            id: member.id,
            username: member.user.username,
            nickname: member.nickname || member.user.username,
            avatar: member.user.avatarURL({ size: 128 }) || member.user.defaultAvatarURL,
            muted: member.voice.mute || member.voice.selfMute,
            deafened: member.voice.deaf || member.voice.selfDeaf,
            channelId: channel.id,
            channelName: channel.name,
          });
        });
      });

    return voiceMembers;
  },

  /**
   * Gets the current bot user information
   * @returns {Object|null} User object or null if not ready
   */
  getCurrentUser() {
    const client = getClient();
    if (!client || !client.isReady()) {
      return null;
    }

    const user = client.user;
    return {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatarURL({ size: 128 }) || user.defaultAvatarURL,
      tag: user.tag,
    };
  },
};

export default DiscordService;
