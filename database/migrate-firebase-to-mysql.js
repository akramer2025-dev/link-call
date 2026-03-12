/**
 * Migration Script: Firebase Firestore → MySQL
 * نقل جميع البيانات من Firebase إلى MySQL
 * 
 * الخطوات:
 * 1. قراءة جميع البيانات من Firebase
 * 2. تحويل البيانات إلى صيغة MySQL
 * 3. إدراج البيانات في MySQL مع معالجة العلاقات
 * 
 * الاستخدام:
 * node migrate-firebase-to-mysql.js
 */

const { getDb } = require('./utils/firebase');
const { query, queryOne, beginTransaction, commit, rollback, testConnection } = require('./utils/mysql');
const { collection, getDocs, doc, getDoc } = require('firebase/firestore');
const crypto = require('crypto');

// إحصائيات الهجرة
const stats = {
    companies: { total: 0, success: 0, failed: 0 },
    employees: { total: 0, success: 0, failed: 0 },
    contacts: { total: 0, success: 0, failed: 0 },
    recordings: { total: 0, success: 0, failed: 0 }
};

/**
 * تحويل كلمات المرور القديمة إلى SHA-256
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * تنسيق التاريخ لـ MySQL
 */
function formatDate(timestamp) {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
}

/**
 * 1. هجرة الشركات (Companies)
 */
async function migrateCompanies() {
    console.log('\n📦 بدء هجرة الشركات...');
    const db = getDb();
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    
    stats.companies.total = companiesSnapshot.size;
    console.log(`وجدنا ${companiesSnapshot.size} شركة في Firebase`);

    for (const docSnap of companiesSnapshot.docs) {
        try {
            const data = docSnap.data();
            const companyId = docSnap.id;

            // تحضير البيانات
            const companyData = {
                id: companyId,
                commercial_number: data.commercialNumber || companyId,
                company_name: data.companyName || 'غير محدد',
                business_type: data.businessType || null,
                country: data.country || null,
                city: data.city || null,
                address: data.address || null,
                company_phone: data.companyPhone || null,
                company_email: data.companyEmail || null,
                
                admin_name: data.adminName || null,
                admin_title: data.adminTitle || null,
                admin_phone: data.adminPhone || null,
                admin_email: data.adminEmail || null,
                
                username: data.username || companyId,
                password: hashPassword(data.password || 'Aa123456'),
                
                plan: data.plan || 'free',
                status: data.status || 'active',
                is_active: data.isActive !== false,
                is_verified: data.isVerified || false,
                verification_token: data.verificationToken || null,
                
                employees_count: data.employeesCount || 0,
                calls_count: data.callsCount || 0,
                total_minutes: data.totalMinutes || 0,
                total_minutes_used: data.totalMinutesUsed || 0,
                
                balance: data.balance || 121.0000,
                total_cost_deducted: data.totalCostDeducted || 0,
                
                plan_limits_calls: data.planLimits?.calls || null,
                plan_limits_minutes: data.planLimits?.minutes || null,
                plan_limits_employees: data.planLimits?.employees || null,
                
                twilio_phone: data.twilioPhone || null,
                twilio_env_prefix: data.twilioEnvPrefix || null,
                twilio_account_sid: data.twilioCredentials?.accountSid || null,
                twilio_auth_token: data.twilioCredentials?.authToken || null,
                twilio_api_key: data.twilioCredentials?.apiKey || null,
                twilio_api_secret: data.twilioCredentials?.apiSecret || null,
                twilio_twiml_app_sid: data.twilioCredentials?.twimlAppSid || null,
                twilio_phone_number: data.twilioCredentials?.phoneNumber || null,
                twilio_updated_at: formatDate(data.twilioUpdatedAt),
                
                created_at: formatDate(data.createdAt) || new Date(),
                last_login_at: formatDate(data.lastLoginAt),
                updated_at: formatDate(data.updatedAt) || new Date()
            };

            // إدراج في MySQL
            const sql = `
                INSERT INTO companies (
                    id, commercial_number, company_name, business_type, country, city, address,
                    company_phone, company_email, admin_name, admin_title, admin_phone, admin_email,
                    username, password, plan, status, is_active, is_verified, verification_token,
                    employees_count, calls_count, total_minutes, total_minutes_used,
                    balance, total_cost_deducted, plan_limits_calls, plan_limits_minutes, plan_limits_employees,
                    twilio_phone, twilio_env_prefix, twilio_account_sid, twilio_auth_token,
                    twilio_api_key, twilio_api_secret, twilio_twiml_app_sid, twilio_phone_number, twilio_updated_at,
                    created_at, last_login_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    company_name = VALUES(company_name),
                    balance = VALUES(balance),
                    updated_at = VALUES(updated_at)
            `;

            await query(sql, [
                companyData.id, companyData.commercial_number, companyData.company_name,
                companyData.business_type, companyData.country, companyData.city, companyData.address,
                companyData.company_phone, companyData.company_email, companyData.admin_name,
                companyData.admin_title, companyData.admin_phone, companyData.admin_email,
                companyData.username, companyData.password, companyData.plan, companyData.status,
                companyData.is_active, companyData.is_verified, companyData.verification_token,
                companyData.employees_count, companyData.calls_count, companyData.total_minutes,
                companyData.total_minutes_used, companyData.balance, companyData.total_cost_deducted,
                companyData.plan_limits_calls, companyData.plan_limits_minutes, companyData.plan_limits_employees,
                companyData.twilio_phone, companyData.twilio_env_prefix, companyData.twilio_account_sid,
                companyData.twilio_auth_token, companyData.twilio_api_key, companyData.twilio_api_secret,
                companyData.twilio_twiml_app_sid, companyData.twilio_phone_number, companyData.twilio_updated_at,
                companyData.created_at, companyData.last_login_at, companyData.updated_at
            ]);

            stats.companies.success++;
            console.log(`✅ ${companyData.company_name} - نجحت`);

            // هجرة موظفي الشركة
            await migrateCompanyEmployees(companyId);

            // هجرة جهات اتصال الشركة
            await migrateCompanyContacts(companyId);

            // هجرة تسجيلات الشركة
            await migrateCompanyRecordings(companyId);

        } catch (error) {
            stats.companies.failed++;
            console.error(`❌ فشل هجرة الشركة ${docSnap.id}:`, error.message);
        }
    }
}

