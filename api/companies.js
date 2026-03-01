// API للتعامل مع تسجيل وإدارة الشركات
// يتم استدعاؤه من register-company.html و super-admin.html

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Upstash Redis للتخزين السحابي
let redis;
try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
        url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} catch (e) {
    console.log('⚠️ Redis غير متاح في companies.js');
}

// Database file for companies (local fallback)
const companiesFile = path.join(__dirname, '../companies.json');

// Helper functions for data management
async function getCompaniesData() {
    // Try Redis first (Vercel production)
    if (redis && process.env.VERCEL) {
        try {
            const data = await redis.get('companies_data');
            if (data && data.companies) {
                return data;
            }
        } catch (e) {
            console.error('Redis read error in companies:', e);
        }
    }
    // Fallback: local file
    try {
        if (fs.existsSync(companiesFile)) {
            const data = fs.readFileSync(companiesFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading companies file:', error);
    }
    return { companies: [] };
}

async function saveCompaniesData(data) {
    // Save to Redis in production
    if (redis && process.env.VERCEL) {
        try {
            await redis.set('companies_data', data);
            return true;
        } catch (e) {
            console.error('Redis write error in companies:', e);
            return false;
        }
    }
    // Save to file locally
    try {
        fs.writeFileSync(companiesFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving companies file:', error);
        return false;
    }
}

// Generate unique company ID
function generateCompanyId() {
    return 'COMP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Hash password
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/companies/register - Register new company
module.exports.register = async (req, res) => {
    try {
        const {
            // Company Info
            companyName,
            commercialNumber,
            businessType,
            country,
            city,
            address,
            companyPhone,
            companyEmail,
            // Admin Info
            adminName,
            adminTitle,
            adminPhone,
            adminEmail,
            username,
            password,
            // Plan
            selectedPlan
        } = req.body;

        // Validation
        if (!companyName || !commercialNumber || !adminName || !username || !password) {
            return res.status(400).json({
                success: false,
                error: 'الرجاء إدخال جميع الحقول المطلوبة'
            });
        }

        const companiesData = await getCompaniesData();

        // Check if company already exists
        const usernameLower = (username || '').trim().toLowerCase();
        const existingCompany = companiesData.companies.find(
            c => c.commercialNumber === commercialNumber || (c.username || '').toLowerCase() === usernameLower
        );

        if (existingCompany) {
            return res.status(400).json({
                success: false,
                error: 'الشركة أو اسم المستخدم مسجل مسبقاً'
            });
        }

        // Create new company
        const newCompany = {
            id: generateCompanyId(),
            // Company Info
            companyName,
            commercialNumber,
            businessType,
            country,
            city,
            address,
            companyPhone,
            companyEmail,
            // Admin Info
            adminName,
            adminTitle,
            adminPhone,
            adminEmail,
            username,
            password: hashPassword(password),
            // Plan
            plan: selectedPlan || 'free',
            // Status
            status: 'active', // active, pending, suspended
            isActive: true,
            // Counters
            employeesCount: 0,
            callsCount: 0,
            totalMinutes: 0,
            // Limits based on plan
            limits: getPlanLimits(selectedPlan || 'free'),
            // Metadata
            createdAt: new Date().toISOString(),
            lastLoginAt: null,
            verificationToken: crypto.randomBytes(32).toString('hex'),
            isVerified: false
        };

        // Save to database
        companiesData.companies.push(newCompany);
        await saveCompaniesData(companiesData);

        // Log activity
        logActivity('company_registered', newCompany.id, {
            companyName: newCompany.companyName,
            plan: newCompany.plan
        });

        res.json({
            success: true,
            message: 'تم تسجيل الشركة بنجاح',
            company: {
                id: newCompany.id,
                companyName: newCompany.companyName,
                username: newCompany.username,
                plan: newCompany.plan
            }
        });

    } catch (error) {
        console.error('Company registration error:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء التسجيل'
        });
    }
};

// GET /api/companies - Get all companies (Super Admin only)
module.exports.getAllCompanies = async (req, res) => {
    try {
        const companiesData = await getCompaniesData();
        
        // Remove sensitive data
        const companies = companiesData.companies.map(c => ({
            id: c.id,
            companyName: c.companyName,
            commercialNumber: c.commercialNumber,
            adminName: c.adminName,
            username: c.username,
            companyEmail: c.companyEmail,
            companyPhone: c.companyPhone,
            plan: c.plan,
            status: c.status,
            employeesCount: c.employeesCount,
            callsCount: c.callsCount,
            createdAt: c.createdAt,
            lastLoginAt: c.lastLoginAt
        }));

        res.json({
            success: true,
            companies,
            total: companies.length,
            stats: {
                total: companies.length,
                active: companies.filter(c => c.status === 'active').length,
                pending: companies.filter(c => c.status === 'pending').length,
                suspended: companies.filter(c => c.status === 'suspended').length
            }
        });

    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء جلب البيانات'
        });
    }
};

// GET /api/companies/:id - Get company details
module.exports.getCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const companiesData = await getCompaniesData();
        
        const company = companiesData.companies.find(c => c.id === id);

        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'الشركة غير موجودة'
            });
        }

        // Remove password
        const { password, verificationToken, ...companyData } = company;

        res.json({
            success: true,
            company: companyData
        });

    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء جلب البيانات'
        });
    }
};

