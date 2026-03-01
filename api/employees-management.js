const fs = require('fs');
const path = require('path');

// Database file (local fallback)
const companiesFile = path.join(__dirname, '../companies.json');

// Lazy Redis init - يتم تشغيله عند أول طلب وليس عند تحميل الموديول
let _redis = null;
function getRedis() {
    if (_redis) return _redis;
    try {
        const { Redis } = require('@upstash/redis');
        const redisUrl   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
        if (redisUrl && redisToken && redisUrl.startsWith('http')) {
            _redis = new Redis({ url: redisUrl, token: redisToken });
            console.log('✅ [employees-management] Redis initialized. URL:', redisUrl.substring(0, 30));
        } else {
            console.warn('⚠️ [employees-management] Redis env vars missing. URL:', redisUrl ? redisUrl.substring(0, 20) : 'MISSING');
        }
    } catch (e) {
        console.error('❌ [employees-management] Redis init error:', e.message);
    }
    return _redis;
}


// جلب بيانات الشركات
async function getCompaniesData() {
    const redis = getRedis();
    if (redis) {
        try {
            const data = await redis.get('companies_data');
            if (data) {
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                if (parsed && parsed.companies) {
                    console.log('[employees-management] ✅ جلب بيانات من Redis:', parsed.companies.length, 'شركة');
                    return parsed;
                }
            }
        } catch (e) {
            console.error('[employees-management] ❌ Redis read error:', e.message);
        }
    }
    // Fallback: local file
    try {
        if (fs.existsSync(companiesFile)) {
            return JSON.parse(fs.readFileSync(companiesFile, 'utf8'));
        }
    } catch (error) {
        console.error('[employees-management] ❌ file read error:', error.message);
    }
    return { companies: [] };
}

