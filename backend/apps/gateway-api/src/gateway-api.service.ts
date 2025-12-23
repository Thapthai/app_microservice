import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
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

  async findAllItems(page: number, limit: number, keyword?: string, sortBy?: string, sortOrder?: string) {
    const query = { page, limit, keyword, sort_by: sortBy, sort_order: sortOrder };
    return this.itemClient.send('item.findAll', query).toPromise();
  }

  async findOneItem(id: number) {
    return this.itemClient.send('item.findOne', id).toPromise();
  }

  async updateItem(id: number, updateItemDto: any) {
    return this.itemClient.send('item.update', { id, updateItemDto }).toPromise();
  }

  async removeItem(id: number) {
    return this.itemClient.send('item.remove', id).toPromise();
  }

  async findItemsByUser(user_id: number) {
    return this.itemClient.send('item.findByUser', user_id).toPromise();
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
  async createMedicalSupplyUsage(data: any) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.create' }, data).toPromise();
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

  async getQuantityStatistics(department_code?: string) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getQuantityStatistics' }, { department_code }).toPromise();
  }

  async getSupplyItemById(itemId: number) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getById' }, { item_id: itemId }).toPromise();
  }

  async getSupplyItemsByUsageId(usageId: number) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usageId }).toPromise();
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
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.getDispensedItems' }, filters || {}).toPromise();
  }

  async compareDispensedVsUsage(filters?: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    page?: number;
    limit?: number;
  }) {
    return this.medicalSuppliesClient.send({ cmd: 'medical_supply.compareDispensedVsUsage' }, filters || {}).toPromise();
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
}
