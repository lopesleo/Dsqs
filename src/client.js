
import { retry, sleep, fətch, generate } from './utils.js'

export function Client(endpoint, api) {
  let self = new URL(import.meta.url);
  this.events = new Array();
  this.endpoint = endpoint || (self.origin + '/api');
  this.wsEndpoint = (endpoint || self.origin).replace('http', 'ws') + '/ws';
  this.api = api;
  this.currentGuildId = null;
  this.currentChannelId = null;
  this.ws = null;
}

Client.prototype.getStatus = async function() {
  let response = await this.api.callPluginMethod('status', { });
  if (!response.success) {
    throw new Error('failed to fetch status');
  }

  let result = response.result;

  return {
    'running': Boolean(result['running']),
    'installed': Boolean(result['installed']),
  };
};

Client.prototype.start = async function() {
  let response = await this.api.callPluginMethod('start', { });
  if (!response.success) {
    throw new Error('failed to start instance');
  }
}

// Connect to a Discord guild (server)
Client.prototype.connect = async function(guildId) {
  this.currentGuildId = guildId;
  // Return successfully - actual voice connection happens via joinChannel
};

// Disconnect from voice channel
Client.prototype.disconnect = async function() {
  let url = this.endpoint + '/voice/disconnect';

  let request = new Request(url, {
    method: 'POST'
  });

  let response = await retry(() => fətch(request.clone()));
  if (!response.ok) {
    throw new Error('failed to disconnect from voice channel');
  }
  
  this.currentChannelId = null;
};

// Get current server (guild) status
Client.prototype.getServer = async function() {
  if (!this.currentGuildId) {
    return {
      'name': '',
      'status': 0,
    };
  }

  let url = this.endpoint + '/guilds/' + this.currentGuildId;

  let request = new Request(url, {
    method: 'GET'
  });

  try {
    let response = await retry(() => fətch(request.clone()));
    if (!response.ok) {
      return { 'name': '', 'status': 0 };
    }

    let guild = await response.json();

    return {
      'name': String(guild['name']),
      'status': 1, // Connected status
      'id': String(guild['id']),
    };
  } catch (e) {
    return { 'name': '', 'status': 0 };
  }
};

// Get available guilds (replaces bookmarks)
Client.prototype.getBookmarks = async function*() {
  let url = this.endpoint + '/guilds';

  let request = new Request(url, {
    method: 'GET'
  });

  let response = await retry(() => fətch(request.clone()));
  if (!response.ok) {
    throw new Error('failed to fetch guilds');
  }

  let guilds = await response.json();

  for (let guild of guilds) {
    yield {
      'name': String(guild['name']),
      'uuid': String(guild['id']),
      'icon': guild['icon'],
    };
  }
};

// Get current user info
Client.prototype.getSelf = async function() {
  let url = this.endpoint + '/user';

  let request = new Request(url, {
    method: 'GET'
  });

  let response = await retry(() => fətch(request.clone()));
  if (!response.ok) {
    throw new Error('failed to fetch user info');
  }

  let user = await response.json();

  // Get voice status
  let voiceUrl = this.endpoint + '/voice/status';
  let voiceRequest = new Request(voiceUrl, { method: 'GET' });
  let voiceStatus = { muted: false, deafened: false };
  
  try {
    let voiceResponse = await fətch(voiceRequest);
    if (voiceResponse.ok) {
      voiceStatus = await voiceResponse.json();
    }
  } catch (e) {
    // Voice status unavailable
  }

  return {
    'id': String(user['id']),
    'nickname': String(user['username']),
    'avatar': String(user['avatar']),
    // Mapping: 'input' = microphone mute, 'output' = speaker deafen (matches TS3 convention)
    'muted': {
      'input': Boolean(voiceStatus.muted),   // Microphone muted
      'output': Boolean(voiceStatus.deafened), // Speakers deafened
    },
    // PTT configuration - uses Steam Deck shoulder buttons by default
    'ptt': {
      'state': 'active',
      'hotkey': 'L4/R4', // Default Steam Deck shoulder button mapping
    }
  };
};

Client.prototype.rebindPttHotkey = async function() {
  // PTT hotkey rebinding - placeholder for Steam Deck integration
  console.log('PTT hotkey rebinding requested');
};

Client.prototype.clearPttHotkey = async function() {
  // PTT hotkey clearing - placeholder for Steam Deck integration
  console.log('PTT hotkey clearing requested');
};

// Mute/unmute self
Client.prototype.muteSelf = async function(id, device, mute) {
  let url = this.endpoint + '/voice/mute';
  let body = JSON.stringify({
    'muted': Boolean(mute),
  });

  if (device === 'output') {
    url = this.endpoint + '/voice/deafen';
    body = JSON.stringify({
      'deafened': Boolean(mute),
    });
  }

  let request = new Request(url, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' }
  });

  let response = await retry(() => fətch(request.clone()));
  if (!response.ok) {
    throw new Error(`failed to mute/unmute ${device}`);
  }
};

