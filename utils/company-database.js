const fs = require('fs');
const path = require('path');

// المجلد الرئيسي لبيانات الشركات
const COMPANIES_DATA_DIR = path.join(__dirname, '..', 'companies-data');

/**
 * التأكد من وجود مجلد الشركة، وإنشائه إذا لم يكن موجوداً
 */
function ensureCompanyDirectory(companyId) {
    const companyDir = path.join(COMPANIES_DATA_DIR, companyId);
    
    // إنشاء المجلد الرئيسي إذا لم يكن موجوداً
    if (!fs.existsSync(COMPANIES_DATA_DIR)) {
        fs.mkdirSync(COMPANIES_DATA_DIR, { recursive: true });
    }
    
    // إنشاء مجلد الشركة إذا لم يكن موجوداً
    if (!fs.existsSync(companyDir)) {
        fs.mkdirSync(companyDir, { recursive: true });
        console.log(`✅ تم إنشاء مجلد الشركة: ${companyId}`);
        
        // إنشاء الملفات الأساسية
        initializeCompanyDatabase(companyId);
    }
    
    return companyDir;
}

/**
 * تهيئة قاعدة بيانات شركة جديدة
 */
function initializeCompanyDatabase(companyId) {
    const companyDir = path.join(COMPANIES_DATA_DIR, companyId);
    
    // ملف الموظفين
    const employeesFile = path.join(companyDir, 'employees.json');
    if (!fs.existsSync(employeesFile)) {
        fs.writeFileSync(employeesFile, JSON.stringify({ employees: [] }, null, 2));
    }
    
    // ملف جهات الاتصال
    const contactsFile = path.join(companyDir, 'contacts.json');
    if (!fs.existsSync(contactsFile)) {
        fs.writeFileSync(contactsFile, JSON.stringify({ contacts: [] }, null, 2));
    }
    
    // ملف سجل المكالمات
    const callHistoryFile = path.join(companyDir, 'call-history.json');
    if (!fs.existsSync(callHistoryFile)) {
        fs.writeFileSync(callHistoryFile, JSON.stringify({ calls: [] }, null, 2));
    }
    
    // ملف التسجيلات
    const recordingsFile = path.join(companyDir, 'recordings.json');
    if (!fs.existsSync(recordingsFile)) {
        fs.writeFileSync(recordingsFile, JSON.stringify({ recordings: [] }, null, 2));
    }
    
    // ملف استخدام الدقائق
    const minutesUsageFile = path.join(companyDir, 'minutes-usage.json');
    if (!fs.existsSync(minutesUsageFile)) {
        fs.writeFileSync(minutesUsageFile, JSON.stringify({ usage: [] }, null, 2));
    }
    
    // ملف سجل النشاطات
    const activityLogFile = path.join(companyDir, 'activity-log.json');
    if (!fs.existsSync(activityLogFile)) {
        fs.writeFileSync(activityLogFile, JSON.stringify({ activities: [] }, null, 2));
    }
    
    // ملف البيانات الوصفية
    const metadataFile = path.join(companyDir, 'metadata.json');
    if (!fs.existsSync(metadataFile)) {
        fs.writeFileSync(metadataFile, JSON.stringify({
            companyId: companyId,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        }, null, 2));
    }
    
    console.log(`✅ تم تهيئة قاعدة بيانات الشركة: ${companyId}`);
}

/**
 * قراءة ملف JSON من قاعدة بيانات شركة معينة
 */
function readCompanyData(companyId, fileName) {
    try {
        const companyDir = ensureCompanyDirectory(companyId);
        const filePath = path.join(companyDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ الملف غير موجود: ${fileName} للشركة ${companyId}`);
            return null;
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ خطأ في قراءة ${fileName} للشركة ${companyId}:`, error);
        return null;
    }
}

/**
 * كتابة بيانات إلى ملف JSON في قاعدة بيانات شركة معينة
 */
