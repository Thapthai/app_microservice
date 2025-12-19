-- Generated SQL from schema.prisma
-- Database: MySQL/MariaDB

-- Table: app_microservice_users
CREATE TABLE IF NOT EXISTS `app_microservice_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NULL,
  `name` VARCHAR(255) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `preferred_auth_method` VARCHAR(50) NOT NULL DEFAULT 'jwt',
  `last_login_at` DATETIME NULL,
  `firebase_uid` VARCHAR(255) UNIQUE NULL,
  `profile_picture` VARCHAR(500) NULL,
  `two_factor_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `two_factor_secret` VARCHAR(255) NULL,
  `backup_codes` TEXT NULL,
  `two_factor_verified_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_microservice_oauth_accounts
CREATE TABLE IF NOT EXISTS `app_microservice_oauth_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `provider_id` VARCHAR(255) NOT NULL,
  `access_token` TEXT NULL,
  `refresh_token` TEXT NULL,
  `expires_at` DATETIME NULL,
  `token_type` VARCHAR(50) NULL,
  `scope` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_provider_provider_id` (`provider`, `provider_id`),
  CONSTRAINT `fk_oauth_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_microservice_api_keys
CREATE TABLE IF NOT EXISTS `app_microservice_api_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `key_hash` VARCHAR(255) UNIQUE NOT NULL,
  `prefix` VARCHAR(20) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_used_at` DATETIME NULL,
  `expires_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_api_keys_user` FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_microservice_client_credentials
CREATE TABLE IF NOT EXISTS `app_microservice_client_credentials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `client_id` VARCHAR(255) UNIQUE NOT NULL,
  `client_secret_hash` VARCHAR(255) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_used_at` DATETIME NULL,
  `expires_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_client_id` (`client_id`),
  CONSTRAINT `fk_client_credentials_user` FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_microservice_refresh_tokens
CREATE TABLE IF NOT EXISTS `app_microservice_refresh_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token` VARCHAR(500) UNIQUE NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_revoked` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_microservice_two_factor_tokens
CREATE TABLE IF NOT EXISTS `app_microservice_two_factor_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_type` (`user_id`, `type`),
  CONSTRAINT `fk_two_factor_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `app_microservice_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_microservice_categories
CREATE TABLE IF NOT EXISTS `app_microservice_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `image` VARCHAR(500) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Table: app_microservice_medical_supply_usages
CREATE TABLE IF NOT EXISTS `app_microservice_medical_supply_usages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hospital` VARCHAR(255) NULL,
  `en` VARCHAR(255) NULL DEFAULT '',
  `patient_hn` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(255) NULL DEFAULT '',
  `lastname` VARCHAR(255) NULL DEFAULT '',
  `patient_name_th` VARCHAR(500) NULL,
  `patient_name_en` VARCHAR(500) NULL,
  `usage_datetime` VARCHAR(255) NULL,
  `usage_type` VARCHAR(100) NULL,
  `purpose` TEXT NULL,
  `department_code` VARCHAR(100) NULL,
  `recorded_by_user_id` VARCHAR(255) NULL,
  `billing_status` VARCHAR(50) NULL,
  `billing_subtotal` FLOAT NULL,
  `billing_tax` FLOAT NULL,
  `billing_total` FLOAT NULL,
  `billing_currency` VARCHAR(10) NULL DEFAULT 'THB',
  `twu` VARCHAR(255) NULL,
  `print_location` VARCHAR(255) NULL,
  `print_date` VARCHAR(255) NULL,
  `time_print_date` VARCHAR(255) NULL,
  `update` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_patient_hn` (`patient_hn`),
  INDEX `idx_en` (`en`),
  INDEX `idx_usage_datetime` (`usage_datetime`),
  INDEX `idx_department_code` (`department_code`),
  INDEX `idx_billing_status` (`billing_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_microservice_supply_usage_items
CREATE TABLE IF NOT EXISTS `app_microservice_supply_usage_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `medical_supply_usage_id` INT NOT NULL,
  `order_item_code` VARCHAR(255) NULL DEFAULT '',
  `order_item_description` VARCHAR(500) NULL DEFAULT '',
  `assession_no` VARCHAR(255) NULL DEFAULT '',
  `order_item_status` VARCHAR(100) NULL DEFAULT '',
  `qty` INT NULL DEFAULT 0,
  `uom` VARCHAR(50) NULL DEFAULT '',
  `supply_code` VARCHAR(255) NULL,
  `supply_name` VARCHAR(500) NULL,
  `supply_category` VARCHAR(255) NULL,
  `unit` VARCHAR(50) NULL,
  `quantity` INT NULL,
  `unit_price` FLOAT NULL,
  `total_price` FLOAT NULL,
  `expiry_date` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_medical_supply_usage_id` (`medical_supply_usage_id`),
  INDEX `idx_order_item_code` (`order_item_code`),
  INDEX `idx_assession_no` (`assession_no`),
  INDEX `idx_supply_code` (`supply_code`),
  CONSTRAINT `fk_supply_items_usage` FOREIGN KEY (`medical_supply_usage_id`) REFERENCES `app_microservice_medical_supply_usages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: app_microservice_medical_supply_usages_logs
CREATE TABLE IF NOT EXISTS `app_microservice_medical_supply_usages_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usage_id` INT NULL,
  `action` JSON NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_usage_id` (`usage_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_logs_usage` FOREIGN KEY (`usage_id`) REFERENCES `app_microservice_medical_supply_usages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