// PUT /api/companies/:id - Update company
module.exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const companiesData = await getCompaniesData();
        const companyIndex = companiesData.companies.findIndex(c => c.id === id);

        if (companyIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'الشركة غير موجودة'
            });
        }

        // Update company
        companiesData.companies[companyIndex] = {
            ...companiesData.companies[companyIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await saveCompaniesData(companiesData);

        logActivity('company_updated', id, updates);

        res.json({
            success: true,
            message: 'تم تحديث بيانات الشركة',
            company: companiesData.companies[companyIndex]
        });

    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء التحديث'
        });
    }
};

// PUT /api/companies/:id/status - Change company status
module.exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // active, pending, suspended
        
        if (!['active', 'pending', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'حالة غير صالحة'
            });
        }

        const companiesData = await getCompaniesData();
        const companyIndex = companiesData.companies.findIndex(c => c.id === id);

        if (companyIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'الشركة غير موجودة'
            });
        }

        companiesData.companies[companyIndex].status = status;
        companiesData.companies[companyIndex].isActive = status === 'active';
        companiesData.companies[companyIndex].statusChangedAt = new Date().toISOString();

        await saveCompaniesData(companiesData);

        logActivity('company_status_changed', id, { status });

        res.json({
            success: true,
            message: 'تم تحديث حالة الشركة',
            status
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء التحديث'
        });
    }
};

// PUT /api/companies/:id/plan - Change company plan
module.exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { plan } = req.body; // free, pro, enterprise
        
        if (!['free', 'pro', 'enterprise'].includes(plan)) {
            return res.status(400).json({
                success: false,
                error: 'خطة غير صالحة'
            });
        }

        const companiesData = await getCompaniesData();
        const companyIndex = companiesData.companies.findIndex(c => c.id === id);

        if (companyIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'الشركة غير موجودة'
            });
        }

        companiesData.companies[companyIndex].plan = plan;
        companiesData.companies[companyIndex].limits = getPlanLimits(plan);
        companiesData.companies[companyIndex].planChangedAt = new Date().toISOString();

        await saveCompaniesData(companiesData);

        logActivity('company_plan_changed', id, { plan });

        res.json({
            success: true,
            message: 'تم تحديث خطة الشركة',
            plan,
            limits: getPlanLimits(plan)
        });

    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء التحديث'
        });
    }
};

// DELETE /api/companies/:id - Delete company (soft delete)
module.exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        const companiesData = await getCompaniesData();
        const companyIndex = companiesData.companies.findIndex(c => c.id === id);

        if (companyIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'الشركة غير موجودة'
            });
        }

        // Soft delete
        companiesData.companies[companyIndex].status = 'suspended';
        companiesData.companies[companyIndex].isActive = false;
        companiesData.companies[companyIndex].deletedAt = new Date().toISOString();

        await saveCompaniesData(companiesData);

        logActivity('company_deleted', id);

        res.json({
            success: true,
            message: 'تم حذف الشركة'
        });

    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء الحذف'
        });
    }
};

// POST /api/companies/login - Company login
module.exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'الرجاء إدخال اسم المستخدم وكلمة المرور'
            });
        }

        const usernameTrimmed = username.trim().toLowerCase();
        const companiesData = await getCompaniesData();
        const company = companiesData.companies.find(
            c => (c.username || '').toLowerCase() === usernameTrimmed
        );

        if (!company) {
            return res.status(401).json({
                success: false,
                error: 'هذا المستخدم غير مسجل. يرجى إنشاء حساب أولاً عبر صفحة التسجيل'
            });
        }

        if (company.password !== hashPassword(password.trim())) {
            return res.status(401).json({
                success: false,
                error: 'كلمة المرور غير صحيحة'
            });
        }

        if (company.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'حسابك غير نشط. الرجاء التواصل مع الدعم الفني'
            });
        }

        // Update last login
        const companyIndex = companiesData.companies.findIndex(c => c.id === company.id);
        companiesData.companies[companyIndex].lastLoginAt = new Date().toISOString();
        await saveCompaniesData(companiesData);

        logActivity('company_login', company.id);

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            company: {
                id: company.id,
                companyName: company.companyName,
                adminName: company.adminName,
                username: company.username,
                plan: company.plan,
                limits: company.limits
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء تسجيل الدخول'
        });
    }
};

