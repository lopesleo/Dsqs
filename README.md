# Discord Quick Access for Steam Deck

A Discord integration and [DeckyLoader](https://github.com/SteamDeckHomebrew/PluginLoader) plugin that brings Discord voice functionality to Steam Deck's quick access menu.

<img src="screenshot1.png" width="50%">
<img src="screenshot2.png" width="50%">

## Features

- Connect to Discord servers via bot integration.
- See connected clients and join their voice channels.
- Browse and join available voice channels on the server.
- See client avatars and their current status.
- Mute/Unmute microphone and speakers.
- Push-to-Talk via shoulder buttons (L/R 4-5).
- Disconnect from current voice channel.
- Real-time updates via WebSocket.

## Architecture

This project uses a Node.js backend with discord.js to integrate with Discord's official API:

```
Discord API (via discord.js)
         ↓
Node.js Backend (HTTP/WebSocket server)
         ↓
DeckyLoader Frontend (Quick Access UI)
         ↓
Steam Deck Controls + Audio System
```

### Backend (Node.js)

The backend is built with:
- **discord.js v14+**: Official Discord API wrapper
- **Express**: HTTP server for REST API
- **WebSocket (ws)**: Real-time event streaming
- **@discordjs/voice**: Voice channel support

### Frontend (React)

The frontend is a DeckyLoader plugin built with:
- **React 16.x**: UI framework
- **decky-frontend-lib**: DeckyLoader component library

## Prerequisites

1. **Node.js 18+**: Required for the backend
2. **Discord Bot Token**: Create a bot at https://discord.com/developers/applications
3. **DeckyLoader**: Install on your Steam Deck

## Building

### Backend

```sh
# Navigate to backend directory
cd backend-node

# Install dependencies
npm install

# Configure your Discord bot token
cp .env.example .env
# Edit .env and add your DISCORD_TOKEN

# Start the backend
npm start
```

### Frontend

The following tools are required to build the DeckyLoader plugin:
1. [Node.js](https://nodejs.org): JavaScript runtime required for building
1. [pnpm](https://pnpm.io): Package manager for JavaScript/Node.js

After all required tools are installed run the following commands to build the frontend:

```sh
pnpm install
pnpm run build
pnpm run build:zip
```

This should create a `plugin.zip` file containing the frontend part of the plugin.

## Installing

Follow these steps to install and setup the plugin on your Steam Deck:

1. Install DeckyLoader on your Steam Deck as described [here](https://github.com/SteamDeckHomebrew/PluginLoader).
2. Create a Discord bot at https://discord.com/developers/applications
3. Enable the following Gateway Intents for your bot:
   - Server Members Intent
   - Presence Intent (optional)
4. Invite your bot to your Discord servers with the following permissions:
   - Connect
   - Speak
   - View Channels
5. Copy the bot token and configure it in the backend's `.env` file.
6. Start the Node.js backend on your Steam Deck.
7. Install the DeckyLoader plugin:
   - Go to DeckyLoader settings and enable developer mode.
   - Open the DeckyLoader developer menu and select "Install Plugin from ZIP File".

## Configuration

### Environment Variables

Create a `.env` file in the `backend-node` directory with:

```env
# Discord bot token (required)
DISCORD_TOKEN=your_discord_bot_token_here

# Server configuration (optional)
PORT=52259
HOST=127.0.0.1
```

### Discord Bot Permissions

Your bot needs the following permissions:
- **View Channels**: To see available voice channels
- **Connect**: To join voice channels
- **Speak**: To transmit audio

### Gateway Intents

Enable these intents in the Discord Developer Portal:
- **Server Members Intent**: To see members in voice channels
- **Presence Intent** (optional): For rich presence information

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/guilds` | GET | List all guilds |
| `/api/guilds/:id` | GET | Get guild details |
| `/api/guilds/:id/channels` | GET | List voice channels |
| `/api/guilds/:id/voice-members` | GET | List members in voice |
| `/api/voice/status` | GET | Get voice connection status |
| `/api/voice/connect` | POST | Connect to voice channel |
| `/api/voice/disconnect` | POST | Disconnect from voice |
| `/api/voice/mute` | POST | Set mute state |
| `/api/voice/deafen` | POST | Set deafen state |
| `/api/user` | GET | Get bot user info |
| `/ws` | WS | WebSocket for real-time events |

## WebSocket Events

Connect to `/ws` for real-time Discord events:

- `connected`: Connection established
- `user_connected`: User joined voice channel
- `user_disconnected`: User left voice channel
- `voice_state_update`: User voice state changed
- `guild_updated`: Guild information changed
- `channel_created`: Voice channel created
- `channel_deleted`: Voice channel deleted

## Security Considerations

- **Bot Token**: Never expose your bot token. Store it in environment variables.
- **No Custom Client**: This project uses the official Discord API, not a custom client.
- **Rate Limiting**: The backend implements rate limiting to respect Discord's API limits.
- **Local Only**: By default, the API only listens on localhost (127.0.0.1).

## License

See [LICENSE.txt](LICENSE.txt) for details.
