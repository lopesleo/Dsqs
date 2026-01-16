/**
 * SettingsPanel Component - User settings and logout
 */

import { createElement as $ } from 'react';
import { 
  PanelSection, 
  PanelSectionRow,
  DialogButton,
  Field,
} from 'decky-frontend-lib';

export function SettingsPanel({ onLogout }) {
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout? Your token will be deleted.')) {
      onLogout();
    }
  };

  return $(PanelSection, { title: 'Settings' },
    $(PanelSectionRow, {},
      $(Field, { label: 'Account' },
        $(DialogButton, {
          onClick: handleLogout,
          style: { backgroundColor: '#f04747' }
        },
          'Logout'
        )
      )
    ),
    $(PanelSectionRow, {},
      $('div', { 
        style: { 
          fontSize: '11px', 
          color: '#72767d',
          marginTop: '8px'
        } 
      },
        'Push-to-Talk: Press L4 or R4 shoulder buttons'
      )
    ),
    $(PanelSectionRow, {},
      $('div', { 
        style: { 
          marginTop: '16px',
          padding: '8px',
          backgroundColor: '#4f545c22',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#b9bbbe'
        } 
      },
        'Discord Quick Access v1.0.0',
        $('br'),
        'Built with discord.js'
      )
    )
  );
}
