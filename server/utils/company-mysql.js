/**
 * Company Database Functions - MySQL
 * وظائف التعامل مع بيانات الشركات في MySQL
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
 * Generate unique company ID
 */
function generateCompanyId() {
    return 'COMP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

/**
 * Get all companies
 */
async function getAllCompanies(includeInactive = false) {
    try {
        let sql = 'SELECT * FROM companies';
        if (!includeInactive) {
            sql += ' WHERE status != "suspended"';
        }
        sql += ' ORDER BY created_at DESC';
        
        const companies = await query(sql);
        return companies;
    } catch (error) {
        console.error('❌ getAllCompanies error:', error.message);
        throw error;
    }
}

/**
 * Get company by ID
 */
async function getCompanyById(companyId) {
    try {
        const sql = 'SELECT * FROM companies WHERE id = ?';
        const company = await queryOne(sql, [companyId]);
        return company;
    } catch (error) {
        console.error('❌ getCompanyById error:', error.message);
        throw error;
    }
}

/**
 * Get company by username
 */
async function getCompanyByUsername(username) {
    try {
        const sql = 'SELECT * FROM companies WHERE username = ?';
        const company = await queryOne(sql, [username]);
        return company;
    } catch (error) {
        console.error('❌ getCompanyByUsername error:', error.message);
        throw error;
    }
}

/**
 * Get company by commercial number
 */
async function getCompanyByCommercialNumber(commercialNumber) {
    try {
        const sql = 'SELECT * FROM companies WHERE commercial_number = ?';
        const company = await queryOne(sql, [commercialNumber]);
        return company;
    } catch (error) {
        console.error('❌ getCompanyByCommercialNumber error:', error.message);
        throw error;
    }
}

/**
 * Create new company
 */
async function createCompany(companyData) {
    try {
        const companyId = companyData.id || generateCompanyId();
        
        const sql = `
            INSERT INTO companies (
                id, commercial_number, company_name, business_type, country, city, address,
                company_phone, company_email, admin_name, admin_title, admin_phone, admin_email,
                username, password, plan, status, is_active, balance, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        await query(sql, [
            companyId,
            companyData.commercial_number,
            companyData.company_name,
            companyData.business_type || null,
            companyData.country || null,
            companyData.city || null,
            companyData.address || null,
            companyData.company_phone || null,
            companyData.company_email || null,
            companyData.admin_name,
            companyData.admin_title || null,
            companyData.admin_phone || null,
            companyData.admin_email || null,
            companyData.username,
            hashPassword(companyData.password),
            companyData.plan || 'free',
            companyData.status || 'active',
            companyData.is_active !== false ? 1 : 0,
            companyData.balance || 121.0000
        ]);
        
        return await getCompanyById(companyId);
    } catch (error) {
        console.error('❌ createCompany error:', error.message);
        throw error;
    }
}

/**
 * Update company
 */
async function updateCompany(companyId, updates) {
    try {
        const fields = [];
        const values = [];
        
        // Build dynamic UPDATE query
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'id') continue; // Don't update ID
            
            let dbField = key;
            // Convert camelCase to snake_case
            dbField = dbField.replace(/([A-Z])/g, '_$1').toLowerCase();
            
            fields.push(`${dbField} = ?`);
            values.push(value);
        }
        
        if (fields.length === 0) {
            throw new Error('No fields to update');
        }
        
        fields.push('updated_at = NOW()');
        values.push(companyId);
        
        const sql = `UPDATE companies SET ${fields.join(', ')} WHERE id = ?`;
        await query(sql, values);
        
        return await getCompanyById(companyId);
    } catch (error) {
        console.error('❌ updateCompany error:', error.message);
        throw error;
    }
}

/**
 * Update company balance
 */
async function updateCompanyBalance(companyId, amount, deductCost = 0) {
    try {
        const sql = `
            UPDATE companies 
            SET balance = balance + ?, 
                total_cost_deducted = total_cost_deducted + ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        await query(sql, [amount, deductCost, companyId]);
        return await getCompanyById(companyId);
    } catch (error) {
        console.error('❌ updateCompanyBalance error:', error.message);
        throw error;
    }
}

/**
 * Delete company (soft delete)
 */
async function deleteCompany(companyId) {
    try {
        const sql = 'UPDATE companies SET status = "suspended", updated_at = NOW() WHERE id = ?';
        await query(sql, [companyId]);
        return true;
    } catch (error) {
        console.error('❌ deleteCompany error:', error.message);
        throw error;
    }
}

/**
 * Verify company login
 */
async function verifyLogin(username, password) {
    try {
        const hashedPassword = hashPassword(password);
        const sql = `
            SELECT * FROM companies 
            WHERE username = ? AND password = ? AND status = 'active'
        `;
        const company = await queryOne(sql, [username, hashedPassword]);
        
        if (company) {
            // Update last login
            await query('UPDATE companies SET last_login_at = NOW() WHERE id = ?', [company.id]);
        }
        
        return company;
    } catch (error) {
        console.error('❌ verifyLogin error:', error.message);
        throw error;
    }
}

/**
 * Get company statistics
 */
async function getCompanyStatistics(companyId) {
    try {
        const sql = 'SELECT * FROM company_statistics WHERE id = ?';
        const stats = await queryOne(sql, [companyId]);
        return stats;
    } catch (error) {
        console.error('❌ getCompanyStatistics error:', error.message);
        throw error;
    }
}

module.exports = {
    hashPassword,
    generateCompanyId,
    getAllCompanies,
    getCompanyById,
    getCompanyByUsername,
    getCompanyByCommercialNumber,
    createCompany,
    updateCompany,
    updateCompanyBalance,
    deleteCompany,
    verifyLogin,
    getCompanyStatistics
};
