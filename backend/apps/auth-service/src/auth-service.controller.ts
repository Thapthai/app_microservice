import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import { 
  LoginDto, 
  RegisterDto, 
  OAuth2LoginDto, 
  ApiKeyCreateDto, 
  RefreshTokenDto,
  OAuth2Provider 
} from './dto/auth.dto';

@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @MessagePattern('auth.register')
  async register(@Payload() registerDto: RegisterDto) {
    return this.authServiceService.register(registerDto);
  }

  @MessagePattern('auth.login')
  async login(@Payload() loginDto: LoginDto) {
    return this.authServiceService.login(loginDto);
  }

  @MessagePattern('auth.validate')
  async validateToken(@Payload() token: string) {
    return this.authServiceService.validateToken(token);
  }

  // ================================ OAuth 2.0 Endpoints ================================

  @MessagePattern('auth.oauth2.getAuthUrl')
  async getOAuth2AuthUrl(@Payload() data: { provider: OAuth2Provider; state?: string }) {
    return this.authServiceService.getOAuth2AuthUrl(data.provider, data.state);
  }

  @MessagePattern('auth.oauth2.login')
  async oauth2Login(@Payload() oauth2LoginDto: OAuth2LoginDto) {
    return this.authServiceService.oauth2Login(oauth2LoginDto);
  }

  // ================================ API Key Endpoints ================================

  @MessagePattern('auth.apikey.create')
  async createApiKey(@Payload() data: { userId: number; apiKeyDto: ApiKeyCreateDto }) {
    return this.authServiceService.createApiKey(data.userId, data.apiKeyDto);
  }

  @MessagePattern('auth.apikey.list')
  async listApiKeys(@Payload() userId: number) {
    return this.authServiceService.listApiKeys(userId);
  }

  @MessagePattern('auth.apikey.revoke')
  async revokeApiKey(@Payload() data: { userId: number; apiKeyId: number }) {
    return this.authServiceService.revokeApiKey(data.userId, data.apiKeyId);
  }

  // ================================ Token Management ================================

  @MessagePattern('auth.token.refresh')
  async refreshTokens(@Payload() refreshTokenDto: RefreshTokenDto) {
    return this.authServiceService.refreshTokens(refreshTokenDto);
  }
}
