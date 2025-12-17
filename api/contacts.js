const fs = require('fs');
const path = require('path');

// استيراد Vercel KV للتخزين السحابي المركزي
let kv;
try {
    kv = require('@vercel/kv').kv;
    console.log('✅ Vercel KV متاح - سيتم استخدام التخزين المركزي');
} catch (error) {
    console.log('⚠️ Vercel KV غير متاح - سيتم استخدام التخزين المحلي');
}

// دالة لحفظ نسخة احتياطية في KV
async function createBackupInKV(data) {
    if (!kv) return;
    
    try {
        const timestamp = new Date().toISOString();
        const backupKey = `contacts-backup-${timestamp}`;
        
        // حفظ النسخة الاحتياطية
        await kv.set(backupKey, data);
        
        // إضافة المفتاح لقائمة النسخ الاحتياطية
        const backupsList = await kv.get('contacts-backups-list') || [];
        backupsList.push({ key: backupKey, timestamp });
        
        // الاحتفاظ بآخر 50 نسخة فقط
        if (backupsList.length > 50) {
            const oldBackups = backupsList.splice(0, backupsList.length - 50);
            for (const backup of oldBackups) {
                await kv.del(backup.key);
            }
        }
        
        await kv.set('contacts-backups-list', backupsList);
        console.log('💾 تم حفظ نسخة احتياطية في KV:', backupKey);
    } catch (error) {
        console.error('⚠️ فشل حفظ النسخة الاحتياطية في KV:', error);
    }
}

// دالة للحصول على البيانات من KV أو الملف المحلي
async function getContactsData() {
    // إذا كان KV متاح (على Vercel)، استخدمه
    if (kv) {
        try {
            const data = await kv.get('contacts-data');
            if (data) {
                console.log('📥 تم جلب البيانات من KV المركزي');
                return data;
            }
        } catch (error) {
            console.error('⚠️ خطأ في قراءة KV:', error);
        }
    }
    
    // إذا لم يكن KV متاح، استخدم الملف المحلي
    const contactsPath = path.join(process.cwd(), 'contacts.json');
    if (fs.existsSync(contactsPath)) {
        try {
            const data = fs.readFileSync(contactsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('⚠️ خطأ في قراءة الملف المحلي:', error);
        }
    }
    
    return { contacts: [] };
}

// دالة لحفظ البيانات في KV والملف المحلي
async function saveContactsData(data) {
    // حفظ في KV إذا كان متاحاً (التخزين الرئيسي)
    if (kv) {
        try {
            await kv.set('contacts-data', data);
            await createBackupInKV(data);
            console.log('💾 تم حفظ البيانات في KV المركزي');
        } catch (error) {
            console.error('⚠️ خطأ في حفظ KV:', error);
        }
    }
    
    // حفظ نسخة في الملف المحلي (نسخة احتياطية)
    try {
        const contactsPath = path.join(process.cwd(), 'contacts.json');
        fs.writeFileSync(contactsPath, JSON.stringify(data, null, 2));
        console.log('💾 تم حفظ نسخة محلية');
    } catch (error) {
        console.error('⚠️ خطأ في حفظ الملف المحلي:', error);
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // جلب البيانات من المصدر المركزي
        let contactsData = await getContactsData();

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
                createdAt: new Date().toISOString(),
                addedBy: req.body.addedBy || 'unknown',
                device: req.body.device || 'unknown'
            };

            contactsData.contacts.push(newContact);
            
            // حفظ في المصدر المركزي
            await saveContactsData(contactsData);
            
            console.log('✅ تم إضافة جهة اتصال:', name, '| الجهاز:', newContact.device);
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
            
            // حفظ في المصدر المركزي
            await saveContactsData(contactsData);
            
            console.log('🗑️ تم حذف جهة اتصال:', deletedContact.name);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('❌ خطأ في contacts API:', error);
        return res.status(500).json({ error: error.message });
    }
};
