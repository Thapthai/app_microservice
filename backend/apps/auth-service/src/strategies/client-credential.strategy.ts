import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClientCredentialStrategy {
  /**
   * Generate a new client credential pair
   * Returns: { client_id, client_secret, client_secret_hash }
   */
  generateClientCredential(): { client_id: string; client_secret: string; client_secret_hash: string } {
    // Generate client_id (32 hex characters)
    const client_id = crypto.randomBytes(16).toString('hex');
    
    // Generate client_secret (32 hex characters)
    const client_secret = crypto.randomBytes(16).toString('hex');
    
    // Hash the client_secret
    const client_secret_hash = bcrypt.hashSync(client_secret, 10);
    
    return {
      client_id,
      client_secret,
      client_secret_hash
    };
  }

  /**
   * Verify client_secret against stored hash
   */
  async verifyClientSecret(providedSecret: string, storedHash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(providedSecret, storedHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if client credential is expired
   */
  isExpired(expires_at?: Date | null): boolean {
    if (!expires_at) return false;
    return new Date() > expires_at;
  }
}

