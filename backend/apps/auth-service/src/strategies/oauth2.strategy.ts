import { Injectable } from '@nestjs/common';
import { OAuth2Provider } from '../dto/auth.dto';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface OAuth2UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: OAuth2Provider;
}

@Injectable()
export class OAuth2Strategy {
  private readonly configs: Record<OAuth2Provider, OAuth2Config> = {
    [OAuth2Provider.GOOGLE]: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
      scope: ['openid', 'email', 'profile']
    },
    [OAuth2Provider.MICROSOFT]: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || '',
      scope: ['openid', 'email', 'profile']
    }
  };

  getAuthUrl(provider: OAuth2Provider, state?: string): string {
    const config = this.configs[provider];
    const baseUrls = {
      [OAuth2Provider.GOOGLE]: 'https://accounts.google.com/o/oauth2/v2/auth',
      [OAuth2Provider.MICROSOFT]: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    };

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      response_type: 'code',
      ...(state && { state })
    });

    return `${baseUrls[provider]}?${params.toString()}`;
  }

  async exchangeCodeForToken(provider: OAuth2Provider, code: string): Promise<any> {
    const config = this.configs[provider];
    const tokenUrls = {
      [OAuth2Provider.GOOGLE]: 'https://oauth2.googleapis.com/token',
      [OAuth2Provider.MICROSOFT]: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
    };

    const response = await fetch(tokenUrls[provider], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      })
    });

    return response.json();
  }

  async getUserInfo(provider: OAuth2Provider, accessToken: string): Promise<OAuth2UserInfo> {
    const userInfoUrls = {
      [OAuth2Provider.GOOGLE]: 'https://www.googleapis.com/oauth2/v2/userinfo',
      [OAuth2Provider.MICROSOFT]: 'https://graph.microsoft.com/v1.0/me'
    };

    const response = await fetch(userInfoUrls[provider], {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const userData = await response.json();
    
    // Normalize user data across providers
    return this.normalizeUserData(provider, userData);
  }

  private normalizeUserData(provider: OAuth2Provider, userData: any): OAuth2UserInfo {
    switch (provider) {
      case OAuth2Provider.GOOGLE:
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          provider
        };
      
      case OAuth2Provider.MICROSOFT:
        return {
          id: userData.id,
          email: userData.mail || userData.userPrincipalName,
          name: userData.displayName,
          provider
        };
      
      default:  
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }
}