/**
 * 2. هجرة موظفي الشركة
 */
async function migrateCompanyEmployees(companyId) {
    const db = getDb();
    const employeesSnapshot = await getDocs(collection(db, `companies/${companyId}/employees`));
    
    if (employeesSnapshot.empty) return;
    
    console.log(`  📋 هجرة ${employeesSnapshot.size} موظف للشركة ${companyId}`);

    for (const docSnap of employeesSnapshot.docs) {
        try {
            const data = docSnap.data();
            
            const employeeData = {
                company_id: companyId,
                name: data.name || 'غير محدد',
                username: data.username || `emp_${Date.now()}`,
                password: hashPassword(data.password || 'Aa123456'),
                email: data.email || null,
                phone: data.phone || null,
                title: data.title || null,
                role: data.role || 'agent',
                minutes_allocated: data.minutesAllocated || 0,
                minutes_used: data.minutesUsed || 0,
                active: data.active !== false,
                is_deleted: data.isDeleted || false,
                deleted_at: formatDate(data.deletedAt),
                deleted_by: data.deletedBy || null,
                archive_id: data.archiveId || null,
                created_at: formatDate(data.createdAt) || new Date(),
                updated_at: formatDate(data.updatedAt) || new Date()
            };

            const sql = `
                INSERT INTO employees (
                    company_id, name, username, password, email, phone, title, role,
                    minutes_allocated, minutes_used, active, is_deleted, deleted_at, deleted_by, archive_id,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    active = VALUES(active),
                    updated_at = VALUES(updated_at)
            `;

            const result = await query(sql, [
                employeeData.company_id, employeeData.name, employeeData.username, employeeData.password,
                employeeData.email, employeeData.phone, employeeData.title, employeeData.role,
                employeeData.minutes_allocated, employeeData.minutes_used, employeeData.active,
                employeeData.is_deleted, employeeData.deleted_at, employeeData.deleted_by, employeeData.archive_id,
                employeeData.created_at, employeeData.updated_at
            ]);

            const employeeId = result.insertId;

            // هجرة الصلاحيات إن وجدت
            if (data.permissions && Array.isArray(data.permissions)) {
                for (const permission of data.permissions) {
                    try {
                        await query(
                            'INSERT IGNORE INTO employee_permissions (employee_id, permission_id) VALUES (?, ?)',
                            [employeeId, permission]
                        );
                    } catch (permError) {
                        console.error(`    ⚠️ فشل إضافة صلاحية ${permission}:`, permError.message);
                    }
                }
            }

            stats.employees.success++;
            console.log(`    ✅ موظف: ${employeeData.name}`);

        } catch (error) {
            stats.employees.failed++;
            console.error(`    ❌ فشل هجرة موظف:`, error.message);
        }
    }
}

/**
 * 3. هجرة جهات اتصال الشركة
 */
