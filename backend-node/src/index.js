import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import config from './config.js';
import { createClient, destroyClient } from './client.js';
import { setupWebSocketHandlers } from './websocket/handlers.js';
import guildsRouter from './routes/guilds.js';
import voiceRouter from './routes/voice.js';
import userRouter from './routes/user.js';

const app = express();

// Middleware
app.use(express.json());

// CORS headers for local access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API routes
app.use('/api/guilds', guildsRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/user', userRouter);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

// Main startup function
async function main() {
  try {
    console.log('Starting Discord Quick Access backend...');
    
    // Initialize Discord client
    await createClient();
    console.log('Discord client initialized');
    
    // Setup WebSocket handlers
    setupWebSocketHandlers(wss);
    console.log('WebSocket handlers initialized');
    
    // Start HTTP server
    server.listen(config.port, config.host, () => {
      console.log(`Server listening on http://${config.host}:${config.port}`);
      console.log(`WebSocket available at ws://${config.host}:${config.port}/ws`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down...');
  
  wss.clients.forEach((client) => {
    client.close();
  });
  
  await destroyClient();
  server.close();
  
  console.log('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the application
main();
