const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const contactsPath = path.join(process.cwd(), 'contacts.json');
    
    try {
        // قراءة جهات الاتصال
        let contactsData = { contacts: [] };
        if (fs.existsSync(contactsPath)) {
            const data = fs.readFileSync(contactsPath, 'utf8');
            contactsData = JSON.parse(data);
        }

        if (req.method === 'GET') {
            // جلب جميع جهات الاتصال
            console.log('📋 جلب جهات الاتصال:', contactsData.contacts.length);
            return res.status(200).json(contactsData);
        }

        if (req.method === 'POST') {
            // إضافة جهة اتصال جديدة
            const { name, phone } = req.body;
            
            if (!name || !phone) {
                return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
            }

            const newContact = {
                id: Date.now(),
                name,
                phone,
                createdAt: new Date().toISOString()
            };

            contactsData.contacts.push(newContact);
            fs.writeFileSync(contactsPath, JSON.stringify(contactsData, null, 2));
            
            console.log('✅ تم إضافة جهة اتصال:', name);
            return res.status(200).json({ success: true, contact: newContact });
        }

        if (req.method === 'DELETE') {
            // حذف جهة اتصال
            const contactId = parseInt(req.query.id);
            
            if (!contactId) {
                return res.status(400).json({ error: 'معرف جهة الاتصال مطلوب' });
            }

            const index = contactsData.contacts.findIndex(c => c.id === contactId);
            
            if (index === -1) {
                return res.status(404).json({ error: 'جهة الاتصال غير موجودة' });
            }

            const deletedContact = contactsData.contacts.splice(index, 1)[0];
            fs.writeFileSync(contactsPath, JSON.stringify(contactsData, null, 2));
            
            console.log('🗑️ تم حذف جهة اتصال:', deletedContact.name);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('❌ خطأ في contacts API:', error);
        return res.status(500).json({ error: error.message });
    }
};