async function migrateCompanyContacts(companyId) {
    const db = getDb();
    const contactsSnapshot = await getDocs(collection(db, `companies/${companyId}/contacts`));
    
    if (contactsSnapshot.empty) return;
    
    console.log(`  📇 هجرة ${contactsSnapshot.size} جهة اتصال للشركة ${companyId}`);

    for (const docSnap of contactsSnapshot.docs) {
        try {
            const data = docSnap.data();
            const contactId = docSnap.id;
            
            const contactData = {
                id: contactId,
                company_id: companyId,
                name: data.name || 'غير محدد',
                phone: data.phone || '',
                email: data.email || null,
                address: data.address || null,
                status: data.status || 'new',
                assigned_to: data.assignedTo || null,
                tags: data.tags ? JSON.stringify(data.tags) : null,
                notes: data.notes || null,
                calls_count: data.callsCount || 0,
                last_call_at: formatDate(data.lastCallAt),
                is_deleted: data.isDeleted || false,
                deleted_at: formatDate(data.deletedAt),
                deleted_by: data.deletedBy || null,
                archive_id: data.archiveId || null,
                created_at: formatDate(data.createdAt) || new Date(),
                updated_at: formatDate(data.updatedAt) || new Date(),
                added_by: data.addedBy || null
            };

            const sql = `
                INSERT INTO contacts (
                    id, company_id, name, phone, email, address, status, assigned_to, tags, notes,
                    calls_count, last_call_at, is_deleted, deleted_at, deleted_by, archive_id,
                    created_at, updated_at, added_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    phone = VALUES(phone),
                    updated_at = VALUES(updated_at)
            `;

            await query(sql, [
                contactData.id, contactData.company_id, contactData.name, contactData.phone,
                contactData.email, contactData.address, contactData.status, contactData.assigned_to,
                contactData.tags, contactData.notes, contactData.calls_count, contactData.last_call_at,
                contactData.is_deleted, contactData.deleted_at, contactData.deleted_by, contactData.archive_id,
                contactData.created_at, contactData.updated_at, contactData.added_by
            ]);

            stats.contacts.success++;

        } catch (error) {
            stats.contacts.failed++;
            console.error(`    ❌ فشل هجرة جهة اتصال:`, error.message);
        }
    }
}

/**
 * 4. هجرة تسجيلات الشركة
 */
async function migrateCompanyRecordings(companyId) {
    const db = getDb();
    const recordingsSnapshot = await getDocs(collection(db, `companies/${companyId}/recordings`));
    
    if (recordingsSnapshot.empty) return;
    
    console.log(`  🎙️ هجرة ${recordingsSnapshot.size} تسجيل للشركة ${companyId}`);

    for (const docSnap of recordingsSnapshot.docs) {
        try {
            const data = docSnap.data();
            
            const recordingData = {
                sid: data.sid || docSnap.id,
                call_sid: data.callSid || data.CallSid || 'unknown',
                company_id: companyId,
                employee_id: null, // سيتم تحديثه لاحقاً إن أمكن
                url: data.url || data.mp3 || '',
                duration: data.duration || 0,
                duration_text: data.durationText || `${Math.floor((data.duration || 0) / 60)}:${((data.duration || 0) % 60).toString().padStart(2, '0')}`,
                status: data.status || 'completed',
                to_number: data.to || null,
                is_deleted: data.isDeleted || false,
                deleted_at: formatDate(data.deletedAt),
                deleted_by: data.deletedBy || null,
                created_at: formatDate(data.DateCreated || data.createdAt) || new Date(),
                updated_at: formatDate(data.updatedAt) || new Date()
            };

            const sql = `
                INSERT INTO recordings (
                    sid, call_sid, company_id, employee_id, url, duration, duration_text,
                    status, to_number, is_deleted, deleted_at, deleted_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    url = VALUES(url),
                    updated_at = VALUES(updated_at)
            `;

            await query(sql, [
                recordingData.sid, recordingData.call_sid, recordingData.company_id, recordingData.employee_id,
                recordingData.url, recordingData.duration, recordingData.duration_text, recordingData.status,
                recordingData.to_number, recordingData.is_deleted, recordingData.deleted_at, recordingData.deleted_by,
                recordingData.created_at, recordingData.updated_at
            ]);

            stats.recordings.success++;

        } catch (error) {
            stats.recordings.failed++;
            console.error(`    ❌ فشل هجرة تسجيل:`, error.message);
        }
    }
}

/**
 * Main Migration Function
 */
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 بدء عملية الهجرة من Firebase إلى MySQL');
    console.log('═══════════════════════════════════════════════════');

    try {
        // اختبار اتصال MySQL
        const connected = await testConnection();
        if (!connected) {
            throw new Error('فشل الاتصال بقاعدة بيانات MySQL');
        }

        // بدء الهجرة
        const startTime = Date.now();
        
        await migrateCompanies();
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // طباعة النتائج
        console.log('\n═══════════════════════════════════════════════════');
        console.log('📊 نتائج الهجرة:');
        console.log('═══════════════════════════════════════════════════');
        console.log(`الشركات:        ${stats.companies.success}/${stats.companies.total} نجحت`);
        console.log(`الموظفون:       ${stats.employees.success} نجحت`);
        console.log(`جهات الاتصال:   ${stats.contacts.success} نجحت`);
        console.log(`التسجيلات:      ${stats.recordings.success} نجحت`);
        console.log(`\nالوقت المستغرق: ${duration} ثانية`);
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ اكتملت عملية الهجرة بنجاح!');
        
    } catch (error) {
        console.error('\n❌ فشلت عملية الهجرة:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

// تشغيل السكريبت
if (require.main === module) {
    main();
}

module.exports = { main };
