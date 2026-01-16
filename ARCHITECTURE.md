# Architecture

This document describes the architecture of the Discord Quick Access for Steam Deck project.

## Overview

The project consists of three main components:

1. **Node.js Backend** - A discord.js-based server that connects to Discord's API
2. **React Frontend** - A DeckyLoader plugin for Steam Deck's Quick Access menu
3. **Python Plugin Manager** - Manages the lifecycle of the backend service

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Steam Deck                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    DeckyLoader                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐│ │
│  │  │               React Frontend Plugin                         ││ │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐               ││ │
│  │  │  │  Guild    │  │  Voice    │  │  Settings │               ││ │
│  │  │  │  Selector │  │  Controls │  │   Panel   │               ││ │
│  │  │  └───────────┘  └───────────┘  └───────────┘               ││ │
│  │  └─────────────────────────┬───────────────────────────────────┘│ │
│  │                            │ HTTP/WebSocket                      │ │
│  │  ┌─────────────────────────▼───────────────────────────────────┐│ │
│  │  │               Node.js Backend                                ││ │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐               ││ │
│  │  │  │  Express  │  │  discord  │  │  WebSocket│               ││ │
│  │  │  │  Routes   │  │  .js      │  │  Events   │               ││ │
│  │  │  └───────────┘  └───────────┘  └───────────┘               ││ │
│  │  └─────────────────────────┬───────────────────────────────────┘│ │
│  └────────────────────────────│────────────────────────────────────┘ │
│                               │ Discord API                          │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    Discord Gateway    │
                    │    & REST API         │
                    └───────────────────────┘
```

## Component Details

### 1. Node.js Backend (`backend-node/`)

The backend is responsible for:
- Maintaining a connection to Discord via discord.js
- Exposing a REST API for the frontend
- Broadcasting real-time events via WebSocket
- Managing voice channel connections

#### Directory Structure

```
backend-node/
├── src/
│   ├── index.js          # Entry point, Express app setup
│   ├── client.js         # Discord.js client initialization
│   ├── config.js         # Configuration management
│   ├── routes/
│   │   ├── guilds.js     # Guild/channel endpoints
│   │   ├── voice.js      # Voice control endpoints
│   │   └── user.js       # User info endpoints
│   ├── services/
│   │   ├── discord-service.js  # Discord API abstraction
│   │   ├── voice-service.js    # Voice connection management
│   │   └── auth-service.js     # Authentication helpers
│   ├── websocket/
│   │   └── handlers.js   # WebSocket event broadcasting
│   └── api/
│       └── openapi.yaml  # API specification
├── package.json
└── .env.example
```

#### Key Technologies

- **discord.js v14+**: Official Discord API wrapper
- **Express**: HTTP server framework
- **ws**: WebSocket implementation
- **@discordjs/voice**: Voice channel support

### 2. React Frontend (`src/`)

The frontend is a DeckyLoader plugin that provides the UI for:
- Selecting and browsing Discord servers (guilds)
- Viewing and joining voice channels
- Controlling mute/deafen state
- Push-to-Talk configuration

#### Directory Structure

```
src/
├── index.js          # Plugin entry point
├── app.js            # Main application logic
├── client.js         # Backend API client
├── components.js     # UI components
├── icons.js          # SVG icons
├── styles.js         # CSS styles
└── utils.js          # Utility functions
```

#### Key Technologies

- **React 16.x**: UI framework
- **decky-frontend-lib**: DeckyLoader component library
- **WebSocket API**: For real-time updates

### 3. Python Plugin Manager (`main.py`)

Manages the lifecycle of the Node.js backend:
- Starting/stopping the backend process
- Checking installation status
- Handling DeckyLoader lifecycle events

#### Variants

- **NodeDiscord**: Primary variant using Node.js backend
- **NativeDiscord**: Alternative using native Discord client

## Data Flow

### Guild Selection Flow

```
User clicks guild → Frontend sends connect request
                  → Client stores guildId
                  → Frontend fetches voice channels
                  → Frontend fetches voice members
                  → UI updates to show dashboard
```

### Voice Connection Flow

```
User clicks channel → Frontend sends join request
                    → Backend calls VoiceService.connect()
                    → discord.js joins voice channel
                    → Backend broadcasts voice_state_update
                    → Frontend updates UI
```

### Real-time Events Flow

```
Discord Gateway Event → discord.js event handler
                      → WebSocket broadcast
                      → Frontend receives event
                      → State update triggers re-render
```

## API Design

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/guilds` | GET | List all guilds |
| `/api/guilds/:id` | GET | Get guild details |
| `/api/guilds/:id/channels` | GET | List voice channels |
| `/api/guilds/:id/voice-members` | GET | List voice members |
| `/api/voice/status` | GET | Get connection status |
| `/api/voice/connect` | POST | Join voice channel |
| `/api/voice/disconnect` | POST | Leave voice channel |
| `/api/voice/mute` | POST | Toggle mute |
| `/api/voice/deafen` | POST | Toggle deafen |
| `/api/user` | GET | Get bot user info |
| `/api/user/status` | GET | Get auth status |

### WebSocket Events

| Event | Description |
|-------|-------------|
| `connected` | Initial connection acknowledgment |
| `user_connected` | User joined voice channel |
| `user_disconnected` | User left voice channel |
| `voice_state_update` | Voice state changed |
| `guild_updated` | Guild info changed |
| `channel_created` | Voice channel created |
| `channel_deleted` | Voice channel deleted |

## Security Considerations

### Token Security

- Bot token stored in environment variable
- Token never exposed to frontend
- Backend validates all requests

### API Security

- Only listens on localhost by default
- No authentication required (local-only access)
- Rate limiting implemented for Discord API calls

### Discord API Compliance

- Uses official Discord API only
- Respects rate limits
- No custom client implementation
- Only bot accounts, never user tokens

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Discord bot token |
| `PORT` | No | Server port (default: 52259) |
| `HOST` | No | Server host (default: 127.0.0.1) |

### Discord Bot Setup

1. Create application at Discord Developer Portal
2. Enable bot and get token
3. Enable required Gateway Intents:
   - Server Members Intent
   - Presence Intent (optional)
4. Invite bot to servers with permissions:
   - View Channels
   - Connect
   - Speak
