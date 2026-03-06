-- ============================================================
-- نظام إدارة الاتصالات والشركات
-- Database Schema with Complete Structure and Relationships
-- Created: 2026-03-04
-- Charset: UTF8MB4 for Arabic support
-- ============================================================

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS link_call_system
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE link_call_system;

-- ============================================================
-- الجدول 1: companies - الشركات
-- ============================================================
CREATE TABLE companies (
    -- المعرفات
    id VARCHAR(100) PRIMARY KEY COMMENT 'معرف الشركة',
    commercial_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'السجل التجاري',
    
    -- معلومات الشركة الأساسية
    company_name VARCHAR(255) NOT NULL COMMENT 'اسم الشركة',
    business_type VARCHAR(100) COMMENT 'نوع النشاط',
    country VARCHAR(100) COMMENT 'الدولة',
    city VARCHAR(100) COMMENT 'المدينة',
    address TEXT COMMENT 'العنوان',
    company_phone VARCHAR(50) COMMENT 'هاتف الشركة',
    company_email VARCHAR(255) COMMENT 'البريد الإلكتروني',
    
    -- معلومات مدير الشركة
    admin_name VARCHAR(255) NOT NULL COMMENT 'اسم المدير',
    admin_title VARCHAR(100) COMMENT 'المنصب',
    admin_phone VARCHAR(50) COMMENT 'هاتف المدير',
    admin_email VARCHAR(255) COMMENT 'بريد المدير',
    
    -- بيانات الدخول
    username VARCHAR(100) UNIQUE NOT NULL COMMENT 'اسم المستخدم',
    password VARCHAR(255) NOT NULL COMMENT 'كلمة المرور المشفرة (SHA-256)',
    
    -- الخطة والحالة
    plan ENUM('free', 'basic', 'professional', 'enterprise') DEFAULT 'free' COMMENT 'الخطة الحالية',
    status ENUM('active', 'pending', 'suspended') DEFAULT 'active' COMMENT 'حالة الحساب',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط/غير نشط',
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'تم التحقق',
    verification_token VARCHAR(255) COMMENT 'رمز التحقق',
    
    -- الإحصائيات والعدادات
    employees_count INT DEFAULT 0 COMMENT 'عدد الموظفين',
    calls_count INT DEFAULT 0 COMMENT 'عدد المكالمات',
    total_minutes DECIMAL(10, 2) DEFAULT 0 COMMENT 'إجمالي الدقائق',
    total_minutes_used DECIMAL(10, 4) DEFAULT 0 COMMENT 'إجمالي الدقائق المستخدمة',
    
    -- النظام المالي
    balance DECIMAL(10, 4) DEFAULT 121.0000 COMMENT 'الرصيد الحالي بالدولار',
    total_cost_deducted DECIMAL(10, 4) DEFAULT 0 COMMENT 'إجمالي التكاليف المخصومة',
    
    -- حدود الخطة (JSON format in SQL stored as TEXT)
    plan_limits_calls INT COMMENT 'حد المكالمات - عدد المكالمات',
    plan_limits_minutes INT COMMENT 'حد المكالمات - الدقائق',
    plan_limits_employees INT COMMENT 'عدد الموظفين المسموح بهم',
    
    -- معلومات Twilio
    twilio_phone VARCHAR(50) COMMENT 'رقم Twilio',
    twilio_env_prefix VARCHAR(50) COMMENT 'بادئة بيئة Twilio',
    twilio_account_sid VARCHAR(255) COMMENT 'Twilio Account SID',
    twilio_auth_token VARCHAR(255) COMMENT 'Twilio Auth Token',
    twilio_api_key VARCHAR(255) COMMENT 'Twilio API Key',
    twilio_api_secret VARCHAR(255) COMMENT 'Twilio API Secret',
    twilio_twiml_app_sid VARCHAR(255) COMMENT 'TwiML App SID',
    twilio_phone_number VARCHAR(50) COMMENT 'رقم Twilio المخصص',
    twilio_updated_at DATETIME COMMENT 'تاريخ تحديث بيانات Twilio',
    
    -- التواريخ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    last_login_at DATETIME COMMENT 'آخر تسجيل دخول',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ آخر تحديث',
    
    -- الفهارس
    INDEX idx_username (username),
    INDEX idx_commercial_number (commercial_number),
    INDEX idx_status (status),
    INDEX idx_plan (plan),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الشركات';

-- ============================================================
-- الجدول 2: employees - الموظفون
-- ============================================================
CREATE TABLE employees (
    -- المعرفات
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'معرف الموظف',
    company_id VARCHAR(100) NOT NULL COMMENT 'معرف الشركة',
    
    -- المعلومات الأساسية
    name VARCHAR(255) NOT NULL COMMENT 'اسم الموظف',
    username VARCHAR(100) NOT NULL COMMENT 'اسم المستخدم',
    password VARCHAR(255) DEFAULT 'Aa123456' COMMENT 'كلمة المرور',
    email VARCHAR(255) COMMENT 'البريد الإلكتروني',
    phone VARCHAR(50) COMMENT 'رقم الهاتف',
    title VARCHAR(100) COMMENT 'المسمى الوظيفي',
    
    -- الدور والصلاحيات
    role ENUM('agent', 'supervisor', 'manager', 'admin') DEFAULT 'agent' COMMENT 'الدور الوظيفي',
    -- الصلاحيات تُخزن كـ JSON في تطبيق منفصل أو جدول منفصل
    
    -- إدارة الدقائق
    minutes_allocated INT DEFAULT 0 COMMENT 'الدقائق المخصصة',
    minutes_used INT DEFAULT 0 COMMENT 'الدقائق المستخدمة',
    
    -- الحالة
    active BOOLEAN DEFAULT TRUE COMMENT 'نشط/غير نشط',
    
    -- الحذف الناعم
    is_deleted BOOLEAN DEFAULT FALSE COMMENT 'محذوف',
    deleted_at DATETIME COMMENT 'تاريخ الحذف',
    deleted_by VARCHAR(255) COMMENT 'حذف بواسطة',
    archive_id VARCHAR(255) COMMENT 'معرف الأرشيف',
    
    -- التواريخ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإضافة',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث',
    
    -- المفاتيح الأجنبية
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- القيود الفريدة
    UNIQUE KEY unique_username_per_company (company_id, username),
    
    -- الفهارس
    INDEX idx_company_id (company_id),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (active),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الموظفين';

-- ============================================================
-- الجدول 3: employee_permissions - صلاحيات الموظفين
-- ============================================================
CREATE TABLE employee_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'معرف الصلاحية',
    employee_id INT NOT NULL COMMENT 'معرف الموظف',
    permission_id VARCHAR(100) NOT NULL COMMENT 'معرف الصلاحية',
    
    -- التواريخ
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ منح الصلاحية',
    
    -- المفاتيح الأجنبية
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- القيود الفريدة
    UNIQUE KEY unique_employee_permission (employee_id, permission_id),
    
    -- الفهارس
    INDEX idx_employee_id (employee_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='صلاحيات الموظفين';

-- ============================================================
-- الجدول 4: permissions - الصلاحيات المتاحة
-- ============================================================
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY COMMENT 'معرف الصلاحية',
    name VARCHAR(255) NOT NULL COMMENT 'اسم الصلاحية',
    category ENUM('calls', 'contacts', 'reports', 'admin') NOT NULL COMMENT 'فئة الصلاحية',
    description TEXT COMMENT 'وصف الصلاحية',
    
    -- الفهارس
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الصلاحيات المتاحة في النظام';

-- إدراج الصلاحيات الافتراضية
INSERT INTO permissions (id, name, category, description) VALUES
-- صلاحيات المكالمات
('make_calls', 'إجراء المكالمات', 'calls', 'القدرة على إجراء مكالمات هاتفية'),
('view_call_history', 'عرض سجل المكالمات', 'calls', 'عرض سجل المكالمات السابقة'),
('record_calls', 'تسجيل المكالمات', 'calls', 'تسجيل المكالمات الهاتفية'),
('download_recordings', 'تحميل التسجيلات', 'calls', 'تحميل تسجيلات المكالمات'),

-- صلاحيات جهات الاتصال
('view_contacts', 'عرض جهات الاتصال', 'contacts', 'عرض قائمة جهات الاتصال'),
('add_contacts', 'إضافة جهات الاتصال', 'contacts', 'إضافة جهات اتصال جديدة'),
('edit_contacts', 'تعديل جهات الاتصال', 'contacts', 'تعديل معلومات جهات الاتصال'),
('delete_contacts', 'حذف جهات الاتصال', 'contacts', 'حذف جهات الاتصال'),
('import_contacts', 'استيراد جهات الاتصال', 'contacts', 'استيراد جهات الاتصال من ملف'),
('export_contacts', 'تصدير جهات الاتصال', 'contacts', 'تصدير جهات الاتصال إلى ملف'),

-- صلاحيات التقارير
('view_reports', 'عرض التقارير', 'reports', 'عرض التقارير والإحصائيات'),
('export_reports', 'تصدير التقارير', 'reports', 'تصدير التقارير إلى ملفات'),
('view_analytics', 'عرض التحليلات', 'reports', 'عرض التحليلات والرسوم البيانية'),

-- صلاحيات الإدارة
('manage_employees', 'إدارة الموظفين', 'admin', 'إضافة وتعديل وحذف الموظفين'),
('view_employees', 'عرض الموظفين', 'admin', 'عرض قائمة الموظفين'),
('manage_company_settings', 'إدارة إعدادات الشركة', 'admin', 'تعديل إعدادات الشركة'),
('view_billing', 'عرض الفواتير', 'admin', 'عرض معلومات الفواتير والاشتراك');

-- ============================================================
-- الجدول 5: contacts - جهات الاتصال
-- ============================================================
CREATE TABLE contacts (
    -- المعرفات
    id VARCHAR(100) PRIMARY KEY COMMENT 'معرف جهة الاتصال',
    company_id VARCHAR(100) NOT NULL COMMENT 'معرف الشركة',
    
    -- المعلومات الأساسية
    name VARCHAR(255) NOT NULL COMMENT 'الاسم',
    phone VARCHAR(50) NOT NULL COMMENT 'رقم الهاتف',
    email VARCHAR(255) COMMENT 'البريد الإلكتروني',
    address TEXT COMMENT 'العنوان',
    
    -- التصنيف والإدارة
    status ENUM('new', 'contacted', 'qualified', 'converted', 'inactive') DEFAULT 'new' COMMENT 'حالة العميل',
    assigned_to VARCHAR(100) COMMENT 'موزع على (اسم المستخدم للموظف)',
    tags TEXT COMMENT 'الوسوم (JSON array)',
    notes TEXT COMMENT 'ملاحظات',
    
    -- الإحصائيات
    calls_count INT DEFAULT 0 COMMENT 'عدد المكالمات',
    last_call_at DATETIME COMMENT 'تاريخ آخر مكالمة',
    
    -- الحذف الناعم
    is_deleted BOOLEAN DEFAULT FALSE COMMENT 'محذوف',
    deleted_at DATETIME COMMENT 'تاريخ الحذف',
    deleted_by VARCHAR(255) COMMENT 'حذف بواسطة',
    archive_id VARCHAR(255) COMMENT 'معرف الأرشيف',
    
    -- التواريخ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإضافة',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث',
    added_by VARCHAR(255) COMMENT 'أضيف بواسطة',
    
    -- المفاتيح الأجنبية
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- الفهارس
    INDEX idx_company_id (company_id),
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_created_at (created_at),
    INDEX idx_company_phone (company_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول جهات الاتصال';

-- ============================================================
-- الجدول 6: calls - سجل المكالمات
-- ============================================================
CREATE TABLE calls (
    -- المعرفات
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'معرف المكالمة',
    sid VARCHAR(100) UNIQUE NOT NULL COMMENT 'Twilio Call SID',
    company_id VARCHAR(100) NOT NULL COMMENT 'معرف الشركة',
    employee_id INT COMMENT 'معرف الموظف',
    contact_id VARCHAR(100) COMMENT 'معرف جهة الاتصال',
    
    -- معلومات المكالمة
    direction ENUM('inbound', 'outbound') NOT NULL COMMENT 'اتجاه المكالمة',
    from_number VARCHAR(50) COMMENT 'من رقم',
    to_number VARCHAR(50) COMMENT 'إلى رقم',
    status VARCHAR(50) COMMENT 'حالة المكالمة',
    
    -- المدة والتكلفة
    duration INT DEFAULT 0 COMMENT 'المدة بالثواني',
    duration_text VARCHAR(20) COMMENT 'المدة بصيغة نصية (MM:SS)',
    cost DECIMAL(10, 4) DEFAULT 0 COMMENT 'التكلفة بالدولار',
    
    -- التسجيل
    is_recorded BOOLEAN DEFAULT FALSE COMMENT 'تم التسجيل',
    recording_url TEXT COMMENT 'رابط التسجيل',
    
    -- الحذف الناعم
    is_deleted BOOLEAN DEFAULT FALSE COMMENT 'محذوف',
    deleted_at DATETIME COMMENT 'تاريخ الحذف',
    deleted_by VARCHAR(255) COMMENT 'حذف بواسطة',
    
    -- التواريخ
    started_at DATETIME COMMENT 'تاريخ بدء المكالمة',
    ended_at DATETIME COMMENT 'تاريخ انتهاء المكالمة',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإضافة',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث',
    
    -- المفاتيح الأجنبية
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- الفهارس
    INDEX idx_sid (sid),
    INDEX idx_company_id (company_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_direction (direction),
    INDEX idx_status (status),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_started_at (started_at),
    INDEX idx_created_at (created_at),
    INDEX idx_company_employee (company_id, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل المكالمات';

-- ============================================================
-- الجدول 7: recordings - تسجيلات المكالمات
-- ============================================================
CREATE TABLE recordings (
    -- المعرفات
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'معرف التسجيل',
    sid VARCHAR(100) UNIQUE NOT NULL COMMENT 'Twilio Recording SID',
    call_sid VARCHAR(100) NOT NULL COMMENT 'Twilio Call SID',
    company_id VARCHAR(100) NOT NULL COMMENT 'معرف الشركة',
    employee_id INT COMMENT 'معرف الموظف',
    
    -- معلومات التسجيل
    url TEXT NOT NULL COMMENT 'رابط التسجيل',
    duration INT DEFAULT 0 COMMENT 'المدة بالثواني',
    duration_text VARCHAR(20) COMMENT 'المدة بصيغة نصية (MM:SS)',
    status VARCHAR(50) DEFAULT 'completed' COMMENT 'حالة التسجيل',
    to_number VARCHAR(50) COMMENT 'رقم المتلقي',
    
    -- الحذف الناعم
    is_deleted BOOLEAN DEFAULT FALSE COMMENT 'محذوف',
    deleted_at DATETIME COMMENT 'تاريخ الحذف',
    deleted_by VARCHAR(255) COMMENT 'حذف بواسطة',
    
    -- التواريخ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث',
    
    -- المفاتيح الأجنبية
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (call_sid) REFERENCES calls(sid) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- الفهارس
    INDEX idx_sid (sid),
    INDEX idx_call_sid (call_sid),
    INDEX idx_company_id (company_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تسجيلات المكالمات';

-- ============================================================
-- الجدول 8: active_calls - المكالمات النشطة (مؤقتة)
-- ============================================================
CREATE TABLE active_calls (
    -- المعرفات
    call_sid VARCHAR(100) PRIMARY KEY COMMENT 'Twilio Call SID',
    company_id VARCHAR(100) NOT NULL COMMENT 'معرف الشركة',
    employee_id INT COMMENT 'معرف الموظف',
    
    -- معلومات المكالمة
    from_number VARCHAR(50) COMMENT 'من رقم',
    to_number VARCHAR(50) COMMENT 'إلى رقم',
    status VARCHAR(50) COMMENT 'حالة المكالمة',
    direction ENUM('inbound', 'outbound') COMMENT 'اتجاه المكالمة',
    
    -- التواريخ
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ البدء',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'آخر تحديث',
    
    -- المفاتيح الأجنبية
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- الفهارس
    INDEX idx_company_id (company_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='المكالمات النشطة المؤقتة';

-- ============================================================
-- الجدول 9: activity_log - سجل النشاطات
-- ============================================================
CREATE TABLE activity_log (
    -- المعرفات
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'معرف النشاط',
    activity_id VARCHAR(100) UNIQUE COMMENT 'معرف فريد للنشاط',
    company_id VARCHAR(100) NOT NULL COMMENT 'معرف الشركة',
    
    -- معلومات النشاط
    action VARCHAR(255) NOT NULL COMMENT 'نوع النشاط',
    entity_type VARCHAR(100) COMMENT 'نوع الكيان (contact, call, employee)',
    entity_id VARCHAR(100) COMMENT 'معرف الكيان',
    
    -- التفاصيل
    description TEXT COMMENT 'وصف النشاط',
    metadata TEXT COMMENT 'بيانات إضافية (JSON)',
    
    -- المستخدم
    performed_by VARCHAR(255) COMMENT 'نفذ بواسطة',
    user_type ENUM('admin', 'employee', 'system') DEFAULT 'system' COMMENT 'نوع المستخدم',
    
    -- التواريخ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ النشاط',
    
    -- المفاتيح الأجنبية
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- الفهارس
    INDEX idx_company_id (company_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_performed_by (performed_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل النشاطات والأحداث';

-- ============================================================
-- الجدول 10: deleted_archive - أرشيف المحذوفات (لا يُمسح أبداً)
-- ============================================================
CREATE TABLE deleted_archive (
    -- المعرفات
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'معرف السجل',
    archive_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'معرف فريد للأرشيف',
    
    -- معلومات المصدر
    company_id VARCHAR(100) NOT NULL COMMENT 'معرف الشركة',
    original_collection VARCHAR(255) NOT NULL COMMENT 'اسم المجموعة الأصلية',
    subcollection VARCHAR(100) COMMENT 'اسم المجموعة الفرعية',
    original_doc_id VARCHAR(255) NOT NULL COMMENT 'معرف المستند الأصلي',
    
    -- البيانات المحفوظة
    data LONGTEXT NOT NULL COMMENT 'البيانات الأصلية (JSON)',
    
    -- معلومات الحذف
    deleted_by VARCHAR(255) COMMENT 'حذف بواسطة',
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الحذف',
    reason TEXT COMMENT 'سبب الحذف',
    
    -- الفهارس
    INDEX idx_company_id (company_id),
    INDEX idx_archive_id (archive_id),
    INDEX idx_original_collection (original_collection),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_deleted_by (deleted_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='أرشيف المحذوفات - لا يُحذف أبداً';

-- ============================================================
-- الجدول 11: system_settings - إعدادات النظام
-- ============================================================
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'معرف الإعداد',
    setting_key VARCHAR(100) UNIQUE NOT NULL COMMENT 'مفتاح الإعداد',
    setting_value TEXT COMMENT 'قيمة الإعداد',
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT 'نوع الإعداد',
    description TEXT COMMENT 'وصف الإعداد',
    
    -- التواريخ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث',
    
    -- الفهارس
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إعدادات النظام العامة';

-- إدراج الإعدادات الافتراضية
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('cost_per_minute', '0.014', 'number', 'تكلفة الدقيقة الواحدة بالدولار'),
('default_balance', '121.0000', 'number', 'الرصيد الافتراضي للشركات الجديدة'),
('max_upload_size', '10485760', 'number', 'الحد الأقصى لحجم الملف المرفوع (بايت)'),
('maintenance_mode', 'false', 'boolean', 'وضع الصيانة'),
('system_version', '1.0.0', 'string', 'إصدار النظام');

-- ============================================================
-- Views - العروض (Views) لتسهيل الاستعلامات
-- ============================================================

-- عرض: إحصائيات الشركات
CREATE OR REPLACE VIEW company_statistics AS
SELECT 
    c.id,
    c.company_name,
    c.plan,
    c.status,
    c.balance,
    c.employees_count,
    COUNT(DISTINCT co.id) AS contacts_count,
    COUNT(DISTINCT ca.id) AS total_calls,
    COUNT(DISTINCT r.id) AS total_recordings,
    COALESCE(SUM(ca.duration), 0) AS total_call_duration,
    COALESCE(SUM(ca.cost), 0) AS total_call_cost
FROM companies c
LEFT JOIN contacts co ON c.id = co.company_id AND co.is_deleted = FALSE
LEFT JOIN calls ca ON c.id = ca.company_id AND ca.is_deleted = FALSE
LEFT JOIN recordings r ON c.id = r.company_id AND r.is_deleted = FALSE
GROUP BY c.id, c.company_name, c.plan, c.status, c.balance, c.employees_count;

-- عرض: إحصائيات الموظفين
CREATE OR REPLACE VIEW employee_statistics AS
SELECT 
    e.id,
    e.company_id,
    e.name,
    e.username,
    e.role,
    e.minutes_allocated,
    e.minutes_used,
    (e.minutes_allocated - e.minutes_used) AS minutes_remaining,
    COUNT(DISTINCT c.id) AS total_calls,
    COUNT(DISTINCT r.id) AS total_recordings,
    COALESCE(SUM(c.duration), 0) AS total_call_duration,
    COALESCE(SUM(c.cost), 0) AS total_call_cost
FROM employees e
LEFT JOIN calls c ON e.id = c.employee_id AND c.is_deleted = FALSE
LEFT JOIN recordings r ON e.id = r.employee_id AND r.is_deleted = FALSE
WHERE e.is_deleted = FALSE
GROUP BY e.id, e.company_id, e.name, e.username, e.role, e.minutes_allocated, e.minutes_used;

-- عرض: جهات الاتصال النشطة مع آخر مكالمة
CREATE OR REPLACE VIEW active_contacts_with_last_call AS
SELECT 
    co.id,
    co.company_id,
    co.name,
    co.phone,
    co.email,
    co.status,
    co.assigned_to,
    co.calls_count,
    MAX(ca.started_at) AS last_call_date,
    MAX(ca.duration) AS last_call_duration
FROM contacts co
LEFT JOIN calls ca ON co.id = ca.contact_id AND ca.is_deleted = FALSE
WHERE co.is_deleted = FALSE
GROUP BY co.id, co.company_id, co.name, co.phone, co.email, co.status, co.assigned_to, co.calls_count;

-- ============================================================
-- Stored Procedures - الإجراءات المخزنة
-- ============================================================

-- إجراء: تحديث إحصائيات الشركة
DELIMITER //
CREATE PROCEDURE update_company_statistics(IN p_company_id VARCHAR(100))
BEGIN
    DECLARE v_employees_count INT;
    DECLARE v_calls_count INT;
    DECLARE v_total_minutes DECIMAL(10,2);
    
    -- حساب عدد الموظفين
    SELECT COUNT(*) INTO v_employees_count
    FROM employees
    WHERE company_id = p_company_id AND is_deleted = FALSE;
    
    -- حساب عدد المكالمات
    SELECT COUNT(*) INTO v_calls_count
    FROM calls
    WHERE company_id = p_company_id AND is_deleted = FALSE;
    
    -- حساب إجمالي الدقائق
    SELECT COALESCE(SUM(duration), 0) / 60 INTO v_total_minutes
    FROM calls
    WHERE company_id = p_company_id AND is_deleted = FALSE;
    
    -- تحديث بيانات الشركة
    UPDATE companies
    SET 
        employees_count = v_employees_count,
        calls_count = v_calls_count,
        total_minutes = v_total_minutes
    WHERE id = p_company_id;
END //
DELIMITER ;

-- إجراء: تسجيل نشاط
DELIMITER //
CREATE PROCEDURE log_activity(
    IN p_company_id VARCHAR(100),
    IN p_action VARCHAR(255),
    IN p_entity_type VARCHAR(100),
    IN p_entity_id VARCHAR(100),
    IN p_description TEXT,
    IN p_performed_by VARCHAR(255),
    IN p_user_type VARCHAR(50)
)
BEGIN
    DECLARE v_activity_id VARCHAR(100);
    
    SET v_activity_id = CONCAT('ACT_', UNIX_TIMESTAMP(), '_', FLOOR(RAND() * 1000000));
    
    INSERT INTO activity_log (
        activity_id,
        company_id,
        action,
        entity_type,
        entity_id,
        description,
        performed_by,
        user_type,
        created_at
    ) VALUES (
        v_activity_id,
        p_company_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_description,
        p_performed_by,
        p_user_type,
        NOW()
    );
END //
DELIMITER ;

-- إجراء: حذف ناعم مع أرشفة
DELIMITER //
CREATE PROCEDURE soft_delete_contact(
    IN p_contact_id VARCHAR(100),
    IN p_deleted_by VARCHAR(255)
)
BEGIN
    DECLARE v_company_id VARCHAR(100);
    DECLARE v_archive_id VARCHAR(255);
    DECLARE v_contact_data TEXT;
    
    -- جلب بيانات جهة الاتصال
    SELECT company_id INTO v_company_id
    FROM contacts
    WHERE id = p_contact_id;
    
    -- إنشاء معرف أرشيف
    SET v_archive_id = CONCAT(v_company_id, '_contact_', p_contact_id, '_', UNIX_TIMESTAMP());
    
    -- حفظ البيانات في الأرشيف
    INSERT INTO deleted_archive (
        archive_id,
        company_id,
        original_collection,
        subcollection,
        original_doc_id,
        data,
        deleted_by,
        deleted_at
    )
    SELECT 
        v_archive_id,
        company_id,
        'contacts',
        NULL,
        id,
        JSON_OBJECT(
            'id', id,
            'name', name,
            'phone', phone,
            'email', email,
            'status', status,
            'assigned_to', assigned_to
        ),
        p_deleted_by,
        NOW()
    FROM contacts
    WHERE id = p_contact_id;
    
    -- تحديث جهة الاتصال بعلامة الحذف
    UPDATE contacts
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = p_deleted_by,
        archive_id = v_archive_id
    WHERE id = p_contact_id;
    
    -- تسجيل النشاط
    CALL log_activity(
        v_company_id,
        'contact_deleted',
        'contact',
        p_contact_id,
        CONCAT('تم حذف جهة الاتصال: ', p_contact_id),
        p_deleted_by,
        'admin'
    );
END //
DELIMITER ;

-- ============================================================
-- Triggers - المحفزات
-- ============================================================

-- محفز: تحديث عداد المكالمات لجهة الاتصال
DELIMITER //
CREATE TRIGGER update_contact_calls_count AFTER INSERT ON calls
FOR EACH ROW
BEGIN
    IF NEW.contact_id IS NOT NULL THEN
        UPDATE contacts
        SET 
            calls_count = calls_count + 1,
            last_call_at = NEW.started_at
        WHERE id = NEW.contact_id;
    END IF;
END //
DELIMITER ;

-- محفز: تحديث دقائق الموظف بعد المكالمة
DELIMITER //
CREATE TRIGGER update_employee_minutes AFTER UPDATE ON calls
FOR EACH ROW
BEGIN
    IF NEW.employee_id IS NOT NULL AND NEW.duration > 0 AND OLD.duration = 0 THEN
        UPDATE employees
        SET minutes_used = minutes_used + CEIL(NEW.duration / 60)
        WHERE id = NEW.employee_id;
    END IF;
END //
DELIMITER ;

-- محفز: تسجيل نشاط عند إضافة موظف جديد
DELIMITER //
CREATE TRIGGER log_employee_created AFTER INSERT ON employees
FOR EACH ROW
BEGIN
    INSERT INTO activity_log (
        activity_id,
        company_id,
        action,
        entity_type,
        entity_id,
        description,
        performed_by,
        user_type
    ) VALUES (
        CONCAT('ACT_', UNIX_TIMESTAMP(), '_', FLOOR(RAND() * 1000000)),
        NEW.company_id,
        'employee_created',
        'employee',
        NEW.id,
        CONCAT('تم إضافة موظف جديد: ', NEW.name),
        'admin',
        'admin'
    );
END //
DELIMITER ;

-- ============================================================
-- Indexes for Performance Optimization
-- فهارس إضافية لتحسين الأداء
-- ============================================================

-- فهارس مركبة للاستعلامات الشائعة
CREATE INDEX idx_calls_company_date ON calls(company_id, started_at DESC);
CREATE INDEX idx_calls_employee_date ON calls(employee_id, started_at DESC);
CREATE INDEX idx_contacts_company_status ON contacts(company_id, status);
CREATE INDEX idx_recordings_company_created ON recordings(company_id, created_at DESC);
CREATE INDEX idx_activity_company_date ON activity_log(company_id, created_at DESC);

-- فهارس Full-Text للبحث النصي
CREATE FULLTEXT INDEX ft_contacts_search ON contacts(name, phone, email);
CREATE FULLTEXT INDEX ft_companies_search ON companies(company_name, commercial_number);

-- ============================================================
-- Sample Data - بيانات تجريبية للاختبار
-- ============================================================

-- إدراج شركة تجريبية
INSERT INTO companies (
    id, commercial_number, company_name, business_type, country, city,
    admin_name, username, password, plan, status
) VALUES (
    'COMP-1234567890-TEST',
    '1234567890',
    'شركة الاختبار التجريبية',
    'تكنولوجيا',
    'السعودية',
    'الرياض',
    'أحمد محمد',
    'testcompany',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- empty string hash for testing
    'professional',
    'active'
);

-- إدراج موظف تجريبي
INSERT INTO employees (
    company_id, name, username, password, email, phone, title, role,
    minutes_allocated, minutes_used, active
) VALUES (
    'COMP-1234567890-TEST',
    'محمد أحمد',
    'mohammed',
    'Aa123456',
    'mohammed@test.com',
    '0501234567',
    'مدير مبيعات',
    'manager',
    1000,
    0,
    TRUE
);

-- ============================================================
-- Security & Maintenance
-- الأمان والصيانة
-- ============================================================

-- إنشاء مستخدم للتطبيق مع صلاحيات محدودة
-- CREATE USER 'linkcall_app'@'localhost' IDENTIFIED BY 'strong_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON link_call_system.* TO 'linkcall_app'@'localhost';
-- GRANT EXECUTE ON link_call_system.* TO 'linkcall_app'@'localhost';
-- FLUSH PRIVILEGES;

-- جدول النسخ الاحتياطي التلقائي
CREATE TABLE backup_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backup_file VARCHAR(255) NOT NULL,
    backup_size BIGINT COMMENT 'حجم النسخة بالبايت',
    backup_type ENUM('full', 'incremental') DEFAULT 'full',
    status ENUM('success', 'failed') DEFAULT 'success',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل النسخ الاحتياطية';

-- ============================================================
-- Documentation & Comments
-- ============================================================

/*
هيكل قاعدة البيانات - نظام إدارة الاتصالات

الجداول الرئيسية:
1. companies - إدارة الشركات وحساباتها
2. employees - موظفي كل شركة
3. employee_permissions - صلاحيات الموظفين
4. permissions - الصلاحيات المتاحة في النظام
5. contacts - جهات الاتصال لكل شركة
6. calls - سجل جميع المكالمات
7. recordings - تسجيلات المكالمات
8. active_calls - المكالمات الجارية (مؤقتة)
9. activity_log - سجل جميع الأنشطة والأحداث
10. deleted_archive - أرشيف البيانات المحذوفة (لا تُحذف أبداً)
11. system_settings - إعدادات النظام العامة

العلاقات الرئيسية:
- شركة ← موظفون (One-to-Many)
- شركة ← جهات اتصال (One-to-Many)
- شركة ← مكالمات (One-to-Many)
- موظف ← صلاحيات (Many-to-Many عبر employee_permissions)
- موظف ← مكالمات (One-to-Many)
- مكالمة ← تسجيل (One-to-One)
- جهة اتصال ← مكالمات (One-to-Many)

ملاحظات:
- يستخدم النظام الحذف الناعم (Soft Delete) للحفاظ على البيانات
- جميع البيانات المحذوفة تُحفظ في جدول deleted_archive
- يدعم النظام اللغة العربية بالكامل مع UTF8MB4
- يتضمن فهارس محسنة لتحسين أداء الاستعلامات
- يتضمن إجراءات مخزنة ومحفزات لأتمتة العمليات

الإصدار: 1.0.0
تاريخ الإنشاء: 2026-03-04
*/

-- ============================================================
-- END OF SCHEMA
-- ============================================================
