const fs = require('fs');
const path = require('path');

// استخدام نفس Redis setup الموجود في companies.js
let redis;
let redisAvailable = false;
try {
    const { Redis } = require('@upstash/redis');
    const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken && redisUrl.startsWith('http')) {
        redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });
        redisAvailable = true;
        console.log('✅ Employees API: Redis initialized');
    } else {
        console.log('⚠️ Employees API: Redis not available, using local file storage');
    }
} catch (error) {
    console.log('⚠️ Employees API: Redis initialization failed:', error.message);
}

// Database files
const companiesFile = path.join(__dirname, '../companies.json');
const employeesFile = path.join(__dirname, '../employees.json');

// قائمة الصلاحيات المتاحة
const availablePermissions = [
    // صلاحيات المكالمات
    { id: 'view_calls', name: 'عرض المكالمات', category: 'calls' },
    { id: 'make_calls', name: 'إجراء المكالمات', category: 'calls' },
    { id: 'listen_recordings', name: 'الاستماع للتسجيلات', category: 'calls' },
    { id: 'download_recordings', name: 'تحميل التسجيلات', category: 'calls' },
    { id: 'delete_recordings', name: 'حذف التسجيلات', category: 'calls' },
    
    // صلاحيات جهات الاتصال
    { id: 'view_contacts', name: 'عرض جهات الاتصال', category: 'contacts' },
    { id: 'add_contacts', name: 'إضافة جهات اتصال', category: 'contacts' },
    { id: 'edit_contacts', name: 'تعديل جهات الاتصال', category: 'contacts' },
    { id: 'delete_contacts', name: 'حذف جهات الاتصال', category: 'contacts' },
    
    // صلاحيات الرسائل
    { id: 'view_messages', name: 'عرض الرسائل', category: 'messages' },
    { id: 'send_messages', name: 'إرسال الرسائل', category: 'messages' },
    { id: 'delete_messages', name: 'حذف الرسائل', category: 'messages' },
    
    // صلاحيات التقارير
    { id: 'view_reports', name: 'عرض التقارير', category: 'reports' },
    { id: 'export_reports', name: 'تصدير التقارير', category: 'reports' },
    { id: 'view_analytics', name: 'عرض التحليلات', category: 'reports' },
    
    // صلاحيات الإدارة
    { id: 'manage_employees', name: 'إدارة الموظفين', category: 'admin' },
    { id: 'view_employees', name: 'عرض الموظفين', category: 'admin' },
    { id: 'edit_permissions', name: 'تعديل الصلاحيات', category: 'admin' },
    { id: 'view_settings', name: 'عرض الإعدادات', category: 'admin' },
    
    // صلاحيات عامة
    { id: 'view_dashboard', name: 'عرض لوحة التحكم', category: 'general' },
    { id: 'edit_profile', name: 'تعديل الملف الشخصي', category: 'general' },
    { id: 'view_work_schedule', name: 'عرض جدول العمل', category: 'general' }
];

// دوال مساعدة للتعامل مع Data Storage - نفس الطريقة في companies.js
async function getEmployeesData() {
    // Try Redis first (Vercel production)
    if (redisAvailable && redis && process.env.VERCEL) {
        try {
            const data = await redis.get('employees_data');
            if (data && data.employees) {
                console.log(`✅ Read ${data.employees.length} employees from Redis`);
                return data;
            } else {
                // Redis is empty - initialize from file on first access
                console.log('⚠️ Redis empty, initializing from file...');
                if (fs.existsSync(employeesFile)) {
                    const raw = fs.readFileSync(employeesFile, 'utf8');
                    const fileData = JSON.parse(raw);
                    await redis.set('employees_data', fileData);
                    console.log(`✅ Initialized Redis with ${fileData.employees.length} employees`);
                    return fileData;
                }
            }
        } catch (e) {
            console.error('❌ Redis read error in employees:', e);
        }
    }
    
    // Fallback: local file
    try {
        if (fs.existsSync(employeesFile)) {
            const raw = fs.readFileSync(employeesFile, 'utf8');
            const data = JSON.parse(raw);
            console.log(`✅ Read ${data.employees.length} employees from file`);
            return data;
        }
    } catch (error) {
        console.error('❌ Error reading employees file:', error);
    }
    
    return { employees: [], departments: {} };
}

