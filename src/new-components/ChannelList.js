/**
 * ChannelList Component - Display voice channels
 */

import { createElement as $ } from 'react';
import { 
  PanelSection, 
  PanelSectionRow,
  Field,
  Focusable,
} from 'decky-frontend-lib';

export function ChannelList({ channels, currentChannel, onJoinChannel }) {
  if (!channels || channels.length === 0) {
    return $(PanelSection, { title: 'Voice Channels' },
      $(PanelSectionRow, {},
        $('div', { style: { color: '#b9bbbe', fontSize: '13px' } },
          'No voice channels available. Select a server first.'
        )
      )
    );
  }

  const voiceChannels = channels.filter(ch => ch.type === 2);

  if (voiceChannels.length === 0) {
    return $(PanelSection, { title: 'Voice Channels' },
      $(PanelSectionRow, {},
        $('div', { style: { color: '#b9bbbe', fontSize: '13px' } },
          'No voice channels in this server'
        )
      )
    );
  }

  return $(PanelSection, { title: 'Voice Channels' },
    voiceChannels.map(channel => {
      const isCurrentChannel = currentChannel?.channelId === channel.id;
      const memberCount = channel.members?.size || 0;

      return $(PanelSectionRow, { key: channel.id },
        $(Field, {
          label: channel.name,
          onClick: () => onJoinChannel(channel),
          focusable: true,
        },
          $(Focusable, {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px',
              backgroundColor: isCurrentChannel ? '#3ba55c33' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer',
            },
            onClick: () => onJoinChannel(channel),
          },
            $('div', { style: { display: 'flex', alignItems: 'center' } },
              $('span', { style: { marginRight: '8px', fontSize: '16px' } }, '🔊'),
              $('div', {},
                $('div', { 
                  style: { 
                    fontWeight: isCurrentChannel ? 'bold' : 'normal',
                    color: isCurrentChannel ? '#3ba55c' : '#dcdedf'
                  } 
                },
                  channel.name
                ),
                memberCount > 0 && $('div', { style: { fontSize: '11px', color: '#72767d' } },
                  `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
                )
              )
            ),
            isCurrentChannel && $('span', { style: { color: '#3ba55c', fontSize: '12px' } }, 
              '● Connected'
            )
          )
        )
      );
    })
  );
}
