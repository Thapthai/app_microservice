import { Controller, Post, Get, Query, Param } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { HousekeepingServiceService } from './housekeeping-service.service';

@Controller('housekeeping')
export class HousekeepingServiceController {
  constructor(
    private readonly housekeepingService: HousekeepingServiceService,
  ) {}

  @Get()
  getHello(): string {
    return 'Housekeeping Service is running!';
  }

  /**
   * Manually trigger archive process (all tables)
   * POST /housekeeping/archive?days=90
   */
  @Post('archive')
  async manualArchive(@Query('days') days?: string) {
    const daysOld = days ? parseInt(days, 10) : 90;
    return await this.housekeepingService.manualArchive(daysOld);
  }

  /**
   * Archive specific table only
   * POST /housekeeping/archive/:tableName?days=90
   * Supported tables: items, refresh_tokens, two_factor_tokens, oauth_accounts
   */
  @Post('archive/:tableName')
  async archiveSpecificTable(
    @Param('tableName') tableName: string,
    @Query('days') days?: string,
  ) {
    const daysOld = days ? parseInt(days, 10) : 90;
    return await this.housekeepingService.archiveSpecificTable(tableName, daysOld);
  }

  /**
   * Get housekeeping statistics
   * GET /housekeeping/stats
   */
  @Get('stats')
  async getStats() {
    return await this.housekeepingService.getStatistics();
  }

  // ============================================================
  // Microservice Message Patterns (for Gateway)
  // ============================================================

  @MessagePattern('housekeeping.status')
  async handleStatus() {
    return {
      success: true,
      message: 'Housekeeping Service is running!',
      service: 'housekeeping-service',
      version: '1.0.0',
    };
  }

  @MessagePattern('housekeeping.archive')
  async handleArchive(data: { days: number }) {
    return await this.housekeepingService.manualArchive(data.days || 90);
  }

  @MessagePattern('housekeeping.archive.table')
  async handleArchiveTable(data: { tableName: string; days: number }) {
    return await this.housekeepingService.archiveSpecificTable(data.tableName, data.days || 90);
  }

  @MessagePattern('housekeeping.stats')
  async handleStats() {
    return await this.housekeepingService.getStatistics();
  }
}
