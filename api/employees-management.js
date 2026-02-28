const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// استيراد نظام قواعد البيانات المنفصلة
const { 
  readCompanyData, 
  writeCompanyData, 
  logCompanyActivity 
} = require('../utils/company-database');

// مسار ملف الصلاحيات (مشترك لجميع الشركات)
const PERMISSIONS_FILE = path.join(__dirname, '..', 'permissions.json');

// قراءة ملف الصلاحيات (مشترك)
function readPermissions() {
  try {
    if (!fs.existsSync(PERMISSIONS_FILE)) {
      return null;
    }
    const data = fs.readFileSync(PERMISSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading permissions:', error);
    return null;
  }
}

// تشفير كلمة المرور
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// توليد ID فريد
function generateId() {
  return 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// الحصول على كل الموظفين لشركة معينة
exports.getAllEmployees = (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    // قراءة بيانات الموظفين من قاعدة بيانات الشركة
    const employees = readCompanyData(companyId, 'employees.json');
    if (!employees) {
      return res.json({ success: true, employees: [], total: 0 });
    }

    // إضافة معلومات استخدام الدقائق
    const minutesUsage = readCompanyData(companyId, 'minutes-usage.json') || { usage: [] };
    
    const employeesWithUsage = employees.employees.map(emp => {
      const usage = minutesUsage.usage.find(u => u.employeeId === emp.id) || {
        minutesAllocated: emp.minutesAllocated || 0,
        minutesUsed: 0,
        minutesRemaining: emp.minutesAllocated || 0
      };
      
      return {
        ...emp,
        password: undefined, // لا نرسل كلمة المرور
        minutesUsage: usage
      };
    });

    res.json({
      success: true,
      employees: employeesWithUsage,
      total: employeesWithUsage.length
    });

  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// إضافة موظف جديد
exports.addEmployee = (req, res) => {
  try {
    const {
      companyId,
      name,
      username,
      password,
      email,
      phone,
      title,
      role,
      permissions,
      minutesAllocated,
      active
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!companyId || !name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, name, username and password are required'
      });
    }

    // قراءة بيانات الموظفين من قاعدة بيانات الشركة
    const employees = readCompanyData(companyId, 'employees.json') || { employees: [] };

    // التحقق من عدم تكرار اسم المستخدم داخل نفس الشركة
    const existingEmployee = employees.employees.find(
      emp => emp.username === username
    );

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists in this company'
      });
    }

    // إنشاء الموظف الجديد
    const newEmployee = {
      id: generateId(),
      companyId,
      name,
      username,
      password: hashPassword(password),
      email: email || '',
      phone: phone || '',
      title: title || 'موظف',
      role: role || 'agent',
      permissions: permissions || [],
      minutesAllocated: parseInt(minutesAllocated) || 0,
      active: active !== undefined ? active : true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    employees.employees.push(newEmployee);

    // حفظ البيانات في قاعدة بيانات الشركة
    if (!writeCompanyData(companyId, 'employees.json', employees)) {
      return res.status(500).json({ success: false, message: 'Error saving employee data' });
    }

    // إنشاء سجل استخدام الدقائق في قاعدة بيانات الشركة
    const minutesUsage = readCompanyData(companyId, 'minutes-usage.json') || { usage: [] };
    minutesUsage.usage.push({
      employeeId: newEmployee.id,
      companyId,
      minutesAllocated: newEmployee.minutesAllocated,
      minutesUsed: 0,
      minutesRemaining: newEmployee.minutesAllocated,
      lastUpdated: new Date().toISOString(),
      history: []
    });

    writeCompanyData(companyId, 'minutes-usage.json', minutesUsage);
    
    // تسجيل النشاط
    logCompanyActivity(companyId, {
      action: 'employee_added',
      employeeId: newEmployee.id,
      employeeName: newEmployee.name,
      performedBy: 'admin'
    });

    // إرجاع البيانات بدون كلمة المرور
    const employeeResponse = { ...newEmployee };
    delete employeeResponse.password;

    res.json({
      success: true,
      message: 'Employee added successfully',
      employee: employeeResponse
    });

  } catch (error) {
    console.error('Error in addEmployee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// تحديث بيانات موظف
exports.updateEmployee = (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyId,
      name,
      email,
      phone,
      title,
      role,
      permissions,
      minutesAllocated,
      active,
      password
    } = req.body;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    const employees = readCompanyData(companyId, 'employees.json');
    if (!employees) {
      return res.status(500).json({ success: false, message: 'Error reading employees data' });
    }

    const employeeIndex = employees.employees.findIndex(emp => emp.id === id);
    if (employeeIndex === -1) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employee = employees.employees[employeeIndex];

    // تحديث البيانات
    if (name) employee.name = name;
    if (email !== undefined) employee.email = email;
    if (phone !== undefined) employee.phone = phone;
    if (title) employee.title = title;
    if (role) employee.role = role;
    if (permissions) employee.permissions = permissions;
    if (active !== undefined) employee.active = active;
    if (password) employee.password = hashPassword(password);
    
    // تحديث الدقائق المخصصة
    if (minutesAllocated !== undefined) {
      const oldMinutes = employee.minutesAllocated || 0;
      const newMinutes = parseInt(minutesAllocated);
      employee.minutesAllocated = newMinutes;

      // تحديث سجل استخدام الدقائق
      const minutesUsage = readCompanyData(companyId, 'minutes-usage.json') || { usage: [] };
      const usageIndex = minutesUsage.usage.findIndex(u => u.employeeId === id);
      
      if (usageIndex !== -1) {
        const usage = minutesUsage.usage[usageIndex];
        const difference = newMinutes - oldMinutes;
        usage.minutesAllocated = newMinutes;
        usage.minutesRemaining += difference;
        usage.lastUpdated = new Date().toISOString();
        
        // تسجيل التغيير
        usage.history.push({
          date: new Date().toISOString(),
          action: 'allocation_updated',
          oldValue: oldMinutes,
          newValue: newMinutes,
          difference: difference
        });

        writeCompanyData(companyId, 'minutes-usage.json', minutesUsage);
      }
    }

    employee.updatedAt = new Date().toISOString();
    employees.employees[employeeIndex] = employee;

    // حفظ البيانات
    if (!writeCompanyData(companyId, 'employees.json', employees)) {
      return res.status(500).json({ success: false, message: 'Error saving employee data' });
    }

    // تسجيل النشاط
    logCompanyActivity(companyId, {
      action: 'employee_updated',
      employeeId: employee.id,
      employeeName: employee.name,
      performedBy: 'admin'
    });

    // إرجاع البيانات بدون كلمة المرور
    const employeeResponse = { ...employee };
    delete employeeResponse.password;

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: employeeResponse
    });

  } catch (error) {
    console.error('Error in updateEmployee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// حذف موظف
exports.deleteEmployee = (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    const employees = readCompanyData(companyId, 'employees.json');
    if (!employees) {
      return res.status(500).json({ success: false, message: 'Error reading employees data' });
    }

    const employeeIndex = employees.employees.findIndex(emp => emp.id === id);
    if (employeeIndex === -1) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employee = employees.employees[employeeIndex];

    // حذف الموظف
    employees.employees.splice(employeeIndex, 1);

    // حفظ البيانات
    if (!writeCompanyData(companyId, 'employees.json', employees)) {
      return res.status(500).json({ success: false, message: 'Error saving employee data' });
    }

    // تسجيل النشاط
    logCompanyActivity(companyId, {
      action: 'employee_deleted',
      employeeId: employee.id,
      employeeName: employee.name,
      performedBy: 'admin'
    });

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// الحصول على معلومات موظف واحد
exports.getEmployee = (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    const employees = readCompanyData(companyId, 'employees.json');
    if (!employees) {
      return res.status(500).json({ success: false, message: 'Error reading employees data' });
    }

    const employee = employees.employees.find(emp => emp.id === id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // إضافة معلومات استخدام الدقائق
    const minutesUsage = readCompanyData(companyId, 'minutes-usage.json') || { usage: [] };
    const usage = minutesUsage.usage.find(u => u.employeeId === id) || {
      minutesAllocated: employee.minutesAllocated || 0,
      minutesUsed: 0,
      minutesRemaining: employee.minutesAllocated || 0
    };

    // إرجاع البيانات بدون كلمة المرور
    const employeeResponse = { ...employee };
    delete employeeResponse.password;
    employeeResponse.minutesUsage = usage;

    res.json({
      success: true,
      employee: employeeResponse
    });

  } catch (error) {
    console.error('Error in getEmployee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// الحصول على قائمة الصلاحيات المتاحة
exports.getPermissions = (req, res) => {
  try {
    const permissions = readPermissions();
    if (!permissions) {
      return res.status(500).json({ success: false, message: 'Error reading permissions data' });
    }

    res.json({
      success: true,
      permissions: permissions.permissions,
      roles: permissions.roles
    });

  } catch (error) {
    console.error('Error in getPermissions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// تسجيل استخدام الدقائق
exports.recordMinutesUsage = (req, res) => {
  try {
    const { employeeId, minutesUsed, callId, callType, companyId } = req.body;

    if (!employeeId || !minutesUsed || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, minutes used, and company ID are required'
      });
    }

    const minutesUsage = readCompanyData(companyId, 'minutes-usage.json') || { usage: [] };
    const usageIndex = minutesUsage.usage.findIndex(u => u.employeeId === employeeId);

    if (usageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Employee usage record not found' });
    }

    const usage = minutesUsage.usage[usageIndex];
    const minutes = parseFloat(minutesUsed);

    // تحديث استخدام الدقائق
    usage.minutesUsed += minutes;
    usage.minutesRemaining = Math.max(0, usage.minutesAllocated - usage.minutesUsed);
    usage.lastUpdated = new Date().toISOString();

    // تسجيل في السجل
    usage.history.push({
      date: new Date().toISOString(),
      action: 'call_completed',
      minutesUsed: minutes,
      callId: callId || null,
      callType: callType || 'outbound',
      remainingMinutes: usage.minutesRemaining
    });

    minutesUsage.usage[usageIndex] = usage;

    // حفظ البيانات
    if (!writeCompanyData(companyId, 'minutes-usage.json', minutesUsage)) {
      return res.status(500).json({ success: false, message: 'Error saving usage data' });
    }

    // إذا انتهت الدقائق، تعطيل الموظف
    if (usage.minutesRemaining <= 0) {
      const employees = readCompanyData(companyId, 'employees.json');
      if (employees) {
        const empIndex = employees.employees.findIndex(e => e.id === employeeId);
        if (empIndex !== -1) {
          employees.employees[empIndex].active = false;
          employees.employees[empIndex].deactivatedReason = 'no_minutes_remaining';
          employees.employees[empIndex].deactivatedAt = new Date().toISOString();
          writeCompanyData(companyId, 'employees.json', employees);
        }
      }
    }

    // تسجيل النشاط
    logCompanyActivity(companyId, {
      action: 'minutes_recorded',
      employeeId: employeeId,
      minutesUsed: minutes,
      callId: callId
    });

    res.json({
      success: true,
      message: 'Minutes usage recorded successfully',
      usage: {
        minutesUsed: usage.minutesUsed,
        minutesRemaining: usage.minutesRemaining,
        accountActive: usage.minutesRemaining > 0
      }
    });

  } catch (error) {
    console.error('Error in recordMinutesUsage:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// الحصول على سجل استخدام الدقائق
exports.getMinutesUsage = (req, res) => {
  try {
    const { employeeId } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    const minutesUsage = readCompanyData(companyId, 'minutes-usage.json') || { usage: [] };
    const usage = minutesUsage.usage.find(u => u.employeeId === employeeId);

    if (!usage) {
      return res.status(404).json({ success: false, message: 'Usage record not found' });
    }

    res.json({
      success: true,
      usage
    });

  } catch (error) {
    console.error('Error in getMinutesUsage:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// التحقق من توفر الدقائق قبل المكالمة
exports.checkMinutesAvailability = (req, res) => {
  try {
    const { employeeId } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    const employees = readCompanyData(companyId, 'employees.json');
    if (!employees) {
      return res.status(500).json({ success: false, message: 'Error reading employees data' });
    }

    const employee = employees.employees.find(emp => emp.id === employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // إذا كان الموظف غير نشط
    if (!employee.active) {
      return res.json({
        success: true,
        available: false,
        reason: employee.deactivatedReason || 'account_inactive'
      });
    }

    const minutesUsage = readCompanyData(companyId, 'minutes-usage.json') || { usage: [] };
    const usage = minutesUsage.usage.find(u => u.employeeId === employeeId);

    if (!usage) {
      return res.json({
        success: true,
        available: employee.minutesAllocated > 0,
        minutesRemaining: employee.minutesAllocated || 0
      });
    }

    res.json({
      success: true,
      available: usage.minutesRemaining > 0,
      minutesRemaining: usage.minutesRemaining,
      minutesUsed: usage.minutesUsed,
      minutesAllocated: usage.minutesAllocated
    });

  } catch (error) {
    console.error('Error in checkMinutesAvailability:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
