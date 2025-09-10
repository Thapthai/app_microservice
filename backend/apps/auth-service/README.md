# Advanced Authentication Service

A comprehensive authentication microservice supporting multiple authentication methods including JWT, OAuth 2.0, and API Keys.

## 🔐 Supported Authentication Methods

### 1. JWT Authentication (Default)
Traditional username/password authentication with JWT tokens.

### 2. OAuth 2.0
Support for selected providers:
- Google
- Microsoft

### 3. API Key Authentication
Secure API key-based authentication for service-to-service communication.

## 📊 Authentication Methods Summary
- ✅ **Traditional Login** - Email/password with JWT tokens
- ✅ **Google OAuth 2.0** - Sign in with Google account
- ✅ **Microsoft OAuth 2.0** - Sign in with Microsoft account  
- ✅ **API Key Authentication** - For service-to-service communication
- ❌ **GitHub OAuth** - Removed (not supported)
- ❌ **Facebook OAuth** - Removed (not supported)

## 🚀 Quick Start

### 1. Environment Setup
Copy `env.auth.example` to `.env` and configure your OAuth providers:

```bash
cp env.auth.example .env
```

### 2. Database Migration
```bash
npm run db:generate
npm run db:push
```

### 3. Start the Service
```bash
npm run start:auth
```

## 📡 API Endpoints

### Traditional Authentication

#### Register
```
Pattern: auth.register
Payload: { email, password, name, preferredAuthMethod? }
```

#### Login
```
Pattern: auth.login  
Payload: { email, password, authMethod? }
```

#### Validate Token
```
Pattern: auth.validate
Payload: "jwt-token-string"
```

### OAuth 2.0 Authentication

#### Get OAuth URL
```
Pattern: auth.oauth2.getAuthUrl
Payload: { provider: "google"|"microsoft", state? }
Response: { authUrl, provider, state }
```

#### OAuth Login
```
Pattern: auth.oauth2.login
Payload: { provider, code, state?, redirectUri? }
```

### API Key Management

#### Create API Key
```
Pattern: auth.apikey.create
Payload: { userId, apiKeyDto: { name, description?, expiresAt? } }
Response: { id, name, key, prefix, expiresAt }
```

#### List API Keys
```
Pattern: auth.apikey.list
Payload: userId
```

#### Revoke API Key
```
Pattern: auth.apikey.revoke
Payload: { userId, apiKeyId }
```

### Token Management

#### Refresh Tokens
```
Pattern: auth.token.refresh
Payload: { refreshToken }
```

## 🔑 Authentication Headers

### JWT Authentication
```
Authorization: Bearer <jwt-token>
```

### API Key Authentication
```
# Option 1: Authorization header
Authorization: Bearer ak_1234567890abcdef...
Authorization: ApiKey ak_1234567890abcdef...

# Option 2: X-API-Key header  
X-API-Key: ak_1234567890abcdef...
```

## 🛡️ Security Features

- **Multiple Auth Methods**: JWT, OAuth 2.0, API Keys
- **Secure Password Hashing**: bcrypt with configurable rounds
- **Token Refresh**: Automatic token refresh mechanism
- **API Key Expiration**: Configurable API key expiration
- **Rate Limiting**: Built-in rate limiting support
- **Audit Logging**: Track authentication events

## 🔧 Configuration

### OAuth 2.0 Provider Setup

#### 🌐 Google OAuth Setup
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง OAuth 2.0 credentials
3. ตั้งค่า Redirect URI: `http://localhost:3000/auth/oauth2/callback/google`
4. Copy Client ID และ Client Secret ไปใส่ใน `.env`

**ขั้นตอนละเอียด:**
- เลือกโปรเจค หรือสร้างใหม่
- ไป APIs & Services > Credentials
- คลิก Create Credentials > OAuth 2.0 Client IDs
- เลือก Application type: Web application
- ใส่ Authorized redirect URIs: `http://localhost:3000/auth/oauth2/callback/google`
- บันทึกและ copy Client ID, Client Secret

