import { Controller, Post, Body, Get, Headers, HttpException, HttpStatus, Put, Delete, Param, Query, ParseIntPipe } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GatewayApiService } from './gateway-api.service';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Type(() => Number)
  userId: number;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsString()
  category?: string;
}

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

  // Item Endpoints
  @Post('items')
  async createItem(@Body() createItemDto: CreateItemDto) {
    try {
      const result = await this.gatewayApiService.createItem(createItemDto);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
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
    @Query('userId') userId?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    try {
      const query: any = {};
      if (userId) query.userId = parseInt(userId);
      if (category) query.category = category;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const result = await this.gatewayApiService.findAllItems(query);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
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
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.NOT_FOUND);
      }
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
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
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
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users/:userId/items')
  async findItemsByUser(@Param('userId', ParseIntPipe) userId: number) {
    try {
      const result = await this.gatewayApiService.findItemsByUser(userId);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch user items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
