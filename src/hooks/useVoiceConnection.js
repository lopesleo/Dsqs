/**
 * useVoiceConnection hook - Manages voice channel connections
 */

import { useState, useEffect, useCallback } from 'react';
import VoiceManager from '../services/voiceManager.js';
import StorageManager from '../services/storageManager.js';

const storageManager = new StorageManager();

export function useVoiceConnection(discordClient) {
  const [voiceManager] = useState(() => 
    discordClient ? new VoiceManager(discordClient) : null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [error, setError] = useState(null);

  // Update state from voice manager
  useEffect(() => {
    if (!voiceManager) return;

    const updateStatus = () => {
      const status = voiceManager.getStatus();
      setIsConnected(status.connected);
      setCurrentChannel(status.channel);
      setIsMuted(status.muted);
      setIsDeafened(status.deafened);
    };

    // Poll status periodically
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, [voiceManager]);

  /**
   * Join a voice channel
   */
  const joinChannel = useCallback(async (guildId, channelId, channelName) => {
    if (!voiceManager) {
      setError('Voice manager not initialized');
      return false;
    }

    try {
      setError(null);
      await voiceManager.joinChannel(guildId, channelId);
      
      // Save to recent channels
      storageManager.saveRecentChannel({
        guildId,
        channelId,
        name: channelName,
        timestamp: Date.now(),
      });
      
      return true;
    } catch (err) {
      console.error('[useVoiceConnection] Join error:', err);
      setError(err.message);
      return false;
    }
  }, [voiceManager]);

  /**
   * Leave current voice channel
   */
  const leaveChannel = useCallback(() => {
    if (!voiceManager) return;
    
    voiceManager.disconnect();
    setIsConnected(false);
    setCurrentChannel(null);
  }, [voiceManager]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!voiceManager) return;
    
    const newMuted = !isMuted;
    voiceManager.setMute(newMuted);
    setIsMuted(newMuted);
  }, [voiceManager, isMuted]);

  /**
   * Toggle deafen
   */
  const toggleDeafen = useCallback(() => {
    if (!voiceManager) return;
    
    const newDeafened = !isDeafened;
    voiceManager.setDeafen(newDeafened);
    setIsDeafened(newDeafened);
  }, [voiceManager, isDeafened]);

  /**
   * Get recent channels
   */
  const getRecentChannels = useCallback(() => {
    return storageManager.getRecentChannels();
  }, []);

  return {
    isConnected,
    currentChannel,
    isMuted,
    isDeafened,
    error,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    getRecentChannels,
  };
}
