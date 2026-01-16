import { Client, GatewayIntentBits, Events } from 'discord.js';
import config from './config.js';

// Discord.js client instance
let client = null;

/**
 * Creates and initializes the Discord client
 * @returns {Promise<Client>} The initialized Discord client
 */
export async function createClient() {
  if (client && client.isReady()) {
    return client;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMembers,
    ],
  });

  // Setup event handlers
  client.once(Events.ClientReady, (c) => {
    console.log(`Discord client ready! Logged in as ${c.user.tag}`);
  });

  client.on(Events.Error, (error) => {
    console.error('Discord client error:', error);
  });

  client.on(Events.Warn, (warning) => {
    console.warn('Discord client warning:', warning);
  });

  // Login to Discord
  if (!config.discordToken) {
    throw new Error('DISCORD_TOKEN environment variable is required');
  }

  await client.login(config.discordToken);

  return client;
}

/**
 * Gets the current Discord client instance
 * @returns {Client|null} The Discord client or null if not initialized
 */
export function getClient() {
  return client;
}

/**
 * Destroys the Discord client connection
 */
export async function destroyClient() {
  if (client) {
    await client.destroy();
    client = null;
  }
}

/**
 * Checks if the Discord client is ready
 * @returns {boolean} True if the client is ready
 */
export function isClientReady() {
  return client !== null && client.isReady();
}

export default {
  createClient,
  getClient,
  destroyClient,
  isClientReady,
};
