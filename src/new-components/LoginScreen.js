/**
 * LoginScreen Component - Discord token authentication
 */

import { createElement as $, useState } from 'react';
import { 
  PanelSection, 
  PanelSectionRow, 
  TextField, 
  DialogButton,
  Field,
} from 'decky-frontend-lib';

export function LoginScreen({ onLogin, error, isLoading }) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleLogin = () => {
    if (token.trim()) {
      onLogin(token.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && token.trim()) {
      handleLogin();
    }
  };

  return $(PanelSection, { title: 'Discord Login' },
    $(PanelSectionRow, {},
      $('div', { style: { marginBottom: '16px', fontSize: '14px', color: '#dcdedf' } },
        'To use Discord Quick Access, you need to provide your Discord user token.',
      )
    ),
    $(PanelSectionRow, {},
      $('div', { style: { marginBottom: '12px', fontSize: '12px', color: '#b9bbbe' } },
        'To get your token:',
        $('ol', { style: { margin: '8px 0', paddingLeft: '20px' } },
          $('li', {}, 'Open Discord in a browser'),
          $('li', {}, 'Press F12 to open Developer Tools'),
          $('li', {}, 'Go to Console tab'),
          $('li', {}, 'Type: (webpackChunkdiscord_app.push([[\'\'],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()'),
          $('li', {}, 'Copy the token (without quotes)'),
        )
      )
    ),
    $(PanelSectionRow, {},
      $(TextField, {
        label: 'Discord Token',
        value: token,
        onChange: (e) => setToken(e.target.value),
        onKeyDown: handleKeyPress,
        type: showToken ? 'text' : 'password',
        disabled: isLoading,
      })
    ),
    $(PanelSectionRow, {},
      $(Field, {
        label: '',
      },
        $(DialogButton, {
          onClick: () => setShowToken(!showToken),
          style: { minWidth: 'auto', padding: '8px 16px', marginRight: '8px' }
        },
          showToken ? 'Hide Token' : 'Show Token'
        ),
        $(DialogButton, {
          onClick: handleLogin,
          disabled: !token.trim() || isLoading,
        },
          isLoading ? 'Logging in...' : 'Login'
        )
      )
    ),
    error && $(PanelSectionRow, {},
      $('div', { style: { color: '#f04747', fontSize: '13px', marginTop: '8px' } },
        '⚠️ ', error
      )
    ),
    $(PanelSectionRow, {},
      $('div', { style: { marginTop: '16px', padding: '12px', backgroundColor: '#f0431433', borderRadius: '4px', fontSize: '12px', color: '#faa81a' } },
        '⚠️ Warning: Using user tokens violates Discord Terms of Service. Use at your own risk and only for personal use.'
      )
    )
  );
}
