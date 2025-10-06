import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export interface ApiKeyInfo {
  id: number;
  user_id: number;
  name: string;
  prefix: string;
  is_active: boolean;
  last_used_at?: Date;
  expires_at?: Date;
}

@Injectable()
export class ApiKeyStrategy {
  
  /**
   * Generate a new API key
   * Format: prefix_randomString (e.g., ak_1234567890abcdef...)
   */
  generateApiKey(): { key: string; hash: string; prefix: string } {
    const prefix = 'ak';
    const randomBytes = crypto.randomBytes(32);
    const keyBody = randomBytes.toString('hex');
    const key = `${prefix}_${keyBody}`;
    const hash = bcrypt.hashSync(key, 10);
    
    return {
      key,
      hash,
      prefix: key.substring(0, 8) // First 8 characters for identification
    };
  }

  /**
   * Verify API key against stored hash
   */
  async verifyApiKey(providedKey: string, storedHash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(providedKey, storedHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract API key from various header formats
   */
  extractApiKeyFromHeader(authHeader: string): string | null {
    if (!authHeader) return null;

    // Support multiple formats:
    // 1. "Bearer ak_..."
    // 2. "ApiKey ak_..."
    // 3. "ak_..." (direct)
    
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch) {
      return bearerMatch[1];
    }

    const apiKeyMatch = authHeader.match(/^ApiKey\s+(.+)$/i);
    if (apiKeyMatch) {
      return apiKeyMatch[1];
    }

    // Direct API key (starts with prefix)
    if (authHeader.startsWith('ak_')) {
      return authHeader;
    }

    return null;
  }

  /**
   * Validate API key format
   */
  isValidApiKeyFormat(key: string): boolean {
    // API key should be: prefix_64hexchars
    const pattern = /^ak_[a-f0-9]{64}$/;
    return pattern.test(key);
  }

  /**
   * Check if API key is expired
   */
  isApiKeyExpired(expires_at?: Date): boolean {
    if (!expires_at) return false;
    return new Date() > expires_at;
  }

  /**
   * Get prefix from API key for identification
   */
  getApiKeyPrefix(key: string): string {
    return key.substring(0, 8);
  }

  /**
   * Generate API key with custom options
   */
  generateCustomApiKey(options: {
    prefix?: string;
    length?: number;
  } = {}): { key: string; hash: string; prefix: string } {
    const prefix = options.prefix || 'ak';
    const length = options.length || 32;
    
    const randomBytes = crypto.randomBytes(length);
    const keyBody = randomBytes.toString('hex');
    const key = `${prefix}_${keyBody}`;
    const hash = bcrypt.hashSync(key, 10);
    
    return {
      key,
      hash,
      prefix: key.substring(0, Math.min(8, prefix.length + 3))
    };
  }

  /**
   * Rate limiting helper - generate key for rate limiting
   */
  getRateLimitKey(apiKeyPrefix: string, endpoint?: string): string {
    const base = `api_key:${apiKeyPrefix}`;
    return endpoint ? `${base}:${endpoint}` : base;
  }
}
