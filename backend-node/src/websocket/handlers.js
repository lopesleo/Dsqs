import { Events } from 'discord.js';
import WebSocket from 'ws';
import { getClient } from '../client.js';

// Store active WebSocket connections
const connections = new Set();

/**
 * Sets up WebSocket handlers for real-time Discord events
 * @param {WebSocket.Server} wss - The WebSocket server instance
 */
export function setupWebSocketHandlers(wss) {
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    connections.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      connections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connections.delete(ws);
    });

    // Send initial connection acknowledgment
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: Date.now(),
    }));
  });

  // Setup Discord event listeners
  setupDiscordEventListeners();
}

/**
 * Sets up Discord event listeners to broadcast to WebSocket clients
 */
function setupDiscordEventListeners() {
  const client = getClient();
  if (!client) return;

  // Voice state updates
  client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const eventData = {
      type: 'voice_state_update',
      timestamp: Date.now(),
      data: {
        userId: newState.member?.id,
        username: newState.member?.user.username,
        nickname: newState.member?.nickname || newState.member?.user.username,
        guildId: newState.guild.id,
        guildName: newState.guild.name,
        oldChannelId: oldState.channelId,
        newChannelId: newState.channelId,
        muted: newState.mute || newState.selfMute,
        deafened: newState.deaf || newState.selfDeaf,
      },
    };

    // Determine specific event type
    if (!oldState.channelId && newState.channelId) {
      eventData.type = 'user_connected';
    } else if (oldState.channelId && !newState.channelId) {
      eventData.type = 'user_disconnected';
    }

    broadcast(eventData);
  });

  // Guild updates
  client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
    broadcast({
      type: 'guild_updated',
      timestamp: Date.now(),
      data: {
        guildId: newGuild.id,
        name: newGuild.name,
        icon: newGuild.iconURL({ size: 128 }),
      },
    });
  });

  // Channel create
  client.on(Events.ChannelCreate, (channel) => {
    if (channel.isVoiceBased()) {
      broadcast({
        type: 'channel_created',
        timestamp: Date.now(),
        data: {
          channelId: channel.id,
          channelName: channel.name,
          guildId: channel.guildId,
          type: channel.type,
        },
      });
    }
  });

  // Channel delete
  client.on(Events.ChannelDelete, (channel) => {
    if (channel.isVoiceBased()) {
      broadcast({
        type: 'channel_deleted',
        timestamp: Date.now(),
        data: {
          channelId: channel.id,
          channelName: channel.name,
          guildId: channel.guildId,
        },
      });
    }
  });

  // Guild member add
  client.on(Events.GuildMemberAdd, (member) => {
    broadcast({
      type: 'member_joined',
      timestamp: Date.now(),
      data: {
        userId: member.id,
        username: member.user.username,
        guildId: member.guild.id,
      },
    });
  });

  // Guild member remove
  client.on(Events.GuildMemberRemove, (member) => {
    broadcast({
      type: 'member_left',
      timestamp: Date.now(),
      data: {
        userId: member.id,
        username: member.user.username,
        guildId: member.guild.id,
      },
    });
  });
}

/**
 * Broadcasts a message to all connected WebSocket clients
 * @param {Object} data - The data to broadcast
 */
function broadcast(data) {
  const message = JSON.stringify(data);
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Sends a custom event to all connected clients
 * @param {string} type - Event type
 * @param {Object} data - Event data
 */
export function sendEvent(type, data) {
  broadcast({
    type,
    timestamp: Date.now(),
    data,
  });
}

export default {
  setupWebSocketHandlers,
  sendEvent,
};
