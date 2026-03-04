// API للتعامل مع تسجيل وإدارة الشركات
// يتم استدعاؤه من register-company.html و super-admin.html

const crypto = require('crypto');

// Firestore helpers
async function getCompaniesData() {
    try {
        const { getDb } = require('../utils/firebase');
        const { collection, getDocs } = require('firebase/firestore');
        const db = getDb();
        const snapshot = await getDocs(collection(db, 'companies'));
        const companies = [];
        snapshot.forEach(docSnap => companies.push(docSnap.data()));
        console.log('✅ [companies] Firestore:', companies.length, 'شركة');
        return { companies };
    } catch (error) {
        console.error('❌ Firestore getCompaniesData error:', error.message);
        return { companies: [] };
    }
}

async function saveCompaniesData(data) {
    try {
        const { getDb } = require('../utils/firebase');
        const { doc, setDoc } = require('firebase/firestore');
        const db = getDb();
        for (const company of data.companies) {
            await setDoc(doc(db, 'companies', company.id), company);
        }
        console.log('✅ [companies] Firestore حفظ:', data.companies.length, 'شركة');
        return true;
    } catch (error) {
        console.error('❌ Firestore saveCompaniesData error:', error.message);
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
        
        // Remove sensitive data (password, verificationToken) but keep Twilio + plan info
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
            lastLoginAt: c.lastLoginAt,
            // Twilio info needed for admin dashboard
            twilioPhone: c.twilioPhone || null,
            twilioEnvPrefix: c.twilioEnvPrefix || null,
            twilioCredentials: c.twilioCredentials
                ? { accountSid: c.twilioCredentials.accountSid, phoneNumber: c.twilioCredentials.phoneNumber, twimlAppSid: c.twilioCredentials.twimlAppSid, updatedAt: c.twilioCredentials.updatedAt }
                : null,
            balance: typeof c.balance === 'number' ? c.balance : 121.0
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
        // req.params.id لا يعمل في Vercel serverless - نستخرجه من URL
        const urlParts = (req.url || '').split('/').filter(Boolean);
        const id = req.params?.id || urlParts[urlParts.length - 1];

        if (!id || id === 'companies') {
            return res.status(400).json({ success: false, error: 'company id مطلوب في الـ URL' });
        }

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

// DELETE /api/companies/:id - Soft delete company (يُحفظ في deleted_archive)
module.exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBy = req.body?.deletedBy || req.query?.deletedBy || 'super-admin';

        const companiesData = await getCompaniesData();
        const companyIndex = companiesData.companies.findIndex(c => c.id === id);

        if (companyIndex === -1) {
            return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });
        }

        const company = companiesData.companies[companyIndex];

        // حفظ نسخة كاملة في deleted_archive
        try {
            const { getDb } = require('../utils/firebase');
            const { doc, setDoc } = require('firebase/firestore');
            const db = getDb();
            await setDoc(doc(db, 'deleted_archive', `company_${id}_${Date.now()}`), {
                originalCollection: 'companies',
                originalDocId: id,
                data: company,
                deletedBy,
                deletedAt: new Date().toISOString()
            });
        } catch (archiveErr) {
            console.error('⚠️ Archive error:', archiveErr.message);
        }

        // Soft delete — لا تُمسح الشركة، فقط تُعلَّم
        companiesData.companies[companyIndex].status = 'suspended';
        companiesData.companies[companyIndex].isActive = false;
        companiesData.companies[companyIndex]._deleted = true;
        companiesData.companies[companyIndex]._deletedAt = new Date().toISOString();
        companiesData.companies[companyIndex]._deletedBy = deletedBy;

        await saveCompaniesData(companiesData);
        logActivity('company_deleted', id, { deletedBy });

        res.json({ success: true, message: 'تم حذف الشركة (محفوظة في الأرشيف)' });

    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ أثناء الحذف' });
    }
};

