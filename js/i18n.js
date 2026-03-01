/**
 * Link Call - Internationalization (i18n) System
 * Supports: Arabic (ar) and English (en)
 * Default: Arabic
 */

const i18n = {
    translations: {
        ar: {
            // Common
            save: 'حفظ',
            cancel: 'إلغاء',
            delete: 'حذف',
            edit: 'تعديل',
            add: 'إضافة',
            search: 'بحث',
            loading: 'جاري التحميل...',
            logout: 'تسجيل الخروج',
            active: 'نشط',
            inactive: 'غير نشط',
            yes: 'نعم',
            no: 'لا',
            confirm: 'تأكيد',
            back: 'رجوع',
            next: 'التالي',
            previous: 'السابق',
            close: 'إغلاق',
            success: 'نجاح',
            error: 'خطأ',
            warning: 'تحذير',

            // App common
            app_tagline: 'نظام المكالمات السحابي المتكامل',
            app_name: 'Link Call',
            
            // Login page
            login_welcome: 'مرحباً بك في Link Call',
            login_subtitle: 'نظام إدارة المكالمات الاحترافي',
            login_username_label: 'اسم المستخدم',
            login_username_placeholder: 'أدخل اسم المستخدم',
            login_password_label: 'كلمة المرور',
            login_password_placeholder: 'أدخل كلمة المرور',
            login_remember: 'تذكرني',
            login_btn: '🔐 تسجيل الدخول',
            login_loading: 'جاري تسجيل الدخول...',
            login_error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            login_security_title: '🔒 تسجيل دخول آمن',
            login_security_text: 'بياناتك محمية بتشفير متقدم',
            feature_quality_calls: '📞 مكالمات عالية الجودة',
            feature_anywhere: '🌍 من أي مكان في العالم',
            feature_secure: '🔒 آمن ومشفر بالكامل',
            feature_reports: '📊 تقارير وتحليلات متقدمة',

            // Platform page
            platform_title: 'Link Call - نظام إدارة المكالمات',
            nav_features: 'المميزات',
            nav_plans: 'الخطط',
            nav_contact: 'تواصل معنا',
            btn_start_free: '🚀 ابدأ مجاناً',
            btn_login: 'تسجيل الدخول',
            btn_register_company: 'سجّل شركتك',
            hero_title: 'نظام إدارة المكالمات الأكثر احترافية',
            hero_subtitle: 'حل متكامل لإدارة مكالمات شركتك بكل سهولة واحترافية',
            features_title: 'لماذا تختار Link Call؟',
            feature1_title: 'مكالمات عالية الجودة',
            feature1_desc: 'صوت نقي وواضح مع أقل تأخير ممكن في أي مكان بالعالم',
            feature2_title: 'إدارة سهلة',
            feature2_desc: 'واجهة بسيطة وسهلة الاستخدام لإدارة كل موظفيك ومكالماتهم',
            feature3_title: 'أمان عالي',
            feature3_desc: 'تشفير كامل لجميع المكالمات وحماية بيانات شركتك',
            feature4_title: 'تقارير مفصّلة',
            feature4_desc: 'تحليلات وتقارير شاملة لمتابعة أداء فريق العمل',
            plans_title: 'اختر الخطة المناسبة',
            plan_free: 'مجاني',
            plan_pro: 'احترافي',
            plan_enterprise: 'مؤسسي',
            btn_choose_plan: 'اختر الخطة',
            btn_contact_us_plan: 'تواصل معنا',
            footer_rights: 'جميع الحقوق محفوظة',

            // Manage Employees page
            emp_page_title: 'إدارة الموظفين - Link Call',
            emp_header_title: 'إدارة الموظفين',
            emp_btn_add: '➕ إضافة موظف جديد',
            emp_btn_back: 'رجوع',
            emp_stat_total: 'إجمالي الموظفين',
            emp_stat_active: 'الموظفين النشطون',
            emp_stat_inactive: 'الموظفين غير النشطين',
            emp_stat_admins: 'المديرين والمشرفين',
            emp_search_placeholder: '🔍 ابحث عن موظف...',
            emp_filter_all: 'الكل',
            emp_filter_active: 'نشط',
            emp_filter_inactive: 'غير نشط',
            emp_filter_admin: 'مدير',
            emp_filter_agent: 'موظف',
            emp_col_name: 'الاسم',
            emp_col_username: 'اسم المستخدم',
            emp_col_role: 'الدور',
            emp_col_minutes: 'الدقائق',
            emp_col_status: 'الحالة',
            emp_col_actions: 'إجراءات',
            emp_no_employees: 'لا يوجد موظفون',
            emp_loading: 'جاري تحميل الموظفين...',
            emp_modal_add_title: 'إضافة موظف جديد',
            emp_modal_edit_title: 'تعديل بيانات الموظف',
            emp_field_name: 'الاسم الكامل',
            emp_field_username: 'اسم المستخدم',
            emp_field_password: 'كلمة المرور',
            emp_field_email: 'البريد الإلكتروني',
            emp_field_phone: 'رقم الهاتف',
            emp_field_title: 'المسمى الوظيفي',
            emp_field_minutes: 'الدقائق المخصصة',
            emp_field_active: 'حساب نشط',
            emp_permissions_title: 'الصلاحيات',
            emp_perm_calls: 'إجراء المكالمات',
            emp_perm_contacts: 'عرض جهات الاتصال',
            emp_perm_reports: 'عرض التقارير',
            emp_perm_admin: 'صلاحيات الإدارة',
            emp_perm_general: 'الإعدادات العامة',
            emp_btn_save: '✅ حفظ الموظف',
            emp_btn_cancel: 'إلغاء',
            emp_role_admin: 'مدير',
            emp_role_supervisor: 'مشرف',
            emp_role_agent: 'موظف',
            emp_delete_confirm: 'هل أنت متأكد من حذف هذا الموظف؟',
            emp_delete_success: 'تم حذف الموظف بنجاح',
            emp_delete_error: 'حدث خطأ أثناء حذف الموظف',
            emp_save_success: 'تم إضافة الموظف بنجاح',
            emp_update_success: 'تم تحديث بيانات الموظف بنجاح',
            emp_save_error: 'حدث خطأ أثناء حفظ البيانات',

            // Admin page
            admin_page_title: 'لوحة تحكم المطور - Link Call',
            admin_title: 'لوحة المطور',
            admin_dashboard: 'الرئيسية',
            admin_companies: 'الشركات',
            admin_calls: 'المكالمات',
            admin_employees: 'الموظفين',
            admin_analytics: 'التحليلات',
            admin_transcripts: 'تحويل الصوت',
            admin_missed: 'المكالمات الفائتة',
            admin_settings: 'الإعدادات',
            admin_back_app: 'العودة للتطبيق',
            admin_total_calls: 'إجمالي المكالمات',
            admin_answered: 'مكالمات ناجحة',
            admin_missed_calls: 'مكالمات فائتة',
            admin_active_employees: 'موظفين نشطين',
            admin_duration: 'إجمالي مدة المكالمات',
            admin_recordings: 'تسجيلات محفوظة',
            admin_online_users: '🟢 المستخدمين الأونلاين الآن',
            admin_last_login: '🕐 آخر تسجيل دخول',
            admin_no_online: 'لا يوجد مستخدمين أونلاين',
            admin_manage_companies: 'إدارة الشركات',
            admin_developer: 'المطور',
            admin_search_placeholder: 'بحث...',
            admin_page_title_dashboard: 'لوحة التحكم',

            // Register Company page
            reg_page_title: 'تسجيل شركة جديدة - Link Call',
            reg_title: 'تسجيل شركة جديدة',
            reg_header_subtitle: 'انضم إلى أكثر من 50 شركة تستخدم Link Call',
            reg_step1: 'معلومات الشركة',
            reg_step2: 'معلومات المسؤول',
            reg_step3: 'اختيار الخطة',
            reg_step4: 'المراجعة',
            reg_company_name: 'اسم الشركة',
            reg_business_type: 'نوع النشاط التجاري',
            reg_country: 'الدولة',
            reg_city: 'المدينة',
            reg_admin_name: 'اسم المدير',
            reg_admin_title: 'المسمى الوظيفي',
            reg_choose_plan: 'اختر الخطة المناسبة',
            reg_username: 'اسم المستخدم',
            reg_password: 'كلمة المرور',
            reg_confirm_password: 'تأكيد كلمة المرور',
            reg_btn_next: 'التالي →',
            reg_btn_prev: '→ السابق',
            reg_btn_register: '✅ تأكيد التسجيل',
            reg_success: 'تم إنشاء الحساب بنجاح!',
            reg_have_account: 'لديك حساب بالفعل؟',
            reg_login_link: 'تسجيل الدخول',

            // Main App Navigation
            nav_dialpad: 'لوحة المفاتيح',
            nav_contacts: 'جهات الاتصال',
            nav_call_history: 'سجل المكالمات',
            nav_recordings: 'المحفوظات',
            nav_settings: 'الإعدادات',
            nav_manage_employees: 'إدارة الموظفين',
            nav_employee_reports: 'تقارير الموظفين والتحليلات',
            nav_crm: 'CRM - إدارة العملاء',
            nav_admin_panel: 'لوحة التحكم',
            nav_logout: 'تسجيل الخروج',

            // Roles
            role_company_admin: 'مدير شركة',
            role_developer: 'مطور',
            role_manager: 'مدير',

            // Sidebar
            sidebar_tagline: 'نظام المكالمات السحابي',
            data_protect_title: 'حماية البيانات',
            data_protect_text: 'جميع مكالماتك وبياناتك محمية بتقنية أمان متقدمة. لا يمكن حذف أو تعديل البيانات بدون صلاحيات.',

            // Employee stats
            emp_stat_minutes_total: 'إجمالي الدقائق المتاحة',
            emp_stat_minutes_used: 'الدقائق المستخدمة',

            // Incoming call
            incoming_call_title: 'مكالمة واردة',
            incoming_unknown: 'جهة اتصال غير معروفة',
            incoming_reject: 'رفض',
            incoming_accept: 'رد',

            // Install app
            nav_install_app: 'تثبيت التطبيق',

            // Header extra
            settings_logout_short: 'خروج',

            // Dialpad
            dialpad_call_from: 'اتصال من:',
            dialpad_call_now: 'اتصل الآن',
            dialpad_quick_dial: 'اتصال سريع',
            caller_usa: '🇺🇸 Twilio أمريكا',
            caller_egypt: '🇪🇬 Zadarma مصر ⭐',
            caller_saudi: '🇸🇦 Zadarma السعودية',

            // Call screen
            call_status_calling: 'جاري الاتصال...',
            call_recording: 'جاري التسجيل',
            call_mute: 'كتم الصوت',
            call_speaker: 'السبيكر',
            call_hold: 'إيقاف مؤقت',
            call_end: 'إنهاء',

            // Call history
            history_empty: 'لا توجد مكالمات حتى الآن',

            // Contacts
            contacts_add: 'إضافة جهة اتصال',
            contacts_search_placeholder: 'ابحث عن جهة اتصال...',
            contacts_empty: 'لا توجد جهات اتصال',

            // Settings general
            settings_version: 'الإصدار 1.0.0',
            settings_build: 'بناء December 7, 2025',
            status_connecting: 'جاري الاتصال بـ Twilio...',

            // Settings - account section
            settings_account_title: 'معلومات الحساب',
            settings_your_number: 'رقمك الشخصي',
            settings_twilio_number: 'رقم Twilio',
            settings_connection_status: 'حالة الاتصال',
            settings_connected: 'متصل',

            // Settings - dev panel
            settings_dev_panel: 'لوحة تحكم المطور',
            settings_open_dev_panel: 'فتح لوحة تحكم المطور',

            // Settings - company admin section
            company_admin_desc: 'إضافة وإدارة موظفين الشركة',
            company_btn_manage: 'إدارة موظفين شركتك',
            company_btn_reports: 'تقارير وتحليلات الموظفين',
            company_btn_crm: 'نظام إدارة العملاء CRM',

            // Settings - balance section
            settings_balance_title: 'رصيد المكالمات',
            settings_loading: 'جاري التحميل...',
            settings_account_status: 'حالة الحساب',
            settings_recharge: 'إعادة شحن الرصيد',
            settings_refresh_balance: 'تحديث الرصيد',

            // Settings - audio section
            settings_audio_title: 'إعدادات الصوت',
            settings_auto_record: 'تسجيل المكالمات تلقائياً',
            settings_audio_quality: 'جودة الصوت',
            quality_high: 'عالية',
            quality_medium: 'متوسطة',
            quality_low: 'منخفضة',

            // Settings - notifications
            settings_notifications_title: 'الإشعارات',
            settings_incoming_notif: 'إشعارات المكالمات الواردة',
            settings_ringtone: 'صوت الرنين',

            // Settings - profile
            settings_profile_title: 'الملف الشخصي',
            settings_fullname: 'الاسم الكامل',
            settings_phone: 'رقم الهاتف',
            settings_current_password: 'كلمة المرور الحالية',
            settings_new_password: 'كلمة المرور الجديدة',
            settings_leave_empty: 'اتركها فارغة إن لم ترد التغيير',
            settings_save_profile: 'حفظ التعديلات',

            // Settings - managers section
            settings_managers_title: 'إدارة المديرين',
            settings_add_manager: 'إضافة مدير جديد',
            emp_username: 'اسم المستخدم',
            emp_password: 'كلمة المرور',
            emp_phone: 'رقم الهاتف (+966...)',
            settings_dept: 'القسم',
            settings_choose_dept: '-- اختر القسم --',
            dept_reservations: 'الحجوزات',
            dept_sales: 'المبيعات',
            dept_support: 'خدمة العملاء',
            dept_accounts: 'الحسابات',
            dept_tech: 'الدعم الفنى',
            dept_complaints: 'الشكاوى والاقتراحات',
            settings_permissions: 'الصلاحيات',
            perm_view_own: '📹 مشاهدة التسجيلات الخاصة',
            perm_view_all: '📊 مشاهدة التسجيلات العامة',
            perm_delete: '🗑️ مسح التسجيل',
            perm_edit_profile: '✏️ تعديل الملف الشخصي',
            settings_call_perms: 'صلاحيات الاتصال',
            perm_call_usa: '🇺🇸 الاتصال من أمريكا',
            perm_call_egypt: '🇪🇬 الاتصال من مصر',
            perm_call_saudi: '🇸🇦 الاتصال من السعودية',
            settings_add_manager_btn: 'إضافة مدير',
            settings_current_managers: 'المديرين الحاليين',

            // Settings - about
            settings_about_title: 'عنا',
            settings_about_text: 'Link Call - تطبيق مكالمات سحابي متكامل مع Twilio',
            settings_rights: 'جميع الحقوق محفوظة.'
        },

        en: {
            // Common
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            add: 'Add',
            search: 'Search',
            loading: 'Loading...',
            logout: 'Logout',
            active: 'Active',
            inactive: 'Inactive',
            yes: 'Yes',
            no: 'No',
            confirm: 'Confirm',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            close: 'Close',
            success: 'Success',
            error: 'Error',
            warning: 'Warning',

            // App common
            app_tagline: 'The Integrated Cloud Call System',
            app_name: 'Link Call',

            // Login page
            login_welcome: 'Welcome to Link Call',
            login_subtitle: 'Professional Call Management System',
            login_username_label: 'Username',
            login_username_placeholder: 'Enter username',
            login_password_label: 'Password',
            login_password_placeholder: 'Enter password',
            login_remember: 'Remember me',
            login_btn: '🔐 Sign In',
            login_loading: 'Signing in...',
            login_error: 'Incorrect username or password',
            login_security_title: '🔒 Secure Login',
            login_security_text: 'Your data is protected with advanced encryption',
            feature_quality_calls: '📞 High Quality Calls',
            feature_anywhere: '🌍 From Anywhere in the World',
            feature_secure: '🔒 Fully Secure & Encrypted',
            feature_reports: '📊 Advanced Reports & Analytics',

            // Platform page
            platform_title: 'Link Call - Call Management System',
            nav_features: 'Features',
            nav_plans: 'Plans',
            nav_contact: 'Contact Us',
            btn_start_free: '🚀 Start Free',
            btn_login: 'Sign In',
            btn_register_company: 'Register Company',
            hero_title: 'The Most Professional Call Management System',
            hero_subtitle: 'A complete solution to manage your company calls with ease and professionalism',
            features_title: 'Why Choose Link Call?',
            feature1_title: 'High Quality Calls',
            feature1_desc: 'Crystal clear sound with minimal latency anywhere in the world',
            feature2_title: 'Easy Management',
            feature2_desc: 'Simple and user-friendly interface to manage all your employees and calls',
            feature3_title: 'High Security',
            feature3_desc: 'Full encryption for all calls and protection of your company data',
            feature4_title: 'Detailed Reports',
            feature4_desc: 'Comprehensive analytics and reports to monitor your team performance',
            plans_title: 'Choose the Right Plan',
            plan_free: 'Free',
            plan_pro: 'Professional',
            plan_enterprise: 'Enterprise',
            btn_choose_plan: 'Choose Plan',
            btn_contact_us_plan: 'Contact Us',
            footer_rights: 'All Rights Reserved',

            // Manage Employees page
            emp_page_title: 'Employee Management - Link Call',
            emp_header_title: 'Employee Management',
            emp_btn_add: '➕ Add New Employee',
            emp_btn_back: 'Back',
            emp_stat_total: 'Total Employees',
            emp_stat_active: 'Active Employees',
            emp_stat_inactive: 'Inactive Employees',
            emp_stat_admins: 'Admins & Supervisors',
            emp_search_placeholder: '🔍 Search for employee...',
            emp_filter_all: 'All',
            emp_filter_active: 'Active',
            emp_filter_inactive: 'Inactive',
            emp_filter_admin: 'Admin',
            emp_filter_agent: 'Agent',
            emp_col_name: 'Name',
            emp_col_username: 'Username',
            emp_col_role: 'Role',
            emp_col_minutes: 'Minutes',
            emp_col_status: 'Status',
            emp_col_actions: 'Actions',
            emp_no_employees: 'No employees found',
            emp_loading: 'Loading employees...',
            emp_modal_add_title: 'Add New Employee',
            emp_modal_edit_title: 'Edit Employee',
            emp_field_name: 'Full Name',
            emp_field_username: 'Username',
            emp_field_password: 'Password',
            emp_field_email: 'Email Address',
            emp_field_phone: 'Phone Number',
            emp_field_title: 'Job Title',
            emp_field_minutes: 'Allocated Minutes',
            emp_field_active: 'Active Account',
            emp_permissions_title: 'Permissions',
            emp_perm_calls: 'Make Calls',
            emp_perm_contacts: 'View Contacts',
            emp_perm_reports: 'View Reports',
            emp_perm_admin: 'Admin Permissions',
            emp_perm_general: 'General Settings',
            emp_btn_save: '✅ Save Employee',
            emp_btn_cancel: 'Cancel',
            emp_role_admin: 'Admin',
            emp_role_supervisor: 'Supervisor',
            emp_role_agent: 'Agent',
            emp_delete_confirm: 'Are you sure you want to delete this employee?',
            emp_delete_success: 'Employee deleted successfully',
            emp_delete_error: 'Error deleting employee',
            emp_save_success: 'Employee added successfully',
            emp_update_success: 'Employee updated successfully',
            emp_save_error: 'Error saving employee data',

            // Admin page
            admin_page_title: 'Developer Dashboard - Link Call',
            admin_title: 'Developer Panel',
            admin_dashboard: 'Dashboard',
            admin_companies: 'Companies',
            admin_calls: 'Calls',
            admin_employees: 'Employees',
            admin_analytics: 'Analytics',
            admin_transcripts: 'Transcripts',
            admin_missed: 'Missed Calls',
            admin_settings: 'Settings',
            admin_back_app: 'Back to App',
            admin_total_calls: 'Total Calls',
            admin_answered: 'Successful Calls',
            admin_missed_calls: 'Missed Calls',
            admin_active_employees: 'Active Employees',
            admin_duration: 'Total Call Duration',
            admin_recordings: 'Saved Recordings',
            admin_online_users: '🟢 Online Users Now',
            admin_last_login: '🕐 Last Login',
            admin_no_online: 'No users online',
            admin_manage_companies: 'Manage Companies',
            admin_developer: 'Developer',
            admin_search_placeholder: 'Search...',
            admin_page_title_dashboard: 'Dashboard',

            // Register Company page
            reg_page_title: 'Register New Company - Link Call',
            reg_title: 'Register New Company',
            reg_header_subtitle: 'Join over 50 companies using Link Call',
            reg_step1: 'Company Info',
            reg_step2: 'Admin Info',
            reg_step3: 'Choose Plan',
            reg_step4: 'Review',
            reg_company_name: 'Company Name',
            reg_business_type: 'Business Type',
            reg_country: 'Country',
            reg_city: 'City',
            reg_admin_name: 'Admin Name',
            reg_admin_title: 'Job Title',
            reg_choose_plan: 'Choose Your Plan',
            reg_username: 'Username',
            reg_password: 'Password',
            reg_confirm_password: 'Confirm Password',
            reg_btn_next: 'Next →',
            reg_btn_prev: '← Previous',
            reg_btn_register: '✅ Confirm Registration',
            reg_success: 'Account created successfully!',
            reg_have_account: 'Already have an account?',
            reg_login_link: 'Sign In',

            // Main App Navigation
            nav_dialpad: 'Dialpad',
            nav_contacts: 'Contacts',
            nav_call_history: 'Call History',
            nav_recordings: 'Recordings',
            nav_settings: 'Settings',
            nav_manage_employees: 'Manage Employees',
            nav_employee_reports: 'Employee Reports & Analytics',
            nav_crm: 'CRM - Customer Management',
            nav_admin_panel: 'Admin Panel',
            nav_logout: 'Logout',

            // Roles
            role_company_admin: 'Company Admin',
            role_developer: 'Developer',
            role_manager: 'Manager',

            // Sidebar
            sidebar_tagline: 'Cloud Call System',
            data_protect_title: 'Data Protection',
            data_protect_text: 'All your calls and data are protected with advanced security. Data cannot be deleted or modified without proper permissions.',

            // Employee stats
            emp_stat_minutes_total: 'Total Available Minutes',
            emp_stat_minutes_used: 'Used Minutes',

            // Incoming call
            incoming_call_title: 'Incoming Call',
            incoming_unknown: 'Unknown Caller',
            incoming_reject: 'Reject',
            incoming_accept: 'Answer',

            // Install app
            nav_install_app: 'Install App',

            // Header extra
            settings_logout_short: 'Exit',

            // Dialpad
            dialpad_call_from: 'Call from:',
            dialpad_call_now: 'Call Now',
            dialpad_quick_dial: 'Quick Dial',
            caller_usa: '🇺🇸 Twilio USA',
            caller_egypt: '🇪🇬 Zadarma Egypt ⭐',
            caller_saudi: '🇸🇦 Zadarma Saudi Arabia',

            // Call screen
            call_status_calling: 'Connecting...',
            call_recording: 'Recording',
            call_mute: 'Mute',
            call_speaker: 'Speaker',
            call_hold: 'Hold',
            call_end: 'End',

            // Call history
            history_empty: 'No calls yet',

            // Contacts
            contacts_add: 'Add Contact',
            contacts_search_placeholder: 'Search contacts...',
            contacts_empty: 'No contacts found',

            // Settings general
            settings_version: 'Version 1.0.0',
            settings_build: 'Build December 7, 2025',
            status_connecting: 'Connecting to Twilio...',

            // Settings - account section
            settings_account_title: 'Account Info',
            settings_your_number: 'Your Number',
            settings_twilio_number: 'Twilio Number',
            settings_connection_status: 'Connection Status',
            settings_connected: 'Connected',

            // Settings - dev panel
            settings_dev_panel: 'Developer Panel',
            settings_open_dev_panel: 'Open Developer Panel',

            // Settings - company admin section
            company_admin_desc: 'Add and manage company employees',
            company_btn_manage: 'Manage Your Employees',
            company_btn_reports: 'Employee Reports & Analytics',
            company_btn_crm: 'CRM - Customer Management',

            // Settings - balance section
            settings_balance_title: 'Call Balance',
            settings_loading: 'Loading...',
            settings_account_status: 'Account Status',
            settings_recharge: 'Recharge Balance',
            settings_refresh_balance: 'Refresh Balance',

            // Settings - audio section
            settings_audio_title: 'Audio Settings',
            settings_auto_record: 'Auto-record calls',
            settings_audio_quality: 'Audio Quality',
            quality_high: 'High',
            quality_medium: 'Medium',
            quality_low: 'Low',

            // Settings - notifications
            settings_notifications_title: 'Notifications',
            settings_incoming_notif: 'Incoming Call Notifications',
            settings_ringtone: 'Ringtone Sound',

            // Settings - profile
            settings_profile_title: 'Profile',
            settings_fullname: 'Full Name',
            settings_phone: 'Phone Number',
            settings_current_password: 'Current Password',
            settings_new_password: 'New Password',
            settings_leave_empty: 'Leave blank to keep unchanged',
            settings_save_profile: 'Save Changes',

            // Settings - managers section
            settings_managers_title: 'Manage Managers',
            settings_add_manager: 'Add New Manager',
            emp_username: 'Username',
            emp_password: 'Password',
            emp_phone: 'Phone (+966...)',
            settings_dept: 'Department',
            settings_choose_dept: '-- Choose Department --',
            dept_reservations: 'Reservations',
            dept_sales: 'Sales',
            dept_support: 'Customer Service',
            dept_accounts: 'Accounts',
            dept_tech: 'Technical Support',
            dept_complaints: 'Complaints & Suggestions',
            settings_permissions: 'Permissions',
            perm_view_own: '📹 View Own Recordings',
            perm_view_all: '📊 View All Recordings',
            perm_delete: '🗑️ Delete Recordings',
            perm_edit_profile: '✏️ Edit Profile',
            settings_call_perms: 'Call Permissions',
            perm_call_usa: '🇺🇸 Call from USA',
            perm_call_egypt: '🇪🇬 Call from Egypt',
            perm_call_saudi: '🇸🇦 Call from Saudi Arabia',
            settings_add_manager_btn: 'Add Manager',
            settings_current_managers: 'Current Managers',

            // Settings - about
            settings_about_title: 'About',
            settings_about_text: 'Link Call - Integrated Cloud Call App with Twilio',
            settings_rights: 'All rights reserved.'
        }
    },

    get lang() {
        return localStorage.getItem('lc_lang') || 'ar';
    },

    setLang(lang) {
        localStorage.setItem('lc_lang', lang);
        this.apply();
    },

    t(key) {
        const lang = this.lang;
        const translations = this.translations;
        return (translations[lang] && translations[lang][key]) ||
               (translations['ar'] && translations['ar'][key]) ||
               key;
    },

    apply() {
        const lang = this.lang;
        const isAr = lang === 'ar';

        // Set document direction and language
        document.documentElement.lang = lang;
        document.documentElement.dir = isAr ? 'rtl' : 'ltr';

        // Update font family
        if (document.body) {
            document.body.style.fontFamily = isAr
                ? "'Segoe UI', Tahoma, Arial, sans-serif"
                : "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
        }

        // Update page title from body data-title-key
        const bodyTitleKey = document.body && document.body.getAttribute('data-title-key');
        if (bodyTitleKey) {
            document.title = this.t(bodyTitleKey);
        }
        // Or from title element data-i18n
        const titleEl = document.querySelector('title[data-i18n]');
        if (titleEl) {
            document.title = this.t(titleEl.getAttribute('data-i18n'));
        }

        // Update all [data-i18n] elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation !== key) {
                el.textContent = translation;
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Update title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Update lang buttons active state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const btnLang = btn.getAttribute('data-lang');
            btn.classList.toggle('active', btnLang === lang);
        });

        // Dispatch custom event for page-specific JS
        document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang, isAr } }));
    },

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.apply());
        } else {
            this.apply();
        }
    }
};

// Auto-initialize
i18n.init();
