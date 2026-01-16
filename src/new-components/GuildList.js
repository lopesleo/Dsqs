/**
 * GuildList Component - Display Discord servers
 */

import { createElement as $ } from 'react';
import { 
  PanelSection, 
  PanelSectionRow,
  Field,
  Focusable,
} from 'decky-frontend-lib';

export function GuildList({ guilds, selectedGuild, onSelectGuild }) {
  if (!guilds || guilds.length === 0) {
    return $(PanelSection, { title: 'Servers' },
      $(PanelSectionRow, {},
        $('div', { style: { color: '#b9bbbe', fontSize: '13px' } },
          'No servers found'
        )
      )
    );
  }

  return $(PanelSection, { title: 'Servers' },
    guilds.map(guild => 
      $(PanelSectionRow, { key: guild.id },
        $(Field, {
          label: guild.name,
          onClick: () => onSelectGuild(guild),
          focusable: true,
        },
          $(Focusable, {
            style: {
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: selectedGuild?.id === guild.id ? '#4752c433' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer',
            },
            onClick: () => onSelectGuild(guild),
          },
            guild.icon && $('img', {
              src: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=32`,
              style: { width: '32px', height: '32px', borderRadius: '50%', marginRight: '12px' },
              alt: guild.name,
            }),
            $('div', {},
              $('div', { style: { fontWeight: selectedGuild?.id === guild.id ? 'bold' : 'normal' } },
                guild.name
              ),
              $('div', { style: { fontSize: '11px', color: '#72767d' } },
                `${guild.memberCount || 0} members`
              )
            )
          )
        )
      )
    )
  );
}
