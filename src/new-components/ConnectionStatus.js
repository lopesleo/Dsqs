/**
 * ConnectionStatus Component - Display connection status
 */

import { createElement as $ } from 'react';
import { PanelSection, PanelSectionRow } from 'decky-frontend-lib';

export function ConnectionStatus({ user, currentChannel }) {
  return $(PanelSection, {},
    $(PanelSectionRow, {},
      $('div', { 
        style: { 
          display: 'flex', 
          alignItems: 'center', 
          padding: '8px',
          backgroundColor: '#2f3136',
          borderRadius: '4px'
        } 
      },
        user?.avatar && $('img', {
          src: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`,
          style: { 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            marginRight: '12px' 
          },
          alt: user.username,
        }),
        $('div', { style: { flex: 1 } },
          $('div', { style: { fontWeight: 'bold', fontSize: '13px' } },
            user?.username || 'Unknown User'
          ),
          currentChannel && $('div', { 
            style: { 
              fontSize: '11px', 
              color: '#3ba55c',
              marginTop: '2px'
            } 
          },
            `🔊 ${currentChannel.name}`
          ),
          !currentChannel && $('div', { 
            style: { 
              fontSize: '11px', 
              color: '#72767d',
              marginTop: '2px'
            } 
          },
            'Not in voice'
          )
        ),
        $('div', { 
          style: { 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%',
            backgroundColor: '#3ba55c'
          } 
        })
      )
    )
  );
}
