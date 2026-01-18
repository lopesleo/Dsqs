/**
 * useDiscordClient hook - Manages Discord client state and guilds
 */

import { useState, useEffect, useCallback } from 'react';

export function useDiscordClient(discordClient) {
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [channels, setChannels] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load guilds when client is ready
  useEffect(() => {
    if (!discordClient) return;

    const handleReady = () => {
      setIsReady(true);
      refreshGuilds();
    };

    const handleGuildCreate = () => {
      refreshGuilds();
    };

    discordClient.on('ready', handleReady);
    discordClient.on('guildCreate', handleGuildCreate);

    // Check if already ready
    const status = discordClient.getStatus();
    if (status.ready) {
      setIsReady(true);
      refreshGuilds();
    }

    return () => {
      discordClient.off('ready', handleReady);
      discordClient.off('guildCreate', handleGuildCreate);
    };
  }, [discordClient]);

  // Load channels when guild is selected
  useEffect(() => {
    if (selectedGuild && discordClient) {
      loadChannels(selectedGuild.id);
    }
  }, [selectedGuild, discordClient]);

  /**
   * Refresh guilds list
   */
  const refreshGuilds = useCallback(async () => {
    if (!discordClient) return;
    
    try {
      setIsLoading(true);
      const guildList = await discordClient.getGuilds();
      setGuilds(guildList);
    } catch (error) {
      console.error('[useDiscordClient] Failed to refresh guilds:', error);
    } finally {
      setIsLoading(false);
    }
  }, [discordClient]);

  /**
   * Load voice channels for a guild
   */
  const loadChannels = useCallback(async (guildId) => {
    if (!discordClient) return;
    
    try {
      setIsLoading(true);
      const voiceChannels = await discordClient.getVoiceChannels(guildId);
      setChannels(voiceChannels);
    } catch (error) {
      console.error('[useDiscordClient] Failed to load channels:', error);
    } finally {
      setIsLoading(false);
    }
  }, [discordClient]);

  /**
   * Select a guild
   */
  const selectGuild = useCallback((guild) => {
    setSelectedGuild(guild);
  }, []);

  /**
   * Get members in a channel (stub for now)
   */
  const getChannelMembers = useCallback((channelId) => {
    // This would need to be implemented in the backend
    return [];
  }, [discordClient, selectedGuild]);

  return {
    guilds,
    selectedGuild,
    channels,
    isReady,
    isLoading,
    refreshGuilds,
    selectGuild,
    getChannelMembers,
  };
}
