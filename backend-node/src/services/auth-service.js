import { isClientReady } from '../client.js';
import config from '../config.js';

/**
 * Auth service for handling authentication and authorization
 */
export const AuthService = {
  /**
   * Checks if the Discord bot token is configured
   * @returns {boolean} True if token is configured
   */
  isTokenConfigured() {
    return Boolean(config.discordToken);
  },

  /**
   * Gets the authentication status
   * @returns {Object} Auth status object
   */
  getStatus() {
    return {
      tokenConfigured: this.isTokenConfigured(),
      clientReady: isClientReady(),
    };
  },

  /**
   * Validates that the bot is ready for operations
   * @throws {Error} If bot is not ready
   */
  requireReady() {
    if (!this.isTokenConfigured()) {
      throw new Error('Discord token is not configured');
    }
    if (!isClientReady()) {
      throw new Error('Discord client is not ready');
    }
  },
};

export default AuthService;
