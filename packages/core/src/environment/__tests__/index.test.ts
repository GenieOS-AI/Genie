import { EnvironmentManager, env } from '../index';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('EnvironmentManager', () => {
  const testEnvFile = join(process.cwd(), '.env.test');
  
  beforeEach(() => {
    // Clear any existing environment variables and reset singleton
    env.clear();
    // @ts-ignore - accessing private property for testing
    EnvironmentManager.instance = undefined;
    
    // Clean up any existing test env file
    if (existsSync(testEnvFile)) {
      unlinkSync(testEnvFile);
    }
  });

  afterEach(() => {
    // Clean up test env file
    if (existsSync(testEnvFile)) {
      unlinkSync(testEnvFile);
    }
    // Reset singleton instance
    // @ts-ignore - accessing private property for testing
    EnvironmentManager.instance = undefined;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EnvironmentManager.getInstance();
      const instance2 = EnvironmentManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Environment Variables Management', () => {
    it('should set and get environment variables', () => {
      env.set('TEST_KEY', 'test_value');
      expect(env.get('TEST_KEY')).toBe('test_value');
    });

    it('should return undefined for non-existent variables', () => {
      expect(env.get('NON_EXISTENT_KEY')).toBeUndefined();
    });

    it('should throw error when getting required non-existent variables', () => {
      expect(() => env.getRequired('NON_EXISTENT_KEY')).toThrow();
    });

    it('should delete environment variables', () => {
      env.set('TEST_KEY', 'test_value');
      expect(env.delete('TEST_KEY')).toBe(true);
      expect(env.get('TEST_KEY')).toBeUndefined();
    });

    it('should return false when deleting non-existent variables', () => {
      expect(env.delete('NON_EXISTENT_KEY')).toBe(false);
    });

    it('should list all environment variable keys', () => {
      env.set('KEY1', 'value1');
      env.set('KEY2', 'value2');
      const keys = env.getAllKeys();
      expect(keys).toContain('KEY1');
      expect(keys).toContain('KEY2');
      expect(keys.length).toBe(2);
    });

    it('should clear all environment variables', () => {
      env.set('KEY1', 'value1');
      env.set('KEY2', 'value2');
      env.clear();
      expect(env.getAllKeys().length).toBe(0);
    });
  });

  describe('File Loading', () => {
    it('should load environment variables from file', async () => {
      // Create a test env file
      const envContent = 'TEST_VAR=test_value\nANOTHER_VAR=another_value';
      writeFileSync(testEnvFile, envContent);

      // Force a new instance to be created
      // @ts-ignore - accessing private property for testing
      EnvironmentManager.instance = undefined;
      const newEnv = EnvironmentManager.getInstance();
      
      // Check if variables were loaded
      expect(newEnv.get('TEST_VAR')).toBe('test_value');
      expect(newEnv.get('ANOTHER_VAR')).toBe('another_value');
    });

    it('should handle missing env files gracefully', () => {
      // This should not throw an error
      expect(() => EnvironmentManager.getInstance()).not.toThrow();
    });
  });

  describe('Process Environment Variables', () => {
    it('should load variables from process.env', () => {
      // Set a process environment variable
      process.env.TEST_PROCESS_VAR = 'process_value';

      // Force a new instance to be created
      // @ts-ignore - accessing private property for testing
      EnvironmentManager.instance = undefined;
      const newEnv = EnvironmentManager.getInstance();
      
      expect(newEnv.get('TEST_PROCESS_VAR')).toBe('process_value');

      // Clean up
      delete process.env.TEST_PROCESS_VAR;
    });
  });
}); 