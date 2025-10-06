import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';

export interface TOTPSetupResult {
  secret: string;
  qrCodeUrl: string;
  qrCodeDataURL: string;
  backup_codes: string[];
}

@Injectable()
export class TOTPService {
  private readonly appName = process.env.APP_NAME || 'POSE Microservice';
  
  constructor() {
    // Configure TOTP settings
    authenticator.options = {
      step: 30,     // 30 seconds window
      window: 1,    // Allow 1 step before/after for clock drift
      digits: 6,    // 6-digit codes
    };
  }

  /**
   * Generate TOTP secret and QR code for setup
   */
  async generateTOTPSetup(email: string): Promise<TOTPSetupResult> {
    // Generate random secret
    const secret = authenticator.generateSecret();
    
    // Create service name for authenticator app
    const service = `${this.appName}`;
    const account = email;
    
    // Generate otpauth URL
    const otpauthUrl = authenticator.keyuri(account, service, secret);
    
    // Generate QR code data URL
    const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl);
    
    // Generate backup codes
    const backup_codes = this.generateBackupCodes();
    
    return {
      secret,
      qrCodeUrl: otpauthUrl,
      qrCodeDataURL,
      backup_codes
    };
  }

  /**
   * Verify TOTP token
   */
  verifyTOTP(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate current TOTP token (for testing)
   */
  generateTOTP(secret: string): string {
    return authenticator.generate(secret);
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-digit backup code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Format as XXXX-XXXX
      const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
      codes.push(formattedCode);
    }
    
    return codes;
  }

  /**
   * Hash backup codes for secure storage
   */
  hashBackupCodes(codes: string[]): string[] {
    return codes.map(code => {
      return crypto.createHash('sha256').update(code).digest('hex');
    });
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(inputCode: string, backup_codes_json: string): boolean {
    try {
      const hashedCodes = JSON.parse(backup_codes_json);
      const hashedInput = crypto.createHash('sha256').update(inputCode).digest('hex');
      return hashedCodes.includes(hashedInput);
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove used backup code
   */
  removeUsedBackupCode(usedCode: string, backup_codes_json: string): string {
    try {
      const hashedCodes = JSON.parse(backup_codes_json);
      const hashedUsed = crypto.createHash('sha256').update(usedCode).digest('hex');
      const updatedCodes = hashedCodes.filter((code: string) => code !== hashedUsed);
      return JSON.stringify(updatedCodes);
    } catch (error) {
      return backup_codes_json;
    }
  }

  /**
   * Get time remaining for current TOTP token
   */
  getTimeRemaining(): number {
    const step = authenticator.options.step || 30;
    const currentTime = Math.floor(Date.now() / 1000);
    return step - (currentTime % step);
  }

  /**
   * Validate TOTP secret format
   */
  isValidSecret(secret: string): boolean {
    try {
      // Try to generate a token to validate the secret
      authenticator.generate(secret);
      return true;
    } catch (error) {
      return false;
    }
  }
}
