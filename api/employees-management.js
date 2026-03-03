// Firestore helpers
async function getCompaniesData() {
    try {
        const { getDb } = require('../utils/firebase');
        const { collection, getDocs } = require('firebase/firestore');
        const db = getDb();
        const snapshot = await getDocs(collection(db, 'companies'));
        const companies = [];
        snapshot.forEach(docSnap => companies.push(docSnap.data()));
        console.log('[employees-management] ✅ Firestore:', companies.length, 'شركة');
        return { companies };
    } catch (error) {
        console.error('[employees-management] ❌ Firestore read error:', error.message);
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
        console.log('[employees-management] ✅ Firestore saved');
        return true;
    } catch (error) {
        console.error('[employees-management] ❌ Firestore write error:', error.message);
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
        // أظهر فقط غير المحذوفين للمستخدم
        const activeEmployees = (company.employees || []).filter(e => !e._deleted);
        res.json({ success: true, employees: activeEmployees });
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
            console.error('❌ فشل الحفظ في Firestore');
            return res.status(500).json({ success: false, message: 'فشل في حفظ البيانات في قاعدة البيانات' });
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
        const deletedBy = req.query.deletedBy || req.body?.deletedBy || 'manager';
        const data = await getCompaniesData();
        let found = null;
        let foundCompanyId = null;
        for (const company of data.companies) {
            const emp = (company.employees || []).find(e => e.id === parseInt(id) && !e._deleted);
            if (emp) { found = emp; foundCompanyId = company.id; break; }
        }
        if (!found) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

        // حفظ نسخة في deleted_archive (لا تُمحى أبداً)
        try {
            const { getDb } = require('../utils/firebase');
            const { doc, setDoc } = require('firebase/firestore');
            const db = getDb();
            const archiveId = `${foundCompanyId}_employee_${found.id}_${Date.now()}`;
            await setDoc(doc(db, 'deleted_archive', archiveId), {
                originalCollection: `companies/${foundCompanyId}/employees`,
                companyId: foundCompanyId,
                subcollection: 'employees',
                data: found,
                deletedBy,
                deletedAt: new Date().toISOString()
            });
        } catch (archiveErr) {
            console.error('⚠️ Archive error:', archiveErr.message);
        }

        // Soft delete - لا نحذف من المصفوفة، نضع علامة فقط
        for (const company of data.companies) {
            const emp = (company.employees || []).find(e => e.id === parseInt(id));
            if (emp) {
                emp._deleted = true;
                emp._deletedAt = new Date().toISOString();
                emp._deletedBy = deletedBy;
                emp.active = false;
                company.employeesCount = company.employees.filter(e => !e._deleted).length;
                break;
            }
        }
        const saved = await saveCompaniesData(data);
        if (!saved) return res.status(500).json({ success: false, message: 'فشل في حفظ البيانات' });
        res.json({ success: true, message: 'تم حذف الموظف بنجاح (محفوظ في الأرشيف)' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// POST /api/employees-management/minutes/record
async function recordMinutes(req, res) {
    const { employeeId, minutesUsed, callId, callType } = req.body || {};
    if (!employeeId || !minutesUsed) return res.status(400).json({ success: false, message: 'employeeId و minutesUsed مطلوبان' });

    const data = await getCompaniesData();
    let found = null, foundCompany = null;
    for (const company of data.companies) {
        const emp = (company.employees || []).find(e => e.id === employeeId || String(e.id) === String(employeeId));
        if (emp) { found = emp; foundCompany = company; break; }
    }
    if (!found || !foundCompany) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    found.minutesUsed   = (found.minutesUsed   || 0) + parseInt(minutesUsed, 10);
    foundCompany.employees = foundCompany.employees.map(e =>
        (e.id === employeeId || String(e.id) === String(employeeId)) ? found : e
    );
    await saveCompaniesData(data);

    const minutesAllocated = found.minutesAllocated || 0;
    const minutesRemaining = minutesAllocated > 0 ? Math.max(0, minutesAllocated - found.minutesUsed) : Infinity;
    const accountActive    = minutesAllocated === 0 || minutesRemaining > 0;

    console.log(`⏱️ recordMinutes: موظف ${employeeId} → ${found.minutesUsed} دق مستخدمة`);
    return res.status(200).json({
        success: true,
        usage: { minutesUsed: found.minutesUsed, minutesAllocated, minutesRemaining: minutesRemaining === Infinity ? null : minutesRemaining, accountActive }
    });
}

// GET /api/employees-management/minutes/{employeeId}/check
async function checkMinutes(req, res) {
    const url = req.url || '';
    const match = url.match(/\/minutes\/([^\/\?]+)\/check/);
    const employeeId = match ? match[1] : null;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId مطلوب' });

    const data = await getCompaniesData();
    let found = null;
    for (const company of data.companies) {
        const emp = (company.employees || []).find(e => e.id === employeeId || String(e.id) === String(employeeId));
        if (emp) { found = emp; break; }
    }
    if (!found) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    const minutesAllocated = found.minutesAllocated || 0;
    const minutesUsed      = found.minutesUsed      || 0;
    const minutesRemaining = minutesAllocated > 0 ? Math.max(0, minutesAllocated - minutesUsed) : null;
    const available        = minutesAllocated === 0 || minutesRemaining > 0;
    const reason           = !available ? 'no_minutes' : (found.active === false ? 'account_inactive' : null);

    return res.status(200).json({ success: true, available, minutesRemaining, minutesUsed, minutesAllocated, reason });
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
        if (method === 'POST' && url.includes('/minutes/record'))  return await recordMinutes(req, res);
        if (method === 'GET'  && url.includes('/minutes/'))        return await checkMinutes(req, res);
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