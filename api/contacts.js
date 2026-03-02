// contacts.js - Firestore Subcollections: companies/{companyId}/contacts/{contactId}
// البيانات لا تُحذف أبداً — softDelete فقط → deleted_archive
const crypto = require('crypto');
const {
    getCompanySubcollection,
    setCompanyDoc,
    softDelete,
    logCompanyActivity
} = require('../utils/company-database');
const { getDb } = require('../utils/firebase');
function _hashPassword(pw) { return crypto.createHash('sha256').update(pw).digest('hex'); }

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // ─── GET ───────────────────────────────────────────────────────
        if (req.method === 'GET') {
            const { companyId, action, assignedTo, page, limit: limitQ, search } = req.query;
            if (!companyId) return res.status(400).json({ success: false, error: 'Company ID is required' });

            const allContacts = await getCompanySubcollection(companyId, 'contacts');
            let active = allContacts.filter(c => !c._deleted);

            // فلتر الموظف — كل موظف يرى فقط ما وُزِّع عليه
            if (assignedTo && assignedTo !== 'admin' && assignedTo !== 'all') {
                active = active.filter(c => c.assignedTo === assignedTo);
            }

            // فلتر البحث النصي
            if (search) {
                const q = search.toLowerCase();
                active = active.filter(c =>
                    (c.name  || '').toLowerCase().includes(q) ||
                    (c.phone || '').includes(q) ||
                    (c.email || '').toLowerCase().includes(q)
                );
            }

            const total = active.length;

            // Pagination
            const pageNum  = Math.max(1, parseInt(page  || '1',  10));
            const pageSize = Math.min(500, Math.max(1, parseInt(limitQ || '100', 10)));
            const offset   = (pageNum - 1) * pageSize;
            const paginated = active.slice(offset, offset + pageSize);
            const hasMore   = offset + pageSize < total;

            console.log(`📋 [${companyId}] جلب ${paginated.length}/${total} جهة اتصال (صفحة ${pageNum})`);
            return res.status(200).json({
                success: true,
                contacts: paginated,
                count: paginated.length,
                total,
                page: pageNum,
                pageSize,
                hasMore
            });
        }

        // ─── DELETE-ALL (admin only, requires password) ────────────────
        if (req.method === 'POST' && req.query.action === 'deleteAll') {
            const { companyId, adminPassword, deletedBy } = req.body;
            if (!companyId) return res.status(400).json({ success: false, error: 'Company ID is required' });
            if (!adminPassword) return res.status(400).json({ success: false, error: 'كلمة المرور مطلوبة' });

            // ── التحقق من كلمة مرور مدير الشركة ──────────────────────────
            try {
                const { doc, getDoc } = require('firebase/firestore');
                const db = getDb();
                const companySnap = await getDoc(doc(db, 'companies', companyId));
                if (!companySnap.exists()) return res.status(404).json({ success: false, error: 'لم يتم العثور على الشركة' });
                const company = companySnap.data();
                const storedHash = company.password || '';
                const suppliedHash = _hashPassword(adminPassword.trim());
                if (storedHash !== suppliedHash) {
                    return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
                }
            } catch (authErr) {
                console.error('deleteAll auth error:', authErr.message);
                return res.status(500).json({ success: false, error: 'خطأ في التحقق من الهوية' });
            }

            const allContacts = await getCompanySubcollection(companyId, 'contacts');
            const active = allContacts.filter(c => !c._deleted);

            let deleted = 0;
            for (const c of active) {
                const cId = c._id || c.id;
                if (cId) {
                    await softDelete(companyId, 'contacts', cId, c, deletedBy || 'admin');
                    deleted++;
                }
            }
            logCompanyActivity(companyId, { action: 'contacts_cleared', count: deleted, deletedBy: deletedBy || 'admin' });
            console.log(`🗑️ [${companyId}] تم مسح ${deleted} جهة اتصال (deleteAll)`);
            return res.status(200).json({ success: true, deleted, message: `تم مسح ${deleted} جهة اتصال` });
        }

        // ─── POST ──────────────────────────────────────────────────────
        if (req.method === 'POST') {
            const { companyId, name, phone, email, notes, tags, addedBy, device } = req.body;
            if (!companyId) return res.status(400).json({ success: false, error: 'Company ID is required' });
            if (!name || !phone) return res.status(400).json({ success: false, error: 'Name and phone are required' });

            const existing = await getCompanySubcollection(companyId, 'contacts');
            const duplicate = existing.find(c => c.phone === phone && !c._deleted);
            if (duplicate) {
                return res.status(400).json({ success: false, error: 'Phone number already exists', existingContact: { id: duplicate._id, name: duplicate.name } });
            }

            const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newContact = {
                id: contactId, companyId, name, phone,
                email: email || null, notes: notes || '',
                tags: tags || [], addedBy: addedBy || 'unknown',
                device: device || 'unknown',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                callHistory: [], totalCalls: 0, totalDuration: 0, lastCallDate: null
            };

            await setCompanyDoc(companyId, 'contacts', contactId, newContact);
            logCompanyActivity(companyId, { action: 'contact_added', contactId, contactName: name, contactPhone: phone, addedBy: addedBy || 'unknown' });
            console.log(`✅ [${companyId}] تم إضافة جهة اتصال: ${name} (${phone})`);
            return res.status(200).json({ success: true, contact: newContact, message: 'Contact added successfully' });
        }

        // ─── PUT ───────────────────────────────────────────────────────
        if (req.method === 'PUT') {
            const { companyId, contactId, name, phone, email, notes, tags, assignedTo, updatedBy } = req.body;
            if (!companyId || !contactId) return res.status(400).json({ success: false, error: 'Company ID and Contact ID are required' });

            const contacts = await getCompanySubcollection(companyId, 'contacts');
            const existing = contacts.find(c => c._id === contactId || c.id === contactId);
            if (!existing) return res.status(404).json({ success: false, error: 'Contact not found' });

            if (phone && phone !== existing.phone) {
                const dup = contacts.find(c => c.phone === phone && c._id !== contactId && c.id !== contactId && !c._deleted);
                if (dup) return res.status(400).json({ success: false, error: 'Phone number already exists' });
            }

            const updated = {
                ...existing,
                name:         name       !== undefined ? name       : existing.name,
                phone:        phone      !== undefined ? phone      : existing.phone,
                email:        email      !== undefined ? email      : existing.email,
                notes:        notes      !== undefined ? notes      : existing.notes,
                tags:         tags       !== undefined ? tags       : existing.tags,
                assignedTo:   assignedTo !== undefined ? assignedTo : existing.assignedTo,
                lastModified: new Date().toISOString()
            };
            delete updated._id;

            await setCompanyDoc(companyId, 'contacts', contactId, updated);
            logCompanyActivity(companyId, { action: 'contact_updated', contactId, updatedBy: updatedBy || 'unknown' });
            console.log(`✏️ [${companyId}] تم تحديث جهة اتصال: ${updated.name}`);
            return res.status(200).json({ success: true, contact: updated, message: 'Contact updated successfully' });
        }

        // ─── DELETE (Soft Delete فقط - لا يُمسح أبداً) ────────────────
        if (req.method === 'DELETE') {
            const { companyId, contactId, deletedBy } = req.query;
            if (!companyId || !contactId) return res.status(400).json({ success: false, error: 'Company ID and Contact ID are required' });

            const contacts = await getCompanySubcollection(companyId, 'contacts');
            const existing = contacts.find(c => c._id === contactId || c.id === contactId);
            if (!existing || existing._deleted) return res.status(404).json({ success: false, error: 'Contact not found' });

            await softDelete(companyId, 'contacts', contactId, existing, deletedBy || 'unknown');
            logCompanyActivity(companyId, { action: 'contact_deleted', contactId, contactName: existing.name, contactPhone: existing.phone, deletedBy: deletedBy || 'unknown' });
            console.log(`🗃️ [${companyId}] Soft-deleted: ${existing.name}`);
            return res.status(200).json({ success: true, message: 'Contact deleted successfully (archived)' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });

    } catch (error) {
        console.error('❌ خطأ في contacts API:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
