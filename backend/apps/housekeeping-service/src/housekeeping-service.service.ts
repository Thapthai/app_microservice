import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, ArchivePrismaService } from './prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HousekeepingLoggerService } from './logger/housekeeping-logger.service';

@Injectable()
export class HousekeepingServiceService {
  private readonly logger = new Logger(HousekeepingServiceService.name);

  // Batch processing configuration
  private readonly BATCH_SIZE = 100; // Number of records per batch
  private readonly BATCH_DELAY_MS = 60000; // 1 minute delay between batches

  constructor(
    private readonly prisma: PrismaService,
    private readonly archivePrisma: ArchivePrismaService,
    private readonly fileLogger: HousekeepingLoggerService,
  ) {}
  
  // Note: Prometheus default metrics are already enabled via PrometheusModule
  // Custom metrics can be added later if needed

  /**
   * Archive old data (older than 90 days)
   * Runs daily at 2:00 AM
   * 
   * Archive Strategy:
   * 1. Items → Copy + DELETE (clean up old items)
   * 2. Tokens & Users → Copy ONLY (keep for audit/history)
   * 
   * Order matters! Archive in dependency order (child → parent):
   * 1. Items (depends on Categories)
   * 2. Refresh Tokens (depends on Users) - Copy only
   * 3. Two-Factor Tokens (depends on Users) - Copy only
   * 4. OAuth Accounts (depends on Users) - Copy only
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async archiveOldData() {
    this.logger.log('╔════════════════════════════════════════════════════════╗');
    this.logger.log('║  🧹 HOUSEKEEPING SERVICE - Auto Archive Started       ║');
    this.logger.log('╚════════════════════════════════════════════════════════╝');
    this.logger.log('📋 Archive Strategy:');
    this.logger.log('   • Items: Copy → DELETE (cleanup)');
    this.logger.log('   • Tokens/Users/OAuth: Copy ONLY (audit/history)');
    this.logger.log('');

    const startTime = Date.now();

    try {
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - 90); // 90 days ago

      this.logger.log(`📅 Archive Date: ${archiveDate.toISOString()}`);
      this.logger.log('');

      // 1. Archive inactive items (copy + delete)
      await this.archiveInactiveItems(archiveDate);

      // 2. Archive old refresh tokens (copy only - no delete)
      await this.archiveRefreshTokens(archiveDate, false);

      // 3. Archive old two-factor tokens (copy only - no delete)
      await this.archiveTwoFactorTokens(archiveDate, false);

      // 4. Archive OAuth accounts (copy only - no delete)
      await this.archiveOAuthAccounts(archiveDate);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log('');
      this.logger.log('╔════════════════════════════════════════════════════════╗');
      this.logger.log(`║  ✅ Housekeeping completed in ${duration}s                  ║`);
      this.logger.log('╚════════════════════════════════════════════════════════╝');
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.error('');
      this.logger.error('╔════════════════════════════════════════════════════════╗');
      this.logger.error(`║  ❌ Housekeeping FAILED after ${duration}s                 ║`);
      this.logger.error('╚════════════════════════════════════════════════════════╝');
      this.logger.error('Error details:', error.message);
      throw error;
    }
  }

  /**
   * Archive old refresh tokens (batch processing)
   * @param archiveDate - Date threshold for archiving
   * @param shouldDelete - If true, delete from primary DB after copy (default: true for backward compatibility)
   */
  private async archiveRefreshTokens(archiveDate: Date, shouldDelete: boolean = true) {
    const action = shouldDelete ? 'Archiving (copy + delete)' : 'Backing up (copy only)';
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`📦 ${action} refresh tokens older than ${archiveDate.toLocaleDateString()}`);
    this.logger.log(`   Batch: ${this.BATCH_SIZE} records, Delay: ${this.BATCH_DELAY_MS / 1000}s`);
    
    let totalArchived = 0;
    let totalDeleted = 0;
    let hasMore = true;
    const startTime = Date.now();

