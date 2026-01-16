import { Router } from 'express';
import DiscordService from '../services/discord-service.js';
import AuthService from '../services/auth-service.js';

const router = Router();

/**
 * GET /api/guilds
 * Returns list of guilds the bot is a member of
 */
router.get('/', (req, res) => {
  try {
    AuthService.requireReady();
    const guilds = DiscordService.getGuilds();
    res.json(guilds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/guilds/:id
 * Returns a specific guild by ID
 */
router.get('/:id', (req, res) => {
  try {
    AuthService.requireReady();
    const guild = DiscordService.getGuild(req.params.id);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }
    res.json(guild);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/guilds/:id/channels
 * Returns voice channels for a guild
 */
router.get('/:id/channels', (req, res) => {
  try {
    AuthService.requireReady();
    const channels = DiscordService.getVoiceChannels(req.params.id);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/guilds/:id/voice-members
 * Returns all members in voice channels for a guild
 */
router.get('/:id/voice-members', (req, res) => {
  try {
    AuthService.requireReady();
    const members = DiscordService.getGuildVoiceMembers(req.params.id);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/guilds/:guildId/channels/:channelId/members
 * Returns members in a specific voice channel
 */
router.get('/:guildId/channels/:channelId/members', (req, res) => {
  try {
    AuthService.requireReady();
    const members = DiscordService.getVoiceChannelMembers(
      req.params.guildId,
      req.params.channelId
    );
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
