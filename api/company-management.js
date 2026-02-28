const fs = require('fs');
const path = require('path');
const { 
    initializeCompanyDatabase, 
    readCompanyData, 
    writeCompanyData,
    logCompanyActivity 
} = require('../utils/company-database');

/**
 * API إدارة الشركات
 * 
 * - إضافة شركة جديدة مع قاعدة بيانات منفصلة
 * - إنشاء حساب المدير الأول
 * - إدارة معلومات الشركات
 */

// مسار ملف الشركات العام
const COMPANIES_FILE = path.join(process.cwd(), 'companies.json');

// قراءة ملف الشركات
function readCompaniesFile() {
    try {
        if (fs.existsSync(COMPANIES_FILE)) {
            const data = fs.readFileSync(COMPANIES_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { companies: [] };
    } catch (error) {
        console.error('❌ خطأ في قراءة ملف الشركات:', error);
        return { companies: [] };
    }
}

// حفظ ملف الشركات
function writeCompaniesFile(data) {
    try {
        fs.writeFileSync(COMPANIES_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ ملف الشركات:', error);
        return false;
    }
}

// توليد companyId فريد
function generateCompanyId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `com_${timestamp}_${random}`;
}

// إضافة شركة جديدة
async function addCompany(companyData) {
    try {
        const {
            companyName,
            companyPhone,
            companyEmail,
            adminName,
            adminUsername,
            adminPassword,
            subscription = 'basic'
        } = companyData;

        // التحقق من البيانات المطلوبة
        if (!companyName || !adminName || !adminUsername || !adminPassword) {
            throw new Error('يرجى إدخال جميع البيانات المطلوبة');
        }

        // قراءة الشركات الحالية
        const companiesData = readCompaniesFile();

        // التحقق من عدم تكرار اسم الشركة
        const existingCompany = companiesData.companies.find(c => 
            c.companyName.toLowerCase() === companyName.toLowerCase()
        );
        if (existingCompany) {
            throw new Error('اسم الشركة موجود بالفعل');
        }

        // التحقق من عدم تكرار username المدير
        const existingAdmin = companiesData.companies.find(c => 
            c.adminUsername.toLowerCase() === adminUsername.toLowerCase()
        );
        if (existingAdmin) {
            throw new Error('اسم المستخدم للمدير موجود بالفعل');
        }

        // توليد companyId فريد
        const companyId = generateCompanyId();

        // إنشاء قاعدة بيانات الشركة
        console.log(`📁 إنشاء قاعدة بيانات للشركة: ${companyName} (${companyId})`);
        initializeCompanyDatabase(companyId);

        // تحديد حدود الاشتراك
        const subscriptionLimits = {
            basic: { employees: 5, minutes: 500 },
            pro: { employees: 20, minutes: 2000 },
            unlimited: { employees: -1, minutes: -1 }
        };

        const limits = subscriptionLimits[subscription] || subscriptionLimits.basic;

        // إنشاء بيانات الشركة
        const newCompany = {
            id: companyId,
            companyName,
            companyPhone: companyPhone || null,
            companyEmail: companyEmail || null,
            adminUsername,
            adminName,
            subscription,
            subscriptionLimits: limits,
            active: true,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        // إضافة الشركة إلى قائمة الشركات
        companiesData.companies.push(newCompany);
        writeCompaniesFile(companiesData);

        console.log(`✅ تم إضافة الشركة: ${companyName}`);

        // إنشاء حساب المدير في قاعدة بيانات الشركة
        const employeesData = readCompanyData(companyId, 'employees.json');
        
        const adminEmployee = {
            id: `emp_${Date.now()}_admin`,
            companyId,
            name: adminName,
            username: adminUsername,
            password: adminPassword, // في الإنتاج يجب تشفيرها
            email: companyEmail || null,
            phone: companyPhone || null,
            role: 'admin',
            title: 'المدير العام',
            permissions: '*', // جميع الصلاحيات
            minutesAllocated: limits.minutes === -1 ? 999999 : limits.minutes,
            minutesRemaining: limits.minutes === -1 ? 999999 : limits.minutes,
            active: true,
            isAdmin: true,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        employeesData.employees.push(adminEmployee);
        writeCompanyData(companyId, 'employees.json', employeesData);

        console.log(`👤 تم إنشاء حساب المدير: ${adminName} (${adminUsername})`);

        // تسجيل النشاط
        logCompanyActivity(companyId, {
            action: 'company_created',
            companyName,
            adminName,
            subscription,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            message: 'تم إنشاء الشركة بنجاح',
            company: {
                id: companyId,
                companyName,
                adminUsername,
                subscription
            }
        };

    } catch (error) {
        console.error('❌ خطأ في إضافة الشركة:', error);
        throw error;
    }
}

// جلب جميع الشركات
function getAllCompanies() {
    const companiesData = readCompaniesFile();
    return companiesData.companies;
}

// جلب شركة محددة
function getCompany(companyId) {
    const companiesData = readCompaniesFile();
    return companiesData.companies.find(c => c.id === companyId);
}

// تحديث بيانات شركة
function updateCompany(companyId, updates) {
    try {
        const companiesData = readCompaniesFile();
        const companyIndex = companiesData.companies.findIndex(c => c.id === companyId);
        
        if (companyIndex === -1) {
            throw new Error('الشركة غير موجودة');
        }

        // تحديث البيانات
        companiesData.companies[companyIndex] = {
            ...companiesData.companies[companyIndex],
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        writeCompaniesFile(companiesData);

        return {
            success: true,
            message: 'تم تحديث بيانات الشركة',
            company: companiesData.companies[companyIndex]
        };
    } catch (error) {
        console.error('❌ خطأ في تحديث الشركة:', error);
        throw error;
    }
}

// تعطيل/تفعيل شركة
function toggleCompanyStatus(companyId, active) {
    try {
        const companiesData = readCompaniesFile();
        const companyIndex = companiesData.companies.findIndex(c => c.id === companyId);
        
        if (companyIndex === -1) {
            throw new Error('الشركة غير موجودة');
        }

        companiesData.companies[companyIndex].active = active;
        companiesData.companies[companyIndex].lastUpdated = new Date().toISOString();

        writeCompaniesFile(companiesData);

        console.log(`${active ? '✅' : '❌'} تم ${active ? 'تفعيل' : 'تعطيل'} الشركة: ${companiesData.companies[companyIndex].companyName}`);

        return {
            success: true,
            message: `تم ${active ? 'تفعيل' : 'تعطيل'} الشركة`,
            company: companiesData.companies[companyIndex]
        };
    } catch (error) {
        console.error('❌ خطأ في تغيير حالة الشركة:', error);
        throw error;
    }
}

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // التعامل مع OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - جلب جميع الشركات
        if (req.method === 'GET') {
            const { companyId } = req.query;
            
            if (companyId) {
                // جلب شركة محددة
                const company = getCompany(companyId);
                if (!company) {
                    return res.status(404).json({
                        success: false,
                        error: 'الشركة غير موجودة'
                    });
                }
                return res.status(200).json({
                    success: true,
                    company
                });
            } else {
                // جلب جميع الشركات
                const companies = getAllCompanies();
                return res.status(200).json({
                    success: true,
                    companies,
                    count: companies.length
                });
            }
        }

        // POST - إضافة شركة جديدة
        if (req.method === 'POST') {
            const result = await addCompany(req.body);
            return res.status(200).json(result);
        }

        // PUT - تحديث بيانات شركة
        if (req.method === 'PUT') {
            const { companyId, action, ...updates } = req.body;
            
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    error: 'Company ID is required'
                });
            }

            // تعطيل/تفعيل الشركة
            if (action === 'toggle') {
                const result = toggleCompanyStatus(companyId, updates.active);
                return res.status(200).json(result);
            }

            // تحديث عادي
            const result = updateCompany(companyId, updates);
            return res.status(200).json(result);
        }

        // DELETE - حذف شركة (خطر!)
        if (req.method === 'DELETE') {
            return res.status(403).json({
                success: false,
                error: 'لا يمكن حذف الشركات. يمكن تعطيلها فقط.'
            });
        }

        // طريقة غير مدعومة
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });

    } catch (error) {
        console.error('❌ خطأ في company-management API:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// تصدير الوظائف للاستخدام في أماكن أخرى
module.exports.addCompany = addCompany;
module.exports.getAllCompanies = getAllCompanies;
module.exports.getCompany = getCompany;
module.exports.updateCompany = updateCompany;
module.exports.toggleCompanyStatus = toggleCompanyStatus;
