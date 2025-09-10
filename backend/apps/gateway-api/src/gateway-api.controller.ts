import { Controller, Post, Body, Get, Headers, HttpException, HttpStatus, Put, Delete, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { GatewayApiService } from './gateway-api.service';
import { RegisterDto, LoginDto, CreateItemDto, UpdateItemDto } from './dto';

@Controller('api')
export class GatewayApiController {
  constructor(private readonly gatewayApiService: GatewayApiService) { }

  @Get()
  getHello(): string {
    return this.gatewayApiService.getHello();
  }

  @Get('api')
  getApiHello(): string {
    return this.gatewayApiService.getHello();
  }

  @Post('auth/register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const result = await this.gatewayApiService.register(registerDto);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auth/login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.gatewayApiService.login(loginDto);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.UNAUTHORIZED);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Login failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('auth/profile')
  async getProfile(@Headers('authorization') authorization: string) {
    try {
      if (!authorization) {
        throw new HttpException('Authorization header is required', HttpStatus.UNAUTHORIZED);
      }

      const token = authorization.replace('Bearer ', '');
      const result = await this.gatewayApiService.validateToken(token);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.UNAUTHORIZED);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Token validation failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // ==================================== Item Endpoints ====================================
  @Post('items')
  async createItem(@Body() createItemDto: CreateItemDto) {
    try {
      const result = await this.gatewayApiService.createItem(createItemDto);

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items')
  async findAllItems(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
  ) {
    try {

      const result = await this.gatewayApiService.findAllItems(page, limit, keyword);
      return result;

    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items/:id')
  async findOneItem(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.gatewayApiService.findOneItem(id);

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('items/:id')
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    try {
      const result = await this.gatewayApiService.updateItem(id, updateItemDto);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('items/:id')
  async removeItem(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.gatewayApiService.removeItem(id);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================== Email Endpoints ====================================
  
  @Post('email/test')
  async testEmail(@Body() data: { email: string; name?: string }) {
    try {
      const result = await this.gatewayApiService.sendWelcomeEmail(
        data.email, 
        data.name || 'Test User'
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send test email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('email/connection')
  async testEmailConnection() {
    try {
      const result = await this.gatewayApiService.testEmailConnection();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to test email connection',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================== Item Endpoints ====================================

}