// POST /api/companies/login - Company OR Employee login
module.exports.login = async (req, res) => {
    try {
        // Parse body manually as fallback (Vercel sometimes needs this)
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch(e) { body = {}; }
        }
        if (!body || typeof body !== 'object') body = {};
        const { username, password } = body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'الرجاء إدخال اسم المستخدم وكلمة المرور'
            });
        }

        const usernameTrimmed = username.trim().toLowerCase();
        const companiesData = await getCompaniesData();

        // ─── 1. هل هو مدير شركة؟ ───
        const company = companiesData.companies.find(
            c => (c.username || '').toLowerCase() === usernameTrimmed
        );

        if (company) {
            if (company.password !== hashPassword(password.trim())) {
                return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
            }
            if (company.status !== 'active') {
                return res.status(403).json({ success: false, error: 'حسابك غير نشط. الرجاء التواصل مع الدعم الفني' });
            }
            logActivity('company_login', company.id);
            return res.json({
                success: true,
                isEmployee: false,
                company: {
                    id: company.id,
                    companyName: company.companyName,
                    adminName: company.adminName,
                    username: company.username,
                    plan: company.plan,
                    limits: company.limits
                }
            });
        }

        // ─── 2. هل هو موظف في إحدى الشركات؟ ───
        let foundEmployee = null;
        let foundCompany  = null;

        // normalize: استبدل المسافات بـ underscore للمقارنة
        const usernameNorm = usernameTrimmed.replace(/\s+/g, '_');

        for (const c of companiesData.companies) {
            const emp = (c.employees || []).find(e => {
                if (e._deleted || e.active === false) return false;
                const stored = (e.username || '').toLowerCase();
                const storedNorm = stored.replace(/\s+/g, '_');
                // مطابقة مرنة: بالمسافة أو بـ underscore
                return stored === usernameTrimmed
                    || stored === usernameNorm
                    || storedNorm === usernameTrimmed
                    || storedNorm === usernameNorm;
            });
            if (emp) { foundEmployee = emp; foundCompany = c; break; }
        }

        if (!foundEmployee) {
            return res.status(401).json({
                success: false,
                error: 'اسم المستخدم غير موجود. يرجى التواصل مع مدير الشركة'
            });
        }

        // مقارنة كلمة المرور (نص عادي للموظفين)
        const rawPass = password.trim();
        const empPass = foundEmployee.password || '';
        const passOk  = empPass === rawPass || empPass === hashPassword(rawPass);
        if (!passOk) {
            return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
        }

        logActivity('employee_login', foundCompany.id, { employeeId: foundEmployee.id });

        return res.json({
            success: true,
            isEmployee: true,
            company: {
                id: foundCompany.id,
                companyName: foundCompany.companyName,
                adminName: foundCompany.adminName
            },
            employee: {
                id: foundEmployee.id,
                name: foundEmployee.name,
                username: foundEmployee.username,
                role: foundEmployee.role || 'agent',
                title: foundEmployee.title || '',
                permissions: foundEmployee.permissions || [],
                minutesAllocated: foundEmployee.minutesAllocated || 0,
                minutesUsed: foundEmployee.minutesUsed || 0,
                companyId: foundCompany.id
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'خطأ: ' + error.message });
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

// GET /api/companies/init - Show Firestore status
module.exports.initFromFile = async (req, res) => {
    try {
        const companiesData = await getCompaniesData();
        res.json({
            success: true,
            message: `Firestore يعمل - ${companiesData.companies.length} شركة مسجلة`,
            database: 'Firestore - akramplatform-2c6be',
            companies: companiesData.companies.map(c => ({
                id: c.id,
                companyName: c.companyName,
                username: c.username,
                plan: c.plan
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ══════════════════════════════════════════════
// BALANCE SYSTEM - نظام الرصيد
// ══════════════════════════════════════════════
const COST_PER_MINUTE = 0.014; // دولار لكل دقيقة
const DEFAULT_BALANCE  = 121.0; // الرصيد الافتراضي

// GET /api/companies/balance?companyId=XXX
module.exports.getBalance = async (req, res) => {
    try {
        const companyId = req.query.companyId;
        if (!companyId) return res.status(400).json({ success: false, error: 'companyId مطلوب' });

        const { getDb } = require('../utils/firebase');
        const { doc, getDoc, updateDoc } = require('firebase/firestore');
        const db = getDb();
        const snap = await getDoc(doc(db, 'companies', companyId));
        if (!snap.exists()) return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });

        const company = snap.data();
        // إذا لم يوجد رصيد بعد، ابدأ بـ 121 دولار
        if (company.balance === undefined) {
            await updateDoc(doc(db, 'companies', companyId), { balance: DEFAULT_BALANCE, costPerMinute: COST_PER_MINUTE, totalMinutesUsed: 0, totalCostDeducted: 0 });
            company.balance = DEFAULT_BALANCE;
            company.totalMinutesUsed = 0;
            company.totalCostDeducted = 0;
        }
        return res.json({
            success: true,
            balance: Number((company.balance || 0).toFixed(4)),
            costPerMinute: company.costPerMinute || COST_PER_MINUTE,
            totalMinutesUsed: company.totalMinutesUsed || 0,
            totalCostDeducted: Number((company.totalCostDeducted || 0).toFixed(4)),
            companyName: company.companyName || '',
            adminName: company.adminName || ''
        });
    } catch (error) {
        console.error('getBalance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /api/companies/deduct-balance  { companyId, durationSeconds }
module.exports.deductBalance = async (req, res) => {
    try {
        const { companyId, durationSeconds } = req.body;
        if (!companyId || !durationSeconds) return res.status(400).json({ success: false, error: 'companyId و durationSeconds مطلوبان' });

        const { getDb } = require('../utils/firebase');
        const { doc, getDoc, updateDoc } = require('firebase/firestore');
        const db = getDb();
        const snap = await getDoc(doc(db, 'companies', companyId));
        if (!snap.exists()) return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });

        const company = snap.data();
        const minutes = durationSeconds / 60;
        const costPerMin = company.costPerMinute || COST_PER_MINUTE;
        const cost = minutes * costPerMin;
        const currentBalance = company.balance !== undefined ? company.balance : DEFAULT_BALANCE;
        const newBalance = Math.max(0, currentBalance - cost);

        await updateDoc(doc(db, 'companies', companyId), {
            balance: Number(newBalance.toFixed(4)),
            totalMinutesUsed: (company.totalMinutesUsed || 0) + minutes,
            totalCostDeducted: Number(((company.totalCostDeducted || 0) + cost).toFixed(4))
        });

        console.log(`💳 خصم ${cost.toFixed(4)}$ (${minutes.toFixed(2)} دقيقة) من ${companyId} - الرصيد: ${newBalance.toFixed(4)}$`);
        return res.json({ success: true, deducted: Number(cost.toFixed(4)), newBalance: Number(newBalance.toFixed(4)), minutes: Number(minutes.toFixed(2)) });
    } catch (error) {
        console.error('deductBalance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /api/companies/set-balance  { companyId, balance, adminKey }
module.exports.setBalance = async (req, res) => {
    try {
        const { companyId, balance, adminKey } = req.body;
        if (adminKey !== (process.env.ADMIN_SECRET || 'LINKCALL_ADMIN_2024')) {
            return res.status(403).json({ success: false, error: 'غير مصرح' });
        }
        if (!companyId || balance === undefined) return res.status(400).json({ success: false, error: 'companyId و balance مطلوبان' });

        const { getDb } = require('../utils/firebase');
        const { doc, updateDoc } = require('firebase/firestore');
        const db = getDb();
        await updateDoc(doc(db, 'companies', companyId), { balance: Number(Number(balance).toFixed(4)) });
        return res.json({ success: true, balance: Number(Number(balance).toFixed(4)) });
    } catch (error) {
        console.error('setBalance error:', error);
        res.status(500).json({ success: false, error: error.message });
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
const _getBalance = module.exports.getBalance;
const _deductBalance = module.exports.deductBalance;
const _setBalance = module.exports.setBalance;

// Main handler for Vercel serverless - Router للطلبات
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Ensure req.body is parsed (fallback for Vercel edge cases)
    if (req.method !== 'GET' && typeof req.body === 'string') {
        try { req.body = JSON.parse(req.body); } catch(e) { req.body = {}; }
    }
    if (req.method !== 'GET' && (!req.body || typeof req.body !== 'object')) {
        req.body = {};
    }

    try {
        const url = req.url || '';
        const method = req.method;

        // Route the request based on URL and method
        if (url.includes('/balance') && method === 'GET') {
            return _getBalance(req, res);
        } else if (url.includes('/deduct-balance') && method === 'POST') {
            return _deductBalance(req, res);
        } else if (url.includes('/set-balance') && method === 'POST') {
            return _setBalance(req, res);
        } else if (url.includes('/init') && method === 'GET') {
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
module.exports.getBalance = _getBalance;
module.exports.deductBalance = _deductBalance;
module.exports.setBalance = _setBalance;
