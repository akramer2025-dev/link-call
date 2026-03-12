/**
 * Contact Database Functions - MySQL
 * وظائف التعامل مع جهات الاتصال في MySQL
 */

const { query, queryOne, beginTransaction, commit, rollback } = require('./mysql');

/**
 * Generate unique contact ID
 */
function generateContactId() {
    return 'CONT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

/**
 * Get all contacts for a company
 */
async function getCompanyContacts(companyId, includeDeleted = false) {
    try {
        let sql = 'SELECT * FROM contacts WHERE company_id = ?';
        if (!includeDeleted) {
            sql += ' AND is_deleted = FALSE';
        }
        sql += ' ORDER BY created_at DESC';
        
        const contacts = await query(sql, [companyId]);
        
        // Parse tags JSON
        contacts.forEach(contact => {
            if (contact.tags) {
                try {
                    contact.tags = JSON.parse(contact.tags);
                } catch (e) {
                    contact.tags = [];
                }
            }
        });
        
        return contacts;
    } catch (error) {
        console.error('❌ getCompanyContacts error:', error.message);
        throw error;
    }
}

/**
 * Get contact by ID
 */
async function getContactById(contactId) {
    try {
        const sql = 'SELECT * FROM contacts WHERE id = ?';
        const contact = await queryOne(sql, [contactId]);
        
        if (contact && contact.tags) {
            try {
                contact.tags = JSON.parse(contact.tags);
            } catch (e) {
                contact.tags = [];
            }
        }
        
        return contact;
    } catch (error) {
        console.error('❌ getContactById error:', error.message);
        throw error;
    }
}

/**
 * Get contact by phone
 */
async function getContactByPhone(companyId, phone) {
    try {
        const sql = 'SELECT * FROM contacts WHERE company_id = ? AND phone = ? AND is_deleted = FALSE';
        const contact = await queryOne(sql, [companyId, phone]);
        
        if (contact && contact.tags) {
            try {
                contact.tags = JSON.parse(contact.tags);
            } catch (e) {
                contact.tags = [];
            }
        }
        
        return contact;
    } catch (error) {
        console.error('❌ getContactByPhone error:', error.message);
        throw error;
    }
}

/**
 * Create new contact
 */
async function createContact(companyId, contactData) {
    try {
        const contactId = contactData.id || generateContactId();
        
        const sql = `
            INSERT INTO contacts (
                id, company_id, name, phone, email, address, status, 
                assigned_to, tags, notes, added_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        await query(sql, [
            contactId,
            companyId,
            contactData.name,
            contactData.phone,
            contactData.email || null,
            contactData.address || null,
            contactData.status || 'new',
            contactData.assigned_to || null,
            contactData.tags ? JSON.stringify(contactData.tags) : null,
            contactData.notes || null,
            contactData.added_by || null
        ]);
        
        return await getContactById(contactId);
    } catch (error) {
        console.error('❌ createContact error:', error.message);
        throw error;
    }
}

/**
 * Update contact
 */
async function updateContact(contactId, updates) {
    try {
        const fields = [];
        const values = [];
        
        // Build dynamic UPDATE query
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'id' || key === 'company_id') continue;
            
            let dbField = key;
            // Convert camelCase to snake_case
            dbField = dbField.replace(/([A-Z])/g, '_$1').toLowerCase();
            
            // Special handling for tags
            if (key === 'tags') {
                fields.push(`${dbField} = ?`);
                values.push(Array.isArray(value) ? JSON.stringify(value) : value);
            } else {
                fields.push(`${dbField} = ?`);
                values.push(value);
            }
        }
        
        if (fields.length === 0) {
            throw new Error('No fields to update');
        }
        
        fields.push('updated_at = NOW()');
        values.push(contactId);
        
        const sql = `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`;
        await query(sql, values);
        
        return await getContactById(contactId);
    } catch (error) {
        console.error('❌ updateContact error:', error.message);
        throw error;
    }
}

/**
 * Delete contact (soft delete)
 */
async function deleteContact(contactId, deletedBy) {
    try {
        const archiveId = `ARCH_CONT_${Date.now()}_${contactId}`;
        const sql = `
            UPDATE contacts 
            SET is_deleted = TRUE, 
                deleted_at = NOW(), 
                deleted_by = ?,
                archive_id = ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        await query(sql, [deletedBy, archiveId, contactId]);
        
        // Archive to deleted_archive table
        const contact = await queryOne('SELECT * FROM contacts WHERE id = ?', [contactId]);
        if (contact) {
            await query(`
                INSERT INTO deleted_archive (
                    archive_id, company_id, original_collection, subcollection, original_doc_id, data, deleted_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [archiveId, contact.company_id, 'companies', 'contacts', contactId, JSON.stringify(contact), deletedBy]);
        }
        
        return true;
    } catch (error) {
        console.error('❌ deleteContact error:', error.message);
        throw error;
    }
}

/**
 * Bulk create contacts
 */
async function bulkCreateContacts(companyId, contacts, addedBy) {
    const connection = await beginTransaction();
    
    try {
        const results = {
            success: 0,
            failed: 0,
            duplicates: 0,
            errors: []
        };
        
        for (const contactData of contacts) {
            try {
                // Check for duplicate
                const existing = await getContactByPhone(companyId, contactData.phone);
                if (existing) {
                    results.duplicates++;
                    continue;
                }
                
                // Insert contact
                const contactId = generateContactId();
                await connection.execute(`
                    INSERT INTO contacts (
                        id, company_id, name, phone, email, address, status, 
                        assigned_to, tags, notes, added_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    contactId,
                    companyId,
                    contactData.name || 'غير محدد',
                    contactData.phone,
                    contactData.email || null,
                    contactData.address || null,
                    contactData.status || 'new',
                    contactData.assigned_to || null,
                    contactData.tags ? JSON.stringify(contactData.tags) : null,
                    contactData.notes || null,
                    addedBy
                ]);
                
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ phone: contactData.phone, error: error.message });
            }
        }
        
        await commit(connection);
        return results;
    } catch (error) {
        await rollback(connection);
        console.error('❌ bulkCreateContacts error:', error.message);
        throw error;
    }
}

/**
 * Search contacts
 */
async function searchContacts(companyId, searchTerm) {
    try {
        const sql = `
            SELECT * FROM contacts 
            WHERE company_id = ? AND is_deleted = FALSE
            AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)
            ORDER BY created_at DESC
            LIMIT 100
        `;
        
        const term = `%${searchTerm}%`;
        const contacts = await query(sql, [companyId, term, term, term]);
        
        // Parse tags
        contacts.forEach(contact => {
            if (contact.tags) {
                try {
                    contact.tags = JSON.parse(contact.tags);
                } catch (e) {
                    contact.tags = [];
                }
            }
        });
        
        return contacts;
    } catch (error) {
        console.error('❌ searchContacts error:', error.message);
        throw error;
    }
}

module.exports = {
    generateContactId,
    getCompanyContacts,
    getContactById,
    getContactByPhone,
    createContact,
    updateContact,
    deleteContact,
    bulkCreateContacts,
    searchContacts
};
