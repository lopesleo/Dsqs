/**
 * Discord Quick Access Plugin Entry Point (New Architecture)
 * Using discord.js monolithic architecture
 */

import { createElement as $ } from 'react';
import { definePlugin } from 'decky-frontend-lib';
import { DiscordApp } from './discordApp.js';
import { DiscordLogoIcon } from './components.js';

export default definePlugin(serverAPI => {
  console.log('[Discord QA] Plugin loaded with discord.js architecture');

  return {
    content: $(DiscordApp, { serverAPI }),
    icon: $(DiscordLogoIcon),
    onDismount() {
      console.log('[Discord QA] Plugin dismounting');
    },
  };
});
