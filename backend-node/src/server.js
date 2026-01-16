/**
 * Discord Quick Access - Node.js Backend Server
 * Provides HTTP API for Discord.js client operations
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { Client, GatewayIntentBits } from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';

const app = express();
const PORT = process.env.PORT || 52260;

app.use(express.json());

// Rate limiting middleware - since this is localhost only, we can be more lenient
// but still protect against accidental abuse or bugs
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for status endpoint
  skip: (req) => req.path === '/api/status',
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Global state
let discordClient = null;
let voiceConnection = null;
let currentChannel = null;
let isAuthenticated = false;

/**
 * Initialize Discord client
 */
function initializeClient() {
  if (discordClient) return discordClient;

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
    ],
  });

  discordClient.on('ready', () => {
    console.log(`[Discord] Logged in as ${discordClient.user.tag}`);
    isAuthenticated = true;
  });

  discordClient.on('error', (error) => {
    console.error('[Discord] Error:', error);
  });

  discordClient.on('disconnect', () => {
    console.log('[Discord] Disconnected');
    isAuthenticated = false;
  });

  return discordClient;
}

// API Routes

/**
 * POST /api/auth/login
 * Login with Discord token
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    initializeClient();
    await discordClient.login(token);

    res.json({
      success: true,
      user: {
        id: discordClient.user.id,
        username: discordClient.user.username,
        discriminator: discordClient.user.discriminator,
        avatar: discordClient.user.avatar,
      },
    });
  } catch (error) {
    // Sanitize error to prevent token leakage in logs
    const sanitizedError = error.message ? 
      error.message.replace(/[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27}/g, '[TOKEN]') :
      'Login failed';
    console.error('[API] Login error:', sanitizedError);
    res.status(401).json({ error: 'Login failed', message: 'Invalid token or authentication failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout and destroy client
 */
app.post('/api/auth/logout', async (req, res) => {
  try {
    if (voiceConnection) {
      voiceConnection.destroy();
      voiceConnection = null;
    }

    if (discordClient) {
      await discordClient.destroy();
      discordClient = null;
    }

    isAuthenticated = false;

    res.json({ success: true });
  } catch (error) {
    console.error('[API] Logout error:', error);
    res.status(500).json({ error: 'Logout failed', message: error.message });
  }
});

/**
 * GET /api/guilds
 * Get list of guilds
 */
app.get('/api/guilds', (req, res) => {
  if (!discordClient || !isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const guilds = Array.from(discordClient.guilds.cache.values()).map(guild => ({
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
    memberCount: guild.memberCount,
  }));

  res.json({ guilds });
});

/**
 * GET /api/guilds/:guildId/channels
 * Get voice channels in a guild
 */
app.get('/api/guilds/:guildId/channels', (req, res) => {
  if (!discordClient || !isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { guildId } = req.params;
  const guild = discordClient.guilds.cache.get(guildId);

  if (!guild) {
    return res.status(404).json({ error: 'Guild not found' });
  }

  const channels = Array.from(guild.channels.cache.values())
    .filter(channel => channel.type === 2) // GUILD_VOICE
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      members: channel.members ? channel.members.size : 0,
    }));

  res.json({ channels });
});

/**
 * POST /api/voice/join
 * Join a voice channel
 */
app.post('/api/voice/join', async (req, res) => {
  try {
    if (!discordClient || !isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { guildId, channelId } = req.body;
    const guild = discordClient.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const channel = guild.channels.cache.get(channelId);

    if (!channel || channel.type !== 2) {
      return res.status(404).json({ error: 'Voice channel not found' });
    }

    // Disconnect from current channel if any
    if (voiceConnection) {
      voiceConnection.destroy();
    }

    voiceConnection = joinVoiceChannel({
      channelId: channelId,
      guildId: guildId,
      adapterCreator: guild.voiceAdapterCreator,
    });

    await entersState(voiceConnection, VoiceConnectionStatus.Ready, 30000);

    currentChannel = { guildId, channelId, name: channel.name };

    res.json({
      success: true,
      channel: currentChannel,
    });
  } catch (error) {
    console.error('[API] Join voice error:', error);
    res.status(500).json({ error: 'Failed to join voice', message: error.message });
  }
});

/**
 * POST /api/voice/leave
 * Leave current voice channel
 */
app.post('/api/voice/leave', (req, res) => {
  if (voiceConnection) {
    voiceConnection.destroy();
    voiceConnection = null;
    currentChannel = null;
  }

  res.json({ success: true });
});

/**
 * GET /api/voice/status
 * Get current voice connection status
 */
app.get('/api/voice/status', (req, res) => {
  res.json({
    connected: voiceConnection !== null,
    channel: currentChannel,
  });
});

/**
 * GET /api/status
 * Get overall status
 */
app.get('/api/status', (req, res) => {
  res.json({
    authenticated: isAuthenticated,
    connected: voiceConnection !== null,
    user: discordClient?.user ? {
      id: discordClient.user.id,
      username: discordClient.user.username,
      avatar: discordClient.user.avatar,
    } : null,
    channel: currentChannel,
  });
});

// Start server
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Server] Discord Quick Access backend running on http://127.0.0.1:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[Server] Port ${PORT} is already in use. Another instance may be running.`);
    process.exit(1);
  } else {
    console.error('[Server] Server error:', error);
    process.exit(1);
  }
});
