-- ═══════════════════════════════════════════════════
-- استيراد إلى phpMyAdmin على Hostinger
-- Import to phpMyAdmin on Hostinger
-- ═══════════════════════════════════════════════════
-- الخطوات:
-- 1. افتح phpMyAdmin من لوحة تحكم Hostinger
-- 2. اختر قاعدة البيانات: u878468059_linkcall
-- 3. اضغط على "Import" أو "استيراد"
-- 4. اختر هذا الملف
-- 5. اضغط "Go" أو "تنفيذ"
-- ═══════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- الجدول 1: companies - الشركات
-- ============================================================
CREATE TABLE IF NOT EXISTS `companies` (
    `id` VARCHAR(100) PRIMARY KEY COMMENT 'معرف الشركة',
    `commercial_number` VARCHAR(100) UNIQUE NOT NULL COMMENT 'السجل التجاري',
    
    -- معلومات الشركة الأساسية
    `company_name` VARCHAR(255) NOT NULL COMMENT 'اسم الشركة',
    `business_type` VARCHAR(100) COMMENT 'نوع النشاط',
    `country` VARCHAR(100) COMMENT 'الدولة',
    `city` VARCHAR(100) COMMENT 'المدينة',
    `address` TEXT COMMENT 'العنوان',
    `company_phone` VARCHAR(50) COMMENT 'هاتف الشركة',
    `company_email` VARCHAR(255) COMMENT 'البريد الإلكتروني',
    
    -- معلومات مدير الشركة
    `admin_name` VARCHAR(255) NOT NULL COMMENT 'اسم المدير',
    `admin_title` VARCHAR(100) COMMENT 'المنصب',
    `admin_phone` VARCHAR(50) COMMENT 'هاتف المدير',
    `admin_email` VARCHAR(255) COMMENT 'بريد المدير',
    
    -- بيانات الدخول
    `username` VARCHAR(100) UNIQUE NOT NULL COMMENT 'اسم المستخدم',
    `password` VARCHAR(255) NOT NULL COMMENT 'كلمة المرور المشفرة',
    
    -- الخطة والحالة
    `plan` ENUM('free', 'basic', 'professional', 'enterprise') DEFAULT 'free',
    `status` ENUM('active', 'pending', 'suspended') DEFAULT 'active',
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_verified` BOOLEAN DEFAULT FALSE,
    `verification_token` VARCHAR(255),
    
    -- الإحصائيات
    `employees_count` INT DEFAULT 0,
    `calls_count` INT DEFAULT 0,
    `total_minutes` DECIMAL(10, 2) DEFAULT 0,
    `total_minutes_used` DECIMAL(10, 4) DEFAULT 0,
    
    -- النظام المالي
    `balance` DECIMAL(10, 4) DEFAULT 121.0000,
    `total_cost_deducted` DECIMAL(10, 4) DEFAULT 0,
    
    -- حدود الخطة
    `plan_limits_calls` INT,
    `plan_limits_minutes` INT,
    `plan_limits_employees` INT,
    
    -- معلومات Twilio
    `twilio_phone` VARCHAR(50),
    `twilio_env_prefix` VARCHAR(50),
    `twilio_account_sid` VARCHAR(255),
    `twilio_auth_token` VARCHAR(255),
    `twilio_api_key` VARCHAR(255),
    `twilio_api_secret` VARCHAR(255),
    `twilio_twiml_app_sid` VARCHAR(255),
    `twilio_phone_number` VARCHAR(50),
    `twilio_updated_at` DATETIME,
    
    -- التواريخ
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `last_login_at` DATETIME,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_username` (`username`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- الجدول 2: employees - الموظفون
-- ============================================================
CREATE TABLE IF NOT EXISTS `employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` VARCHAR(100) NOT NULL,
    
    `name` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) DEFAULT 'Aa123456',
    `email` VARCHAR(255),
    `phone` VARCHAR(50),
    `title` VARCHAR(100),
    
    `role` ENUM('agent', 'supervisor', 'manager', 'admin') DEFAULT 'agent',
    
    `minutes_allocated` INT DEFAULT 0,
    `minutes_used` INT DEFAULT 0,
    
    `active` BOOLEAN DEFAULT TRUE,
    
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `deleted_at` DATETIME,
    `deleted_by` VARCHAR(255),
    `archive_id` VARCHAR(255),
    
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_username_per_company` (`company_id`, `username`),
    INDEX `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- الجدول 3: permissions - الصلاحيات
-- ============================================================
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` VARCHAR(100) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `category` ENUM('calls', 'contacts', 'reports', 'admin') NOT NULL,
    `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- الصلاحيات الافتراضية
INSERT IGNORE INTO `permissions` VALUES
('make_calls', 'إجراء المكالمات', 'calls', 'القدرة على إجراء مكالمات هاتفية'),
('view_call_history', 'عرض سجل المكالمات', 'calls', 'عرض سجل المكالمات السابقة'),
('record_calls', 'تسجيل المكالمات', 'calls', 'تسجيل المكالمات الهاتفية'),
('download_recordings', 'تحميل التسجيلات', 'calls', 'تحميل تسجيلات المكالمات'),
('view_contacts', 'عرض جهات الاتصال', 'contacts', 'عرض قائمة جهات الاتصال'),
('add_contacts', 'إضافة جهات الاتصال', 'contacts', 'إضافة جهات اتصال جديدة'),
('edit_contacts', 'تعديل جهات الاتصال', 'contacts', 'تعديل معلومات جهات الاتصال'),
('delete_contacts', 'حذف جهات الاتصال', 'contacts', 'حذف جهات الاتصال'),
('import_contacts', 'استيراد جهات الاتصال', 'contacts', 'استيراد جهات الاتصال من ملف'),
('export_contacts', 'تصدير جهات الاتصال', 'contacts', 'تصدير جهات الاتصال إلى ملف'),
('view_reports', 'عرض التقارير', 'reports', 'عرض التقارير والإحصائيات'),
('export_reports', 'تصدير التقارير', 'reports', 'تصدير التقارير إلى ملفات'),
('manage_employees', 'إدارة الموظفين', 'admin', 'إضافة وتعديل وحذف الموظفين'),
('view_employees', 'عرض الموظفين', 'admin', 'عرض قائمة الموظفين'),
('manage_company_settings', 'إدارة إعدادات الشركة', 'admin', 'تعديل إعدادات الشركة');

-- ============================================================
-- الجدول 4: employee_permissions - صلاحيات الموظفين
-- ============================================================
CREATE TABLE IF NOT EXISTS `employee_permissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `permission_id` VARCHAR(100) NOT NULL,
    `granted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_employee_permission` (`employee_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- الجدول 5: contacts - جهات الاتصال
-- ============================================================
CREATE TABLE IF NOT EXISTS `contacts` (
    `id` VARCHAR(100) PRIMARY KEY,
    `company_id` VARCHAR(100) NOT NULL,
    
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255),
    `address` TEXT,
    
    `status` ENUM('new', 'contacted', 'qualified', 'converted', 'inactive') DEFAULT 'new',
    `assigned_to` VARCHAR(100),
    `tags` TEXT,
    `notes` TEXT,
    
    `calls_count` INT DEFAULT 0,
    `last_call_at` DATETIME,
    
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `deleted_at` DATETIME,
    `deleted_by` VARCHAR(255),
    `archive_id` VARCHAR(255),
    
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `added_by` VARCHAR(255),
    
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    INDEX `idx_company_id` (`company_id`),
    INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- الجدول 6: recordings - تسجيلات المكالمات
-- ============================================================
CREATE TABLE IF NOT EXISTS `recordings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sid` VARCHAR(100) UNIQUE NOT NULL,
    `call_sid` VARCHAR(100) NOT NULL,
    `company_id` VARCHAR(100) NOT NULL,
    `employee_id` INT,
    
    `url` TEXT NOT NULL,
    `duration` INT DEFAULT 0,
    `duration_text` VARCHAR(20),
    `status` VARCHAR(50) DEFAULT 'completed',
    `to_number` VARCHAR(50),
    
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `deleted_at` DATETIME,
    `deleted_by` VARCHAR(255),
    
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    INDEX `idx_company_id` (`company_id`),
    INDEX `idx_call_sid` (`call_sid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- الجدول 7: calls - سجل المكالمات
-- ============================================================
CREATE TABLE IF NOT EXISTS `calls` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sid` VARCHAR(100) UNIQUE NOT NULL,
    `company_id` VARCHAR(100) NOT NULL,
    `employee_id` INT,
    `contact_id` VARCHAR(100),
    
    `direction` ENUM('inbound', 'outbound') NOT NULL,
    `from_number` VARCHAR(50),
    `to_number` VARCHAR(50),
    `status` VARCHAR(50),
    
    `duration` INT DEFAULT 0,
    `duration_text` VARCHAR(20),
    `cost` DECIMAL(10, 4) DEFAULT 0,
    
    `is_recorded` BOOLEAN DEFAULT FALSE,
    `recording_url` TEXT,
    
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `deleted_at` DATETIME,
    `deleted_by` VARCHAR(255),
    
    `started_at` DATETIME,
    `ended_at` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    INDEX `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- الجدول 8: deleted_archive - أرشيف المحذوفات
-- ============================================================
CREATE TABLE IF NOT EXISTS `deleted_archive` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `archive_id` VARCHAR(255) UNIQUE NOT NULL,
    `company_id` VARCHAR(100) NOT NULL,
    `original_collection` VARCHAR(255) NOT NULL,
    `subcollection` VARCHAR(100),
    `original_doc_id` VARCHAR(255) NOT NULL,
    `data` LONGTEXT NOT NULL,
    `deleted_by` VARCHAR(255),
    `deleted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `reason` TEXT,
    
    INDEX `idx_company_id` (`company_id`),
    INDEX `idx_archive_id` (`archive_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- الجدول 9: active_calls - المكالمات النشطة
-- ============================================================
CREATE TABLE IF NOT EXISTS `active_calls` (
    `call_sid` VARCHAR(100) PRIMARY KEY,
    `company_id` VARCHAR(100) NOT NULL,
    `employee_id` INT,
    `from_number` VARCHAR(50),
    `to_number` VARCHAR(50),
    `status` VARCHAR(50),
    `direction` ENUM('inbound', 'outbound'),
    `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    INDEX `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════
-- ✅ تم! الآن يمكنك البدء باستخدام قاعدة البيانات
-- ═══════════════════════════════════════════════════
