-- Create Staff Users table for client credentials authentication
CREATE TABLE IF NOT EXISTS `app_microservice_staff_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `fname` VARCHAR(191) NOT NULL,
  `lname` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `client_id` VARCHAR(191) NOT NULL,
  `client_secret` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `app_microservice_staff_users_email_key` (`email`),
  UNIQUE INDEX `app_microservice_staff_users_client_id_key` (`client_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX `idx_staff_client_id` ON `app_microservice_staff_users`(`client_id`);
CREATE INDEX `idx_staff_email` ON `app_microservice_staff_users`(`email`);
CREATE INDEX `idx_staff_is_active` ON `app_microservice_staff_users`(`is_active`);