function writeCompanyData(companyId, fileName, data) {
    try {
        const companyDir = ensureCompanyDirectory(companyId);
        const filePath = path.join(companyDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        // تحديث الـ metadata
        updateMetadata(companyId);
        
        return true;
    } catch (error) {
        console.error(`❌ خطأ في كتابة ${fileName} للشركة ${companyId}:`, error);
        return false;
    }
}

/**
 * تحديث metadata للشركة
 */
function updateMetadata(companyId) {
    try {
        const companyDir = path.join(COMPANIES_DATA_DIR, companyId);
        const metadataFile = path.join(companyDir, 'metadata.json');
        
        let metadata = { companyId };
        
        if (fs.existsSync(metadataFile)) {
            metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        } else {
            metadata.createdAt = new Date().toISOString();
        }
        
        metadata.lastUpdated = new Date().toISOString();
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
        console.error(`❌ خطأ في تحديث metadata للشركة ${companyId}:`, error);
    }
}

/**
 * حذف قاعدة بيانات شركة بالكامل
 */
function deleteCompanyDatabase(companyId) {
    try {
        const companyDir = path.join(COMPANIES_DATA_DIR, companyId);
        
        if (fs.existsSync(companyDir)) {
            fs.rmSync(companyDir, { recursive: true, force: true });
            console.log(`✅ تم حذف قاعدة بيانات الشركة: ${companyId}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ خطأ في حذف قاعدة بيانات الشركة ${companyId}:`, error);
        return false;
    }
}

/**
 * الحصول على قائمة جميع الشركات
 */
function getAllCompanies() {
    try {
        if (!fs.existsSync(COMPANIES_DATA_DIR)) {
            return [];
        }
        
        const companies = fs.readdirSync(COMPANIES_DATA_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        return companies;
    } catch (error) {
        console.error('❌ خطأ في الحصول على قائمة الشركات:', error);
        return [];
    }
}

/**
 * نسخ احتياطي لقاعدة بيانات شركة
 */
function backupCompanyDatabase(companyId) {
    try {
        const companyDir = path.join(COMPANIES_DATA_DIR, companyId);
        
        if (!fs.existsSync(companyDir)) {
            console.error(`❌ الشركة ${companyId} غير موجودة`);
            return false;
        }
        
        const backupDir = path.join(COMPANIES_DATA_DIR, 'backups', companyId);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, timestamp);
        
        // إنشاء مجلد النسخ الاحتياطية
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }
        
        // نسخ جميع الملفات
        const files = fs.readdirSync(companyDir);
        files.forEach(file => {
            const srcPath = path.join(companyDir, file);
            const destPath = path.join(backupPath, file);
            fs.copyFileSync(srcPath, destPath);
        });
        
        console.log(`✅ تم إنشاء نسخة احتياطية للشركة ${companyId}: ${timestamp}`);
        return true;
    } catch (error) {
        console.error(`❌ خطأ في إنشاء نسخة احتياطية للشركة ${companyId}:`, error);
        return false;
    }
}

/**
 * إحصائيات قاعدة بيانات الشركة
 */
function getCompanyDatabaseStats(companyId) {
    try {
        const employees = readCompanyData(companyId, 'employees.json');
        const contacts = readCompanyData(companyId, 'contacts.json');
        const callHistory = readCompanyData(companyId, 'call-history.json');
        const recordings = readCompanyData(companyId, 'recordings.json');
        const minutesUsage = readCompanyData(companyId, 'minutes-usage.json');
        const metadata = readCompanyData(companyId, 'metadata.json');
        
        return {
            companyId,
            employees: employees?.employees?.length || 0,
            contacts: contacts?.contacts?.length || 0,
            calls: callHistory?.calls?.length || 0,
            recordings: recordings?.recordings?.length || 0,
            activeEmployees: employees?.employees?.filter(e => e.active).length || 0,
            totalMinutes: minutesUsage?.usage?.reduce((sum, u) => sum + (u.minutesAllocated || 0), 0) || 0,
            usedMinutes: minutesUsage?.usage?.reduce((sum, u) => sum + (u.minutesUsed || 0), 0) || 0,
            createdAt: metadata?.createdAt || null,
            lastUpdated: metadata?.lastUpdated || null
        };
    } catch (error) {
        console.error(`❌ خطأ في الحصول على إحصائيات الشركة ${companyId}:`, error);
        return null;
    }
}

/**
 * تسجيل نشاط في سجل الشركة
 */
function logCompanyActivity(companyId, activity) {
    try {
        const activityLog = readCompanyData(companyId, 'activity-log.json') || { activities: [] };
        
        activityLog.activities.push({
            timestamp: new Date().toISOString(),
            ...activity
        });
        
        // الاحتفاظ بآخر 1000 نشاط فقط
        if (activityLog.activities.length > 1000) {
            activityLog.activities = activityLog.activities.slice(-1000);
        }
        
        writeCompanyData(companyId, 'activity-log.json', activityLog);
        return true;
    } catch (error) {
        console.error(`❌ خطأ في تسجيل النشاط للشركة ${companyId}:`, error);
        return false;
    }
}

module.exports = {
    ensureCompanyDirectory,
    initializeCompanyDatabase,
    readCompanyData,
    writeCompanyData,
    deleteCompanyDatabase,
    getAllCompanies,
    backupCompanyDatabase,
    getCompanyDatabaseStats,
    logCompanyActivity,
    updateMetadata,
    COMPANIES_DATA_DIR
};
