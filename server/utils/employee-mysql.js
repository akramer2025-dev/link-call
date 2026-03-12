/**
 * Employee Database Functions - MySQL
 * وظائف التعامل مع بيانات الموظفين في MySQL
 */

const { query, queryOne, beginTransaction, commit, rollback } = require('./mysql');
const crypto = require('crypto');

/**
 * Hash password using SHA-256
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Get all employees for a company
 */
async function getCompanyEmployees(companyId, includeDeleted = false) {
    try {
        let sql = 'SELECT * FROM employees WHERE company_id = ?';
        if (!includeDeleted) {
            sql += ' AND is_deleted = FALSE';
        }
        sql += ' ORDER BY created_at DESC';
        
        const employees = await query(sql, [companyId]);
        
        // Get permissions for each employee
        for (const employee of employees) {
            employee.permissions = await getEmployeePermissions(employee.id);
        }
        
        return employees;
    } catch (error) {
        console.error('❌ getCompanyEmployees error:', error.message);
        throw error;
    }
}

/**
 * Get employee by ID
 */
async function getEmployeeById(employeeId) {
    try {
        const sql = 'SELECT * FROM employees WHERE id = ?';
        const employee = await queryOne(sql, [employeeId]);
        
        if (employee) {
            employee.permissions = await getEmployeePermissions(employeeId);
        }
        
        return employee;
    } catch (error) {
        console.error('❌ getEmployeeById error:', error.message);
        throw error;
    }
}

/**
 * Get employee by username and company
 */
async function getEmployeeByUsername(companyId, username) {
    try {
        const sql = 'SELECT * FROM employees WHERE company_id = ? AND username = ? AND is_deleted = FALSE';
        const employee = await queryOne(sql, [companyId, username]);
        
        if (employee) {
            employee.permissions = await getEmployeePermissions(employee.id);
        }
        
        return employee;
    } catch (error) {
        console.error('❌ getEmployeeByUsername error:', error.message);
        throw error;
    }
}

/**
 * Create new employee
 */
