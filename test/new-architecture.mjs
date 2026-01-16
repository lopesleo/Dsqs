/**
 * Basic structure tests for new discord.js architecture
 */

import Assert from 'node:assert';
import { describe, it } from 'node:test';

describe('New Architecture', async () => {
  
  it('should have discordClient service', async () => {
    const { default: DiscordClientService } = await import('../src/services/discordClient.js');
    
    const client = new DiscordClientService();
    Assert.ok(client, 'DiscordClientService should be instantiable');
    Assert.strictEqual(typeof client.login, 'function', 'Should have login method');
    Assert.strictEqual(typeof client.logout, 'function', 'Should have logout method');
    Assert.strictEqual(typeof client.getGuilds, 'function', 'Should have getGuilds method');
  });
  
  it('should have tokenManager service', async () => {
    const { default: TokenManager } = await import('../src/services/tokenManager.js');
    
    const manager = new TokenManager();
    Assert.ok(manager, 'TokenManager should be instantiable');
    Assert.strictEqual(typeof manager.encryptAndStore, 'function', 'Should have encryptAndStore method');
    Assert.strictEqual(typeof manager.retrieveAndDecrypt, 'function', 'Should have retrieveAndDecrypt method');
    Assert.strictEqual(typeof manager.deleteToken, 'function', 'Should have deleteToken method');
  });
  
  it('should have storageManager service', async () => {
    const { default: StorageManager } = await import('../src/services/storageManager.js');
    
    const storage = new StorageManager();
    Assert.ok(storage, 'StorageManager should be instantiable');
    Assert.strictEqual(typeof storage.get, 'function', 'Should have get method');
    Assert.strictEqual(typeof storage.set, 'function', 'Should have set method');
    Assert.strictEqual(typeof storage.getPreferences, 'function', 'Should have getPreferences method');
  });
  
  it('should have voiceManager service', async () => {
    const { default: VoiceManager } = await import('../src/services/voiceManager.js');
    const { default: DiscordClientService } = await import('../src/services/discordClient.js');
    
    const client = new DiscordClientService();
    const voice = new VoiceManager(client);
    
    Assert.ok(voice, 'VoiceManager should be instantiable');
    Assert.strictEqual(typeof voice.joinChannel, 'function', 'Should have joinChannel method');
    Assert.strictEqual(typeof voice.disconnect, 'function', 'Should have disconnect method');
    Assert.strictEqual(typeof voice.setMute, 'function', 'Should have setMute method');
  });

});
