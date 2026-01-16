import { Router } from 'express';
import DiscordService from '../services/discord-service.js';
import AuthService from '../services/auth-service.js';

const router = Router();

/**
 * GET /api/user
 * Returns the current bot user information
 */
router.get('/', (req, res) => {
  try {
    AuthService.requireReady();
    const user = DiscordService.getCurrentUser();
    if (!user) {
      return res.status(503).json({ error: 'Discord client not ready' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/status
 * Returns the authentication status
 */
router.get('/status', (req, res) => {
  try {
    const status = AuthService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
