import { Controller, Post, Body, Get, Headers, HttpException, HttpStatus, Put, Delete, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Request } from '@nestjs/common';
import { GatewayApiService } from './gateway-api.service';
import { RegisterDto, LoginDto, CreateItemDto, UpdateItemDto, ChangePasswordDto, UpdateUserProfileDto, ResetPasswordDto, CreateCategoryDto, UpdateCategoryDto, CreateMedicalSupplyUsageDto, UpdateMedicalSupplyUsageDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

  // ============================================================
  // HOUSEKEEPING ENDPOINTS (Admin only)
  // ============================================================

  @Get('housekeeping')
  @UseGuards(JwtAuthGuard)
  async getHousekeepingStatus() {
    try {
      const result = await this.gatewayApiService.getHousekeepingStatus();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get housekeeping status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('housekeeping/archive')
  @UseGuards(JwtAuthGuard)
  async triggerArchive(@Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number) {
    try {
      const result = await this.gatewayApiService.triggerArchive(days);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to trigger archive',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('housekeeping/archive/:tableName')
  @UseGuards(JwtAuthGuard)
  async triggerArchiveTable(
    @Param('tableName') tableName: string,
    @Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number,
  ) {
    try {
      const result = await this.gatewayApiService.triggerArchiveTable(tableName, days);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to trigger table archive',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('housekeeping/stats')
  @UseGuards(JwtAuthGuard)
  async getHousekeepingStats() {
    try {
      const result = await this.gatewayApiService.getHousekeepingStats();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get housekeeping statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================
  // MEDICAL SUPPLIES ENDPOINTS (Public for testing)
  // ============================================================

  @Post('medical-supplies')
  //  @UseGuards(JwtAuthGuard)
  async createMedicalSupplyUsage(@Body() data: CreateMedicalSupplyUsageDto) {
    try {
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
  // @UseGuards(JwtAuthGuard)
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
            status: 'success',
            data: {
              patient_hn: item.patient_hn,
              name_th: item.patient_name_th,
              name_en: item.patient_name_en,
            },
            supplies_count: item.supply_items?.length || 0,
            supplies_summary: item.supply_items?.map((supply: any) => ({
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
          };
        }

        // Multiple records - return array
        const transformedData = filteredData.map((item: any) => ({
          status: 'success',
          data: {
            patient_hn: item.patient_hn,
            name_th: item.patient_name_th,
            name_en: item.patient_name_en,
          },
          supplies_count: item.supply_items?.length || 0,
          supplies_summary: item.supply_items?.map((supply: any) => ({
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
  // @UseGuards(JwtAuthGuard)
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
  // @UseGuards(JwtAuthGuard)
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
  // @UseGuards(JwtAuthGuard)
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

  @Delete('medical-supplies/:id')
  // @UseGuards(JwtAuthGuard)
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
  // @UseGuards(JwtAuthGuard)
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

}
