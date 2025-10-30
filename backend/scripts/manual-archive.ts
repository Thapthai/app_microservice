#!/usr/bin/env ts-node

/**
 * Manual Archive Script
 * 
 * ย้ายข้อมูลเก่าจาก Primary DB ไป Archive DB
 * 
 * Usage:
 *   ts-node scripts/manual-archive.ts [days]
 * 
 * Example:
 *   ts-node scripts/manual-archive.ts 90
 *   ts-node scripts/manual-archive.ts 30
 */

import { PrismaClient } from '@prisma/client';
import { PrismaClient as ArchivePrismaClient } from '@prisma/archive-client';

const prisma = new PrismaClient();
const archivePrisma = new ArchivePrismaClient();

async function archiveOldData(daysOld: number = 90) {
  console.log(`\n🧹 Starting archive process for data older than ${daysOld} days...\n`);

  const archiveDate = new Date();
  archiveDate.setDate(archiveDate.getDate() - daysOld);

  console.log(`📅 Archive date: ${archiveDate.toISOString()}`);
  console.log(`📋 Archive Strategy:`);
  console.log(`   • Items: Copy → DELETE (cleanup old data)`);
  console.log(`   • Tokens/Users: Copy ONLY (keep for audit/history)`);
  console.log(``);

  try {
    // Archive in dependency order (child → parent)
    // 1. Items first (child of Categories)
    await archiveInactiveItems(archiveDate);

    // 2. Refresh tokens (child of Users)
    await archiveRefreshTokens(archiveDate);

    // 3. Two-factor tokens (child of Users)
    await archiveTwoFactorTokens(archiveDate);

    console.log('\n✅ Archive process completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Archive process failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await archivePrisma.$disconnect();
  }
}

async function archiveRefreshTokens(archiveDate: Date) {
  console.log('📦 Backing up (copy only) refresh tokens...');

  const oldTokens = await prisma.refreshToken.findMany({
    where: {
      OR: [
        { created_at: { lt: archiveDate } },
        { is_revoked: true, created_at: { lt: archiveDate } },
      ],
    },
    include: {
      user: true, // Include user data for foreign key
    },
  });

  if (oldTokens.length === 0) {
    console.log('  ℹ️  No refresh tokens to backup');
    return;
  }

  console.log(`  📊 Found ${oldTokens.length} refresh tokens to backup`);

  // Copy to archive database
  for (const token of oldTokens) {
    // Ensure user exists in archive database first
    await archivePrisma.user.upsert({
      where: { id: token.user_id },
      update: {}, // Don't update if exists
      create: token.user, // Create if doesn't exist
    });

    // Now copy the token
    const { user, ...tokenData } = token;
    await archivePrisma.refreshToken.upsert({
      where: { id: tokenData.id },
      update: tokenData,
      create: tokenData,
    });
  }

  console.log('  ✓ Copied to archive database (kept in primary for audit)');
  
  // NOTE: We do NOT delete tokens - keep for audit/history
}

async function archiveTwoFactorTokens(archiveDate: Date) {
  console.log('\n🔐 Backing up (copy only) two-factor tokens...');

  const oldTokens = await prisma.twoFactorToken.findMany({
    where: {
      OR: [
        { created_at: { lt: archiveDate } },
        { isUsed: true, created_at: { lt: archiveDate } },
      ],
    },
    include: {
      user: true, // Include user data for foreign key
    },
  });

  if (oldTokens.length === 0) {
    console.log('  ℹ️  No 2FA tokens to backup');
    return;
  }

  console.log(`  📊 Found ${oldTokens.length} 2FA tokens to backup`);

  // Copy to archive database
  for (const token of oldTokens) {
    // Ensure user exists in archive database first
    await archivePrisma.user.upsert({
      where: { id: token.user_id },
      update: {}, // Don't update if exists
      create: token.user, // Create if doesn't exist
    });

    // Now copy the token
    const { user, ...tokenData } = token;
    await archivePrisma.twoFactorToken.upsert({
      where: { id: tokenData.id },
      update: tokenData,
      create: tokenData,
    });
  }

  console.log('  ✓ Copied to archive database (kept in primary for audit)');
  
  // NOTE: We do NOT delete tokens - keep for audit/history
}

async function archiveInactiveItems(archiveDate: Date) {
  console.log('\n📦 Archiving (copy + delete) inactive items...');

  const oldItems = await prisma.item.findMany({
    where: {
      OR: [
        { is_active: false, updated_at: { lt: archiveDate } },
        { created_at: { lt: archiveDate }, updated_at: { lt: archiveDate } },
      ],
    },
    include: {
      category: true,
    },
  });

  if (oldItems.length === 0) {
    console.log('  ℹ️  No inactive items to archive');
    return;
  }

  console.log(`  📊 Found ${oldItems.length} inactive items to archive`);

  // Copy to archive database
  for (const item of oldItems) {
    // Ensure category exists in archive database first (if item has category)
    if (item.category_id && item.category) {
      await archivePrisma.category.upsert({
        where: { id: item.category_id },
        update: {},
        create: item.category,
      });
    }

    // Now copy the item
    const { category, ...itemData } = item;
    await archivePrisma.item.upsert({
      where: { id: itemData.id },
      update: itemData,
      create: itemData,
    });
  }

  console.log('  ✓ Copied to archive database');

  // Delete from primary database (Items are always deleted for cleanup)
  const deleted = await prisma.item.deleteMany({
    where: {
      id: { in: oldItems.map((i) => i.id) },
    },
  });

  console.log(`  ✓ Deleted ${deleted.count} items from primary database (cleanup)`);
}

// Get statistics
async function getStatistics() {
  console.log('\n📊 Database Statistics:\n');

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
    prisma.refreshToken.count(),
    prisma.twoFactorToken.count(),
    prisma.user.count(),
    prisma.item.count(),
    prisma.category.count(),
    archivePrisma.refreshToken.count(),
    archivePrisma.twoFactorToken.count(),
    archivePrisma.user.count(),
    archivePrisma.item.count(),
    archivePrisma.category.count(),
  ]);

  console.log('Primary Database:');
  console.log(`  Users: ${primaryUsers}`);
  console.log(`  Refresh Tokens: ${primaryRefreshTokens}`);
  console.log(`  2FA Tokens: ${primaryTwoFactorTokens}`);
  console.log(`  Items: ${primaryItems}`);
  console.log(`  Categories: ${primaryCategories}`);

  console.log('\nArchive Database:');
  console.log(`  Users: ${archiveUsers}`);
  console.log(`  Refresh Tokens: ${archiveRefreshTokens}`);
  console.log(`  2FA Tokens: ${archiveTwoFactorTokens}`);
  console.log(`  Items: ${archiveItems}`);
  console.log(`  Categories: ${archiveCategories}\n`);

  await prisma.$disconnect();
  await archivePrisma.$disconnect();
}

// Main
const command = process.argv[2];
const daysArg = process.argv[3];

if (command === 'stats') {
  getStatistics().catch(console.error);
} else {
  const days = daysArg ? parseInt(daysArg, 10) : parseInt(command || '90', 10);
  archiveOldData(days).catch(console.error);
}

