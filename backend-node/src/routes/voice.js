import { Router } from 'express';
import VoiceService from '../services/voice-service.js';
import AuthService from '../services/auth-service.js';

const router = Router();

/**
 * GET /api/voice/status
 * Returns the current voice connection status
 */
router.get('/status', (req, res) => {
  try {
    AuthService.requireReady();
    const status = VoiceService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voice/connect
 * Connects to a voice channel
 */
router.post('/connect', async (req, res) => {
  try {
    AuthService.requireReady();
    const { guildId, channelId } = req.body;
    
    if (!guildId || !channelId) {
      return res.status(400).json({ error: 'guildId and channelId are required' });
    }
    
    const result = await VoiceService.connect(guildId, channelId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voice/disconnect
 * Disconnects from the current voice channel
 */
router.post('/disconnect', (req, res) => {
  try {
    AuthService.requireReady();
    const result = VoiceService.disconnect();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voice/mute
 * Sets the mute state
 */
router.post('/mute', (req, res) => {
  try {
    AuthService.requireReady();
    const { muted } = req.body;
    
    if (typeof muted !== 'boolean') {
      return res.status(400).json({ error: 'muted must be a boolean' });
    }
    
    const result = VoiceService.setMute(muted);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voice/deafen
 * Sets the deafen state
 */
router.post('/deafen', (req, res) => {
  try {
    AuthService.requireReady();
    const { deafened } = req.body;
    
    if (typeof deafened !== 'boolean') {
      return res.status(400).json({ error: 'deafened must be a boolean' });
    }
    
    const result = VoiceService.setDeafen(deafened);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
