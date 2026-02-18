-- ===================================
-- FULL DATABASE SCHEMA
-- Generated from Prisma Schema
-- ===================================

SET FOREIGN_KEY_CHECKS=0;

-- Drop existing tables
DROP TABLE IF EXISTS `app_microservice_two_factor_tokens`;
DROP TABLE IF EXISTS `app_microservice_refresh_tokens`;
DROP TABLE IF EXISTS `app_microservice_client_credentials`;
DROP TABLE IF EXISTS `app_microservice_api_keys`;
DROP TABLE IF EXISTS `app_microservice_oauth_accounts`;
DROP TABLE IF EXISTS `app_microservice_staff_role_permissions`;
DROP TABLE IF EXISTS `app_microservice_staff_users`;
DROP TABLE IF EXISTS `app_microservice_staff_roles`;
DROP TABLE IF EXISTS `app_microservice_users`;
DROP TABLE IF EXISTS `app_microservice_categories`;
DROP TABLE IF EXISTS `app_microservice_medical_supply_usages_logs`;
DROP TABLE IF EXISTS `app_microservice_supply_item_return_records`;
DROP TABLE IF EXISTS `app_microservice_supply_usage_items`;
DROP TABLE IF EXISTS `app_microservice_medical_supply_usages`;
DROP TABLE IF EXISTS `itemstock`;
DROP TABLE IF EXISTS `item`;
DROP TABLE IF EXISTS `itemtype`;

SET FOREIGN_KEY_CHECKS=1;

-- ===================================
-- AUTH TABLES
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
  UNIQUE INDEX `app_microservice_oauth_accounts_provider_provider_id_key` (`provider`, `provider_id`),
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
  `token` VARCHAR(191) NOT NULL UNIQUE,
  `expires_at` DATETIME(3) NOT NULL,
  `is_revoked` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `app_microservice_refresh_tokens_user_id_idx` (`user_id`),
  INDEX `app_microservice_refresh_tokens_token_hash_idx` (`token`),
  INDEX `app_microservice_refresh_tokens_expires_at_idx` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Two Factor Tokens table
CREATE TABLE IF NOT EXISTS `app_microservice_two_factor_tokens` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INTEGER NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `app_microservice_two_factor_tokens_user_id_idx` (`user_id`),
  INDEX `app_microservice_two_factor_tokens_token_idx` (`token`),
  INDEX `app_microservice_two_factor_tokens_expires_at_idx` (`expires_at`),
  INDEX `app_microservice_two_factor_tokens_user_id_type_idx` (`user_id`, `type`),
  FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Roles table
