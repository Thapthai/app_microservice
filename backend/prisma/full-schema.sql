-- ===================================
-- Complete Prisma Schema Migration SQL
-- All Models from schema.prisma
-- ===================================

-- Set charset and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ===================================
-- 1. USER MANAGEMENT TABLES
-- ===================================

-- Users table
CREATE TABLE IF NOT EXISTS `app_microservice_users` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(191),
  `name` VARCHAR(191) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `email_verified` BOOLEAN NOT NULL DEFAULT false,
  `preferred_auth_method` VARCHAR(191) NOT NULL DEFAULT 'jwt',
  `last_login_at` DATETIME(3),
  `firebase_uid` VARCHAR(191) UNIQUE,
  `profile_picture` VARCHAR(191),
  `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
  `two_factor_secret` VARCHAR(191),
  `backup_codes` TEXT,
  `two_factor_verified_at` DATETIME(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_users_email_idx` (`email`),
  INDEX `app_microservice_users_firebase_uid_idx` (`firebase_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OAuth Accounts table
CREATE TABLE IF NOT EXISTS `app_microservice_oauth_accounts` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INTEGER NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `provider_id` VARCHAR(191) NOT NULL,
  `access_token` TEXT,
  `refresh_token` TEXT,
  `expires_at` DATETIME(3),
  `token_type` VARCHAR(191),
  `scope` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE KEY `app_microservice_oauth_accounts_provider_provider_id_key` (`provider`, `provider_id`),
  INDEX `app_microservice_oauth_accounts_user_id_idx` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Keys table
CREATE TABLE IF NOT EXISTS `app_microservice_api_keys` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INTEGER NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191),
  `key_hash` VARCHAR(191) NOT NULL UNIQUE,
  `prefix` VARCHAR(191) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `last_used_at` DATETIME(3),
  `expires_at` DATETIME(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_api_keys_user_id_idx` (`user_id`),
  INDEX `app_microservice_api_keys_key_hash_idx` (`key_hash`),
  FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Credentials table
CREATE TABLE IF NOT EXISTS `app_microservice_client_credentials` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INTEGER NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191),
  `client_id` VARCHAR(191) NOT NULL UNIQUE,
  `client_secret_hash` VARCHAR(191) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `last_used_at` DATETIME(3),
  `expires_at` DATETIME(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_client_credentials_client_id_idx` (`client_id`),
  INDEX `app_microservice_client_credentials_user_id_idx` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS `app_microservice_refresh_tokens` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INTEGER NOT NULL,
  `token_hash` VARCHAR(191) NOT NULL UNIQUE,
  `expires_at` DATETIME(3) NOT NULL,
  `is_revoked` BOOLEAN NOT NULL DEFAULT false,
  `device_info` VARCHAR(191),
  `ip_address` VARCHAR(191),
  `user_agent` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `app_microservice_refresh_tokens_user_id_idx` (`user_id`),
  INDEX `app_microservice_refresh_tokens_token_hash_idx` (`token_hash`),
  INDEX `app_microservice_refresh_tokens_expires_at_idx` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Two Factor Tokens table
CREATE TABLE IF NOT EXISTS `app_microservice_two_factor_tokens` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INTEGER NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `app_microservice_two_factor_tokens_user_id_idx` (`user_id`),
  INDEX `app_microservice_two_factor_tokens_token_idx` (`token`),
  INDEX `app_microservice_two_factor_tokens_expires_at_idx` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 2. CATEGORY TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS `app_microservice_categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_categories_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 3. ITEM TYPE TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS `itemtype` (
  `ID` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `TypeName` VARCHAR(50),
  `IsCancel` BOOLEAN DEFAULT false,
  `B_ID` INTEGER,
  INDEX `itemtype_ID_idx` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 4. ITEM TABLE (if not exists, otherwise add columns)
-- ===================================

CREATE TABLE IF NOT EXISTS `item` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `itemcode` VARCHAR(20) UNIQUE,
  `itemname` VARCHAR(255),
  `itemtypeID` INTEGER,
  `itemgroupID` INTEGER DEFAULT 0,
  `itemsubgroupID` INTEGER DEFAULT 0,
  `IsForceLockUsage` BOOLEAN DEFAULT false,
  `IsQuickPrepare` BOOLEAN DEFAULT false,
  `UseCanReuse` INTEGER DEFAULT 0,
  `PrepareCostPerQty` DOUBLE,
  `TransportCostPerQty` DOUBLE,
  `LongNameInEng` VARCHAR(255),
  `ShortNameInEng` VARCHAR(100),
  `LongNameInThai` VARCHAR(255),
  `ShortNameInThai` VARCHAR(100),
  `IsUseQrCodeRfid` BOOLEAN DEFAULT false,
  `NetWeight` DOUBLE,
  `MaxUsage` INTEGER,
  `Unit` VARCHAR(50),
  `SterileMethodID` INTEGER,
  `InstrumentTypeID` INTEGER,
  `GrossWeight` DOUBLE,
  `TemperatureMin` DOUBLE,
  `TemperatureMax` DOUBLE,
  `ManufacturerID` INTEGER,
  `MaterialID` INTEGER,
  `IsIgnoreItem` BOOLEAN DEFAULT false,
  `SterileMethodID_2` INTEGER,
  `SizeLong` DOUBLE,
  `SizeWide` DOUBLE,
  `SizeHigh` DOUBLE,
  `IsReusable` BOOLEAN DEFAULT true,
  `UnitBarcode` VARCHAR(50),
  `IsBasicSet` BOOLEAN DEFAULT false,
  `IsNotQrCode` BOOLEAN DEFAULT false,
  `IsPacking` BOOLEAN DEFAULT false,
  `IsCostTran` BOOLEAN DEFAULT false,
  `IsIngore` BOOLEAN DEFAULT false,
  `itemcodeexpress` VARCHAR(20),
  `PricePerpare` DOUBLE,
  `PricePerQty` DOUBLE,
  `PriceTotal` DOUBLE,
  `PriceTransPort` DOUBLE,
  `Barcode` VARCHAR(100),
  `QrcodeSerial` VARCHAR(100),
  `IsExpress` BOOLEAN DEFAULT false,
  `IsActive` BOOLEAN DEFAULT true,
  `IsSterile` BOOLEAN DEFAULT false,
  `IsDisplayDeptName` BOOLEAN DEFAULT false,
  `IsShowDept` BOOLEAN DEFAULT false,
  `IsOnlyOneLine` BOOLEAN DEFAULT false,
  `IsDisplayStockCount` BOOLEAN DEFAULT false,
  `IsPackingOneRow` BOOLEAN DEFAULT false,
  `IsPrintExpressBarcode` BOOLEAN DEFAULT false,
  `PackingCost` DOUBLE,
  `Remark` VARCHAR(255),
  `Picture` TEXT,
  `Picture2` TEXT,
  `StoreCost` DOUBLE,
  `CleaningCost` DOUBLE,
  `IsAutoAddSterile` BOOLEAN DEFAULT false,
  `RefNo` VARCHAR(50),
  `IsCancel` INTEGER DEFAULT 0,
  `IsSingle` BOOLEAN DEFAULT false,
  `IsNotShowSendSterile` BOOLEAN DEFAULT false,
  `Store` VARCHAR(100),
  `PackingMat` VARCHAR(100),
  `ShelfLife` INTEGER DEFAULT 0,
  `ManufacturerName` VARCHAR(255),
  `item_data_1_id` INTEGER,
  `InternalCode` VARCHAR(50),
  `ManufacturerMemo` VARCHAR(255),
  `item_data_1` INTEGER,
  `Picweb` MEDIUMTEXT,
  `SuplierName` VARCHAR(255),
  `IsNoSterile` BOOLEAN DEFAULT false,
  `IsShowQrItemCode` BOOLEAN DEFAULT false,
  `SuplierNameMemo` VARCHAR(255),
  `IsSingleUsage` BOOLEAN DEFAULT false,
  `ListUnderLineNo` VARCHAR(50),
  `Isopdipd` INTEGER,
  `Note` TEXT,
  `B_ID` INTEGER,
  `ListColorLineNo` VARCHAR(50),
  `IsPrintNoSterile` BOOLEAN DEFAULT false,
  `IsPayToSend` INTEGER,
  `IsTrackAuto` BOOLEAN DEFAULT false,
  `IsGroupPrintSticker` BOOLEAN DEFAULT false,
  `FileUpload` TEXT,
  `IsUsageName` BOOLEAN DEFAULT false,
  `Typeitemcode` INTEGER,
  `Picture3` TEXT,
  `Picture4` TEXT,
  `Picture5` TEXT,
  `IsFabric` BOOLEAN DEFAULT false,
  `WashPriceId` INTEGER,
  `SterilePriceId` INTEGER,
  `ReProcessPrice` DOUBLE,
  `wash_price_id` INTEGER,
  `sterile_price_id` INTEGER,
  `reprocess_price` DOUBLE,
  `UserCreate` INTEGER DEFAULT 0,
  `UserModify` INTEGER DEFAULT 0,
  `ModiflyDate` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `IsNumber` BOOLEAN DEFAULT false,
  `SapCode` VARCHAR(50),
  `IsChangeUsageInSet` BOOLEAN DEFAULT false,
  `IsNH` INTEGER,
  `MaxInventory` INTEGER,
  `procedureID` INTEGER,
  `Description` TEXT,
  `ReuseDetect` VARCHAR(100),
  `stock_max` INTEGER,
  `stock_min` INTEGER,
  `stock_balance` INTEGER,
  `warehouseID` INTEGER,
  `fixcost` BOOLEAN DEFAULT false,
  `main_max` INTEGER,
  `main_min` INTEGER,
  `item_status` INTEGER DEFAULT 0,
  INDEX `item_itemcode_idx` (`itemcode`),
  INDEX `item_itemtypeID_idx` (`itemtypeID`),
  FOREIGN KEY (`itemtypeID`) REFERENCES `itemtype`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 5. ITEM STOCK TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS `itemstock` (
  `RowID` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `CreateDate` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `ItemCode` VARCHAR(20),
  `UsageCode` VARCHAR(20),
  `UsageCode2` VARCHAR(20),
  `RfidCode` VARCHAR(255),
  `IsStatus` INTEGER DEFAULT 0,
  `IsNew` BOOLEAN DEFAULT true,
  `IsNewUsage` BOOLEAN DEFAULT true,
  `LastSendDeptDate` DATETIME(3),
  `PackDate` DATETIME(3),
  `ExpireDate` DATETIME(3),
  `DepID` INTEGER DEFAULT 0,
  `PackingMatID` INTEGER,
  `Qty` INTEGER DEFAULT 0,
  `UsageCount` INTEGER DEFAULT 0,
  `IsPay` INTEGER DEFAULT 0,
  `LastPayDeptDate` DATETIME(3),
  `IsDispatch` BOOLEAN DEFAULT false,
  `LastReceiveDeptDate` DATETIME(3),
  `IsTag` BOOLEAN DEFAULT false,
  `IsNoStep12` BOOLEAN DEFAULT false,
  `IsPrint` BOOLEAN DEFAULT false,
  `IsCancel` BOOLEAN DEFAULT false,
  `B_ID` INTEGER DEFAULT 0,
  `ImportOccurrenceID` INTEGER DEFAULT 0,
  `LastSterileDetailID` INTEGER,
  `LastReceiveInDeptDate` DATETIME(3),
  `LastDispatchModify` DATETIME(3),
  `IsHN` INTEGER DEFAULT 0,
  `CancellDate` DATETIME(3),
  `IsStock` BOOLEAN DEFAULT true,
  `IsBorrow` BOOLEAN DEFAULT false,
  `PreviousStatus` INTEGER DEFAULT 0,
  `IsWeb` INTEGER DEFAULT 0,
  `IsRemarkExpress` INTEGER DEFAULT 0,
  `RemarkExpress` VARCHAR(255),
  `IsReuse` INTEGER DEFAULT 1,
  `IsTrade` BOOLEAN DEFAULT false,
  `IsDeposit` INTEGER DEFAULT 0,
  `TransactionCreate` INTEGER,
  `DeptID` INTEGER DEFAULT 0,
  `isPairing` BOOLEAN DEFAULT false,
  `PreviousIsPay` BOOLEAN DEFAULT false,
  `IsREUsageCount` BOOLEAN DEFAULT false,
  `IsCancelByLimit` BOOLEAN DEFAULT false,
  `UsageName` VARCHAR(255),
  `ProductSerial` VARCHAR(25),
  `StockID` INTEGER,
  `HNCode` VARCHAR(20),
  `CabinetUserID` INTEGER,
  `LastCabinetModify` DATETIME(3),
  `InsertRfidDocNo` VARCHAR(20),
  `Istatus_rfid` INTEGER COMMENT '1=เดิม 2=เบิก 3=ส่ง',
  `ShiptoDate` DATETIME(3),
  `ReturnDate` DATETIME(3),
  `InsertDate` DATETIME(3),
  `IsDeproom` VARCHAR(5),
  `IsClaim` INTEGER,
  `IsCross` INTEGER,
  `departmentroomId` INTEGER,
  `IsDamage` INTEGER,
  `serialNo` VARCHAR(50),
  `lotNo` VARCHAR(50),
  `expDate` DATETIME(3),
  `IsTracking` BOOLEAN DEFAULT false,
  `remarkTracking` VARCHAR(255),
  `return_userID` INTEGER,
  `IsSell` INTEGER DEFAULT 0,
  INDEX `itemstock_ItemCode_idx` (`ItemCode`),
  INDEX `itemstock_StockID_idx` (`StockID`),
  INDEX `itemstock_RfidCode_idx` (`RfidCode`),
  FOREIGN KEY (`ItemCode`) REFERENCES `item`(`itemcode`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- 6. MEDICAL SUPPLIES USAGE TABLES
-- ===================================

-- Medical Supply Usage table
CREATE TABLE IF NOT EXISTS `app_microservice_medical_supply_usages` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `hospital` VARCHAR(191),
  `en` VARCHAR(191) DEFAULT '',
  `patient_hn` VARCHAR(191) NOT NULL,
  `first_name` VARCHAR(191) DEFAULT '',
  `lastname` VARCHAR(191) DEFAULT '',
  `patient_name_th` VARCHAR(191),
  `patient_name_en` VARCHAR(191),
  `usage_datetime` VARCHAR(191),
  `usage_type` VARCHAR(191),
  `purpose` VARCHAR(191),
  `department_code` VARCHAR(191),
  `recorded_by_user_id` VARCHAR(191),
  `billing_status` VARCHAR(191),
  `billing_subtotal` DOUBLE,
  `billing_tax` DOUBLE,
  `billing_total` DOUBLE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_medical_supply_usages_patient_hn_idx` (`patient_hn`),
  INDEX `app_microservice_medical_supply_usages_en_idx` (`en`),
  INDEX `app_microservice_medical_supply_usages_department_code_idx` (`department_code`),
  INDEX `app_microservice_medical_supply_usages_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supply Usage Item table
CREATE TABLE IF NOT EXISTS `app_microservice_supply_usage_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `usage_id` INTEGER NOT NULL,
  `supply_code` VARCHAR(191) NOT NULL,
  `supply_name` VARCHAR(191) NOT NULL,
  `qty` INTEGER NOT NULL DEFAULT 1,
  `qty_used_with_patient` INTEGER NOT NULL DEFAULT 0,
  `qty_returned_to_cabinet` INTEGER NOT NULL DEFAULT 0,
  `qty_pending` INTEGER,
  `unit_price` DOUBLE,
  `total_price` DOUBLE,
  `assession_no` VARCHAR(191),
  `order_item_code` VARCHAR(191),
  `order_item_description` VARCHAR(191),
  `order_item_status` VARCHAR(191),
  `item_status` VARCHAR(191),
  `uom` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_supply_usage_items_usage_id_idx` (`usage_id`),
  INDEX `app_microservice_supply_usage_items_supply_code_idx` (`supply_code`),
  INDEX `app_microservice_supply_usage_items_created_at_idx` (`created_at`),
  FOREIGN KEY (`usage_id`) REFERENCES `app_microservice_medical_supply_usages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supply Item Return Record table
CREATE TABLE IF NOT EXISTS `app_microservice_supply_item_return_records` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `supply_usage_item_id` INTEGER NOT NULL,
  `return_qty` INTEGER NOT NULL,
  `return_reason` VARCHAR(191) NOT NULL,
  `return_datetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `return_by_user_id` VARCHAR(191) NOT NULL,
  `return_note` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `app_microservice_supply_item_return_records_supply_usage_item_id_idx` (`supply_usage_item_id`),
  INDEX `app_microservice_supply_item_return_records_return_reason_idx` (`return_reason`),
  INDEX `app_microservice_supply_item_return_records_return_datetime_idx` (`return_datetime`),
  FOREIGN KEY (`supply_usage_item_id`) REFERENCES `app_microservice_supply_usage_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical Supply Usage Log table
CREATE TABLE IF NOT EXISTS `app_microservice_medical_supply_usages_logs` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `usage_id` INTEGER,
  `action` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `app_microservice_medical_supply_usages_logs_usage_id_idx` (`usage_id`),
  INDEX `app_microservice_medical_supply_usages_logs_created_at_idx` (`created_at`),
  FOREIGN KEY (`usage_id`) REFERENCES `app_microservice_medical_supply_usages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- VERIFICATION QUERIES
-- ===================================

SELECT 'Migration Complete!' as status;

-- Show all tables
SELECT TABLE_NAME, TABLE_ROWS, 
       ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- Show foreign keys
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