async function saveEmployeesData(data) {
    // Save to Redis in production
    if (redisAvailable && redis && process.env.VERCEL) {
        try {
            await redis.set('employees_data', data);
            console.log('✅ Saved employees to Redis');
            return true;
        } catch (e) {
            console.error('❌ Redis write error in employees:', e);
            return false;
        }
    }
    
    // Save to file locally
    try {
        fs.writeFileSync(employeesFile, JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ Saved employees to file');
        return true;
    } catch (error) {
        console.error('❌ Error saving employees file:', error);
        return false;
    }
}

// الحصول على قائمة الصلاحيات
async function getPermissions(req, res) {
    res.json({
        success: true,
        permissions: availablePermissions
    });
}

// الحصول على موظفي شركة معينة
async function getEmployees(req, res) {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'companyId مطلوب'
            });
        }
        
        const data = await getEmployeesData();
        
        // فلترة الموظفين حسب companyId
        const employees = data.employees.filter(e => e.companyId === companyId);
        
        res.json({
            success: true,
            employees: employees.map(e => ({
                id: e.id,
                name: e.name,
                username: e.username,
                email: e.email || '',
                phone: e.phone || '',
                title: e.title || '',
                role: e.role || 'agent',
                permissions: e.permissions || [],
                minutesUsage: {
                    minutesAllocated: e.minutesAllocated || 0,
                    minutesUsed: e.minutesUsed || 0
                },
                active: e.active !== false,
                createdAt: e.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب الموظفين:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// إضافة موظف جديد
async function addEmployee(req, res) {
    try {
        console.log('📝 API: طلب إضافة موظف جديد');
        console.log('📦 Request body received:', JSON.stringify(req.body, null, 2));
        
        const {
            companyId,
            name,
            username,
            email,
            phone,
            title,
            role,
            permissions,
            minutesAllocated,
            password,
            active
        } = req.body;
        
        console.log('🔍 البيانات المستخرجة:', { companyId, name, username, role });
        
        if (!companyId || !name || !username) {
            console.log('❌ بيانات ناقصة:', { companyId, name, username });
            return res.status(400).json({
                success: false,
                message: 'companyId و name و username مطلوبة'
            });
        }
        
        const data = await getEmployeesData();
        
        // التحقق من عدم وجود موظف بنفس اسم المستخدم في نفس الشركة
        const exists = data.employees.find(
            emp => emp.username === username && emp.companyId === companyId
        );
        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم موجود بالفعل في هذه الشركة'
            });
        }
        
        // إنشاء ID جديد
        const maxId = data.employees.reduce((max, emp) => Math.max(max, emp.id || 0), 0);
        
        const newEmployee = {
            id: maxId + 1,
            companyId,
            name,
            username,
            password: password || 'Aa123456', // كلمة مرور افتراضية
            email: email || '',
            phone: phone || '',
            title: title || '',
            role: role || 'agent',
            permissions: permissions || [],
            minutesAllocated: minutesAllocated || 0,
            minutesUsed: 0,
            active: active !== false,
            createdAt: new Date().toISOString()
        };
        
        data.employees.push(newEmployee);
        
        const saved = await saveEmployeesData(data);
        
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: 'فشل في حفظ البيانات'
            });
        }
        
        console.log('✅ تمت إضافة الموظف بنجاح:', newEmployee.username, 'للشركة:', companyId);
        res.json({ success: true, employee: newEmployee });
    } catch (error) {
        console.error('خطأ في إضافة موظف:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// تحديث موظف
async function updateEmployee(req, res) {
    try {
        console.log('📝 API: طلب تحديث موظف');
        
        const { id } = req.params;
        console.log('Employee ID:', id);
        console.log('📦 Update data:', JSON.stringify(req.body, null, 2));
        
        const {
            name,
            email,
            phone,
            title,
            role,
            permissions,
            minutesAllocated,
            password,
            active
        } = req.body;
        
        const data = await getEmployeesData();
        
        const employeeIndex = data.employees.findIndex(e => e.id === parseInt(id));
        if (employeeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }
        
        // تحديث البيانات
        const employee = data.employees[employeeIndex];
        if (name) employee.name = name;
        if (email !== undefined) employee.email = email;
        if (phone !== undefined) employee.phone = phone;
        if (title !== undefined) employee.title = title;
        if (role) employee.role = role;
        if (permissions !== undefined) employee.permissions = permissions;
        if (minutesAllocated !== undefined) employee.minutesAllocated = minutesAllocated;
        if (password) employee.password = password;
        if (active !== undefined) employee.active = active;
        
        employee.updatedAt = new Date().toISOString();
        
        const saved = await saveEmployeesData(data);
        
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: 'فشل في حفظ البيانات'
            });
        }
        
        console.log('✅ تم تحديث الموظف بنجاح:', employee.username);
        res.json({ success: true, employee });
    } catch (error) {
        console.error('خطأ في تحديث موظف:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// حذف موظف
async function deleteEmployee(req, res) {
    try {
        const { id } = req.params;
        
        const data = await getEmployeesData();
        
        const employeeIndex = data.employees.findIndex(e => e.id === parseInt(id));
        if (employeeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }
        
        const deletedEmployee = data.employees.splice(employeeIndex, 1)[0];
        
        const saved = await saveEmployeesData(data);
        
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: 'فشل في حفظ البيانات'
            });
        }
        
        console.log('✅ تم حذف الموظف بنجاح:', deletedEmployee.username);
        res.json({
            success: true,
            message: 'تم حذف الموظف بنجاح'
        });
    } catch (error) {
        console.error('خطأ في حذف موظف:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Router رئيسي - نفس الطريقة في companies.js
module.exports = async (req, res) => {
    const { method } = req;
    const url = req.url || '';
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        // GET /api/employees-management/permissions
        if (method === 'GET' && url.includes('/permissions')) {
            return await getPermissions(req, res);
        }
        
        // GET /api/employees-management?companyId=x
        if (method === 'GET' && !url.includes('/permissions')) {
            return await getEmployees(req, res);
        }
        
        // POST /api/employees-management
        if (method === 'POST') {
            return await addEmployee(req, res);
        }
        
        // PUT /api/employees-management/:id
        if (method === 'PUT') {
            const match = url.match(/\/api\/employees-management\/(\d+)/);
            if (match) {
                req.params = { id: match[1] };
                return await updateEmployee(req, res);
            }
        }
        
        // DELETE /api/employees-management/:id
        if (method === 'DELETE') {
            const match = url.match(/\/api\/employees-management\/(\d+)/);
            if (match) {
                req.params = { id: match[1] };
                return await deleteEmployee(req, res);
            }
        }
        
        res.status(404).json({
            success: false,
            message: 'Endpoint not found'
        });
    } catch (error) {
        console.error('❌ Fatal error in employees API:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// تصدير الدوال للاستخدام المباشر
module.exports.getPermissions = getPermissions;
module.exports.getEmployees = getEmployees;
module.exports.addEmployee = addEmployee;
module.exports.updateEmployee = updateEmployee;
module.exports.deleteEmployee = deleteEmployee;
