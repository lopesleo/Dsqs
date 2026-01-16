import { config } from 'dotenv';

// Load environment variables from .env file
config();

export default {
  // Discord bot token (required)
  discordToken: process.env.DISCORD_TOKEN || '',
  
  // Server configuration
  port: parseInt(process.env.PORT || '52259', 10),
  host: process.env.HOST || '127.0.0.1',
  
  // Discord gateway intents configuration
  intents: {
    guilds: true,
    guildVoiceStates: true,
    guildMembers: true,
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 60, // max 60 requests per minute
  },
  
  // Reconnection settings
  reconnect: {
    maxRetries: 5,
    retryDelay: 5000, // 5 seconds
  }
};