async function saveCompaniesData(data) {
    const redis = getRedis();
    if (redis) {
        try {
            await redis.set('companies_data', data);
            console.log('[employees-management] ✅ حفظ في Redis بنجاح');
            return true;
        } catch (e) {
            console.error('[employees-management] ❌ Redis write error:', e.message);
        }
    }
    // Fallback: local file
    try {
        fs.writeFileSync(companiesFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('[employees-management] ❌ file write error:', error.message);
        return false;
    }
}

const availablePermissions = [
    { id: 'view_calls', name: 'عرض المكالمات', category: 'calls' },
    { id: 'make_calls', name: 'إجراء المكالمات', category: 'calls' },
    { id: 'listen_recordings', name: 'الاستماع للتسجيلات', category: 'calls' },
    { id: 'download_recordings', name: 'تحميل التسجيلات', category: 'calls' },
    { id: 'delete_recordings', name: 'حذف التسجيلات', category: 'calls' },
    { id: 'view_contacts', name: 'عرض جهات الاتصال', category: 'contacts' },
    { id: 'add_contacts', name: 'إضافة جهات اتصال', category: 'contacts' },
    { id: 'edit_contacts', name: 'تعديل جهات الاتصال', category: 'contacts' },
    { id: 'delete_contacts', name: 'حذف جهات الاتصال', category: 'contacts' },
    { id: 'view_reports', name: 'عرض التقارير', category: 'reports' },
    { id: 'export_reports', name: 'تصدير التقارير', category: 'reports' },
    { id: 'manage_employees', name: 'إدارة الموظفين', category: 'admin' },
    { id: 'view_employees', name: 'عرض الموظفين', category: 'admin' },
    { id: 'view_dashboard', name: 'عرض لوحة التحكم', category: 'general' },
    { id: 'edit_profile', name: 'تعديل الملف الشخصي', category: 'general' }
];

async function getPermissions(req, res) {
    res.json({ success: true, permissions: availablePermissions });
}

async function getEmployees(req, res) {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ success: false, message: 'companyId مطلوب' });
        const data = await getCompaniesData();
        const company = data.companies.find(c => c.id === companyId);
        if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
        res.json({ success: true, employees: company.employees || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function addEmployee(req, res) {
    try {
        const { companyId, name, username, email, phone, title, role, permissions, minutesAllocated, password, active } = req.body;
        if (!companyId || !name || !username) {
            return res.status(400).json({ success: false, message: 'companyId و name و username مطلوبة' });
        }
        const data = await getCompaniesData();
        const company = data.companies.find(c => c.id === companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: 'الشركة غير موجودة: ' + companyId });
        }
        if (!company.employees) company.employees = [];
        if (company.employees.find(e => e.username === username)) {
            return res.status(400).json({ success: false, message: 'اسم المستخدم موجود بالفعل' });
        }
        const maxId = company.employees.reduce((max, e) => Math.max(max, e.id || 0), 0);
        const newEmployee = {
            id: maxId + 1, companyId, name, username,
            password: password || 'Aa123456',
            email: email || '', phone: phone || '', title: title || '',
            role: role || 'agent', permissions: permissions || [],
            minutesAllocated: minutesAllocated || 0, minutesUsed: 0,
            active: active !== false, createdAt: new Date().toISOString()
        };
        company.employees.push(newEmployee);
        company.employeesCount = company.employees.length;
        const saved = await saveCompaniesData(data);
        if (!saved) {
            console.error('❌ فشل الحفظ - Redis:', redisAvailable, 'VERCEL:', !!process.env.VERCEL);
            return res.status(500).json({ success: false, message: 'فشل في حفظ البيانات في قاعدة البيانات. Redis متاح: ' + redisAvailable });
        }
        res.json({ success: true, employee: newEmployee });
    } catch (error) {
        console.error('addEmployee error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

async function updateEmployee(req, res) {
    try {
        const { id } = req.params;
        const { name, email, phone, title, role, permissions, minutesAllocated, password, active } = req.body;
        const data = await getCompaniesData();
        let found = null;
        for (const company of data.companies) {
            const emp = (company.employees || []).find(e => e.id === parseInt(id));
            if (emp) { found = emp; break; }
        }
        if (!found) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
        if (name) found.name = name;
        if (email !== undefined) found.email = email;
        if (phone !== undefined) found.phone = phone;
        if (title !== undefined) found.title = title;
        if (role) found.role = role;
        if (permissions !== undefined) found.permissions = permissions;
        if (minutesAllocated !== undefined) found.minutesAllocated = minutesAllocated;
        if (password) found.password = password;
        if (active !== undefined) found.active = active;
        found.updatedAt = new Date().toISOString();
        const saved = await saveCompaniesData(data);
        if (!saved) return res.status(500).json({ success: false, message: 'فشل في حفظ البيانات' });
        res.json({ success: true, employee: found });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function deleteEmployee(req, res) {
    try {
        const { id } = req.params;
        const data = await getCompaniesData();
        let deleted = null;
        for (const company of data.companies) {
            const idx = (company.employees || []).findIndex(e => e.id === parseInt(id));
            if (idx !== -1) {
                deleted = company.employees.splice(idx, 1)[0];
                company.employeesCount = company.employees.length;
                break;
            }
        }
        if (!deleted) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
        const saved = await saveCompaniesData(data);
        if (!saved) return res.status(500).json({ success: false, message: 'فشل في حفظ البيانات' });
        res.json({ success: true, message: 'تم حذف الموظف بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    const method = req.method;
    const url = req.url || '';
    try {
        if (method === 'GET' && url.includes('/permissions')) return await getPermissions(req, res);
        if (method === 'GET') return await getEmployees(req, res);
        if (method === 'POST') return await addEmployee(req, res);
        if (method === 'PUT') {
            const match = url.match(/\/(\d+)(?:\?|$)/);
            req.params = { id: match ? match[1] : '0' };
            return await updateEmployee(req, res);
        }
        if (method === 'DELETE') {
            const match = url.match(/\/(\d+)(?:\?|$)/);
            req.params = { id: match ? match[1] : '0' };
            return await deleteEmployee(req, res);
        }
        res.status(404).json({ success: false, message: 'Endpoint not found' });
    } catch (error) {
        console.error('Fatal employees API error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};