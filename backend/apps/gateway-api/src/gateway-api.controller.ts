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

  // JSON endpoint (no file)
  @Post('items')
  @UseGuards(FlexibleAuthGuard)
  async createItem(@Body() body: any) {
    try {
      const axios = require('axios');
      const itemServiceUrl = process.env.ITEM_SERVICE_URL || 'http://localhost:3009';

      console.log('🌐 Gateway JSON received body:', JSON.stringify(body, null, 2));
      console.log('🌐 Body keys:', Object.keys(body || {}));

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

      console.log('🌐 Gateway Upload received body:', JSON.stringify(body, null, 2));
      console.log('🌐 Has file?', !!file);

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

  @Get('items')
  @UseGuards(FlexibleAuthGuard)
  async findAllItems(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_order') sort_order?: string,
  ) {
    try {
      const axios = require('axios');
      const itemServiceUrl = process.env.ITEM_SERVICE_URL || 'http://localhost:3009';

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (keyword) params.append('keyword', keyword);
      if (sort_by) params.append('sort_by', sort_by);
      if (sort_order) params.append('sort_order', sort_order);

      const response = await axios.get(`${itemServiceUrl}/items?${params.toString()}`);
      return response.data;

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
  async createMedicalSupplyUsage(@Body() data: any) {
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

      // Pass data directly to service (no transformation needed)
      const result = await this.gatewayApiService.createMedicalSupplyUsage(data);
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
    @Query('billing_status') billing_status?: string,
    @Query('usage_type') usage_type?: string,
  ) {
    try {
      const query = { page, limit, patient_hn, department_code, billing_status, usage_type };
      const result = await this.gatewayApiService.getMedicalSupplyUsages(query);

      // Transform response to match required format
      if (result.success && result.data) {
        // Filter by visit_date if provided
        let filteredData = result.data;
        if (visit_date && result.data.length > 0) {
          filteredData = result.data.filter((item: any) => {
            if (!item.usage_datetime) return false;
            // Extract date part from usage_datetime (YYYY-MM-DD)
            const usageDate = item.usage_datetime.split('T')[0];
            return usageDate === visit_date;
          });
        }

        // If single record (filtered by patient_hn and optionally visit_date), return single object
        if (patient_hn && filteredData.length === 1) {
          const item = filteredData[0];
          return {
            id: item.id, // เพิ่ม id ใน top level
            usage_id: item.id, // เพิ่ม usage_id ใน top level สำหรับ frontend
            status: 'success',
            data: {
              id: item.id, // เพิ่ม id สำหรับ frontend
              hospital: item.hospital,
              en: item.en,
              patient_hn: item.patient_hn,
              first_name: item.first_name,
              lastname: item.lastname,
              name_th: item.patient_name_th || `${item.first_name} ${item.lastname}`,
              name_en: item.patient_name_en || `${item.first_name} ${item.lastname}`,
              department_code: item.department_code, // เพิ่มแผนก
              usage_datetime: item.usage_datetime, // เพิ่มวันที่
            },
            supplies_count: item.supply_items?.length || 0,
            supplies_summary: item.supply_items?.map((supply: any) => ({
              order_item_code: supply.order_item_code,
              order_item_description: supply.order_item_description,
              assession_no: supply.assession_no,
              order_item_status: supply.order_item_status,
              qty: supply.qty,
              uom: supply.uom,
              // Legacy fields
              supply_code: supply.supply_code,
              supply_name: supply.supply_name,
              quantity: supply.quantity,
              unit: supply.unit,
              total_price: supply.total_price || 0,
            })) || [],
            usage_details: {
              usage_datetime: item.usage_datetime,
              usage_type: item.usage_type,
            },
            personnel: {
              recorded_by: item.recorded_by_user_id,
            },
            billing: {
              status: item.billing_status,
              subtotal: item.billing_subtotal || 0,
              tax: item.billing_tax || 0,
              total: item.billing_total || 0,
              currency: item.billing_currency || 'THB',
            },
            print_info: {
              twu: item.twu,
              print_location: item.print_location,
              print_date: item.print_date,
              time_print_date: item.time_print_date,
              update: item.update,
            },
            created_at: item.created_at,
            timestamp: item.created_at,
          };
        }

        // Multiple records - return array
        const transformedData = filteredData.map((item: any) => ({
          id: item.id, // เพิ่ม id เพื่อให้ frontend ใช้งาน
          status: 'success',
          data: {
            id: item.id, // เพิ่ม id ใน nested data ด้วย
            hospital: item.hospital,
            en: item.en,
            patient_hn: item.patient_hn,
            first_name: item.first_name,
            lastname: item.lastname,
            name_th: item.patient_name_th || `${item.first_name} ${item.lastname}`,
            name_en: item.patient_name_en || `${item.first_name} ${item.lastname}`,
          },
          supplies_count: item.supply_items?.length || 0,
          supplies_summary: item.supply_items?.map((supply: any) => ({
            order_item_code: supply.order_item_code,
            order_item_description: supply.order_item_description,
            assession_no: supply.assession_no,
            order_item_status: supply.order_item_status,
            qty: supply.qty,
            uom: supply.uom,
            // Legacy fields
            supply_code: supply.supply_code,
            supply_name: supply.supply_name,
            quantity: supply.quantity,
            unit: supply.unit,
            total_price: supply.total_price || 0,
          })) || [],
          usage_details: {
            usage_datetime: item.usage_datetime,
            usage_type: item.usage_type,
          },
          personnel: {
            recorded_by: item.recorded_by_user_id,
          },
          billing: {
            status: item.billing_status,
            subtotal: item.billing_subtotal || 0,
            tax: item.billing_tax || 0,
            total: item.billing_total || 0,
            currency: item.billing_currency || 'THB',
          },
          created_at: item.created_at,
          timestamp: item.created_at,
        }));

        return {
          status: 'success',
          data: transformedData,
          total: filteredData.length,
          page: result.page,
          limit: result.limit,
          timestamp: new Date().toISOString(),
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
    @Query('itemCode') itemCode?: string,
    @Query('itemTypeId') itemTypeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const filters: any = {};
      if (itemCode) filters.itemCode = itemCode;
      if (itemTypeId) filters.itemTypeId = parseInt(itemTypeId, 10);
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await this.gatewayApiService.getDispensedItems(filters);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get dispensed items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('medical-supplies-comparison')
  @UseGuards(FlexibleAuthGuard)
  async compareDispensedVsUsage(
    @Query('itemCode') itemCode?: string,
    @Query('itemTypeId') itemTypeId?: string,
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
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const query = { department_code, patient_hn, return_reason, date_from, date_to, page, limit };
      const result = await this.gatewayApiService.getReturnHistory(query);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get return history',
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

}
