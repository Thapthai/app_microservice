import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class GatewayApiService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('ITEM_SERVICE') private readonly itemClient: ClientProxy,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
    @Inject('CATEGORY_SERVICE') private readonly categoryClient: ClientProxy,
    @Inject('MEDICAL_SUPPLIES_SERVICE') private readonly medicalSuppliesClient: ClientProxy,
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,
    @Inject('DEPARTMENT_SERVICE') private readonly departmentClient: ClientProxy,
  ) { }

  getHello(): string {
    return 'Gateway API is running!';
  }

  async register(registerDto: RegisterDto) {
    return this.authClient.send('auth.register', registerDto).toPromise();
  }

  async login(loginDto: LoginDto) {
    return this.authClient.send('auth.login', loginDto).toPromise();
  }

  async validateToken(token: string) {
    return this.authClient.send('auth.validate', token).toPromise();
  }

  async firebaseLogin(idToken: string) {
    return this.authClient.send('auth.firebase.login', { idToken }).toPromise();
  }

  // ==================================== Item Service Methods ====================================
  async createItem(createItemDto: any) {
    return this.itemClient.send('item.create', createItemDto).toPromise();
  }

  async findAllItems(page: number, limit: number, keyword?: string, sortBy?: string, sortOrder?: string, cabinet_id?: number, department_id?: number, status?: string) {
    const query = { page, limit, keyword, sort_by: sortBy, sort_order: sortOrder, cabinet_id: cabinet_id, department_id: department_id, status: status };
    return this.itemClient.send('item.findAll', query).toPromise();
  }

  async findOneItem(itemcode: string) {
    return this.itemClient.send('item.findOne', itemcode).toPromise();
  }

  async updateItem(itemcode: string, updateItemDto: any) {
    return this.itemClient.send('item.update', { itemcode, updateItemDto }).toPromise();
  }

  async removeItem(id: number) {
    return this.itemClient.send('item.remove', id).toPromise();
  }

  async findItemsByUser(user_id: number) {
    return this.itemClient.send('item.findByUser', user_id).toPromise();
  }

  async updateItemMinMax(itemcode: string, updateMinMaxDto: any) {
    return this.itemClient.send('item.updateMinMax', { itemcode, updateMinMaxDto }).toPromise();
  }

  async getItemsStats(cabinet_id?: number, department_id?: number) {
    return this.itemClient.send('item.getStats', { cabinet_id, department_id }).toPromise();
  }

  async findAllItemStock(page: number, limit: number, keyword?: string, sortBy?: string, sortOrder?: string) {
    const query = { page, limit, keyword, sort_by: sortBy, sort_order: sortOrder };
    return this.itemClient.send('itemStock.findAll', query).toPromise();
  }

  // ==================================== Email Service Methods ====================================

  async sendEmail(emailData: any) {
    return this.emailClient.send('email.send', emailData).toPromise();
  }

  async sendTemplateEmail(templateData: any) {
    return this.emailClient.send('email.sendTemplate', templateData).toPromise();
  }

  async sendWelcomeEmail(email: string, name: string, additionalData?: any) {
    return this.emailClient.send('email.sendWelcome', { email, name, additionalData }).toPromise();
  }

  async sendEmailVerification(email: string, name: string, verificationCode: string, verificationUrl: string) {
    return this.emailClient.send('email.sendVerification', {
      email,
      name,
      verificationCode,
      verificationUrl
    }).toPromise();
  }

  async sendPasswordReset(email: string, name: string, resetCode: string, resetUrl: string) {
    return this.emailClient.send('email.sendPasswordReset', {
      email,
      name,
      resetCode,
      resetUrl
    }).toPromise();
  }

  async testEmailConnection() {
    return this.emailClient.send('email.testConnection', {}).toPromise();
  }

  // ================================ 2FA Methods ================================

  async enable2FA(token: string, password: string) {
    // First validate the token to get user info
    const tokenValidation = await this.validateToken(token);

    if (!tokenValidation.success) {
      throw new Error('Invalid token');
    }

    const user_id = tokenValidation.data.user.id;
    return this.authClient.send('auth.2fa.enable', { user_id, password }).toPromise();
  }

  async verify2FASetup(token: string, secret: string, totpToken: string) {
    // First validate the token to get user info
    const tokenValidation = await this.validateToken(token);
    if (!tokenValidation.success) {
      throw new Error('Invalid token');
    }

    const user_id = tokenValidation.data.user.id;
    return this.authClient.send('auth.2fa.verify-setup', {
      user_id,
      verifyDto: {
        secret,
        token: totpToken
      }
    }).toPromise();
  }

  async disable2FA(token: string, password: string, totpToken?: string) {
    // First validate the token to get user info
    const tokenValidation = await this.validateToken(token);
    if (!tokenValidation.success) {
      throw new Error('Invalid token');
    }

    const user_id = tokenValidation.data.user.id;
    return this.authClient.send('auth.2fa.disable', { user_id, password, token: totpToken }).toPromise();
  }

  async loginWith2FA(tempToken: string, code: string, type?: string) {
    return this.authClient.send('auth.login.2fa', { tempToken, code, type }).toPromise();
  }

  // ================================ User Management Methods ================================

  async getUserProfile(user_id: number) {
    return this.authClient.send('auth.user.profile', user_id).toPromise();
  }

  async updateUserProfile(user_id: number, updateUserProfileDto: any) {
    return this.authClient.send('auth.user.update-profile', {
      user_id,
      updateUserProfileDto
    }).toPromise();
  }

  async changePassword(user_id: number, changePasswordDto: any) {

    return this.authClient.send('auth.user.change-password', {
      user_id,
      changePasswordDto
    }).toPromise();
  }

  async requestPasswordReset(resetPasswordDto: any) {
    return this.authClient.send('auth.password.reset-request', resetPasswordDto).toPromise();
  }

  // ==================================== Category Service Methods ====================================

  async createCategory(createCategoryDto: any) {
    return this.categoryClient.send('category.create', createCategoryDto).toPromise();
  }

  async getCategories(params: { page: number; limit: number; parentId?: string }) {
    return this.categoryClient.send('category.findAll', params).toPromise();
  }

  async getCategoryById(id: string) {
    return this.categoryClient.send('category.findOne', id).toPromise();
  }

  async getCategoryBySlug(slug: string) {
    return this.categoryClient.send('category.findBySlug', slug).toPromise();
  }

  async updateCategory(id: string, updateCategoryDto: any) {
    return this.categoryClient.send('category.update', { id, updateCategoryDto }).toPromise();
  }

  async deleteCategory(id: string) {
    return this.categoryClient.send('category.remove', id).toPromise();
  }

  async getCategoryTree() {
    return this.categoryClient.send('category.getTree', {}).toPromise();
  }

  async getCategoryChildren(parentId: string) {
    return this.categoryClient.send('category.getChildren', parentId).toPromise();
  }

  // ==================================== Medical Supplies Service Methods ====================================
  async checkStaffUser(client_id: string) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.checkStaffUser' }, { client_id }).toPromise();
  }

  async createMedicalSupplyUsage(data: any, userContext?: { user: any; userType: string }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.create' }, { ...data, _userContext: userContext }).toPromise();
  }

  async getMedicalSupplyUsages(query: any) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findAll' }, query).toPromise();
  }

  async getMedicalSupplyUsageById(id: number) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findOne' }, { id }).toPromise();
  }

  async getMedicalSupplyUsageByHN(hn: string) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findByPatientHN' }, { patient_hn: hn }).toPromise();
  }

  async updateMedicalSupplyUsage(id: number, updateData: any) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.update' }, { id, updateData }).toPromise();
  }

  async updateMedicalSupplyPrintInfo(id: number, printData: any) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.updatePrintInfo' }, { id, printData }).toPromise();
  }

  async deleteMedicalSupplyUsage(id: number) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.remove' }, { id }).toPromise();
  }

  async updateBillingStatus(id: number, status: string) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.updateBillingStatus' }, { id, status }).toPromise();
  }

  async getMedicalSupplyUsageByDepartment(department_code: string) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findByDepartment' }, { department_code }).toPromise();
  }

  async getMedicalSupplyStatistics() {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.statistics' }, {}).toPromise();
  }

  async getMedicalSupplyUsageLogs(query: { page?: number; limit?: number; usage_id?: number; action?: string; method?: string; status?: string; startDate?: string; endDate?: string }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage_logs.findAll' }, query).toPromise();
  }

  // ==================================== Quantity Management Methods ====================================

  async recordItemUsedWithPatient(data: any) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.recordUsedWithPatient' }, data).toPromise();
  }

  async recordItemReturn(data: any) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.recordReturn' }, data).toPromise();
  }

  async getPendingItems(query: any) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getPendingItems' }, query).toPromise();
  }

  async getReturnHistory(query: any) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getReturnHistory' }, query).toPromise();
  }

  async getItemStocksForReturnToCabinet(filters?: {
    itemCode?: string;
    itemTypeId?: number;
    rfidCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getItemStocksForReturnToCabinet' }, filters || {}).toPromise();
  }

  async recordStockReturns(data: {
    items: Array<{ item_stock_id: number; return_reason: string; return_note?: string }>;
    return_by_user_id: string;
    stock_id?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.recordStockReturns' }, data).toPromise();
  }

  async returnItemsToCabinet(rowIds: number[], userId: number) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.returnItemsToCabinet' }, { rowIds, userId }).toPromise();
  }

  async getItemStocksForDispenseFromCabinet(filters?: {
    itemCode?: string;
    itemTypeId?: number;
    rfidCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getItemStocksForDispenseFromCabinet' }, filters || {}).toPromise();
  }

  async dispenseItemsFromCabinet(rowIds: number[], userId: number) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.dispenseItemsFromCabinet' }, { rowIds, userId }).toPromise();
  }

  async getReturnedItems(filters?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.getReturnedItems' }, filters || {}).toPromise();
  }

  async getQuantityStatistics(department_code?: string) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getQuantityStatistics' }, { department_code }).toPromise();
  }

  async getSupplyItemById(itemId: number) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getById' }, { item_id: itemId }).toPromise();
  }

  async getSupplyItemsByUsageId(usageId: number) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usageId }).toPromise();
  }

  async handleCrossDayCancelBill(data: {
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
    return firstValueFrom(
      this.medicalSuppliesClient.send({ cmd: 'medical_supply.handleCrossDayCancelBill' }, data)
    );
  }

  async handleCancelBill(data: {
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
    return firstValueFrom(
      this.medicalSuppliesClient.send({ cmd: 'medical_supply.handleCancelBill' }, data)
    );
  }

  // ================================ Client Credential Methods ================================

  async createClientCredential(user_id: number, clientCredentialDto: any) {
    return this.authClient.send('auth.client-credential.create', {
      user_id,
      clientCredentialDto
    }).toPromise();
  }

  async listClientCredentials(user_id: number) {
    return this.authClient.send('auth.client-credential.list', user_id).toPromise();
  }

  async revokeClientCredential(user_id: number, credentialId: number) {
    return this.authClient.send('auth.client-credential.revoke', {
      user_id,
      credentialId
    }).toPromise();
  }

  async updateClientCredential(user_id: number, credentialId: number, dto: { expires_at?: string | null }) {
    return this.authClient.send('auth.client-credential.update', {
      user_id,
      credentialId,
      dto
    }).toPromise();
  }

  // ==================================== Report Service Methods ====================================
  async generateComparisonExcel(usageId: number) {
    return this.reportClient.send({ cmd: 'report.comparison.excel' }, { usageId }).toPromise();
  }

  async generateComparisonPDF(usageId: number) {
    return this.reportClient.send({ cmd: 'report.comparison.pdf' }, { usageId }).toPromise();
  }

  async generateEquipmentUsageExcel(params: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
    usageIds?: number[];
  }) {
    return this.reportClient.send({ cmd: 'report.equipment_usage.excel' }, params).toPromise();
  }

  async generateEquipmentUsagePDF(params: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
    usageIds?: number[];
  }) {
    return this.reportClient.send({ cmd: 'report.equipment_usage.pdf' }, params).toPromise();
  }

  async generateEquipmentDisbursementExcel(params: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }) {
    return this.reportClient.send({ cmd: 'report.equipment_disbursement.excel' }, params).toPromise();
  }

  async generateEquipmentDisbursementPDF(params: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }) {
    return this.reportClient.send({ cmd: 'report.equipment_disbursement.pdf' }, params).toPromise();
  }

  async getDispensedItems(filters?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.getDispensedItems' }, filters || {}).toPromise();
  }

  async generateDispensedItemsExcelReport(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }) {
    return this.reportClient.send({ cmd: 'report.dispensed_items.excel' }, params).toPromise();
  }

  async generateDispensedItemsPDFReport(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }) {
    return this.reportClient.send({ cmd: 'report.dispensed_items.pdf' }, params).toPromise();
  }

  async compareDispensedVsUsage(filters?: {
    itemCode?: string;
    itemTypeId?: number;
    keyword?: string;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    page?: number;
    limit?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.compareDispensedVsUsage' }, filters || {}).toPromise();
  }

  async getDispensedVsUsageSummary(filters?: { startDate?: string; endDate?: string }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.getDispensedVsUsageSummary' }, filters || {}).toPromise();
  }

  async getUsageByItemCode(filters?: {
    itemCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.getUsageByItemCode' }, filters || {}).toPromise();
  }

  async getUsageByOrderItemCode(filters?: {
    orderItemCode?: string;
    startDate?: string;
    endDate?: string;
    first_name?: string;
    lastname?: string;
    assession_no?: string;
    page?: number;
    limit?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.getUsageByOrderItemCode' }, filters || {}).toPromise();
  }

  async getUsageByItemCodeFromItemTable(filters?: {
    itemCode?: string;
    startDate?: string;
    endDate?: string;
    first_name?: string;
    lastname?: string;
    assession_no?: string;
    page?: number;
    limit?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.getUsageByItemCodeFromItemTable' }, filters || {}).toPromise();
  }

  // Report Service Methods
  async generateItemComparisonExcelReport(params: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    includeUsageDetails?: boolean;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.item_comparison.excel' }, params)
    );
  }

  async generateItemComparisonPDFReport(params: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    includeUsageDetails?: boolean;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.item_comparison.pdf' }, params)
    );
  }

  // ==================== Staff User Management ====================

  async createStaffUser(data: any) {
    return this.authClient.send('auth.staff.create', data).toPromise();
  }

  async getAllStaffUsers() {
    return this.authClient.send('auth.staff.getAll', {}).toPromise();
  }

  async getStaffUserById(id: number) {
    return this.authClient.send('auth.staff.getById', id).toPromise();
  }

  async updateStaffUser(id: number, data: any) {
    return this.authClient.send('auth.staff.update', { id, data }).toPromise();
  }

  async deleteStaffUser(id: number) {
    return this.authClient.send('auth.staff.delete', id).toPromise();
  }

  async regenerateClientSecret(id: number, data?: any) {
    return this.authClient.send('auth.staff.regenerateSecret', { id, data }).toPromise();
  }

  async staffUserLogin(email: string, password: string) {
    return this.authClient.send('auth.staff.login', { email, password }).toPromise();
  }

  async getStaffUserProfile(id: number) {
    return this.authClient.send('auth.staff.getProfile', id).toPromise();
  }

  async updateStaffUserProfile(id: number, data: any) {
    return this.authClient.send('auth.staff.updateProfile', { id, data }).toPromise();
  }

  // ==================== Staff Role Permissions ====================

  async getAllRolePermissions() {
    return this.authClient.send('auth.staff.rolePermissions.getAll', {}).toPromise();
  }

  async getRolePermissionsByRole(role: string) {
    return this.authClient.send('auth.staff.rolePermissions.getByRole', role).toPromise();
  }

  async upsertRolePermission(data: { role: string; menu_href: string; can_access: boolean }) {
    return this.authClient.send('auth.staff.rolePermissions.upsert', data).toPromise();
  }

  async bulkUpdateRolePermissions(permissions: Array<{ role: string; menu_href: string; can_access: boolean }>) {
    return this.authClient.send('auth.staff.rolePermissions.bulkUpdate', permissions).toPromise();
  }

  async deleteRolePermission(id: number) {
    return this.authClient.send('auth.staff.rolePermissions.delete', id).toPromise();
  }

  // ==================== Staff Roles Management ====================

  async getAllStaffRoles() {
    try {
      return await firstValueFrom(
        this.authClient.send('auth.staff.roles.getAll', {}).pipe(
          // Add timeout and error handling
          catchError((error) => {
            console.error('❌ Error calling auth service (getAllStaffRoles):', error);
            throw error;
          })
        )
      );
    } catch (error) {
      console.error('❌ Failed to get all staff roles:', error);
      // Check if it's a connection error
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          success: false,
          message: 'ไม่สามารถเชื่อมต่อกับ Auth Service ได้ กรุณาตรวจสอบว่า Auth Service ทำงานอยู่',
          error: 'Service connection error'
        };
      }
      throw error;
    }
  }

  async getStaffRoleById(id: number) {
    try {
      return await firstValueFrom(
        this.authClient.send('auth.staff.roles.getById', id).pipe(
          catchError((error) => {
            console.error('❌ Error calling auth service (getStaffRoleById):', error);
            throw error;
          })
        )
      );
    } catch (error) {
      console.error('❌ Failed to get staff role by ID:', error);
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          success: false,
          message: 'ไม่สามารถเชื่อมต่อกับ Auth Service ได้',
          error: 'Service connection error'
        };
      }
      throw error;
    }
  }

  async createStaffRole(data: { code: string; name: string; description?: string; is_active?: boolean }) {
    try {
      return await firstValueFrom(
        this.authClient.send('auth.staff.roles.create', data).pipe(
          catchError((error) => {
            console.error('❌ Error calling auth service (createStaffRole):', error);
            throw error;
          })
        )
      );
    } catch (error) {
      console.error('❌ Failed to create staff role:', error);
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          success: false,
          message: 'ไม่สามารถเชื่อมต่อกับ Auth Service ได้',
          error: 'Service connection error'
        };
      }
      throw error;
    }
  }

  async updateStaffRole(id: number, data: { name?: string; description?: string; is_active?: boolean }) {
    try {
      return await firstValueFrom(
        this.authClient.send('auth.staff.roles.update', { id, data }).pipe(
          catchError((error) => {
            console.error('❌ Error calling auth service (updateStaffRole):', error);
            throw error;
          })
        )
      );
    } catch (error) {
      console.error('❌ Failed to update staff role:', error);
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          success: false,
          message: 'ไม่สามารถเชื่อมต่อกับ Auth Service ได้',
          error: 'Service connection error'
        };
      }
      throw error;
    }
  }

  async deleteStaffRole(id: number) {
    try {
      return await firstValueFrom(
        this.authClient.send('auth.staff.roles.delete', id).pipe(
          catchError((error) => {
            console.error('❌ Error calling auth service (deleteStaffRole):', error);
            throw error;
          })
        )
      );
    } catch (error) {
      console.error('❌ Failed to delete staff role:', error);
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          success: false,
          message: 'ไม่สามารถเชื่อมต่อกับ Auth Service ได้',
          error: 'Service connection error'
        };
      }
      throw error;
    }
  }

  // ==================== Vending Reports ====================

  async generateVendingMappingExcel(params: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.vending_mapping.excel' }, params)
    );
  }

  async generateVendingMappingPDF(params: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.vending_mapping.pdf' }, params)
    );
  }

  async generateUnmappedDispensedExcel(params: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'month';
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.unmapped_dispensed.excel' }, params)
    );
  }

  async generateUnusedDispensedExcel(params: {
    date?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.unused_dispensed.excel' }, params)
    );
  }

  async getVendingMappingData(params: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.vending_mapping.data' }, params)
    );
  }

  async getUnmappedDispensedData(params: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'month';
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.unmapped_dispensed.data' }, params)
    );
  }

  async getUnusedDispensedData(params: {
    date?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.unused_dispensed.data' }, params)
    );
  }

  async getCancelBillReportData(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.cancel_bill.data' }, params)
    );
  }

  async generateReturnReportExcel(params: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.return.excel' }, params)
    );
  }

  async generateReturnReportPdf(params: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.return.pdf' }, params)
    );
  }

  async generateCancelBillReportExcel(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.cancel_bill.excel' }, params)
    );
  }

  async generateCancelBillReportPdf(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.cancel_bill.pdf' }, params)
    );
  }

  async generateReturnToCabinetReportExcel(params: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.return_to_cabinet.excel' }, params)
    );
  }

  async generateReturnToCabinetReportPdf(params: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.return_to_cabinet.pdf' }, params)
    );
  }

  async generateCabinetStockReportExcel(params: {
    cabinetId?: number;
    cabinetCode?: string;
    departmentId?: number;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.cabinet_stock.excel' }, params)
    );
  }

  async generateCabinetStockReportPdf(params: {
    cabinetId?: number;
    cabinetCode?: string;
    departmentId?: number;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.cabinet_stock.pdf' }, params)
    );
  }

  async getCabinetStockReportData(params: {
    cabinetId?: number;
    cabinetCode?: string;
    departmentId?: number;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.cabinet_stock.data' }, params)
    );
  }

  async generateDispensedItemsForPatientsReportExcel(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    usageType?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.dispensed_items_for_patients.excel' }, params)
    );
  }

  async generateDispensedItemsForPatientsReportPdf(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    usageType?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.dispensed_items_for_patients.pdf' }, params)
    );
  }

  async getDispensedItemsForPatientsReportData(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    usageType?: string;
  }): Promise<any> {
    return firstValueFrom(
      this.reportClient.send({ cmd: 'report.dispensed_items_for_patients.data' }, params)
    );
  }

  // ==================================== Department Service Methods ====================================
  // async createDepartment(data: any) {
  //   try {
  //     return await firstValueFrom(
  //       this.departmentClient.send('department.create', data).pipe(
  //         catchError((error) => {
  //           throw new Error(error?.message || 'Failed to create department');
  //         })
  //       )
  //     );
  //   } catch (error) {
  //     throw new Error(error?.message || 'Department service unavailable');
  //   }
  // }

  async getAllDepartments(params?: { page?: number; limit?: number; keyword?: string }) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('department.findAll', params || {}).pipe(
          catchError((error) => {
            console.error('Department service error:', error);
            throw new Error(error?.message || 'Failed to fetch departments');
          })
        )
      );
    } catch (error) {
      console.error('Department service connection error:', error);
      throw new Error(error?.message || 'Department service unavailable');
    }
  }

  // async getDepartmentById(id: number) {
  //   try {
  //     return await firstValueFrom(
  //       this.departmentClient.send('department.findOne', id).pipe(
  //         catchError((error) => {
  //           throw new Error(error?.message || 'Failed to fetch department');
  //         })
  //       )
  //     );
  //   } catch (error) {
  //     throw new Error(error?.message || 'Department service unavailable');
  //   }
  // }

  // async updateDepartment(id: number, data: any) {
  //   try {
  //     return await firstValueFrom(
  //       this.departmentClient.send('department.update', { id, data }).pipe(
  //         catchError((error) => {
  //           throw new Error(error?.message || 'Failed to update department');
  //         })
  //       )
  //     );
  //   } catch (error) {
  //     throw new Error(error?.message || 'Department service unavailable');
  //   }
  // }

  // async deleteDepartment(id: number) {
  //   try {
  //     return await firstValueFrom(
  //       this.departmentClient.send('department.delete', id).pipe(
  //         catchError((error) => {
  //           throw new Error(error?.message || 'Failed to delete department');
  //         })
  //       )
  //     );
  //   } catch (error) {
  //     throw new Error(error?.message || 'Department service unavailable');
  //   }
  // }


  // =========================== Cabinet CRUD operations ===========================
  async createCabinet(data: any) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinet.create', data).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to create cabinet');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }
  async getAllCabinets(params?: { page?: number; limit?: number; keyword?: string }) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinet.findAll', params || {}).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to fetch cabinets');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }

  async getCabinetById(id: number) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinet.findOne', id).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to fetch cabinet');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }

  async updateCabinet(id: number, data: any) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinet.update', { id, data }).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to update cabinet');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }

  async deleteCabinet(id: number) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinet.delete', id).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to delete cabinet');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }

  // =========================== Cabinet Department CRUD operations ===========================
  async createCabinetDepartment(data: any) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinetDepartment.create', data).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to create cabinet department mapping');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }

  async getCabinetDepartments(query?: { cabinetId?: number; departmentId?: number; status?: string; keyword?: string }) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinetDepartment.findAll', query || {}).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to fetch cabinet departments');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }

  async updateCabinetDepartment(id: number, data: any) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinetDepartment.update', { id, data }).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to update cabinet department');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }

  async deleteCabinetDepartment(id: number) {
    try {
      return await firstValueFrom(
        this.departmentClient.send('cabinetDepartment.delete', id).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to delete cabinet department');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Department service unavailable');
    }
  }


  // =========================== Item Stock In Cabinet API ===========================
  async findAllItemStockInCabinet(params?: { page?: number; limit?: number; keyword?: string; cabinet_id?: number }) {
    try {
      return await firstValueFrom(
        this.itemClient.send('itemStock.findAllInCabinet', params || {}).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to fetch item stocks in cabinet');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Item service unavailable');
    }
  }

  // =========================== Item Stock Return API ===========================
  async findAllItemStockWillReturn(params?: { departmentCode?: string; cabinetCode?: string }) {
    try {
      return await firstValueFrom(
        this.itemClient.send('itemStock.findAllWillReturn', params || {}).pipe(
          catchError((error) => {
            throw new Error(error?.message || 'Failed to fetch item stock will return');
          })
        )
      );
    } catch (error) {
      throw new Error(error?.message || 'Item service unavailable');
    }
  }

}
