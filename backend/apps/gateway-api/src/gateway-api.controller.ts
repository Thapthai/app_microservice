import { Controller, Post, Body, Get, Headers, HttpException, HttpStatus, Put, Patch, Delete, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Request, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GatewayApiService } from './gateway-api.service';
import { RegisterDto, LoginDto, CreateItemDto, UpdateItemDto, ChangePasswordDto, UpdateUserProfileDto, ResetPasswordDto, CreateCategoryDto, UpdateCategoryDto, CreateMedicalSupplyUsageDto, UpdateMedicalSupplyUsageDto, RecordItemUsedWithPatientDto, RecordItemReturnDto, GetPendingItemsQueryDto, GetReturnHistoryQueryDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ClientCredentialGuard } from './guards/client-credential.guard';
import { FlexibleAuthGuard } from './guards/flexible-auth.guard';

@Controller()
export class GatewayApiController {
  constructor(private readonly gatewayApiService: GatewayApiService) { }

  @Get()
  getHello(): string {
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

  // ================================ Client Credential Endpoints ================================

  @Post('auth/client-credential/create')
  @UseGuards(JwtAuthGuard)
  async createClientCredential(@Body() clientCredentialDto: { name: string; description?: string; expires_at?: string }, @Request() req: any) {
    try {
      const user_id = req.user.user.id;
      const result = await this.gatewayApiService.createClientCredential(user_id, clientCredentialDto);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create client credential',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('auth/client-credential/list')
  @UseGuards(JwtAuthGuard)
  async listClientCredentials(@Request() req: any) {
    try {
      const user_id = req.user.user.id;
      const result = await this.gatewayApiService.listClientCredentials(user_id);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to list client credentials',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auth/client-credential/revoke')
  @UseGuards(JwtAuthGuard)
  async revokeClientCredential(@Body() data: { credentialId: number }, @Request() req: any) {
    try {
      const user_id = req.user.user.id;
      const result = await this.gatewayApiService.revokeClientCredential(user_id, data.credentialId);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to revoke client credential',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('auth/client-credential/update')
  @UseGuards(JwtAuthGuard)
  async updateClientCredential(@Body() data: { credentialId: number; expires_at?: string | null }, @Request() req: any) {
    try {
      const user_id = req.user.user.id;
      const result = await this.gatewayApiService.updateClientCredential(user_id, data.credentialId, {
        expires_at: data.expires_at,
      });

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update client credential',
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
  @UseGuards(FlexibleAuthGuard)
  async createItem(@Body() body: any) {
    try {
      const axios = require('axios');
      const itemServiceUrl = process.env.ITEM_SERVICE_URL || 'http://localhost:3009';

      const response = await axios.post(`${itemServiceUrl}/items`, body, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Gateway error:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to create item',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Upload endpoint (with file)
  @Post('items/upload')
  @UseInterceptors(FileInterceptor('picture', {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  @UseGuards(FlexibleAuthGuard)
  async createItemWithFile(@UploadedFile() file: any, @Body() body: any) {
    try {
      const axios = require('axios');
      const itemServiceUrl = process.env.ITEM_SERVICE_URL || 'http://localhost:3009';
      const FormData = require('form-data');

      const formData = new FormData();

      // Add all fields from body
      Object.keys(body).forEach(key => {
        if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
          formData.append(key, body[key]);
        }
      });

      // Add file
      if (file) {
        formData.append('picture', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }

      // Forward to item-service upload endpoint
      const response = await axios.post(`${itemServiceUrl}/items/upload`, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error) {
      console.error('❌ Gateway upload error:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to upload item',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items/stats')
  @UseGuards(FlexibleAuthGuard)
  async getItemsStats(
    @Request() req: any,
    @Query('cabinet_id') cabinet_id?: number,
    @Query('department_id') department_id?: number,
  ) {
    try {
      const result = await this.gatewayApiService.getItemsStats(cabinet_id, department_id);
      return result;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to fetch items stats',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items')
  @UseGuards(FlexibleAuthGuard)
  async findAllItems(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_order') sort_order?: string,
    @Query('cabinet_id') cabinet_id?: number,
    @Query('department_id') department_id?: number,
    @Query('status') status?: string,
  ) {
    try {
      const result = await this.gatewayApiService.findAllItems(page, limit, keyword, sort_by, sort_order, cabinet_id, department_id, status);
      return result;

    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to fetch items',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items/:id')
  @UseGuards(FlexibleAuthGuard)
  async findOneItem(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    try {
      const axios = require('axios');
      const itemServiceUrl = process.env.ITEM_SERVICE_URL || 'http://localhost:3009';

      const response = await axios.get(`${itemServiceUrl}/items/${id}`);
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to fetch item',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('item-stocks')
  @UseGuards(FlexibleAuthGuard)
  async findAllItemStock(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_order') sort_order?: string,
  ) {
    try {
      return await this.gatewayApiService.findAllItemStock(page, limit, keyword, sort_by, sort_order);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch item stocks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('items/:id')
  @UseInterceptors(FileInterceptor('picture', {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  @UseGuards(FlexibleAuthGuard)
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
    @Body() body: any,
    @Request() req: any,
  ) {
    try {
      const axios = require('axios');
      const FormData = require('form-data');
      const itemServiceUrl = process.env.ITEM_SERVICE_URL || 'http://localhost:3009';

      // สร้าง FormData สำหรับส่งไปยัง item-service
      const formData = new FormData();

      // เพิ่มทุก field จาก body
      Object.keys(body).forEach(key => {
        if (body[key] !== undefined && body[key] !== null) {
          formData.append(key, body[key]);
        }
      });

      // เพิ่ม file ถ้ามี
      if (file) {
        formData.append('picture', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }

      // Forward ไปยัง item-service
      const response = await axios.put(`${itemServiceUrl}/items/${id}`, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to update item',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('items/:id')
  @UseGuards(FlexibleAuthGuard)
  async removeItem(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    try {
      const axios = require('axios');
      const itemServiceUrl = process.env.ITEM_SERVICE_URL || 'http://localhost:3009';

      const response = await axios.delete(`${itemServiceUrl}/items/${id}`);
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to delete item',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('items/:itemcode/minmax')
  @UseGuards(FlexibleAuthGuard)
  async getItemMinMax(
    @Param('itemcode') itemcode: string,
    @Request() req: any
  ) {
    try {
      const result = await this.gatewayApiService.findOneItem(itemcode);
      if (result.success && result.data) {
        return {
          success: true,
          data: {
            itemcode: result.data.itemcode,
            itemname: result.data.itemname,
            Minimum: result.data.Minimum ?? 0,
            Maximum: result.data.Maximum ?? 0,
          },
        };
      }
      throw new HttpException(
        result.message || 'Item not found',
        HttpStatus.NOT_FOUND,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get item min/max',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('items/:itemcode/minmax')
  @UseGuards(FlexibleAuthGuard)
  async updateItemMinMax(
    @Param('itemcode') itemcode: string,
    @Body() updateMinMaxDto: any,
    @Request() req: any,
    @Query('cabinet_id') cabinet_id?: number
  ) {
    try {
      // ถ้ามี cabinet_id จาก query string ให้ merge เข้าไปใน updateMinMaxDto
      if (cabinet_id != null) {
        updateMinMaxDto = { ...updateMinMaxDto, cabinet_id };
      }
      const result = await this.gatewayApiService.updateItemMinMax(itemcode, updateMinMaxDto);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update item min/max',
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
  @UseGuards(FlexibleAuthGuard)
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
  @UseGuards(FlexibleAuthGuard)
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
  @UseGuards(FlexibleAuthGuard)
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
  @UseGuards(FlexibleAuthGuard)
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
  @UseGuards(FlexibleAuthGuard)
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
  @UseGuards(FlexibleAuthGuard)
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
  @UseGuards(FlexibleAuthGuard)
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
  @UseGuards(FlexibleAuthGuard)
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

  // ============================================================
  // MEDICAL SUPPLIES ENDPOINTS (Public for testing)
  // ============================================================

  @Post('medical-supplies')
  @UseGuards(FlexibleAuthGuard)
  async createMedicalSupplyUsage(@Body() data: any, @Request() req: any) {
    try {
      // Validate required fields based on format
      if (data.Order && Array.isArray(data.Order)) {
        // New format: Hospital, EN, HN, FirstName, Lastname, Order
        if (!data.EN || !data.HN || !data.FirstName || !data.Lastname) {
          throw new HttpException(
            'Missing required fields: EN, HN, FirstName, Lastname are required for Order format',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (data.supplies && Array.isArray(data.supplies)) {
        // Legacy format: patient_hn, patient_name_th, patient_name_en, supplies
        if (!data.patient_hn) {
          throw new HttpException(
            'Missing required field: patient_hn is required for supplies format',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        throw new HttpException(
          'Invalid data format. Expected either "Order" or "supplies" array.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Extract user information from request
      let userInfo = req.user;
      let userType = 'admin'; // Default for JWT authentication

      // Priority 1: If using Bearer token (JWT) → use admin
      if (req.user && !req.clientCredential) {
        userInfo = req.user;
        userType = 'admin';
      }
      // Priority 2: If client credential validated successfully → use userType from credential
      else if (req.clientCredential) {
        userInfo = req.clientCredential.user;
        userType = req.clientCredential.userType || 'admin';
      }
      // Priority 3: If admin validation failed but has client_id → pass to service to check staff
      else if (req.clientIdForStaffCheck) {
        // Pass client_id to service, service will check if it's staff
        userInfo = { client_id: req.clientIdForStaffCheck };
        userType = 'unknown'; // Will be determined by service
      } else {
        throw new HttpException(
          'Authentication required. Provide either Bearer token or client_id/client_secret headers.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Pass data with user information to service
      const result = await this.gatewayApiService.createMedicalSupplyUsage(data, { user: userInfo, userType });
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create medical supply usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies')
  @UseGuards(FlexibleAuthGuard)
  async getMedicalSupplyUsages(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patient_hn') patient_hn?: string,
    @Query('visit_date') visit_date?: string,
    @Query('department_code') department_code?: string,
    @Query('department_name') department_name?: string,
    @Query('print_date') print_date?: string,
    @Query('time_print_date') time_print_date?: string,
    @Query('billing_status') billing_status?: string,
    @Query('usage_type') usage_type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('keyword') keyword?: string,
    @Query('user_name') user_name?: string,
    @Query('first_name') first_name?: string,
    @Query('lastname') lastname?: string,
    @Query('assession_no') assession_no?: string,
  ) {
    try {
      const query = { page, limit, patient_hn, department_code, department_name, print_date, time_print_date, billing_status, usage_type, startDate, endDate, keyword, user_name, first_name, lastname, assession_no };
      const result = await this.gatewayApiService.getMedicalSupplyUsages(query);

      // Return data from service directly, only filter by visit_date if needed
      if (result.success && result.data) {
        let filteredData = result.data;

        // Filter by visit_date if provided (use created_at instead of usage_datetime)
        if (visit_date && result.data.length > 0) {
          filteredData = result.data.filter((item: any) => {
            if (!item.created_at) return false;
            const usageDate = item.created_at.split('T')[0];
            return usageDate === visit_date;
          });
        }

        // Return service response directly with filtered data (preserve all fields including recorded_by_name and recorded_by_display)
        return {
          status: 'success',
          data: filteredData,
          total: result.total || filteredData.length,
          page: result.page || page || 1,
          limit: result.limit || limit || 10,
          lastPage: result.lastPage || Math.ceil((result.total || filteredData.length) / (result.limit || limit || 10)),
        };
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get medical supply usages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies/logs')
  @UseGuards(FlexibleAuthGuard)
  async getMedicalSupplyUsageLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('usage_id') usage_id?: number,
    @Query('action') action?: string,
    @Query('method') method?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const query = { page, limit, usage_id, action, method, status, startDate, endDate };
      const result = await this.gatewayApiService.getMedicalSupplyUsageLogs(query);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get medical supply usage logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies/:id')
  @UseGuards(FlexibleAuthGuard)
  async getMedicalSupplyUsageById(@Param('id') id: string) {
    try {
      const result = await this.gatewayApiService.getMedicalSupplyUsageById(parseInt(id));
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get medical supply usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies/hn/:hn')
  @UseGuards(FlexibleAuthGuard)
  async getMedicalSupplyUsageByHN(@Param('hn') hn: string) {
    try {
      const result = await this.gatewayApiService.getMedicalSupplyUsageByHN(hn);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get medical supply usage by HN',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('medical-supplies/:id')
  @UseGuards(FlexibleAuthGuard)
  async updateMedicalSupplyUsage(@Param('id') id: string, @Body() updateData: UpdateMedicalSupplyUsageDto) {
    try {
      const result = await this.gatewayApiService.updateMedicalSupplyUsage(parseInt(id), updateData);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update medical supply usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('medical-supplies/:id')
  @UseGuards(FlexibleAuthGuard)
  async patchMedicalSupplyUsage(@Param('id') id: string, @Body() updateData: any) {
    try {
      const result = await this.gatewayApiService.updateMedicalSupplyUsage(parseInt(id), updateData);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update medical supply usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('medical-supplies/:id/print-info')
  @UseGuards(FlexibleAuthGuard)
  async updateMedicalSupplyPrintInfo(@Param('id') id: string, @Body() printData: any) {
    try {
      const result = await this.gatewayApiService.updateMedicalSupplyPrintInfo(parseInt(id), printData);
      return {
        status: 'success',
        message: 'Print information updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update print information',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('medical-supplies/:id')
  @UseGuards(FlexibleAuthGuard)
  async deleteMedicalSupplyUsage(@Param('id') id: string) {
    try {
      const result = await this.gatewayApiService.deleteMedicalSupplyUsage(parseInt(id));
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete medical supply usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies/statistics/all')
  @UseGuards(FlexibleAuthGuard)
  async getMedicalSupplyStatistics() {
    try {
      const result = await this.gatewayApiService.getMedicalSupplyStatistics();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get medical supply statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-dispensed-items')
  @UseGuards(FlexibleAuthGuard)
  async getDispensedItems(
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('departmentId') departmentId?: string,
    @Query('cabinetId') cabinetId?: string,
  ) {
    try {
      const filters: any = {};
      if (keyword) filters.keyword = keyword;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);
      if (departmentId) filters.departmentId = departmentId;
      if (cabinetId) filters.cabinetId = cabinetId;

      const result = await this.gatewayApiService.getDispensedItems(filters);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get dispensed items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-dispensed-items/export/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportDispensedItemsExcel(
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('cabinetId') cabinetId?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (departmentId) params.departmentId = departmentId;
      if (cabinetId) params.cabinetId = cabinetId;
      // Get all items for export (no pagination)
      params.page = 1;
      params.limit = 100000;

      const result = await this.gatewayApiService.generateDispensedItemsExcelReport(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Dispensed Items Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Dispensed Items Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-dispensed-items/export/pdf')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportDispensedItemsPDF(
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('cabinetId') cabinetId?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (departmentId) params.departmentId = departmentId;
      if (cabinetId) params.cabinetId = cabinetId;
      // Get all items for export (no pagination)
      params.page = 1;
      params.limit = 100000;

      const result = await this.gatewayApiService.generateDispensedItemsPDFReport(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Dispensed Items PDF report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Dispensed Items PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/dispensed-items-for-patients/export/excel')
  // @UseGuards(FlexibleAuthGuard)
  async exportDispensedItemsForPatientsExcel(
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('patientHn') patientHn?: string,
    @Query('departmentCode') departmentCode?: string,
    @Query('usageType') usageType?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (patientHn) params.patientHn = patientHn;
      if (departmentCode) params.departmentCode = departmentCode;
      if (usageType) params.usageType = usageType;

      const result = await this.gatewayApiService.generateDispensedItemsForPatientsReportExcel(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Dispensed Items for Patients Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Dispensed Items for Patients Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/dispensed-items-for-patients/export/pdf')
  // @UseGuards(FlexibleAuthGuard)
  async exportDispensedItemsForPatientsPDF(
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('patientHn') patientHn?: string,
    @Query('departmentCode') departmentCode?: string,
    @Query('usageType') usageType?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (patientHn) params.patientHn = patientHn;
      if (departmentCode) params.departmentCode = departmentCode;
      if (usageType) params.usageType = usageType;
      const result = await this.gatewayApiService.generateDispensedItemsForPatientsReportPdf(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Dispensed Items for Patients PDF report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Dispensed Items for Patients PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-comparison/summary')
  @UseGuards(FlexibleAuthGuard)
  async getDispensedVsUsageSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const result = await this.gatewayApiService.getDispensedVsUsageSummary(
        startDate && endDate ? { startDate, endDate } : undefined,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get dispensed vs usage summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-comparison')
  @UseGuards(FlexibleAuthGuard)
  async compareDispensedVsUsage(
    @Query('itemCode') itemCode?: string,
    @Query('itemTypeId') itemTypeId?: string,
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentCode') departmentCode?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const filters: any = {};
      if (itemCode) filters.itemCode = itemCode;
      if (itemTypeId) filters.itemTypeId = parseInt(itemTypeId, 10);
      if (keyword) filters.keyword = keyword;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (departmentCode) filters.departmentCode = departmentCode;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await this.gatewayApiService.compareDispensedVsUsage(filters);
      return result;  
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to compare dispensed vs usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-usage-by-item')
  @UseGuards(FlexibleAuthGuard)
  async getUsageByItemCode(
    @Query('itemCode') itemCode?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const filters: any = {};
      if (itemCode) filters.itemCode = itemCode;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await this.gatewayApiService.getUsageByItemCode(filters);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get usage by item code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-usage-by-order-item')
  @UseGuards(FlexibleAuthGuard)
  async getUsageByOrderItemCode(
    @Query('orderItemCode') orderItemCode?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('first_name') first_name?: string,
    @Query('lastname') lastname?: string,
    @Query('assession_no') assession_no?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const filters: any = {};
      if (orderItemCode) filters.orderItemCode = orderItemCode;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (first_name) filters.first_name = first_name;
      if (lastname) filters.lastname = lastname;
      if (assession_no) filters.assession_no = assession_no;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await this.gatewayApiService.getUsageByOrderItemCode(filters);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get usage by order item code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-usage-by-item-code')
  @UseGuards(FlexibleAuthGuard)
  async getUsageByItemCodeFromItemTable(
    @Query('itemCode') itemCode?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('first_name') first_name?: string,
    @Query('lastname') lastname?: string,
    @Query('assession_no') assession_no?: string,
    @Query('departmentCode') departmentCode?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const filters: any = {};
      if (itemCode) filters.itemCode = itemCode;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (first_name) filters.first_name = first_name;
      if (lastname) filters.lastname = lastname;
      if (assession_no) filters.assession_no = assession_no;
      if (departmentCode) filters.departmentCode = departmentCode;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await this.gatewayApiService.getUsageByItemCodeFromItemTable(filters);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get usage by item code from item table',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================
  // MEDICAL SUPPLY ITEM - QUANTITY MANAGEMENT ENDPOINTS
  // ============================================================

  @Post('medical-supply-items/record-used')
  @UseGuards(FlexibleAuthGuard)
  async recordItemUsedWithPatient(@Body() data: RecordItemUsedWithPatientDto) {
    try {
      const result = await this.gatewayApiService.recordItemUsedWithPatient(data);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to record item usage with patient',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('medical-supply-items/record-return')
  @UseGuards(FlexibleAuthGuard)
  async recordItemReturn(@Body() data: RecordItemReturnDto) {
    try {
      const result = await this.gatewayApiService.recordItemReturn(data);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to record item return',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supply-items/pending')
  @UseGuards(FlexibleAuthGuard)
  async getPendingItems(
    @Query('department_code') department_code?: string,
    @Query('patient_hn') patient_hn?: string,
    @Query('item_status') item_status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const query = { department_code, patient_hn, item_status, page, limit };
      const result = await this.gatewayApiService.getPendingItems(query);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get pending items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supply-items/return-history')
  @UseGuards(FlexibleAuthGuard)
  async getReturnHistory(
    @Query('department_code') department_code?: string,
    @Query('patient_hn') patient_hn?: string,
    @Query('return_reason') return_reason?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('page') page?: string | number,
    @Query('limit') limit?: string | number,
  ) {
    try {
      const pageNum = page != null ? Math.max(1, Number(page) || 1) : undefined;
      const limitNum = limit != null ? Math.min(100, Math.max(1, Number(limit) || 10)) : undefined;
      const query = { department_code, patient_hn, return_reason, date_from, date_to, page: pageNum, limit: limitNum };
      const result = await this.gatewayApiService.getReturnHistory(query);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get return history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supply-items/return-to-cabinet')
  @UseGuards(FlexibleAuthGuard)
  async getItemStocksForReturnToCabinet(
    @Query('itemCode') itemCode?: string,
    @Query('itemTypeId') itemTypeId?: number,
    @Query('rfidCode') rfidCode?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const filters = {
        itemCode,
        itemTypeId: itemTypeId ? Number(itemTypeId) : undefined,
        rfidCode,
        startDate,
        endDate,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      };
      const result = await this.gatewayApiService.getItemStocksForReturnToCabinet(filters);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get item stocks for return to cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('medical-supply-items/record-stock-return')
  @UseGuards(FlexibleAuthGuard)
  async recordStockReturn(@Body() data: { items: Array<{ item_stock_id: number; return_reason: string; return_note?: string }>; return_by_user_id?: string; stock_id?: number }, @Request() req: any) {
    try {
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        throw new HttpException('items is required and must not be empty', HttpStatus.BAD_REQUEST);
      }
      const returnByUserId = data.return_by_user_id || req.user?.user?.id || req.user?.id;
      if (!returnByUserId) {
        throw new HttpException('return_by_user_id is required', HttpStatus.UNAUTHORIZED);
      }
      const result = await this.gatewayApiService.recordStockReturns({
        items: data.items,
        return_by_user_id: String(returnByUserId),
        stock_id: data.stock_id,
      });
      return result;
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        error?.message || 'Failed to record stock return',
        status,
      );
    }
  }

  @Post('medical-supply-items/return-to-cabinet')
  @UseGuards(FlexibleAuthGuard)
  async returnItemsToCabinet(@Body() data: { rowIds: number[] }, @Request() req: any) {
    try {
      if (!data.rowIds || !Array.isArray(data.rowIds) || data.rowIds.length === 0) {
        throw new HttpException('Row IDs are required', HttpStatus.BAD_REQUEST);
      }
      const userId = req.user?.user?.id || req.user?.id;
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.UNAUTHORIZED);
      }
      const result = await this.gatewayApiService.returnItemsToCabinet(data.rowIds, userId);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to return items to cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supply-items/dispense-from-cabinet')
  @UseGuards(FlexibleAuthGuard)
  async getItemStocksForDispenseFromCabinet(
    @Query('itemCode') itemCode?: string,
    @Query('itemTypeId') itemTypeId?: number,
    @Query('rfidCode') rfidCode?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const filters = {
        itemCode,
        itemTypeId: itemTypeId ? Number(itemTypeId) : undefined,
        rfidCode,
        startDate,
        endDate,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      };
      const result = await this.gatewayApiService.getItemStocksForDispenseFromCabinet(filters);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get item stocks for dispense from cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('medical-supply-items/dispense-from-cabinet')
  @UseGuards(FlexibleAuthGuard)
  async dispenseItemsFromCabinet(@Body() data: { rowIds: number[] }, @Request() req: any) {
    try {
      if (!data.rowIds || !Array.isArray(data.rowIds) || data.rowIds.length === 0) {
        throw new HttpException('Row IDs are required', HttpStatus.BAD_REQUEST);
      }
      const userId = req.user?.user?.id || req.user?.id;
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.UNAUTHORIZED);
      }
      const result = await this.gatewayApiService.dispenseItemsFromCabinet(data.rowIds, userId);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to dispense items from cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supply-items/statistics')
  @UseGuards(FlexibleAuthGuard)
  async getQuantityStatistics(@Query('department_code') department_code?: string) {
    try {
      const result = await this.gatewayApiService.getQuantityStatistics(department_code);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get quantity statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('medical-supplies/cancel-bill')
  @UseGuards(FlexibleAuthGuard)
  async handleCancelBill(@Body() data: {
    usageId: number;
    supplyItemIds: number[];
    oldPrintDate: string;
    newPrintDate: string;
    newItems?: Array<{
      item_code: string;
      item_description: string;
      assession_no: string;
      qty: number;
      uom: string;
      item_status?: string;
    }>;
  }) {
    try {
      const result = await this.gatewayApiService.handleCancelBill(data);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to handle cancel bill',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('medical-supplies/cancel-bill/cross-day')
  @UseGuards(FlexibleAuthGuard)
  async handleCrossDayCancelBill(@Body() data: {
    en: string;
    hn: string;
    oldPrintDate: string;
    newPrintDate: string;
    cancelItems: Array<{
      assession_no: string;
      item_code: string;
      qty: number;
      status?: string;
    }>;
    newItems?: Array<{
      item_code: string;
      item_description: string;
      assession_no: string;
      qty: number;
      uom: string;
      item_status?: string;
    }>;
  }) {
    try {
      const result = await this.gatewayApiService.handleCrossDayCancelBill(data);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to handle cancel bill',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supply-items/returned-items')
  @UseGuards(FlexibleAuthGuard)
  async getReturnedItems(
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('departmentId') departmentId?: string,
    @Query('cabinetId') cabinetId?: string,
  ) {
    try {
      const filters: any = {};
      if (keyword) filters.keyword = keyword;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);
      if (departmentId) filters.departmentId = departmentId;
      if (cabinetId) filters.cabinetId = cabinetId;
      const result = await this.gatewayApiService.getReturnedItems(filters);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get returned items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supply-items/:id')
  @UseGuards(FlexibleAuthGuard)
  async getSupplyItemById(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.gatewayApiService.getSupplyItemById(id);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get supply item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supply-items/usage/:usageId')
  @UseGuards(FlexibleAuthGuard)
  async getSupplyItemsByUsageId(@Param('usageId', ParseIntPipe) usageId: number) {
    try {
      const result = await this.gatewayApiService.getSupplyItemsByUsageId(usageId);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get supply items by usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================== Report Endpoints ====================================

  @Get('reports/comparison/:usageId/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportComparisonExcel(@Param('usageId', ParseIntPipe) usageId: number, @Res() res) {
    try {
      const result = await this.gatewayApiService.generateComparisonExcel(usageId);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/comparison/:usageId/pdf')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportComparisonPDF(@Param('usageId', ParseIntPipe) usageId: number, @Res() res) {
    try {
      const result = await this.gatewayApiService.generateComparisonPDF(usageId);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate PDF report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/equipment-usage/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportEquipmentUsageExcel(
    @Res() res,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('hospital') hospital?: string,
    @Query('department') department?: string,
    @Query('usageIds') usageIds?: string
  ) {
    try {
      const params: {
        dateFrom?: string;
        dateTo?: string;
        hospital?: string;
        department?: string;
        usageIds?: number[];
      } = {
        dateFrom,
        dateTo,
        hospital,
        department,
      };

      // Parse usageIds from comma-separated string to array
      if (usageIds) {
        params.usageIds = usageIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      }

      const result = await this.gatewayApiService.generateEquipmentUsageExcel(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Equipment Usage Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Equipment Usage Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/equipment-usage/pdf')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportEquipmentUsagePDF(
    @Res() res,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('hospital') hospital?: string,
    @Query('department') department?: string,
    @Query('usageIds') usageIds?: string
  ) {
    try {
      const params: {
        dateFrom?: string;
        dateTo?: string;
        hospital?: string;
        department?: string;
        usageIds?: number[];
      } = {
        dateFrom,
        dateTo,
        hospital,
        department,
      };

      // Parse usageIds from comma-separated string to array
      if (usageIds) {
        params.usageIds = usageIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      }

      const result = await this.gatewayApiService.generateEquipmentUsagePDF(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Equipment Usage PDF report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Equipment Usage PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/equipment-disbursement/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportEquipmentDisbursementExcel(
    @Res() res,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('hospital') hospital?: string,
    @Query('department') department?: string
  ) {
    try {
      const params: {
        dateFrom?: string;
        dateTo?: string;
        hospital?: string;
        department?: string;
      } = {
        dateFrom,
        dateTo,
        hospital,
        department,
      };

      const result = await this.gatewayApiService.generateEquipmentDisbursementExcel(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Equipment Disbursement Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Equipment Disbursement Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/equipment-disbursement/pdf')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportEquipmentDisbursementPDF(
    @Res() res,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('hospital') hospital?: string,
    @Query('department') department?: string
  ) {
    try {
      const params: {
        dateFrom?: string;
        dateTo?: string;
        hospital?: string;
        department?: string;
      } = {
        dateFrom,
        dateTo,
        hospital,
        department,
      };

      const result = await this.gatewayApiService.generateEquipmentDisbursementPDF(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Equipment Disbursement PDF report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Equipment Disbursement PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-comparison/export/excel')
  async exportItemComparisonExcel(
    @Query('itemCode') itemCode?: string,
    @Query('itemTypeId') itemTypeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentCode') departmentCode?: string,
    @Query('includeUsageDetails') includeUsageDetails?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (itemCode) params.itemCode = itemCode;
      if (itemTypeId) params.itemTypeId = parseInt(itemTypeId);
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (departmentCode) params.departmentCode = departmentCode;
      params.includeUsageDetails = includeUsageDetails === 'true';

      const result = await this.gatewayApiService.generateItemComparisonExcelReport(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Item Comparison Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Item Comparison Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-comparison/export/pdf')
  async exportItemComparisonPDF(
    @Query('itemCode') itemCode?: string,
    @Query('itemTypeId') itemTypeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentCode') departmentCode?: string,
    @Query('includeUsageDetails') includeUsageDetails?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (itemCode) params.itemCode = itemCode;
      if (itemTypeId) params.itemTypeId = parseInt(itemTypeId);
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (departmentCode) params.departmentCode = departmentCode;
      params.includeUsageDetails = includeUsageDetails === 'true';

      const result = await this.gatewayApiService.generateItemComparisonPDFReport(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Item Comparison PDF report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Item Comparison PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== Staff User Management ====================

  @Post('staff-users')
  async createStaffUser(@Body() createStaffUserDto: any) {
    return this.gatewayApiService.createStaffUser(createStaffUserDto);
  }

  @Get('staff-users')
  async getAllStaffUsers() {
    return this.gatewayApiService.getAllStaffUsers();
  }

  @Get('staff-users/:id')
  async getStaffUserById(@Param('id') id: string) {
    return this.gatewayApiService.getStaffUserById(parseInt(id));
  }

  @Put('staff-users/:id')
  async updateStaffUser(@Param('id') id: string, @Body() updateStaffUserDto: any) {
    return this.gatewayApiService.updateStaffUser(parseInt(id), updateStaffUserDto);
  }

  @Delete('staff-users/:id')
  async deleteStaffUser(@Param('id') id: string) {
    return this.gatewayApiService.deleteStaffUser(parseInt(id));
  }

  @Post('staff-users/:id/regenerate-secret')
  async regenerateClientSecret(@Param('id') id: string, @Body() data?: any) {
    return this.gatewayApiService.regenerateClientSecret(parseInt(id), data);
  }

  @Post('staff-users/login')
  async staffUserLogin(@Body() loginDto: { email: string; password: string }) {
    return this.gatewayApiService.staffUserLogin(loginDto.email, loginDto.password);
  }

  @Get('staff/profile')
  @UseGuards(JwtAuthGuard)
  async getStaffProfile(@Request() req: any) {
    try {
      // Extract staff user ID from JWT token
      // JWT payload has sub field with staff user id
      const staffUserId = req.user?.sub;
      if (!staffUserId) {
        throw new HttpException('Staff user ID not found in token', HttpStatus.UNAUTHORIZED);
      }
      return this.gatewayApiService.getStaffUserProfile(staffUserId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get staff profile',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('staff/profile')
  @UseGuards(JwtAuthGuard)
  async updateStaffProfile(@Body() updateProfileDto: { fname?: string; lname?: string; email?: string; currentPassword?: string; newPassword?: string }, @Request() req: any) {
    try {
      // Extract staff user ID from JWT token
      // JWT payload has sub field with staff user id
      const staffUserId = req.user?.sub;
      if (!staffUserId) {
        throw new HttpException('Staff user ID not found in token', HttpStatus.UNAUTHORIZED);
      }
      return this.gatewayApiService.updateStaffUserProfile(staffUserId, updateProfileDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update staff profile',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== Staff Role Permissions ====================

  @Get('staff-role-permissions')
  async getAllRolePermissions() {
    return this.gatewayApiService.getAllRolePermissions();
  }

  @Get('staff-role-permissions/:role')
  async getRolePermissionsByRole(@Param('role') role: string) {
    return this.gatewayApiService.getRolePermissionsByRole(role);
  }

  @Post('staff-role-permissions')
  async upsertRolePermission(@Body() data: { role: string; menu_href: string; can_access: boolean }) {
    return this.gatewayApiService.upsertRolePermission(data);
  }

  @Put('staff-role-permissions/bulk')
  async bulkUpdateRolePermissions(@Body() body: { permissions: Array<{ role: string; menu_href: string; can_access: boolean }> }) {
    return this.gatewayApiService.bulkUpdateRolePermissions(body.permissions);
  }

  @Delete('staff-role-permissions/:id')
  async deleteRolePermission(@Param('id') id: string) {
    return this.gatewayApiService.deleteRolePermission(parseInt(id));
  }

  // ==================== Staff Roles Management ====================

  @Get('staff-roles')
  async getAllStaffRoles() {
    try {
      const result = await this.gatewayApiService.getAllStaffRoles();
      if (!result || !result.success) {
        throw new HttpException(
          result?.message || 'Failed to get staff roles',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return result;
    } catch (error) {
      console.error('❌ Get all staff roles error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get staff roles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('staff-roles/:id')
  async getStaffRoleById(@Param('id') id: string) {
    try {
      const result = await this.gatewayApiService.getStaffRoleById(parseInt(id));
      if (!result || !result.success) {
        throw new HttpException(
          result?.message || 'Failed to get staff role',
          HttpStatus.NOT_FOUND,
        );
      }
      return result;
    } catch (error) {
      console.error('❌ Get staff role by ID error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get staff role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('staff-roles')
  async createStaffRole(@Body() data: { code: string; name: string; description?: string; is_active?: boolean }) {
    try {
      const result = await this.gatewayApiService.createStaffRole(data);
      if (!result || !result.success) {
        throw new HttpException(
          result?.message || 'Failed to create staff role',
          HttpStatus.BAD_REQUEST,
        );
      }
      return result;
    } catch (error) {
      console.error('❌ Create staff role error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create staff role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('staff-roles/:id')
  async updateStaffRole(@Param('id') id: string, @Body() data: { name?: string; description?: string; is_active?: boolean }) {
    try {
      const result = await this.gatewayApiService.updateStaffRole(parseInt(id), data);
      if (!result || !result.success) {
        throw new HttpException(
          result?.message || 'Failed to update staff role',
          HttpStatus.BAD_REQUEST,
        );
      }
      return result;
    } catch (error) {
      console.error('❌ Update staff role error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update staff role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('staff-roles/:id')
  async deleteStaffRole(@Param('id') id: string) {
    try {
      const result = await this.gatewayApiService.deleteStaffRole(parseInt(id));
      if (!result || !result.success) {
        throw new HttpException(
          result?.message || 'Failed to delete staff role',
          HttpStatus.BAD_REQUEST,
        );
      }
      return result;
    } catch (error) {
      console.error('❌ Delete staff role error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete staff role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== Vending Reports Endpoints ====================

  @Get('reports/vending-mapping/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportVendingMappingExcel(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('printDate') printDate?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (printDate) params.printDate = printDate;

      const result = await this.gatewayApiService.generateVendingMappingExcel(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Vending Mapping Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Vending Mapping Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/vending-mapping/pdf')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportVendingMappingPDF(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('printDate') printDate?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (printDate) params.printDate = printDate;

      const result = await this.gatewayApiService.generateVendingMappingPDF(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Vending Mapping PDF report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Vending Mapping PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/unmapped-dispensed/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportUnmappedDispensedExcel(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'month',
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (groupBy) params.groupBy = groupBy;

      const result = await this.gatewayApiService.generateUnmappedDispensedExcel(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Unmapped Dispensed Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Unmapped Dispensed Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/unused-dispensed/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportUnusedDispensedExcel(
    @Query('date') date?: string,
    @Res() res?: any,
  ) {
    try {
      const params: any = {};
      if (date) params.date = date;

      const result = await this.gatewayApiService.generateUnusedDispensedExcel(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Unused Dispensed Excel report', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.send(Buffer.from(result.data.buffer));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Unused Dispensed Excel report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== Vending Reports Data (JSON) ====================

  @Get('reports/vending-mapping/data')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async getVendingMappingData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('printDate') printDate?: string,
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (printDate) params.printDate = printDate;

      const result = await this.gatewayApiService.getVendingMappingData(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to get Vending Mapping data', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        status: 'success',
        data: result.data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get Vending Mapping data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/unmapped-dispensed/data')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async getUnmappedDispensedData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'month',
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (groupBy) params.groupBy = groupBy;

      const result = await this.gatewayApiService.getUnmappedDispensedData(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to get Unmapped Dispensed data', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        status: 'success',
        data: result.data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get Unmapped Dispensed data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/unused-dispensed/data')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async getUnusedDispensedData(
    @Query('date') date?: string,
  ) {
    try {
      const params: any = {};
      if (date) params.date = date;

      const result = await this.gatewayApiService.getUnusedDispensedData(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to get Unused Dispensed data', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        status: 'success',
        data: result.data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get Unused Dispensed data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/cancel-bill/data')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async getCancelBillReportData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await this.gatewayApiService.getCancelBillReportData(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to get Cancel Bill data', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        status: 'success',
        data: result.data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get Cancel Bill data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/return/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportReturnReportExcel(
    @Res() res,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('return_reason') return_reason?: string,
    @Query('department_code') department_code?: string,
    @Query('patient_hn') patient_hn?: string,
  ) {
    try {
      const params: any = {};
      if (date_from) params.date_from = date_from;
      if (date_to) params.date_to = date_to;
      if (return_reason) params.return_reason = return_reason;
      if (department_code) params.department_code = department_code;
      if (patient_hn) params.patient_hn = patient_hn;

      const result = await this.gatewayApiService.generateReturnReportExcel(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Return Report Excel', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(Buffer.from(result.buffer, 'base64'));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Return Report Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/return/pdf')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportReturnReportPdf(
    @Res() res,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('return_reason') return_reason?: string,
    @Query('department_code') department_code?: string,
    @Query('patient_hn') patient_hn?: string,
  ) {
    try {
      const params: any = {};
      if (date_from) params.date_from = date_from;
      if (date_to) params.date_to = date_to;
      if (return_reason) params.return_reason = return_reason;
      if (department_code) params.department_code = department_code;
      if (patient_hn) params.patient_hn = patient_hn;

      const result = await this.gatewayApiService.generateReturnReportPdf(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Return Report PDF', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(Buffer.from(result.buffer, 'base64'));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Return Report PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/cancel-bill/excel')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportCancelBillReportExcel(
    @Res() res,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await this.gatewayApiService.generateCancelBillReportExcel(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Cancel Bill Report Excel', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(Buffer.from(result.buffer, 'base64'));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Cancel Bill Report Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/cancel-bill/pdf')
  // @UseGuards(FlexibleAuthGuard) // Comment สำหรับทดสอบ - Uncomment ก่อน production
  async exportCancelBillReportPdf(
    @Res() res,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await this.gatewayApiService.generateCancelBillReportPdf(params);

      if (!result.success) {
        throw new HttpException(result.error || 'Failed to generate Cancel Bill Report PDF', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(Buffer.from(result.buffer, 'base64'));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Cancel Bill Report PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/return-to-cabinet/excel')
  // @UseGuards(FlexibleAuthGuard)
  async exportReturnToCabinetReportExcel(
    @Res() res: any,
    @Query('keyword') keyword?: string,
    @Query('itemTypeId') itemTypeId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('cabinetId') cabinetId?: string,
  ) {
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (itemTypeId) params.itemTypeId = Number(itemTypeId);
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (departmentId) params.departmentId = departmentId;
      if (cabinetId) params.cabinetId = cabinetId;

      const result = await this.gatewayApiService.generateReturnToCabinetReportExcel(params);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Failed to generate Return To Cabinet Report Excel',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const buffer = Buffer.from(result.buffer, 'base64');
      const filename = result.filename || `return_to_cabinet_report_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', result.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Return To Cabinet Report Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/return-to-cabinet/pdf')
  // @UseGuards(FlexibleAuthGuard)
  async exportReturnToCabinetReportPdf(
    @Res() res: any,
    @Query('keyword') keyword?: string,
    @Query('itemTypeId') itemTypeId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('cabinetId') cabinetId?: string,
  ) {
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (itemTypeId) params.itemTypeId = Number(itemTypeId);
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (departmentId) params.departmentId = departmentId;
      if (cabinetId) params.cabinetId = cabinetId;

      const result = await this.gatewayApiService.generateReturnToCabinetReportPdf(params);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Failed to generate Return To Cabinet Report PDF',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const buffer = Buffer.from(result.buffer, 'base64');
      const filename = result.filename || `return_to_cabinet_report_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', result.contentType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Return To Cabinet Report PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/cabinet-stock/excel')
  // @UseGuards(FlexibleAuthGuard)
  async exportCabinetStockReportExcel(
    @Res() res: any,
    @Query('cabinetId') cabinetId?: string,
    @Query('cabinetCode') cabinetCode?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    try {
      const params: any = {};
      if (cabinetId) params.cabinetId = Number(cabinetId);
      if (cabinetCode) params.cabinetCode = cabinetCode;
      if (departmentId) params.departmentId = Number(departmentId);

      const result = await this.gatewayApiService.generateCabinetStockReportExcel(params);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Failed to generate Cabinet Stock Report Excel',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const buffer = Buffer.isBuffer(result.data?.buffer)
        ? result.data.buffer
        : Buffer.from(result.data?.buffer || '', 'base64');
      const filename = result.data?.filename || `cabinet_stock_report_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', result.data?.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Cabinet Stock Report Excel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/cabinet-stock/pdf')
  // @UseGuards(FlexibleAuthGuard)
  async exportCabinetStockReportPdf(
    @Res() res: any,
    @Query('cabinetId') cabinetId?: string,
    @Query('cabinetCode') cabinetCode?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    try {
      const params: any = {};
      if (cabinetId) params.cabinetId = Number(cabinetId);
      if (cabinetCode) params.cabinetCode = cabinetCode;
      if (departmentId) params.departmentId = Number(departmentId);

      const result = await this.gatewayApiService.generateCabinetStockReportPdf(params);

      if (!result.success) {
        throw new HttpException(
          result.error || 'Failed to generate Cabinet Stock Report PDF',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const buffer = Buffer.isBuffer(result.data?.buffer)
        ? result.data.buffer
        : Buffer.from(result.data?.buffer || '', 'base64');
      const filename = result.data?.filename || `cabinet_stock_report_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', result.data?.contentType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate Cabinet Stock Report PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================== Department REST API Endpoints ====================================
  // @Post('departments')
  // @UseGuards(FlexibleAuthGuard)
  // async createDepartment(@Body() data: any) {
  //   try {
  //     return await this.gatewayApiService.createDepartment(data);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to create department',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  @Get('departments')
  @UseGuards(FlexibleAuthGuard)
  async getAllDepartments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('keyword') keyword?: string,

  ) {
    try {
      const query: any = {};
      if (page) query.page = Number(page);
      if (limit) query.limit = Number(limit);
      if (keyword) query.keyword = keyword;


      return await this.gatewayApiService.getAllDepartments(query);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch departments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================== Item Stock Return REST API ====================================
  @Get('item-stocks/will-return')
  @UseGuards(FlexibleAuthGuard)
  async getItemStocksWillReturn() {
    try {
      const result = await this.gatewayApiService.findAllItemStockWillReturn();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch item stocks will return',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Get('departments/:id')
  // @UseGuards(FlexibleAuthGuard)
  // async getDepartmentById(@Param('id', ParseIntPipe) id: number) {
  //   try {
  //     return await this.gatewayApiService.getDepartmentById(id);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to fetch department',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // @Put('departments/:id')
  // @UseGuards(FlexibleAuthGuard)
  // async updateDepartment(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
  //   try {
  //     return await this.gatewayApiService.updateDepartment(id, data);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to update department',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // @Delete('departments/:id')
  // @UseGuards(FlexibleAuthGuard)
  // async deleteDepartment(@Param('id', ParseIntPipe) id: number) {
  //   try {
  //     return await this.gatewayApiService.deleteDepartment(id);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to delete department',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }


  // ==================================== Cabinet REST API Endpoints ====================================
  @Post('cabinets')
  @UseGuards(FlexibleAuthGuard)
  async createCabinet(@Body() data: any) {
    try {
      return await this.gatewayApiService.createCabinet(data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('cabinets')
  @UseGuards(FlexibleAuthGuard)
  async getAllCabinets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('keyword') keyword?: string,

  ) {
    try {
      return await this.gatewayApiService.getAllCabinets({ page, limit, keyword });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch cabinets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cabinets/:id')
  @UseGuards(FlexibleAuthGuard)
  async getCabinetById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.gatewayApiService.getCabinetById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('cabinets/:id')
  @UseGuards(FlexibleAuthGuard)
  async updateCabinet(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    try {
      return await this.gatewayApiService.updateCabinet(id, data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Delete('cabinets/:id')
  @UseGuards(FlexibleAuthGuard)
  async deleteCabinet(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.gatewayApiService.deleteCabinet(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================== Cabinet Department REST API Endpoints ====================================
  @Post('cabinet-departments')
  @UseGuards(FlexibleAuthGuard)
  async createCabinetDepartment(@Body() data: any) {
    try {
      return await this.gatewayApiService.createCabinetDepartment(data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create cabinet-department mapping',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cabinet-departments')
  @UseGuards(FlexibleAuthGuard)
  async getCabinetDepartments(
    @Query('cabinet_id') cabinet_id?: number,
    @Query('department_id') department_id?: number,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    try {
      const query: any = {};
      if (cabinet_id) query.cabinet_id = Number(cabinet_id);
      if (department_id) query.department_id = Number(department_id);
      if (status) query.status = status;
      if (keyword) query.keyword = keyword;

      return await this.gatewayApiService.getCabinetDepartments(query);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch cabinet-department mappings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('cabinet-departments/:id')
  @UseGuards(FlexibleAuthGuard)
  async updateCabinetDepartment(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    try {
      return await this.gatewayApiService.updateCabinetDepartment(id, data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update cabinet-department mapping',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('cabinet-departments/:id')
  @UseGuards(FlexibleAuthGuard)
  async deleteCabinetDepartment(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.gatewayApiService.deleteCabinetDepartment(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete cabinet-department mapping',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================== Item Stock In Cabinet API ===========================
  @Get('item-stocks/in-cabinet')
  @UseGuards(FlexibleAuthGuard)
  async findAllItemStockInCabinet(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('keyword') keyword?: string,
    @Query('cabinet_id') cabinet_id?: number,
  ) {
    try {
      return await this.gatewayApiService.findAllItemStockInCabinet({ page, limit, keyword, cabinet_id });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch item stocks in cabinet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
