const { readCompanyData, writeCompanyData, logCompanyActivity } = require('../utils/company-database');

/**
 * إدارة جهات الاتصال - نظام قواعد بيانات منفصلة لكل شركة
 * 
 * كل شركة لها ملف contacts.json خاص بها في:
 * companies-data/{companyId}/contacts.json
 * 
 * هذا يضمن عزل كامل لبيانات كل شركة
 */

/**
 * HTTP Methods:
 * - GET: جلب جميع جهات الاتصال لشركة معينة
 * - POST: إضافة جهة اتصال جديدة لشركة معينة
 * - PUT: تحديث جهة اتصال لشركة معينة
 * - DELETE: حذف جهة اتصال لشركة معينة
 */

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // التعامل مع OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // التعامل مع GET - جلب جهات الاتصال
        if (req.method === 'GET') {
            const { companyId } = req.query;
            
            // التحقق من وجود companyId
            if (!companyId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID is required' 
                });
            }
            
            // قراءة جهات الاتصال من قاعدة بيانات الشركة
            const contactsData = await readCompanyData(companyId, 'contacts.json');
            
            console.log(`📋 [${companyId}] جلب ${contactsData.contacts.length} جهة اتصال`);
            
            return res.status(200).json({
                success: true,
                contacts: contactsData.contacts,
                count: contactsData.contacts.length
            });
        }

        // التعامل مع POST - إضافة جهة اتصال جديدة
        if (req.method === 'POST') {
            const { companyId, name, phone, email, notes, tags, addedBy, device } = req.body;
            
            // التحقق من البيانات المطلوبة
            if (!companyId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID is required' 
                });
            }
            
            if (!name || !phone) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Name and phone are required' 
                });
            }
            
            // قراءة جهات الاتصال الحالية
            const contactsData = await readCompanyData(companyId, 'contacts.json');
            
            // التحقق من عدم تكرار رقم الهاتف
            const existingContact = contactsData.contacts.find(c => c.phone === phone);
            if (existingContact) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Phone number already exists',
                    existingContact: {
                        id: existingContact.id,
                        name: existingContact.name
                    }
                });
            }
            
            // إنشاء جهة اتصال جديدة
            const newContact = {
                id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                companyId,
                name,
                phone,
                email: email || null,
                notes: notes || '',
                tags: tags || [],
                addedBy: addedBy || 'unknown',
                device: device || 'unknown',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                callHistory: [],
                totalCalls: 0,
                totalDuration: 0,
                lastCallDate: null
            };
            
            // إضافة جهة الاتصال الجديدة
            contactsData.contacts.push(newContact);
            
            // حفظ في قاعدة بيانات الشركة
            const success = await writeCompanyData(companyId, 'contacts.json', contactsData);
            
            if (success) {
                // تسجيل النشاط
                logCompanyActivity(companyId, {
                    action: 'contact_added',
                    contactId: newContact.id,
                    contactName: name,
                    contactPhone: phone,
                    addedBy: addedBy || 'unknown',
                    device: device || 'unknown',
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ [${companyId}] تم إضافة جهة اتصال: ${name} (${phone}) | الجهاز: ${device || 'unknown'}`);
                
                return res.status(200).json({ 
                    success: true, 
                    contact: newContact,
                    message: 'Contact added successfully'
                });
            } else {
                throw new Error('Failed to save contact');
            }
        }

        // التعامل مع PUT - تحديث جهة اتصال
        if (req.method === 'PUT') {
            const { companyId, contactId, name, phone, email, notes, tags, updatedBy } = req.body;
            
            // التحقق من البيانات المطلوبة
            if (!companyId || !contactId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID and Contact ID are required' 
                });
            }
            
            // قراءة جهات الاتصال
            const contactsData = await readCompanyData(companyId, 'contacts.json');
            
            // البحث عن جهة الاتصال
            const contactIndex = contactsData.contacts.findIndex(c => c.id === contactId);
            
            if (contactIndex === -1) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Contact not found' 
                });
            }
            
            // التحقق من عدم تكرار رقم الهاتف (إذا تم تغييره)
            if (phone && phone !== contactsData.contacts[contactIndex].phone) {
                const existingContact = contactsData.contacts.find(c => c.phone === phone && c.id !== contactId);
                if (existingContact) {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Phone number already exists',
                        existingContact: {
                            id: existingContact.id,
                            name: existingContact.name
                        }
                    });
                }
            }
            
            // حفظ البيانات القديمة للمقارنة
            const oldContact = { ...contactsData.contacts[contactIndex] };
            
            // تحديث البيانات
            if (name !== undefined) contactsData.contacts[contactIndex].name = name;
            if (phone !== undefined) contactsData.contacts[contactIndex].phone = phone;
            if (email !== undefined) contactsData.contacts[contactIndex].email = email;
            if (notes !== undefined) contactsData.contacts[contactIndex].notes = notes;
            if (tags !== undefined) contactsData.contacts[contactIndex].tags = tags;
            
            contactsData.contacts[contactIndex].lastModified = new Date().toISOString();
            
            // حفظ في قاعدة بيانات الشركة
            const success = await writeCompanyData(companyId, 'contacts.json', contactsData);
            
            if (success) {
                // تسجيل النشاط
                const changes = [];
                if (name && name !== oldContact.name) changes.push(`name: ${oldContact.name} → ${name}`);
                if (phone && phone !== oldContact.phone) changes.push(`phone: ${oldContact.phone} → ${phone}`);
                if (email && email !== oldContact.email) changes.push(`email: ${oldContact.email} → ${email}`);
                
                logCompanyActivity(companyId, {
                    action: 'contact_updated',
                    contactId,
                    contactName: contactsData.contacts[contactIndex].name,
                    changes,
                    updatedBy: updatedBy || 'unknown',
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✏️ [${companyId}] تم تحديث جهة اتصال: ${contactsData.contacts[contactIndex].name}`);
                
                return res.status(200).json({ 
                    success: true, 
                    contact: contactsData.contacts[contactIndex],
                    message: 'Contact updated successfully'
                });
            } else {
                throw new Error('Failed to update contact');
            }
        }

        // التعامل مع DELETE - حذف جهة اتصال
        if (req.method === 'DELETE') {
            const { companyId, contactId, deletedBy } = req.query;
            
            // التحقق من البيانات المطلوبة
            if (!companyId || !contactId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID and Contact ID are required' 
                });
            }
            
            // قراءة جهات الاتصال
            const contactsData = await readCompanyData(companyId, 'contacts.json');
            
            // البحث عن جهة الاتصال
            const contactIndex = contactsData.contacts.findIndex(c => c.id === contactId);
            
            if (contactIndex === -1) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Contact not found' 
                });
            }
            
            // حفظ بيانات جهة الاتصال المحذوفة
            const deletedContact = contactsData.contacts[contactIndex];
            
            // حذف جهة الاتصال
            contactsData.contacts.splice(contactIndex, 1);
            
            // حفظ في قاعدة بيانات الشركة
            const success = await writeCompanyData(companyId, 'contacts.json', contactsData);
            
            if (success) {
                // تسجيل النشاط
                logCompanyActivity(companyId, {
                    action: 'contact_deleted',
                    contactId,
                    contactName: deletedContact.name,
                    contactPhone: deletedContact.phone,
                    deletedBy: deletedBy || 'unknown',
                    timestamp: new Date().toISOString()
                });
                
                console.log(`🗑️ [${companyId}] تم حذف جهة اتصال: ${deletedContact.name} (${deletedContact.phone})`);
                
                return res.status(200).json({ 
                    success: true,
                    deletedContact: {
                        id: deletedContact.id,
                        name: deletedContact.name,
                        phone: deletedContact.phone
                    },
                    message: 'Contact deleted successfully'
                });
            } else {
                throw new Error('Failed to delete contact');
            }
        }

        // طريقة غير مدعومة
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });

    } catch (error) {
        console.error('❌ خطأ في contacts API:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};