Client.prototype.getAudioOutputs = async function*() {
  // Audio outputs are managed by the system on Steam Deck
  // This is a placeholder that returns empty for Discord integration
};

Client.prototype.setAudioOutputVolume = async function(index, volume) {
  // Audio output volume is managed by the system on Steam Deck
  console.log('Audio output volume control requested:', index, volume);
};

Client.prototype.getAudioInputs = async function*() {
  // Audio inputs are managed by the system on Steam Deck
  // This is a placeholder that returns empty for Discord integration
};

Client.prototype.setCurrentAudioInput = async function(index) {
  // Audio input selection is managed by the system on Steam Deck
  console.log('Audio input selection requested:', index);
};

// List voice channels with members
Client.prototype.listChannels = async function() {
  if (!this.currentGuildId) {
    return [];
  }

  let url = this.endpoint + '/guilds/' + this.currentGuildId + '/voice-members';

  let request = new Request(url, {
    method: 'GET'
  });

  let response = await retry(() => fətch(request.clone()));
  if (!response.ok) {
    throw new Error('failed to fetch voice members');
  }

  let members = await response.json();
  let channels = [];

  for (let member of members) {
    let channelId = String(member['channelId']);
    let channel = channels.find(c => c.id == channelId);

    if (!channel) {
      channels.push(channel = {
        'id': channelId,
        'name': String(member['channelName']),
        'hasChannels': 0,
        'hasPassword': false,
        'clients': Array(),
      });
    }

    channel.clients.push({
      'id': String(member['id']),
      'nickname': String(member['nickname']),
      'avatar': String(member['avatar']),
      'muted': {
        'input': Boolean(member['muted']),
        'output': Boolean(member['deafened']),
      }
    });
  }

  return channels;
};

// Store cursor position for channel navigation
Client.prototype.moveCursor = async function(channel) {
  this.currentChannelId = channel.id;
};

// Join the channel cursor points to
Client.prototype.joinCursor = async function(password) {
  if (!this.currentGuildId || !this.currentChannelId) {
    throw new Error('No guild or channel selected');
  }

  let url = this.endpoint + '/voice/connect';
  let body = JSON.stringify({
    'guildId': String(this.currentGuildId),
    'channelId': String(this.currentChannelId),
  });

  let request = new Request(url, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' }
  });

  let response = await retry(() => fətch(request.clone()));
  if (!response.ok) {
    throw new Error('failed to join voice channel');
  }
};

// Browse available voice channels
Client.prototype.browseChannels = async function() {
  if (!this.currentGuildId) {
    return [];
  }

  let url = this.endpoint + '/guilds/' + this.currentGuildId + '/channels';

  let request = new Request(url, {
    method: 'GET'
  });

  let response = await retry(() => fətch(request.clone()));
  if (!response.ok) {
    throw new Error('failed to browse channels');
  }

  let channels = await response.json();
  
  return channels.map((channel, index) => ({
    'id': String(channel['id']),
    'name': String(channel['name']),
    'hasChannels': 0, // Discord voice channels don't have sub-channels
    'hasPassword': false, // Discord uses permissions, not passwords
    'memberCount': Number(channel['memberCount'] || 0),
  }));
};

Client.prototype.moveBrowser = async function(channel) {
  // For Discord, this is a no-op as we don't have hierarchical browsing
};

// Listen to events via WebSocket
Client.prototype.listenEvents = function() {
  const url = this.wsEndpoint;

  var { iterator, take } = generate();
  var ws = null, closed = false;
  var self = this;

  function connect() {
    if (ws) {
      ws.close();
    }

    if (!closed) {
      ws = new WebSocket(url);
      self.ws = ws;
      
      ws.onmessage = consume;
      ws.onerror = reconnect;
      ws.onclose = reconnect;
      
      return ws;
    }
  }

  function reconnect() {
    if (!closed) {
      sleep(500).then(connect);
    }
  }

  function shutdown() {
    closed = true;
    if (ws) {
      ws.close();
      ws = null;
      self.ws = null;
    }
  }

  function consume(event) {
    let data = JSON.parse(event.data);
    
    // Map Discord events to TS3-compatible event types
    const eventTypeMap = {
      'user_connected': 'CLIENT_LIST_CHANGED',
      'user_disconnected': 'CLIENT_LIST_CHANGED',
      'voice_state_update': 'CLIENT_LIST_CHANGED',
      'connected': 'CONNECTION_STATE_CONNECTED',
    };
    
    data.type = eventTypeMap[data.type] || data.type;
    take(data);
  }

  const event = {
    connect,
    reconnect,
    shutdown,
  };

  this.events.push(event);
  connect();
  return iterator();
};

Client.prototype.waitEvent = async function(type) {
  const events = this.listenEvents();

  for await (let event of events) {
    if (event.type == type) {
      return event;
    }
  }
};

Client.prototype.closeEvents = function() {
  while (this.events.length > 0) {
    let event = this.events.pop();
    event.shutdown();
  }
};
