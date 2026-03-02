import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPantheonEnvironment,
  isProduction,
  isNonProduction,
  getEnvironmentDisplayName,
} from '@/lib/pantheon/env';

describe('Pantheon Environment Detection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getPantheonEnvironment', () => {
    it('should return "dev" when PANTHEON_ENVIRONMENT is dev', () => {
      process.env.PANTHEON_ENVIRONMENT = 'dev';
      expect(getPantheonEnvironment()).toBe('dev');
    });

    it('should return "test" when PANTHEON_ENVIRONMENT is test', () => {
      process.env.PANTHEON_ENVIRONMENT = 'test';
      expect(getPantheonEnvironment()).toBe('test');
    });

    it('should return "live" when PANTHEON_ENVIRONMENT is live', () => {
      process.env.PANTHEON_ENVIRONMENT = 'live';
      expect(getPantheonEnvironment()).toBe('live');
    });

    it('should return "local" when NODE_ENV is development', () => {
      delete process.env.PANTHEON_ENVIRONMENT;
      process.env.NODE_ENV = 'development';
      expect(getPantheonEnvironment()).toBe('local');
    });

    it('should return "unknown" when no environment is detected', () => {
      delete process.env.PANTHEON_ENVIRONMENT;
      process.env.NODE_ENV = 'production';
      expect(getPantheonEnvironment()).toBe('unknown');
    });
  });

  describe('isProduction', () => {
    it('should return true when environment is live', () => {
      process.env.PANTHEON_ENVIRONMENT = 'live';
      expect(isProduction()).toBe(true);
    });

    it('should return false when environment is dev', () => {
      process.env.PANTHEON_ENVIRONMENT = 'dev';
      expect(isProduction()).toBe(false);
    });

    it('should return false when environment is test', () => {
      process.env.PANTHEON_ENVIRONMENT = 'test';
      expect(isProduction()).toBe(false);
    });
  });

  describe('isNonProduction', () => {
    it('should return true when environment is dev', () => {
      process.env.PANTHEON_ENVIRONMENT = 'dev';
      expect(isNonProduction()).toBe(true);
    });

    it('should return true when environment is test', () => {
      process.env.PANTHEON_ENVIRONMENT = 'test';
      expect(isNonProduction()).toBe(true);
    });

    it('should return true when environment is local', () => {
      process.env.NODE_ENV = 'development';
      expect(isNonProduction()).toBe(true);
    });

    it('should return false when environment is live', () => {
      process.env.PANTHEON_ENVIRONMENT = 'live';
      expect(isNonProduction()).toBe(false);
    });
  });

  describe('getEnvironmentDisplayName', () => {
    it('should return "Development" for dev', () => {
      process.env.PANTHEON_ENVIRONMENT = 'dev';
      expect(getEnvironmentDisplayName()).toBe('Development');
    });

    it('should return "Test" for test', () => {
      process.env.PANTHEON_ENVIRONMENT = 'test';
      expect(getEnvironmentDisplayName()).toBe('Test');
    });

    it('should return "Production" for live', () => {
      process.env.PANTHEON_ENVIRONMENT = 'live';
      expect(getEnvironmentDisplayName()).toBe('Production');
    });

    it('should return "Local" for local', () => {
      process.env.NODE_ENV = 'development';
      expect(getEnvironmentDisplayName()).toBe('Local');
    });

    it('should return "Unknown" for unknown', () => {
      delete process.env.PANTHEON_ENVIRONMENT;
      process.env.NODE_ENV = 'production';
      expect(getEnvironmentDisplayName()).toBe('Unknown');
    });
  });
});