// Helper function to get plan limits
function getPlanLimits(plan) {
    const limits = {
        free: {
            employees: 5,
            monthlyMinutes: 500,
            recordings: true,
            reports: 'basic',
            api: false,
            support: 'standard'
        },
        pro: {
            employees: 20,
            monthlyMinutes: 2000,
            recordings: true,
            reports: 'advanced',
            api: true,
            support: 'priority'
        },
        enterprise: {
            employees: -1, // unlimited
            monthlyMinutes: -1, // unlimited
            recordings: true,
            reports: 'advanced',
            api: true,
            support: 'dedicated',
            customization: true
        }
    };

    return limits[plan] || limits.free;
}

// Helper function to log activities
function logActivity(type, companyId, details = {}) {
    // In Vercel, skip file-based logging (filesystem is read-only)
    if (process.env.VERCEL) return;
    try {
        const logFile = path.join(__dirname, '../activity-log.json');
        let logs = [];

        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }

        logs.push({
            type,
            companyId,
            details,
            timestamp: new Date().toISOString()
        });

        // Keep only last 1000 entries
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }

        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// GET /api/companies/init - Initialize Redis from companies.json
module.exports.initFromFile = async (req, res) => {
    try {
        if (!redis) {
            return res.json({
                success: false,
                message: 'Redis غير متاح (تشغيل محلي)'
            });
        }

        // قراءة من companies.json
        if (!fs.existsSync(companiesFile)) {
            return res.status(404).json({
                success: false,
                message: 'ملف companies.json غير موجود'
            });
        }

        const fileData = JSON.parse(fs.readFileSync(companiesFile, 'utf8'));
        
        if (!fileData.companies || fileData.companies.length === 0) {
            return res.json({
                success: false,
                message: 'ملف companies.json فارغ'
            });
        }

        // حفظ في Redis
        await redis.set('companies_data', fileData);

        console.log('✅ تم تهيئة Redis من companies.json -', fileData.companies.length, 'شركة');

        res.json({
            success: true,
            message: `تم تحميل ${fileData.companies.length} شركة إلى Redis بنجاح`,
            companies: fileData.companies.map(c => ({
                id: c.id,
                companyName: c.companyName,
                username: c.username,
                plan: c.selectedPlan
            }))
        });
    } catch (error) {
        console.error('خطأ في تهيئة Redis:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Save handlers before module.exports is overwritten
const _register = module.exports.register;
const _getAllCompanies = module.exports.getAllCompanies;
const _getCompany = module.exports.getCompany;
const _updateCompany = module.exports.updateCompany;
const _updateStatus = module.exports.updateStatus;
const _updatePlan = module.exports.updatePlan;
const _deleteCompany = module.exports.deleteCompany;
const _login = module.exports.login;
const _initFromFile = module.exports.initFromFile;

// Main handler for Vercel serverless - Router للطلبات
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const url = req.url || '';
        const method = req.method;

        // Route the request based on URL and method
        if (url.includes('/init') && method === 'GET') {
            return _initFromFile(req, res);
        } else if (url.includes('/register') && method === 'POST') {
            return _register(req, res);
        } else if (url.includes('/login') && method === 'POST') {
            return _login(req, res);
        } else if (method === 'GET' && url.match(/\/\d+$/)) {
            return _getCompany(req, res);
        } else if (method === 'GET') {
            return _getAllCompanies(req, res);
        } else if (method === 'PUT' && url.includes('/status')) {
            return _updateStatus(req, res);
        } else if (method === 'PUT' && url.includes('/plan')) {
            return _updatePlan(req, res);
        } else if (method === 'PUT') {
            return _updateCompany(req, res);
        } else if (method === 'DELETE') {
            return _deleteCompany(req, res);
        } else {
            res.status(404).json({ error: 'Route not found' });
        }
    } catch (error) {
        console.error('Companies API error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Re-attach named handlers after module.exports was reassigned
module.exports.register = _register;
module.exports.getAllCompanies = _getAllCompanies;
module.exports.getCompany = _getCompany;
module.exports.updateCompany = _updateCompany;
module.exports.updateStatus = _updateStatus;
module.exports.updatePlan = _updatePlan;
module.exports.deleteCompany = _deleteCompany;
module.exports.login = _login;
module.exports.initFromFile = _initFromFile;