    while (hasMore) {
      // Fetch batch of old tokens with user info (ordered by id for consistent pagination)
      const oldTokens = await this.prisma.refreshToken.findMany({
        where: {
          OR: [
            { created_at: { lt: archiveDate } },
            { is_revoked: true, created_at: { lt: archiveDate } },
          ],
        },
        take: this.BATCH_SIZE,
        orderBy: { id: 'asc' },
        include: {
          user: true, // Include user data
        },
      });

      if (oldTokens.length === 0) {
        if (totalArchived === 0) {
          this.logger.log(`   ℹ️  No refresh tokens found to process`);
        }
        hasMore = false;
        break;
      }

      // Copy to archive database
      for (const token of oldTokens) {
        // Ensure user exists in archive database first
        await this.archivePrisma.user.upsert({
          where: { id: token.user_id },
          update: {}, // Don't update if exists
          create: token.user, // Create if doesn't exist
        });

        // Now copy the token
        const { user, ...tokenData } = token;
        await this.archivePrisma.refreshToken.upsert({
          where: { id: tokenData.id },
          update: tokenData,
          create: tokenData,
        });
      }

      // Delete from primary database (if requested)
      if (shouldDelete) {
        await this.prisma.refreshToken.deleteMany({
          where: {
            id: { in: oldTokens.map((t) => t.id) },
          },
        });
      }

      totalArchived += oldTokens.length;
      if (shouldDelete) totalDeleted += oldTokens.length;
      const deleteMsg = shouldDelete ? '(deleted from primary)' : '(kept in primary)';
      const batchNum = Math.ceil(totalArchived / this.BATCH_SIZE);
      this.logger.log(`   ✓ Batch ${batchNum}: ${oldTokens.length} tokens copied ${deleteMsg}`);

      // Log to file for each batch
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.fileLogger.logArchiveOperation({
        operation: shouldDelete ? 'archive_refresh_tokens' : 'backup_refresh_tokens',
        table: 'refresh_tokens',
        recordsProcessed: oldTokens.length,
        recordsArchived: oldTokens.length,
        recordsDeleted: shouldDelete ? oldTokens.length : 0,
        duration: parseFloat(duration),
        startDate: archiveDate,
        endDate: new Date(),
        status: oldTokens.length < this.BATCH_SIZE ? 'success' : 'partial',
      });

      // If we got less than batch size, we're done
      if (oldTokens.length < this.BATCH_SIZE) {
        const statusMsg = shouldDelete ? `(${totalDeleted} deleted)` : '(kept in primary)';
        this.logger.log(`   ✅ Completed: ${totalArchived} tokens in ${duration}s ${statusMsg}`);
        hasMore = false;
      } else {
        // Wait before next batch
        this.logger.log(`   ⏳ Waiting ${this.BATCH_DELAY_MS / 1000}s...`);
        await this.delay(this.BATCH_DELAY_MS);
      }
    }
  }

  /**
   * Archive old two-factor tokens (batch processing)
   * @param archiveDate - Date threshold for archiving
   * @param shouldDelete - If true, delete from primary DB after copy (default: true)
   */
  private async archiveTwoFactorTokens(archiveDate: Date, shouldDelete: boolean = true) {
    const action = shouldDelete ? 'Archiving (copy + delete)' : 'Backing up (copy only)';
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`🔐 ${action} 2FA tokens older than ${archiveDate.toLocaleDateString()}`);
    this.logger.log(`   Batch: ${this.BATCH_SIZE} records, Delay: ${this.BATCH_DELAY_MS / 1000}s`);
    
    let totalArchived = 0;
    let totalDeleted = 0;
    let hasMore = true;
    const startTime = Date.now();

    while (hasMore) {
      // Fetch batch of old tokens with user info (ordered by id for consistent pagination)
      const oldTokens = await this.prisma.twoFactorToken.findMany({
        where: {
          OR: [
            { created_at: { lt: archiveDate } },
            { isUsed: true, created_at: { lt: archiveDate } },
          ],
        },
        take: this.BATCH_SIZE,
        orderBy: { id: 'asc' },
        include: {
          user: true, // Include user data
        },
      });

      if (oldTokens.length === 0) {
        if (totalArchived === 0) {
          this.logger.log(`   ℹ️  No 2FA tokens found to process`);
        }
        hasMore = false;
        break;
      }

      // Copy to archive database
      for (const token of oldTokens) {
        // Ensure user exists in archive database first
        await this.archivePrisma.user.upsert({
          where: { id: token.user_id },
          update: {}, // Don't update if exists
          create: token.user, // Create if doesn't exist
        });

        // Now copy the token
        const { user, ...tokenData } = token;
        await this.archivePrisma.twoFactorToken.upsert({
          where: { id: tokenData.id },
          update: tokenData,
          create: tokenData,
        });
      }

      // Delete from primary database (if requested)
      if (shouldDelete) {
        await this.prisma.twoFactorToken.deleteMany({
          where: {
            id: { in: oldTokens.map((t) => t.id) },
          },
        });
      }

      totalArchived += oldTokens.length;
      if (shouldDelete) totalDeleted += oldTokens.length;
      const deleteMsg = shouldDelete ? '(deleted from primary)' : '(kept in primary)';
      const batchNum = Math.ceil(totalArchived / this.BATCH_SIZE);
      this.logger.log(`   ✓ Batch ${batchNum}: ${oldTokens.length} tokens copied ${deleteMsg}`);

      // Log to file for each batch
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.fileLogger.logArchiveOperation({
        operation: shouldDelete ? 'archive_2fa_tokens' : 'backup_2fa_tokens',
        table: 'two_factor_tokens',
        recordsProcessed: oldTokens.length,
        recordsArchived: oldTokens.length,
        recordsDeleted: shouldDelete ? oldTokens.length : 0,
        duration: parseFloat(duration),
        startDate: archiveDate,
        endDate: new Date(),
        status: oldTokens.length < this.BATCH_SIZE ? 'success' : 'partial',
      });

      // If we got less than batch size, we're done
      if (oldTokens.length < this.BATCH_SIZE) {
        const statusMsg = shouldDelete ? `(${totalDeleted} deleted)` : '(kept in primary)';
        this.logger.log(`   ✅ Completed: ${totalArchived} tokens in ${duration}s ${statusMsg}`);
        hasMore = false;
      } else {
        // Wait before next batch
        this.logger.log(`   ⏳ Waiting ${this.BATCH_DELAY_MS / 1000}s...`);
        await this.delay(this.BATCH_DELAY_MS);
      }
    }
  }

  /**
   * Archive OAuth accounts (batch processing - copy only, no delete)
   */
  private async archiveOAuthAccounts(archiveDate: Date) {
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`🔑 Backing up (copy only) OAuth accounts older than ${archiveDate.toLocaleDateString()}`);
    this.logger.log(`   Batch: ${this.BATCH_SIZE} records, Delay: ${this.BATCH_DELAY_MS / 1000}s`);
    
    let totalArchived = 0;
    let hasMore = true;
    const startTime = Date.now();

    while (hasMore) {
      const oldAccounts = await this.prisma.oAuthAccount.findMany({
        where: {
          created_at: { lt: archiveDate },
        },
        take: this.BATCH_SIZE,
        orderBy: { id: 'asc' },
        include: {
          user: true,
        },
      });

      if (oldAccounts.length === 0) {
        if (totalArchived === 0) {
          this.logger.log(`   ℹ️  No OAuth accounts found to process`);
        }
        hasMore = false;
        break;
      }

      // Copy to archive database (no delete)
      for (const account of oldAccounts) {
        // Ensure user exists in archive database first
        await (this.archivePrisma as any).user.upsert({
          where: { id: account.user_id },
          update: {},
          create: account.user,
        });

        // Copy OAuth account
        const { user, ...accountData } = account;
        await (this.archivePrisma as any).oAuthAccount.upsert({
          where: { id: accountData.id },
          update: accountData,
          create: accountData,
        });
      }

      totalArchived += oldAccounts.length;
      const batchNum = Math.ceil(totalArchived / this.BATCH_SIZE);
      this.logger.log(`   ✓ Batch ${batchNum}: ${oldAccounts.length} accounts copied (kept in primary)`);

      // Log to file for each batch
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.fileLogger.logArchiveOperation({
        operation: 'backup_oauth_accounts',
        table: 'oauth_accounts',
        recordsProcessed: oldAccounts.length,
        recordsArchived: oldAccounts.length,
        recordsDeleted: 0,
        duration: parseFloat(duration),
        startDate: archiveDate,
        endDate: new Date(),
        status: oldAccounts.length < this.BATCH_SIZE ? 'success' : 'partial',
      });

      if (oldAccounts.length < this.BATCH_SIZE) {
        this.logger.log(`   ✅ Completed: ${totalArchived} accounts in ${duration}s (kept in primary)`);
        hasMore = false;
      } else {
        this.logger.log(`   ⏳ Waiting ${this.BATCH_DELAY_MS / 1000}s...`);
        await this.delay(this.BATCH_DELAY_MS);
      }
    }
  }

  /**
   * Archive inactive items (batch processing)
   * Archive items that are inactive or very old (copy + DELETE)
   */
  private async archiveInactiveItems(archiveDate: Date) {
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`📦 Archiving (copy + delete) inactive items older than ${archiveDate.toLocaleDateString()}`);
    this.logger.log(`   Batch: ${this.BATCH_SIZE} records, Delay: ${this.BATCH_DELAY_MS / 1000}s`);
    
    let totalArchived = 0;
    let hasMore = true;
    const startTime = Date.now();

    while (hasMore) {
      // Fetch batch of inactive or old items with category info
      const oldItems = await this.prisma.item.findMany({
        where: {
          OR: [
            { is_active: false, updated_at: { lt: archiveDate } }, // Inactive items older than X days
            { created_at: { lt: archiveDate }, updated_at: { lt: archiveDate } }, // Very old items
          ],
        },
        take: this.BATCH_SIZE,
        orderBy: { id: 'asc' },
        include: {
          category: true, // Include category data for foreign key
        },
      });

      if (oldItems.length === 0) {
        if (totalArchived === 0) {
          this.logger.log(`   ℹ️  No inactive items found to process`);
        }
        hasMore = false;
        break;
      }

      // Copy to archive database
      for (const item of oldItems) {
        // Ensure category exists in archive database first (if item has category)
        if (item.category_id && item.category) {
          await this.archivePrisma.category.upsert({
            where: { id: item.category_id },
            update: {}, // Don't update if exists
            create: item.category, // Create if doesn't exist
          });
        }

        // Now copy the item
        const { category, ...itemData } = item;
        await this.archivePrisma.item.upsert({
          where: { id: itemData.id },
          update: itemData,
          create: itemData,
        });
      }

      // Delete from primary database (Items are always deleted)
      await this.prisma.item.deleteMany({
        where: {
          id: { in: oldItems.map((i) => i.id) },
        },
      });

      totalArchived += oldItems.length;
      const batchNum = Math.ceil(totalArchived / this.BATCH_SIZE);
      this.logger.log(`   ✓ Batch ${batchNum}: ${oldItems.length} items archived (deleted from primary)`);

      // Log to file for each batch
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.fileLogger.logArchiveOperation({
        operation: 'archive_items',
        table: 'items',
        recordsProcessed: oldItems.length,
        recordsArchived: oldItems.length,
        recordsDeleted: oldItems.length,
        duration: parseFloat(duration),
        startDate: archiveDate,
        endDate: new Date(),
        status: oldItems.length < this.BATCH_SIZE ? 'success' : 'partial',
      });

      // If we got less than batch size, we're done
      if (oldItems.length < this.BATCH_SIZE) {
        this.logger.log(`   ✅ Completed: ${totalArchived} items in ${duration}s`);
        hasMore = false;
      } else {
        // Wait before next batch
        this.logger.log(`   ⏳ Waiting ${this.BATCH_DELAY_MS / 1000}s...`);
        await this.delay(this.BATCH_DELAY_MS);
      }
    }
  }

  /**
   * Archive categories (copy only - never delete categories)
   */
  private async archiveCategories(archiveDate: Date) {
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`🏷️  Backing up (copy only) categories older than ${archiveDate.toLocaleDateString()}`);
    
    const startTime = Date.now();

    const oldCategories = await this.prisma.category.findMany({
      where: {
        created_at: { lt: archiveDate },
      },
    });

    if (oldCategories.length === 0) {
      this.logger.log('   ℹ️  No categories found to process');
      return;
    }

    this.logger.log(`   📊 Found ${oldCategories.length} categories to backup`);

    // Copy to archive database (no delete - categories are reference data)
    for (const category of oldCategories) {
      await this.archivePrisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category,
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`   ✅ Completed: ${oldCategories.length} categories (kept in primary) in ${duration}s`);
    
    // Log to file
    this.fileLogger.logArchiveOperation({
      operation: 'backup_categories',
      table: 'categories',
      recordsProcessed: oldCategories.length,
      recordsArchived: oldCategories.length,
      recordsDeleted: 0,
      duration: parseFloat(duration),
      startDate: archiveDate,
      endDate: new Date(),
      status: 'success',
    });
  }

  /**
   * Archive inactive users
   * @param archiveDate - Date threshold for archiving
   * @param shouldDelete - If true, delete from primary DB after copy (default: false - copy only)
   */
  private async archiveInactiveUsers(archiveDate: Date, shouldDelete: boolean = false) {
    const action = shouldDelete ? 'Archiving (copy + delete)' : 'Backing up (copy only)';
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`👤 ${action} inactive users (last login before ${archiveDate.toLocaleDateString()})`);
    
    const startTime = Date.now();

    const inactiveUsers = await this.prisma.user.findMany({
      where: {
        is_active: false,
        last_login_at: { lt: archiveDate },
      },
      include: {
        oauth_accounts: true,
        api_keys: true,
        refreshTokens: true,
        two_factor_tokens: true,
      },
    });

    if (inactiveUsers.length === 0) {
      this.logger.log('   ℹ️  No inactive users found to process');
      return;
    }

    this.logger.log(`   📊 Found ${inactiveUsers.length} inactive users to ${shouldDelete ? 'archive' : 'backup'}`);

    for (const user of inactiveUsers) {
      // Copy user and relations to archive
      await this.archivePrisma.user.upsert({
        where: { id: user.id },
        update: {
          ...user,
          oauth_accounts: undefined,
          api_keys: undefined,
          refreshTokens: undefined,
          two_factor_tokens: undefined,
        },
        create: {
          ...user,
          oauth_accounts: undefined,
          api_keys: undefined,
          refreshTokens: undefined,
          two_factor_tokens: undefined,
        },
      });

      // Archive related data
      for (const oauth of user.oauth_accounts) {
        await this.archivePrisma.oAuthAccount.upsert({
          where: { id: oauth.id },
          update: oauth,
          create: oauth,
        });
      }

      for (const apiKey of user.api_keys) {
        await this.archivePrisma.apiKey.upsert({
          where: { id: apiKey.id },
          update: apiKey,
          create: apiKey,
        });
      }

      // Delete from primary database if requested (cascade will handle relations)
      if (shouldDelete) {
        await this.prisma.user.delete({
          where: { id: user.id },
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const deleteMsg = shouldDelete ? '(deleted from primary)' : '(kept in primary)';
    this.logger.log(`   ✅ Completed: ${inactiveUsers.length} users ${deleteMsg} in ${duration}s`);
    
    // Log to file
    this.fileLogger.logArchiveOperation({
      operation: shouldDelete ? 'archive_users' : 'backup_users',
      table: 'users',
      recordsProcessed: inactiveUsers.length,
      recordsArchived: inactiveUsers.length,
      recordsDeleted: shouldDelete ? inactiveUsers.length : 0,
      duration: parseFloat(duration),
      startDate: archiveDate,
      endDate: new Date(),
      status: 'success',
    });
  }

  /**
   * Manual trigger for housekeeping (all tables)
   */
  async manualArchive(daysOld: number = 90) {
    this.logger.log('╔════════════════════════════════════════════════════════╗');
    this.logger.log('║  🧹 HOUSEKEEPING SERVICE - Manual Archive (All)        ║');
    this.logger.log('╚════════════════════════════════════════════════════════╝');
    this.logger.log(`📅 Archive data older than ${daysOld} days`);
    this.logger.log('📋 Strategy:');
    this.logger.log('   • Items: Copy → DELETE');
    this.logger.log('   • Tokens/OAuth: Copy ONLY (no delete)');
    this.logger.log('');

    // Also log to file
    this.fileLogger.log('╔════════════════════════════════════════════════════════╗', 'ManualArchive');
    this.fileLogger.log('║  🧹 HOUSEKEEPING SERVICE - Manual Archive (All)        ║', 'ManualArchive');
    this.fileLogger.log('╚════════════════════════════════════════════════════════╝', 'ManualArchive');
    this.fileLogger.log(`📅 Archive data older than ${daysOld} days`, 'ManualArchive');

    const startTime = Date.now();
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - daysOld);

    try {
      // Archive in dependency order (child → parent)
      await this.archiveCategories(archiveDate);
      await this.archiveInactiveItems(archiveDate);
      await this.archiveInactiveUsers(archiveDate, false);// Copy only
      await this.archiveRefreshTokens(archiveDate, false); // Copy only
      await this.archiveTwoFactorTokens(archiveDate, false); // Copy only
      await this.archiveOAuthAccounts(archiveDate); // Copy only

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log('');
      this.logger.log('╔════════════════════════════════════════════════════════╗');
      this.logger.log(`║  ✅ Manual archive completed in ${duration}s           ║`);
      this.logger.log('╚════════════════════════════════════════════════════════╝');

      // Log to file
      this.fileLogger.log(`✅ Manual archive completed in ${duration}s`, 'ManualArchive');

      return {
        success: true,
        message: `Archived all tables for data older than ${daysOld} days`,
        archiveDate,
        duration: parseFloat(duration),
      };
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.error('');
      this.logger.error('╔════════════════════════════════════════════════════════╗');
      this.logger.error(`║  ❌ Manual archive FAILED after ${duration}s           ║`);
      this.logger.error('╚════════════════════════════════════════════════════════╝');
      
      // Log error to file
      this.fileLogger.error(`❌ Manual archive FAILED after ${duration}s: ${error.message}`, error.stack, 'ManualArchive');
      
      throw error;
    }
  }

  /**
   * Archive specific table only
   */
  async archiveSpecificTable(tableName: string, daysOld: number = 90) {
    this.logger.log('╔═══════════════════════════════════════════════════════════╗');
    this.logger.log(`║  🧹 HOUSEKEEPING - Archive Table: ${tableName.padEnd(20)} ║`);
    this.logger.log('╚═══════════════════════════════════════════════════════════╝');
    this.logger.log(`📅 Archive data older than ${daysOld} days`);
    this.logger.log('');

    const startTime = Date.now();
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - daysOld);

    try {
      switch (tableName.toLowerCase()) {
        case 'categories':
          this.logger.log('📋 Strategy: Copy ONLY (reference data)');
          await this.archiveCategories(archiveDate);
          break;

        case 'items':
          this.logger.log('📋 Strategy: Copy → DELETE (cleanup)');
          await this.archiveInactiveItems(archiveDate);
          break;

        case 'users':
          this.logger.log('📋 Strategy: Copy ONLY (keep for audit)');
          await this.archiveInactiveUsers(archiveDate, false);
          break;

        case 'refresh_tokens':
          this.logger.log('📋 Strategy: Copy ONLY (keep for audit)');
          await this.archiveRefreshTokens(archiveDate, false);
          break;

        case 'two_factor_tokens':
          this.logger.log('📋 Strategy: Copy ONLY (keep for audit)');
          await this.archiveTwoFactorTokens(archiveDate, false);
          break;

        case 'oauth_accounts':
          this.logger.log('📋 Strategy: Copy ONLY (keep for audit)');
          await this.archiveOAuthAccounts(archiveDate);
          break;

        default:
          throw new Error(
            `Invalid table name: ${tableName}. Supported: categories, items, users, refresh_tokens, two_factor_tokens, oauth_accounts`,
          );
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log('');
      this.logger.log('╔════════════════════════════════════════════════════════╗');
      this.logger.log(`║  ✅ Archive ${tableName} completed in ${duration}s     ║`);
      this.logger.log('╚════════════════════════════════════════════════════════╝');

      return {
        success: true,
        message: `Archived ${tableName} for data older than ${daysOld} days`,
        table: tableName,
        archiveDate,
        duration: parseFloat(duration),
      };
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.error('');
      this.logger.error('╔════════════════════════════════════════════════════════╗');
      this.logger.error(`║  ❌ Archive ${tableName} FAILED after ${duration}s     ║`);
      this.logger.error('╚════════════════════════════════════════════════════════╝');
      this.logger.error('Error:', error.message);
      throw error;
    }
  }

  /**
   * Get housekeeping statistics
   */
  async getStatistics() {
    const [
      primaryRefreshTokens,
      primaryTwoFactorTokens,
      primaryUsers,
      primaryItems,
      primaryCategories,
      archiveRefreshTokens,
      archiveTwoFactorTokens,
      archiveUsers,
      archiveItems,
      archiveCategories,
    ] = await Promise.all([
      this.prisma.refreshToken.count(),
      this.prisma.twoFactorToken.count(),
      this.prisma.user.count(),
      this.prisma.item.count(),
      this.prisma.category.count(),
      this.archivePrisma.refreshToken.count(),
      this.archivePrisma.twoFactorToken.count(),
      this.archivePrisma.user.count(),
      this.archivePrisma.item.count(),
      this.archivePrisma.category.count(),
    ]);

    return {
      primary: {
        refresh_tokens: primaryRefreshTokens,
        two_factor_tokens: primaryTwoFactorTokens,
        users: primaryUsers,
        items: primaryItems,
        categories: primaryCategories,
      },
      archive: {
        refresh_tokens: archiveRefreshTokens,
        two_factor_tokens: archiveTwoFactorTokens,
        users: archiveUsers,
        items: archiveItems,
        categories: archiveCategories,
      },
    };
  }

  /**
   * Delay utility for batch processing
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
