import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  onModuleInit() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      let credential: admin.credential.Credential;

      // Method 1: Use service account JSON file (recommended)
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        credential = admin.credential.cert(serviceAccountPath);
      }
      // Method 2: Use individual environment variables
      else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        // Get private key and handle various formats
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        // If private key exists, clean it up
        if (privateKey) {
          // Replace literal \n with actual newlines
          privateKey = privateKey.replace(/\\n/g, '\n');
          
          // Remove quotes if present
          privateKey = privateKey.replace(/^["']|["']$/g, '');
        }

        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        });
      } else {
        throw new Error('Firebase credentials not configured. Please set either FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
      }

      this.app = admin.initializeApp({
        credential: credential,
      });

    } else {
      this.app = admin.app();
    }
  }

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      throw new Error(`Invalid Firebase token: ${error.message}`);
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    return await admin.auth().getUser(uid);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    return await admin.auth().getUserByEmail(email);
  }

  /**
   * Create custom token for user
   */
  async createCustomToken(uid: string, claims?: object): Promise<string> {
    return await admin.auth().createCustomToken(uid, claims);
  }

  /**
   * Set custom user claims (for roles, permissions)
   */
  async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    return await admin.auth().setCustomUserClaims(uid, claims);
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    return await admin.auth().deleteUser(uid);
  }
}

