/**
 * useAuthentication hook - Manages Discord authentication state
 */

import { useState, useEffect, useCallback } from 'react';
import TokenManager from '../services/tokenManager.js';
import DiscordClientService from '../services/discordClient.js';

const tokenManager = new TokenManager();
const discordClient = new DiscordClientService();

export function useAuthentication() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Initialize and check for existing token
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        
        if (tokenManager.hasToken()) {
          const token = await tokenManager.retrieveAndDecrypt();
          if (token) {
            // Try to login with stored token
            try {
              await discordClient.login(token);
              setIsAuthenticated(true);
              setUser(discordClient.getCurrentUser());
            } catch (err) {
              console.error('[useAuthentication] Auto-login failed:', err);
              // Token might be invalid, clear it
              await tokenManager.deleteToken();
              setError('Stored token is invalid. Please login again.');
            }
          }
        }
      } catch (err) {
        console.error('[useAuthentication] Initialization error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // Listen for ready event
  useEffect(() => {
    const handleReady = (userData) => {
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
    };

    const handleError = (err) => {
      setError(err.message);
    };

    discordClient.on('ready', handleReady);
    discordClient.on('error', handleError);

    return () => {
      discordClient.off('ready', handleReady);
      discordClient.off('error', handleError);
    };
  }, []);

  /**
   * Login with Discord token
   */
  const login = useCallback(async (token) => {
    try {
      setIsLoading(true);
      setError(null);

      // Token minimum length constant
      const MIN_TOKEN_LENGTH = 50;

      // Validate token format (basic check)
      if (!token || token.length < MIN_TOKEN_LENGTH) {
        throw new Error('Invalid token format');
      }

      // Try to login
      await discordClient.login(token);

      // If successful, encrypt and store token
      await tokenManager.encryptAndStore(token);
      
      setIsAuthenticated(true);
      setUser(discordClient.getCurrentUser());
      setIsLoading(false);
      
      return true;
    } catch (err) {
      console.error('[useAuthentication] Login error:', err);
      setError(err.message || 'Login failed. Please check your token.');
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Logout and clear stored token
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      await discordClient.logout();
      await tokenManager.deleteToken();
      
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setIsLoading(false);
      
      return true;
    } catch (err) {
      console.error('[useAuthentication] Logout error:', err);
      setError(err.message);
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    discordClient,
  };
}