CREATE TABLE IF NOT EXISTS `app_microservice_staff_roles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(191) NOT NULL UNIQUE,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_code` (`code`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO `app_microservice_staff_roles` (`code`, `name`, `description`, `is_active`) VALUES
('it1', 'IT 1', 'สิทธิ์เต็ม - เห็นทุกเมนู', true),
('it2', 'IT 2', 'เห็นทุกเมนู (ยกเว้นเมนูจัดการสิทธิ์)', true),
('it3', 'IT 3', 'เห็นทุกเมนู (ยกเว้นเมนูจัดการสิทธิ์)', true),
('warehouse1', 'Warehouse 1', 'เห็นทุกเมนู (ยกเว้นเมนูจัดการสิทธิ์)', true),
('warehouse2', 'Warehouse 2', 'เห็นทุกเมนู (ยกเว้นเมนูจัดการสิทธิ์)', true),
('warehouse3', 'Warehouse 3', 'เห็นทุกเมนู (ยกเว้นเมนูจัดการสิทธิ์)', true)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- Staff Users table
CREATE TABLE IF NOT EXISTS `app_microservice_staff_users` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `fname` VARCHAR(191) NOT NULL,
  `lname` VARCHAR(191) NOT NULL,
  `department_id` INTEGER,
  `role_id` INTEGER NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `client_id` VARCHAR(191) NOT NULL UNIQUE,
  `client_secret` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3),
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_role_id` (`role_id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_is_active` (`is_active`),
  FOREIGN KEY (`role_id`) REFERENCES `app_microservice_staff_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE IF NOT EXISTS `app_microservice_categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191),
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `image` VARCHAR(191),
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_categories_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ITEM AND INVENTORY TABLES
-- ===================================

-- Item Type table
CREATE TABLE IF NOT EXISTS `itemtype` (
  `ID` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `TypeName` VARCHAR(50),
  `IsCancel` BOOLEAN DEFAULT false,
  `B_ID` INTEGER
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item table
CREATE TABLE IF NOT EXISTS `item` (
  `itemcode` VARCHAR(25) NOT NULL PRIMARY KEY,
  `itemname` VARCHAR(255),
  `Alternatename` VARCHAR(100),
  `Barcode` VARCHAR(50),
  `IsSet` VARCHAR(1),
  `IsReuse` VARCHAR(1),
  `IsNormal` VARCHAR(1) DEFAULT '1',
  `itemtypeID` INTEGER,
  `UnitID` INTEGER DEFAULT 0,
  `SpecialID` INTEGER DEFAULT 0,
  `DepartmentID` INTEGER DEFAULT 0,
  `ShelfLifeID` INTEGER DEFAULT 0,
  `SetCount` INTEGER DEFAULT 0,
  `PackingMatID` INTEGER DEFAULT 0,
  `CostPrice` DECIMAL(10, 2),
  `SalePrice` DECIMAL(10, 2),
  `UsagePrice` DECIMAL(10, 2),
  `SterileMachineID` INTEGER DEFAULT 0,
  `SterileProcessID` INTEGER DEFAULT 0,
  `WashMachineID` INTEGER DEFAULT 0,
  `WashProcessID` INTEGER DEFAULT 0,
  `SupllierID` INTEGER DEFAULT 0,
  `FactID` INTEGER DEFAULT 0,
  `LabelID` INTEGER DEFAULT 0,
  `Minimum` INTEGER DEFAULT 0,
  `Maximum` INTEGER DEFAULT 0,
  `weight` DECIMAL(10, 2),
  `IsSpecial` VARCHAR(1) DEFAULT '0',
  `LabelGroupID` INTEGER,
  `Picture` VARCHAR(100),
  `Picture2` VARCHAR(100),
  `NoWash` BOOLEAN DEFAULT false,
  `IsWashDept` INTEGER DEFAULT 0,
  `PriceID` INTEGER DEFAULT 0,
  `itemcode2` VARCHAR(20),
  `IsNonUsage` BOOLEAN DEFAULT false,
  `itemcode3` VARCHAR(20),
  `IsPrintDepartment` BOOLEAN DEFAULT true,
  `IsStock` BOOLEAN DEFAULT true,
  `IsRecieveRecordOnly` BOOLEAN DEFAULT false,
  `IsWasting` BOOLEAN DEFAULT false,
  `IsCheckList` BOOLEAN DEFAULT false,
  `RoundOfTimeUsed` INTEGER DEFAULT 0,
  `NoWashType` INTEGER DEFAULT 0,
  `CreateDate` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `IsCSSDComfirm` INTEGER DEFAULT 0,
  `IsDenger` INTEGER DEFAULT 0,
  `IsInternalIndicatorCheck` INTEGER DEFAULT 0,
  `IsFillterCheck` INTEGER DEFAULT 0,
  `IsLabelingCheck` INTEGER DEFAULT 0,
  `IsLoaner` INTEGER,
  `LimitUse` INTEGER DEFAULT 0,
  `PayDep` INTEGER DEFAULT 0,
  `IsRemarkRound` INTEGER DEFAULT 0,
  `IsReceiveNotSterile` BOOLEAN DEFAULT true,
  `IsReceiveManual` BOOLEAN DEFAULT true,
  `RefNo` VARCHAR(191),
  `IsCancel` INTEGER DEFAULT 0,
  `IsSingle` BOOLEAN DEFAULT false,
  `IsNotShowSendSterile` BOOLEAN DEFAULT false,
  `Store` VARCHAR(191),
  `PackingMat` VARCHAR(191),
  `ShelfLife` INTEGER DEFAULT 0,
  `ManufacturerName` VARCHAR(191),
  `item_data_1_id` INTEGER,
  `InternalCode` VARCHAR(191),
  `ManufacturerMemo` VARCHAR(191),
  `item_data_1` INTEGER,
  `Picweb` MEDIUMTEXT,
  `SuplierName` VARCHAR(191),
  `IsNoSterile` BOOLEAN DEFAULT false,
  `IsShowQrItemCode` BOOLEAN DEFAULT false,
  `SuplierNameMemo` VARCHAR(191),
  `IsSingleUsage` BOOLEAN DEFAULT false,
  `ListUnderLineNo` VARCHAR(191),
  `Isopdipd` INTEGER,
  `Note` TEXT,
  `B_ID` INTEGER,
  `ListColorLineNo` VARCHAR(191),
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
  `ReProcessPrice` FLOAT,
  `wash_price_id` INTEGER,
  `sterile_price_id` INTEGER,
  `reprocess_price` FLOAT,
  `UserCreate` INTEGER DEFAULT 0,
  `UserModify` INTEGER DEFAULT 0,
  `ModiflyDate` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `IsNumber` BOOLEAN DEFAULT false,
  `SapCode` VARCHAR(191),
  `IsChangeUsageInSet` BOOLEAN DEFAULT false,
  `IsNH` INTEGER,
  `MaxInventory` INTEGER,
  `procedureID` INTEGER,
  `Description` TEXT,
  `ReuseDetect` VARCHAR(191),
  `stock_max` INTEGER,
  `stock_min` INTEGER,
  `stock_balance` INTEGER,
  `warehouseID` INTEGER,
  `fixcost` BOOLEAN DEFAULT false,
  `main_max` INTEGER,
  `main_min` INTEGER,
  `item_status` INTEGER DEFAULT 0,
  INDEX `item_itemtypeID_idx` (`itemtypeID`),
  FOREIGN KEY (`itemtypeID`) REFERENCES `itemtype`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item Stock table
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
  `Istatus_rfid` INTEGER,
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
-- MEDICAL SUPPLIES TABLES
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
  `billing_currency` VARCHAR(191) DEFAULT 'THB',
  `twu` VARCHAR(191),
  `print_location` VARCHAR(191),
  `print_date` VARCHAR(191),
  `time_print_date` VARCHAR(191),
  `update` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_medical_supply_usages_patient_hn_idx` (`patient_hn`),
  INDEX `app_microservice_medical_supply_usages_en_idx` (`en`),
  INDEX `app_microservice_medical_supply_usages_usage_datetime_idx` (`usage_datetime`),
  INDEX `app_microservice_medical_supply_usages_department_code_idx` (`department_code`),
  INDEX `app_microservice_medical_supply_usages_billing_status_idx` (`billing_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supply Usage Item table
CREATE TABLE IF NOT EXISTS `app_microservice_supply_usage_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `medical_supply_usage_id` INTEGER NOT NULL,
  `order_item_code` VARCHAR(191) DEFAULT '',
  `order_item_description` VARCHAR(191) DEFAULT '',
  `assession_no` VARCHAR(191) DEFAULT '',
  `order_item_status` VARCHAR(191) DEFAULT '',
  `qty` INTEGER DEFAULT 0,
  `uom` VARCHAR(191) DEFAULT '',
  `supply_code` VARCHAR(191),
  `supply_name` VARCHAR(191),
  `supply_category` VARCHAR(191),
  `unit` VARCHAR(191),
  `quantity` INTEGER,
  `unit_price` DOUBLE,
  `total_price` DOUBLE,
  `expiry_date` VARCHAR(191),
  `qty_used_with_patient` INTEGER NOT NULL DEFAULT 0,
  `qty_returned_to_cabinet` INTEGER NOT NULL DEFAULT 0,
  `item_status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_supply_usage_items_usage_id_idx` (`medical_supply_usage_id`),
  INDEX `app_microservice_supply_usage_items_order_item_code_idx` (`order_item_code`),
  INDEX `app_microservice_supply_usage_items_assession_no_idx` (`assession_no`),
  INDEX `app_microservice_supply_usage_items_supply_code_idx` (`supply_code`),
  INDEX `app_microservice_supply_usage_items_item_status_idx` (`item_status`),
  FOREIGN KEY (`medical_supply_usage_id`) REFERENCES `app_microservice_medical_supply_usages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supply Item Return Record table
CREATE TABLE IF NOT EXISTS `app_microservice_supply_item_return_records` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  -- `supply_usage_item_id` INTEGER NOT NULL,
  `item_code` VARCHAR(191) NOT NULL,
  `stock_id` INTEGER NULL,
  `qty_returned` INTEGER NOT NULL,
  `return_reason` VARCHAR(191) NOT NULL,
  `return_datetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `return_by_user_id` VARCHAR(191) NOT NULL,
  `return_note` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
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


-- Staff Role Permissions table
CREATE TABLE IF NOT EXISTS `app_microservice_staff_role_permissions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `role_id` INTEGER NOT NULL,
  `menu_href` VARCHAR(191) NOT NULL,
  `can_access` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE KEY `role_menu_href` (`role_id`, `menu_href`),
  INDEX `idx_role_id` (`role_id`),
  INDEX `idx_menu_href` (`menu_href`),
  FOREIGN KEY (`role_id`) REFERENCES `app_microservice_staff_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Cabinet Department table
CREATE TABLE IF NOT EXISTS `app_microservice_cabinet_departments` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `cabinet_id` INTEGER NOT NULL,
  `department_id` INTEGER NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `description` TEXT,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `app_microservice_cabinet_department` (`cabinet_id`),
  INDEX `app_microservice_cabinet_department_id` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Cabinet table
CREATE TABLE IF NOT EXISTS `app_microservice_cabinets` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `cabinet_name` VARCHAR(191) NOT NULL,
  `cabinet_code` VARCHAR(191) NOT NULL,
  `cabinet_type` VARCHAR(191) NOT NULL,
  `cabinet_status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `stock_id` INTEGER,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Min/Max ต่อตู้ (override ต่อ cabinet + item_code)
CREATE TABLE IF NOT EXISTS `app_microservice_cabinet_item_settings` (
  `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `cabinet_id` INTEGER NOT NULL,
  `item_code` VARCHAR(25) NOT NULL,
  `stock_min` INTEGER NULL,
  `stock_max` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `app_microservice_cabinet_item_settings_cabinet_id_item_code_key`(`cabinet_id`, `item_code`),
  INDEX `app_microservice_cabinet_item_settings_cabinet_id_idx`(`cabinet_id`),
  INDEX `app_microservice_cabinet_item_settings_item_code_idx`(`item_code`),
  CONSTRAINT `app_microservice_cabinet_item_settings_cabinet_id_fkey` FOREIGN KEY (`cabinet_id`) REFERENCES `app_microservice_cabinets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
