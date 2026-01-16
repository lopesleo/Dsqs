/**
 * MainDashboard Component - Main application view when authenticated
 */

import { createElement as $, useState } from 'react';
import { Tabs } from 'decky-frontend-lib';
import { ConnectionStatus } from './ConnectionStatus.js';
import { GuildList } from './GuildList.js';
import { ChannelList } from './ChannelList.js';
import { VoiceControls } from './VoiceControls.js';
import { SettingsPanel } from './SettingsPanel.js';

export function MainDashboard({ 
  user,
  guilds,
  selectedGuild,
  channels,
  currentChannel,
  isVoiceConnected,
  isMuted,
  isDeafened,
  onSelectGuild,
  onJoinChannel,
  onLeaveChannel,
  onToggleMute,
  onToggleDeafen,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('servers');

  const tabs = [
    {
      title: 'Servers',
      id: 'servers',
      content: $('div', {},
        $(ConnectionStatus, { user, currentChannel }),
        $(GuildList, { 
          guilds, 
          selectedGuild, 
          onSelectGuild 
        }),
        selectedGuild && $(ChannelList, {
          channels,
          currentChannel,
          onJoinChannel,
        }),
        $(VoiceControls, {
          isConnected: isVoiceConnected,
          isMuted,
          isDeafened,
          onToggleMute,
          onToggleDeafen,
          onDisconnect: onLeaveChannel,
        })
      ),
    },
    {
      title: 'Settings',
      id: 'settings',
      content: $(SettingsPanel, { onLogout }),
    },
  ];

  return $(Tabs, {
    activeTab: activeTab,
    onShowTab: (tabId) => setActiveTab(tabId),
    tabs: tabs,
  });
}
