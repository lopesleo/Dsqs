/**
 * VoiceControls Component - Mute/Deafen controls
 */

import { createElement as $ } from 'react';
import { 
  PanelSection, 
  PanelSectionRow,
  Field,
  Focusable,
} from 'decky-frontend-lib';

export function VoiceControls({ 
  isConnected, 
  isMuted, 
  isDeafened, 
  onToggleMute, 
  onToggleDeafen,
  onDisconnect 
}) {
  if (!isConnected) {
    return null;
  }

  return $(PanelSection, { title: 'Voice Controls' },
    $(PanelSectionRow, {},
      $(Field, { label: '' },
        $('div', { style: { display: 'flex', gap: '8px' } },
          // Mute button
          $(Focusable, {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: isMuted ? '#f0431433' : '#4f545c33',
              borderRadius: '4px',
              cursor: 'pointer',
            },
            onClick: onToggleMute,
          },
            $('div', { style: { fontSize: '24px', marginBottom: '4px' } },
              isMuted ? '🔇' : '🔊'
            ),
            $('div', { style: { fontSize: '11px', color: isMuted ? '#f04747' : '#dcdedf' } },
              isMuted ? 'Muted' : 'Unmuted'
            )
          ),
          // Deafen button
          $(Focusable, {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: isDeafened ? '#f0431433' : '#4f545c33',
              borderRadius: '4px',
              cursor: 'pointer',
            },
            onClick: onToggleDeafen,
          },
            $('div', { style: { fontSize: '24px', marginBottom: '4px' } },
              isDeafened ? '🔇' : '👂'
            ),
            $('div', { style: { fontSize: '11px', color: isDeafened ? '#f04747' : '#dcdedf' } },
              isDeafened ? 'Deafened' : 'Hearing'
            )
          ),
          // Disconnect button
          $(Focusable, {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: '#f0431433',
              borderRadius: '4px',
              cursor: 'pointer',
            },
            onClick: onDisconnect,
          },
            $('div', { style: { fontSize: '24px', marginBottom: '4px' } },
              '📞'
            ),
            $('div', { style: { fontSize: '11px', color: '#f04747' } },
              'Disconnect'
            )
          )
        )
      )
    )
  );
}