#### 🏢 Microsoft OAuth Setup  
1. ไปที่ [Azure Portal](https://portal.azure.com/)
2. Register application ใหม่
3. ตั้งค่า Redirect URI: `http://localhost:3000/auth/oauth2/callback/microsoft`
4. Copy Application (client) ID และสร้าง Client Secret

**ขั้นตอนละเอียด:**
- ไป Azure Active Directory > App registrations
- คลิก New registration
- ใส่ชื่อแอป
- เลือก Supported account types: Accounts in any organizational directory and personal Microsoft accounts
- ใส่ Redirect URI (Web): `http://localhost:3000/auth/oauth2/callback/microsoft`
- หลังสร้างแล้ว ไป Certificates & secrets เพื่อสร้าง Client Secret
- Copy Application (client) ID และ Client Secret value

## 📊 Database Schema

### Users Table
- Support for multiple auth methods
- Email verification status
- Last login tracking
- Preferred authentication method

### OAuth Accounts Table
- Link users to OAuth providers
- Store provider tokens
- Support token refresh

### API Keys Table
- Secure key storage with hashing
- Key metadata and expiration
- Usage tracking

### Refresh Tokens Table
- Secure refresh token management
- Token revocation support
- Expiration handling

## 🧪 Testing

### Test Traditional Authentication
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123", 
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test OAuth 2.0 Authentication

#### Google OAuth
```bash
# Step 1: Get Google Auth URL
curl -X POST http://localhost:3000/api/auth/oauth2/url \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'

# Step 2: After user authorization, use the code
curl -X POST http://localhost:3000/api/auth/oauth2/login \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "code": "authorization-code-from-google"
  }'
```

#### Microsoft OAuth
```bash
# Step 1: Get Microsoft Auth URL
curl -X POST http://localhost:3000/api/auth/oauth2/url \
  -H "Content-Type: application/json" \
  -d '{"provider": "microsoft"}'

# Step 2: After user authorization, use the code
curl -X POST http://localhost:3000/api/auth/oauth2/login \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "microsoft",
    "code": "authorization-code-from-microsoft"
  }'
```

### Test API Key Authentication
```bash
# Create API key (requires JWT token from login)
curl -X POST http://localhost:3000/api/auth/apikey \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My API Key",
    "description": "For testing"
  }'

# Use API Key to access protected endpoints
curl -X GET http://localhost:3000/api/items \
  -H "X-API-Key: ak_your_generated_api_key_here"
```

## 🔍 Monitoring & Logging

The service provides comprehensive logging for:
- Authentication attempts
- API key usage
- OAuth flows
- Token refresh events
- Security violations

## 🚨 Security Best Practices

1. **Environment Variables**: Never commit OAuth secrets to version control
2. **HTTPS Only**: Use HTTPS in production for all OAuth callbacks
3. **Token Rotation**: Implement regular token rotation
4. **Rate Limiting**: Configure appropriate rate limits
5. **Monitoring**: Monitor for suspicious authentication patterns
6. **API Key Management**: Regularly rotate and audit API keys

## 📈 Performance Considerations

- **Database Indexing**: Proper indexes on email, API key prefix
- **Token Caching**: Consider Redis for token blacklisting
- **Connection Pooling**: Configure database connection pooling
- **Rate Limiting**: Implement distributed rate limiting for scale

## 🔄 Migration Guide

### From Basic JWT to Advanced Auth

1. Run database migrations to add new tables
2. Update environment variables with OAuth credentials
3. Update client applications to support new auth methods
4. Migrate existing users gradually

## 🎯 Quick Reference

### Environment Variables Required
```bash
# Copy example file
cp env.auth.example .env

# Configure these variables:
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"  
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
JWT_SECRET="your-super-secret-jwt-key"
```

### Start Services
```bash
# Build all services
npm run build:all

# Start all microservices
npm run start:all

# Or start individually:
npm run start:gateway  # Port 3000
npm run start:auth     # Port 3001 (TCP)
npm run start:item     # Port 3002 (TCP)
```

### Authentication Flow Summary
1. **Traditional**: Register → Login → Get JWT Token
2. **Google OAuth**: Get Auth URL → User Authorize → Exchange Code → Get JWT Token  
3. **Microsoft OAuth**: Get Auth URL → User Authorize → Exchange Code → Get JWT Token
4. **API Key**: Login with JWT → Create API Key → Use API Key for requests

## 🤝 Contributing

1. Follow the established patterns for new auth methods
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure security best practices are followed

---

## 📋 Change Log

### v2.0.0 - OAuth Simplification
- ✅ **Removed GitHub OAuth** - Simplified provider list
- ✅ **Removed Facebook OAuth** - Simplified provider list  
- ✅ **Kept Google OAuth** - Popular enterprise choice
- ✅ **Kept Microsoft OAuth** - Enterprise integration
- ✅ **Enhanced Documentation** - Complete setup guides
- ✅ **Improved Testing** - Updated test examples
