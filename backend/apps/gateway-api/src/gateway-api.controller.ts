import { Controller, Post, Body, Get, Headers, HttpException, HttpStatus, Put, Delete, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Request } from '@nestjs/common';
import { GatewayApiService } from './gateway-api.service';
import { RegisterDto, LoginDto, CreateItemDto, UpdateItemDto, ChangePasswordDto, UpdateUserProfileDto, ResetPasswordDto, CreateCategoryDto, UpdateCategoryDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

  @Post('auth/firebase/login')
  async firebaseLogin(@Body() data: { idToken: string }) {
    try {
      const result = await this.gatewayApiService.firebaseLogin(data.idToken);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.UNAUTHORIZED);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Firebase login failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ================================ 2FA Endpoints ================================

  @Post('auth/2fa/enable')
  async enable2FA(@Body() data: { password: string }, @Headers('authorization') authorization: string) {
    try {
      if (!authorization) {
        throw new HttpException('Authorization header is required', HttpStatus.UNAUTHORIZED);
      }

      const token = authorization.replace('Bearer ', '');
      const result = await this.gatewayApiService.enable2FA(token, data.password);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to enable 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auth/2fa/verify-setup')
  async verify2FASetup(@Body() data: { secret: string; token: string }, @Headers('authorization') authorization: string) {
    try {
      if (!authorization) {
        throw new HttpException('Authorization header is required', HttpStatus.UNAUTHORIZED);
      }

      const authToken = authorization.replace('Bearer ', '');
      const result = await this.gatewayApiService.verify2FASetup(authToken, data.secret, data.token);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to verify 2FA setup',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auth/2fa/disable')
  async disable2FA(@Body() data: { password: string; token?: string }, @Headers('authorization') authorization: string) {
    try {
      if (!authorization) {
        throw new HttpException('Authorization header is required', HttpStatus.UNAUTHORIZED);
      }

      const authToken = authorization.replace('Bearer ', '');
      const result = await this.gatewayApiService.disable2FA(authToken, data.password, data.token);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to disable 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auth/login/2fa')
  async loginWith2FA(@Body() data: { tempToken: string; code: string; type?: string }) {
    try {
      const result = await this.gatewayApiService.loginWith2FA(data.tempToken, data.code, data.type);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || '2FA verification failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================== User Management Endpoints ====================================

  @Get('auth/user/profile')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Request() req: any) {
    try {
      const user_id = req.user.user.id;
      const result = await this.gatewayApiService.getUserProfile(user_id);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get user profile',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('auth/user/profile')
  @UseGuards(JwtAuthGuard)
  async updateUserProfile(@Body() updateUserProfileDto: UpdateUserProfileDto, @Request() req: any) {
    try {
      const user_id = req.user.user.id;
      const result = await this.gatewayApiService.updateUserProfile(user_id, updateUserProfileDto);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update user profile',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auth/user/change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() req: any) {
    try {
      const user_id = req.user.user.id;

      const result = await this.gatewayApiService.changePassword(user_id, changePasswordDto);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to change password',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

  }

  @Post('auth/password/reset-request')
  async requestPasswordReset(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const result = await this.gatewayApiService.requestPasswordReset(resetPasswordDto);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to request password reset',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================== Item Endpoints ====================================
  @Post('items')
  @UseGuards(JwtAuthGuard)
  async createItem(@Body() createItemDto: CreateItemDto, @Request() req: any) {
    try {
      // User data is available from JWT token via req.user
 
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
  @UseGuards(JwtAuthGuard)
  async findAllItems(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_order') sort_order?: string,
  ) {
    try {

      const result = await this.gatewayApiService.findAllItems(page, limit, keyword, sort_by, sort_order);
      return result;

    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items/:id')
  @UseGuards(JwtAuthGuard)
  async findOneItem(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
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
  @UseGuards(JwtAuthGuard)
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req: any,
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
  @UseGuards(JwtAuthGuard)
  async removeItem(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
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

  // ==================================== Category Endpoints ====================================

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      const result = await this.gatewayApiService.createCategory(createCategoryDto);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  async getCategories(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('parentId') parentId?: string,
  ) {
    try {
      const result = await this.gatewayApiService.getCategories({ page, limit, parentId });
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch categories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('categories/tree')
  @UseGuards(JwtAuthGuard)
  async getCategoryTree() {
    try {
      const result = await this.gatewayApiService.getCategoryTree();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch category tree',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('categories/:id')
  @UseGuards(JwtAuthGuard)
  async getCategoryById(@Param('id') id: string) {
    try {
      const result = await this.gatewayApiService.getCategoryById(id);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('categories/slug/:slug')
  @UseGuards(JwtAuthGuard)
  async getCategoryBySlug(@Param('slug') slug: string) {
    try {
      const result = await this.gatewayApiService.getCategoryBySlug(slug);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      const result = await this.gatewayApiService.updateCategory(id, updateCategoryDto);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCategory(@Param('id') id: string) {
    try {
      const result = await this.gatewayApiService.deleteCategory(id);
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('categories/:parentId/children')
  @UseGuards(JwtAuthGuard)
  async getCategoryChildren(@Param('parentId') parentId: string) {
    try {
      const result = await this.gatewayApiService.getCategoryChildren(parentId);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch category children',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
