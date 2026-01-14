-- Create Staff Roles table
CREATE TABLE IF NOT EXISTS `app_microservice_staff_roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(191) NOT NULL UNIQUE,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `app_microservice_staff_roles_code_key` (`code`),
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

-- Add role_id column to staff_users table
ALTER TABLE `app_microservice_staff_users` 
ADD COLUMN `role_id` INT NULL AFTER `lname`,
ADD INDEX `idx_role_id` (`role_id`);

-- Migrate existing role data to role_id
UPDATE `app_microservice_staff_users` su
INNER JOIN `app_microservice_staff_roles` sr ON su.`role` = sr.`code`
SET su.`role_id` = sr.`id`;

-- Make role_id NOT NULL after migration
ALTER TABLE `app_microservice_staff_users` 
MODIFY COLUMN `role_id` INT NOT NULL;

-- Add foreign key constraint
ALTER TABLE `app_microservice_staff_users`
ADD CONSTRAINT `fk_staff_user_role` 
FOREIGN KEY (`role_id`) REFERENCES `app_microservice_staff_roles`(`id`) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add role_id column to staff_role_permissions table
ALTER TABLE `app_microservice_staff_role_permissions`
ADD COLUMN `role_id` INT NULL AFTER `id`,
ADD INDEX `idx_role_id` (`role_id`);

-- Migrate existing role data to role_id in permissions
UPDATE `app_microservice_staff_role_permissions` srp
INNER JOIN `app_microservice_staff_roles` sr ON srp.`role` = sr.`code`
SET srp.`role_id` = sr.`id`;

-- Make role_id NOT NULL after migration
ALTER TABLE `app_microservice_staff_role_permissions`
MODIFY COLUMN `role_id` INT NOT NULL;

-- Add foreign key constraint
ALTER TABLE `app_microservice_staff_role_permissions`
ADD CONSTRAINT `fk_staff_role_permission_role` 
FOREIGN KEY (`role_id`) REFERENCES `app_microservice_staff_roles`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old unique constraint and create new one
ALTER TABLE `app_microservice_staff_role_permissions`
DROP INDEX `role_menu_href`;

ALTER TABLE `app_microservice_staff_role_permissions`
ADD UNIQUE KEY `role_menu_href` (`role_id`, `menu_href`);

-- Note: Keep `role` column for backward compatibility (can be removed later)
-- ALTER TABLE `app_microservice_staff_users` DROP COLUMN `role`;
-- ALTER TABLE `app_microservice_staff_role_permissions` DROP COLUMN `role`;
