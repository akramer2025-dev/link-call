// contacts.js - Firestore Subcollections: companies/{companyId}/contacts/{contactId}
// البيانات لا تُحذف أبداً — softDelete فقط → deleted_archive
const {
    getCompanySubcollection,
    setCompanyDoc,
    softDelete,
    logCompanyActivity
} = require('../utils/company-database');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // ─── GET ───────────────────────────────────────────────────────
        if (req.method === 'GET') {
            const { companyId } = req.query;
            if (!companyId) return res.status(400).json({ success: false, error: 'Company ID is required' });

            const contacts = await getCompanySubcollection(companyId, 'contacts');
            const active = contacts.filter(c => !c._deleted);
            console.log(`📋 [${companyId}] جلب ${active.length} جهة اتصال`);
            return res.status(200).json({ success: true, contacts: active, count: active.length });
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
            const { companyId, contactId, name, phone, email, notes, tags, updatedBy } = req.body;
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
                name:         name  !== undefined ? name  : existing.name,
                phone:        phone !== undefined ? phone : existing.phone,
                email:        email !== undefined ? email : existing.email,
                notes:        notes !== undefined ? notes : existing.notes,
                tags:         tags  !== undefined ? tags  : existing.tags,
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
