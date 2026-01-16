/**
 * Discord Client Service - HTTP API client for Discord backend
 */

class DiscordClientService {
  constructor(baseUrl = 'http://127.0.0.1:52260/api') {
    this.baseUrl = baseUrl;
    this.connected = false;
    this.ready = false;
    this.user = null;
    this.eventHandlers = new Map();
    this.statusPollInterval = null;
  }

  /**
   * Make HTTP request to backend
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('[DiscordClient] Request error:', error);
      throw error;
    }
  }

  /**
   * Login to Discord with user token
   * @param {string} token - Discord user token
   * @returns {Promise<boolean>} Success status
   */
  async login(token) {
    try {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      this.user = result.user;
      this.connected = true;
      this.ready = true;

      // Start status polling
      this.startStatusPolling();

      this.emit('ready', this.user);
      return true;
    } catch (error) {
      console.error('[DiscordClient] Login failed:', error);
      this.connected = false;
      this.ready = false;
      throw error;
    }
  }

  /**
   * Logout and destroy client
   */
  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });

      this.stopStatusPolling();
      this.user = null;
      this.connected = false;
      this.ready = false;
    } catch (error) {
      console.error('[DiscordClient] Logout error:', error);
    }
  }

  /**
   * Get list of guilds (servers)
   * @returns {Promise<Array>} Guild list
   */
  async getGuilds() {
    try {
      const result = await this.request('/guilds');
      return result.guilds || [];
    } catch (error) {
      console.error('[DiscordClient] Failed to get guilds:', error);
      return [];
    }
  }

  /**
   * Get voice channels in a guild
   * @param {string} guildId
   * @returns {Promise<Array>} Voice channel list
   */
  async getVoiceChannels(guildId) {
    try {
      const result = await this.request(`/guilds/${guildId}/channels`);
      return result.channels || [];
    } catch (error) {
      console.error('[DiscordClient] Failed to get channels:', error);
      return [];
    }
  }

  /**
   * Get current user
   * @returns {User|null}
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get connection status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      connected: this.connected,
      ready: this.ready,
      user: this.user,
    };
  }

  /**
   * Start polling backend status
   */
  startStatusPolling() {
    if (this.statusPollInterval) return;

    this.statusPollInterval = setInterval(async () => {
      try {
        const status = await this.request('/status');
        
        if (status.authenticated && !this.ready) {
          this.ready = true;
          this.user = status.user;
          this.emit('ready', this.user);
        } else if (!status.authenticated && this.ready) {
          this.ready = false;
          this.connected = false;
          this.user = null;
          this.emit('disconnect');
        }
      } catch (error) {
        // Backend might be down
        console.error('[DiscordClient] Status poll error:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Stop status polling
   */
  stopStatusPolling() {
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
      this.statusPollInterval = null;
    }
  }

  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Remove event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;
    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit event to registered handlers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.eventHandlers.has(event)) return;
    const handlers = this.eventHandlers.get(event);
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[DiscordClient] Error in ${event} handler:`, error);
      }
    });
  }
}

export default DiscordClientService;
