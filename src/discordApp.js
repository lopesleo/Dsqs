/**
 * DiscordApp - Main application component using new discord.js architecture
 */

import { createElement as $, useState, useEffect } from 'react';
import { useAuthentication } from './hooks/useAuthentication.js';
import { useDiscordClient } from './hooks/useDiscordClient.js';
import { useVoiceConnection } from './hooks/useVoiceConnection.js';
import { LoginScreen } from './new-components/LoginScreen.js';
import { MainDashboard } from './new-components/MainDashboard.js';

export function DiscordApp() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    user,
    login,
    logout,
    discordClient,
  } = useAuthentication();

  const {
    guilds,
    selectedGuild,
    channels,
    isReady,
    selectGuild,
    getChannelMembers,
  } = useDiscordClient(discordClient);

  const {
    isConnected: isVoiceConnected,
    currentChannel,
    isMuted,
    isDeafened,
    error: voiceError,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
  } = useVoiceConnection(discordClient);

  // Handle channel join
  const handleJoinChannel = async (channel) => {
    if (!selectedGuild) return;
    
    const success = await joinChannel(
      selectedGuild.id,
      channel.id,
      channel.name
    );

    if (!success && voiceError) {
      console.error('Failed to join channel:', voiceError);
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return $(LoginScreen, {
      onLogin: login,
      error: authError,
      isLoading: authLoading,
    });
  }

  // Show loading state
  if (authLoading || !isReady) {
    return $('div', { 
      style: { 
        padding: '20px', 
        textAlign: 'center',
        color: '#dcdedf'
      } 
    },
      'Loading Discord...'
    );
  }

  // Show main dashboard
  return $(MainDashboard, {
    user,
    guilds,
    selectedGuild,
    channels,
    currentChannel,
    isVoiceConnected,
    isMuted,
    isDeafened,
    onSelectGuild: selectGuild,
    onJoinChannel: handleJoinChannel,
    onLeaveChannel: leaveChannel,
    onToggleMute: toggleMute,
    onToggleDeafen: toggleDeafen,
    onLogout: logout,
  });
}