async function createEmployee(companyId, employeeData) {
    try {
        const sql = `
            INSERT INTO employees (
                company_id, name, username, password, email, phone, title, role,
                minutes_allocated, active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const result = await query(sql, [
            companyId,
            employeeData.name,
            employeeData.username,
            hashPassword(employeeData.password || 'Aa123456'),
            employeeData.email || null,
            employeeData.phone || null,
            employeeData.title || null,
            employeeData.role || 'agent',
            employeeData.minutes_allocated || 0,
            employeeData.active !== false ? 1 : 0
        ]);
        
        const employeeId = result.insertId;
        
        // Add permissions if provided
        if (employeeData.permissions && Array.isArray(employeeData.permissions)) {
            await setEmployeePermissions(employeeId, employeeData.permissions);
        }
        
        return await getEmployeeById(employeeId);
    } catch (error) {
        console.error('❌ createEmployee error:', error.message);
        throw error;
    }
}

/**
 * Update employee
 */
async function updateEmployee(employeeId, updates) {
    try {
        const fields = [];
        const values = [];
        
        // Build dynamic UPDATE query
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'id' || key === 'company_id' || key === 'permissions') continue;
            
            let dbField = key;
            // Convert camelCase to snake_case
            dbField = dbField.replace(/([A-Z])/g, '_$1').toLowerCase();
            
            // Special handling for password
            if (key === 'password') {
                fields.push(`${dbField} = ?`);
                values.push(hashPassword(value));
            } else {
                fields.push(`${dbField} = ?`);
                values.push(value);
            }
        }
        
        if (fields.length === 0 && !updates.permissions) {
            throw new Error('No fields to update');
        }
        
        if (fields.length > 0) {
            fields.push('updated_at = NOW()');
            values.push(employeeId);
            
            const sql = `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`;
            await query(sql, values);
        }
        
        // Update permissions if provided
        if (updates.permissions && Array.isArray(updates.permissions)) {
            await setEmployeePermissions(employeeId, updates.permissions);
        }
        
        return await getEmployeeById(employeeId);
    } catch (error) {
        console.error('❌ updateEmployee error:', error.message);
        throw error;
    }
}

/**
 * Delete employee (soft delete)
 */
async function deleteEmployee(employeeId, deletedBy) {
    try {
        const archiveId = `ARCH_EMP_${Date.now()}_${employeeId}`;
        const sql = `
            UPDATE employees 
            SET is_deleted = TRUE, 
                deleted_at = NOW(), 
                deleted_by = ?,
                archive_id = ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        await query(sql, [deletedBy, archiveId, employeeId]);
        
        // Archive to deleted_archive table
        const employee = await queryOne('SELECT * FROM employees WHERE id = ?', [employeeId]);
        if (employee) {
            await query(`
                INSERT INTO deleted_archive (
                    archive_id, company_id, original_collection, original_doc_id, data, deleted_by
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [archiveId, employee.company_id, 'employees', employeeId, JSON.stringify(employee), deletedBy]);
        }
        
        return true;
    } catch (error) {
        console.error('❌ deleteEmployee error:', error.message);
        throw error;
    }
}

/**
 * Verify employee login
 */
async function verifyEmployeeLogin(companyId, username, password) {
    try {
        const hashedPassword = hashPassword(password);
        const sql = `
            SELECT * FROM employees 
            WHERE company_id = ? AND username = ? AND password = ? 
            AND active = TRUE AND is_deleted = FALSE
        `;
        const employee = await queryOne(sql, [companyId, username, hashedPassword]);
        
        if (employee) {
            employee.permissions = await getEmployeePermissions(employee.id);
        }
        
        return employee;
    } catch (error) {
        console.error('❌ verifyEmployeeLogin error:', error.message);
        throw error;
    }
}

/**
 * Get employee permissions
 */
async function getEmployeePermissions(employeeId) {
    try {
        const sql = 'SELECT permission_id FROM employee_permissions WHERE employee_id = ?';
        const rows = await query(sql, [employeeId]);
        return rows.map(row => row.permission_id);
    } catch (error) {
        console.error('❌ getEmployeePermissions error:', error.message);
        return [];
    }
}

/**
 * Set employee permissions (replaces all)
 */
async function setEmployeePermissions(employeeId, permissions) {
    try {
        // Delete existing permissions
        await query('DELETE FROM employee_permissions WHERE employee_id = ?', [employeeId]);
        
        // Insert new permissions
        if (permissions && permissions.length > 0) {
            const values = permissions.map(permId => [employeeId, permId]);
            const placeholders = values.map(() => '(?, ?)').join(', ');
            const sql = `INSERT INTO employee_permissions (employee_id, permission_id) VALUES ${placeholders}`;
            await query(sql, values.flat());
        }
        
        return true;
    } catch (error) {
        console.error('❌ setEmployeePermissions error:', error.message);
        throw error;
    }
}

/**
 * Add permission to employee
 */
async function addEmployeePermission(employeeId, permissionId) {
    try {
        const sql = 'INSERT IGNORE INTO employee_permissions (employee_id, permission_id) VALUES (?, ?)';
        await query(sql, [employeeId, permissionId]);
        return true;
    } catch (error) {
        console.error('❌ addEmployeePermission error:', error.message);
        throw error;
    }
}

/**
 * Remove permission from employee
 */
async function removeEmployeePermission(employeeId, permissionId) {
    try {
        const sql = 'DELETE FROM employee_permissions WHERE employee_id = ? AND permission_id = ?';
        await query(sql, [employeeId, permissionId]);
        return true;
    } catch (error) {
        console.error('❌ removeEmployeePermission error:', error.message);
        throw error;
    }
}

module.exports = {
    hashPassword,
    getCompanyEmployees,
    getEmployeeById,
    getEmployeeByUsername,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    verifyEmployeeLogin,
    getEmployeePermissions,
    setEmployeePermissions,
    addEmployeePermission,
    removeEmployeePermission
};
