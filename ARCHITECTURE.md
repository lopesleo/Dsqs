# Discord Quick Access - New Architecture

## Overview

This is the new discord.js-based architecture for Discord Quick Access plugin. The plugin consists of:

1. **React Frontend** - UI components running in Decky Loader
2. **Node.js Backend** - Express server running discord.js client
3. **Python Manager** - Decky plugin that manages both Discord app and Node.js backend

## Architecture

```
┌─────────────────────────────────────┐
│  Steam Deck (Decky Loader)          │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  React Frontend               │  │
│  │  (src/new-components/)        │  │
│  │  - LoginScreen                │  │
│  │  - MainDashboard              │  │
│  │  - GuildList                  │  │
│  │  - ChannelList                │  │
│  │  - VoiceControls              │  │
│  └───────────┬───────────────────┘  │
│              │ HTTP (fetch)          │
│              ↓                       │
│  ┌───────────────────────────────┐  │
│  │  Node.js Backend              │  │
│  │  (backend-node/src/server.js) │  │
│  │  - Express HTTP API           │  │
│  │  - discord.js v14             │  │
│  │  - @discordjs/voice           │  │
│  │  Port: 52260                  │  │
│  └───────────┬───────────────────┘  │
│              │                       │
│  ┌───────────┴───────────────────┐  │
│  │  Python Plugin Manager        │  │
│  │  (main.py)                    │  │
│  │  - Start/stop Node backend    │  │
│  │  - Manage Discord app         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │  Discord API        │
    │  (Voice Gateway)    │
    └─────────────────────┘
```

## Components

### Frontend (`src/`)

**Entry Point**: `src/index-new.js`

**Services** (`src/services/`):
- `tokenManager.js` - Encrypts/decrypts Discord token using Web Crypto API
- `discordClient.js` - HTTP client for backend API
- `voiceManager.js` - Voice connection management via HTTP API
- `storageManager.js` - LocalStorage wrapper for preferences

**Hooks** (`src/hooks/`):
- `useAuthentication.js` - Login/logout state management
- `useDiscordClient.js` - Guilds and channels state
- `useVoiceConnection.js` - Voice connection state

**Components** (`src/new-components/`):
- `LoginScreen.js` - Token input and authentication
- `MainDashboard.js` - Main tabbed interface
- `GuildList.js` - Display Discord servers
- `ChannelList.js` - Display voice channels
- `VoiceControls.js` - Mute/deafen/disconnect controls
- `ConnectionStatus.js` - User status display
- `SettingsPanel.js` - Settings and logout

### Backend (`backend-node/`)

**Server**: `backend-node/src/server.js`

**API Endpoints**:
- `POST /api/auth/login` - Login with Discord token
- `POST /api/auth/logout` - Logout and destroy client
- `GET /api/guilds` - List user's guilds
- `GET /api/guilds/:guildId/channels` - List voice channels
- `POST /api/voice/join` - Join voice channel
- `POST /api/voice/leave` - Leave voice channel
- `GET /api/voice/status` - Get voice connection status
- `GET /api/status` - Get overall status

**Dependencies**:
- `discord.js@^14.25.1` - Discord client library
- `@discordjs/voice@^0.19.0` - Voice connection support
- `@discordjs/opus@^0.10.0` - Opus audio codec
- `express@^4.18.2` - HTTP server
- `ws@^8.14.2` - WebSocket support

### Python Manager (`main.py`)

**NodeBackend Class**:
- Manages Node.js backend process lifecycle
- Auto-installs npm dependencies on first run
- Logs backend output to `discord-backend.log`
- Graceful shutdown on plugin unload

## Security

⚠️ **WARNING**: Using Discord user tokens violates Discord Terms of Service. This plugin is for educational and personal use only.

**Token Security**:
- Frontend: Tokens encrypted using Web Crypto API (AES-GCM)
- Storage: Encrypted tokens stored in browser localStorage
- Backend: Tokens passed via HTTP POST (localhost only)
- Never exposed in logs or console

**Recommendations**:
- Use only on personal Steam Deck
- Do not share your token
- Be aware of account ban risk
- Consider using a secondary Discord account

## Building

### Frontend

```bash
pnpm install
pnpm run build
```

This creates `dist/index.js`

### Backend

The Node.js backend dependencies are installed automatically by the Python plugin manager on first run. To manually install:

```bash
cd backend-node
npm install
```

### Full Plugin

To create a distributable plugin:

```bash
pnpm run build
pnpm run build:zip
```

This creates `plugin.zip` containing both frontend and backend.

## Installation

1. Install DeckyLoader on Steam Deck
2. Install Node.js (if not already installed):
   ```bash
   sudo pacman -S nodejs npm
   ```
3. Install the plugin via DeckyLoader developer menu (Load Plugin from ZIP)
4. The plugin will automatically:
   - Extract backend files
   - Install Node.js dependencies (first time only)
   - Start the Node.js backend server
   - Display login screen

## Usage

### First Time Setup

1. Open Quick Access Menu (L4 + A or Steam button)
2. Navigate to Discord Quick Access plugin
3. Get your Discord token:
   - Open Discord in browser
   - Press F12 → Console
   - Paste token retrieval command (shown in UI)
   - Copy token
4. Paste token in plugin
5. Click Login

### Daily Use

1. Open plugin from Quick Access Menu
2. Select a server from the list
3. Select a voice channel
4. Click to join
5. Use voice controls:
   - Mute/unmute microphone
   - Deafen/undeafen speakers
   - Disconnect from channel

### Logout

1. Go to Settings tab
2. Click Logout
3. Token will be securely deleted

## Troubleshooting

### Backend Not Starting

Check logs:
```bash
cat ~/homebrew/logs/discord-backend.log
```

Verify Node.js is installed:
```bash
node --version
```

### Cannot Connect to Discord

- Check if Discord token is valid
- Verify network connection
- Check backend is running (see logs)
- Try logging out and back in

### Voice Not Working

- Voice features require PulseAudio
- Check audio settings in Steam Deck
- Verify Discord has audio permissions

## Development

### Running Backend Standalone

```bash
cd backend-node
npm start
```

Backend runs on http://127.0.0.1:52260

### Testing Frontend

The frontend communicates with backend via HTTP. Make sure backend is running first.

### Hot Reload

Use DeckyLoader developer mode to reload the frontend without restarting:

```bash
pnpm run plugin:reload
```

## Known Limitations

1. **No Push-to-Talk** - PTT via Steam Deck buttons not yet implemented
2. **Basic Voice Controls** - Mute/deafen state not fully synced with Discord
3. **No Audio Mixing** - Cannot control individual user volumes
4. **No Text Channels** - Only voice channels supported
5. **Single Instance** - Only one Discord connection at a time

## Future Enhancements

- [ ] Implement Push-to-Talk via Steam Input API
- [ ] Add per-user volume controls
- [ ] Show who is speaking indicators
- [ ] Support for screen sharing
- [ ] Recent channels quick access
- [ ] Audio quality settings
- [ ] Reconnection on network loss

## Legal

This plugin is provided as-is with no warranty. Using Discord user tokens violates Discord's Terms of Service and may result in account suspension or ban. Use at your own risk and for personal use only.

## Credits

- Inspired by [ts3-qs4sd](https://github.com/ILadis/ts3-qs4sd) - TeamSpeak 3 Quick Access plugin
- Built with [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader)
- Powered by [discord.js](https://discord.js.org/)
