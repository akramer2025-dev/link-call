// API للتعامل مع تسجيل وإدارة الشركات
// يتم استدعاؤه من register-company.html و super-admin.html

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Database file for companies
const companiesFile = path.join(__dirname, '../companies.json');

// Helper functions for data management
function getCompaniesData() {
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

function saveCompaniesData(data) {
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

        const companiesData = getCompaniesData();

        // Check if company already exists
        const existingCompany = companiesData.companies.find(
            c => c.commercialNumber === commercialNumber || c.username === username
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
        saveCompaniesData(companiesData);

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
        const companiesData = getCompaniesData();
        
        // Remove sensitive data
        const companies = companiesData.companies.map(c => ({
            id: c.id,
            companyName: c.companyName,
            commercialNumber: c.commercialNumber,
            adminName: c.adminName,
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
        const companiesData = getCompaniesData();
        
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
        
        const companiesData = getCompaniesData();
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

        saveCompaniesData(companiesData);

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

        const companiesData = getCompaniesData();
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

        saveCompaniesData(companiesData);

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

        const companiesData = getCompaniesData();
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

        saveCompaniesData(companiesData);

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
        
        const companiesData = getCompaniesData();
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

        saveCompaniesData(companiesData);

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

        const companiesData = getCompaniesData();
        const company = companiesData.companies.find(c => c.username === username);

        if (!company || company.password !== hashPassword(password)) {
            return res.status(401).json({
                success: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
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
        saveCompaniesData(companiesData);

        logActivity('company_login', company.id);

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            company: {
                id: company.id,
                companyName: company.companyName,
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
