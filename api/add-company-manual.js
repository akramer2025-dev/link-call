// add-company-manual.js
// إضافة شركة يدوياً إلى Firestore عند الحاجة
// POST /api/add-company-manual   body: { secretKey, company: {...} }
// GET  /api/add-company-manual?action=add-jamjoum&key=LINKCALL_ADMIN_2024   ← يضيف Jamjoum مباشرة

const ADMIN_KEY = process.env.ADMIN_SECRET || 'LINKCALL_ADMIN_2024';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { getDb } = require('../utils/firebase');
        const { doc, setDoc, getDoc } = require('firebase/firestore');
        const db = getDb();

        // ── GET: إضافة Jamjoum مباشرة ──
        if (req.method === 'GET' && req.query.action === 'add-jamjoum') {
            if (req.query.key !== ADMIN_KEY) {
                return res.status(403).json({ success: false, error: 'Invalid admin key' });
            }

            const companyId = 'COMP-JAMJOUM-GROUP';
            const existingRef = doc(db, 'companies', companyId);
            const existing = await getDoc(existingRef);

            if (existing.exists()) {
                return res.json({ success: true, message: 'Company already exists in Firestore', data: existing.data() });
            }

            const jamjoumCompany = {
                id: companyId,
                companyName: 'مجموعة جامجوم',
                username: 'Jimmmy@jamjoumgroup.com',
                password: '01210505010',
                email: 'Jimmmy@jamjoumgroup.com',
                phone: '',
                plan: 'premium',
                maxEmployees: 50,
                maxMinutes: 10000,
                status: 'active',
                active: true,
                employees: [],
                createdAt: new Date().toISOString(),
                _source: 'manual_restore'
            };

            await setDoc(doc(db, 'companies', companyId), jamjoumCompany);
            return res.json({ success: true, message: '✅ تم إضافة شركة Jamjoum بنجاح', id: companyId });
        }

        // ── POST: إضافة شركة بالكامل ──
        if (req.method === 'POST') {
            const { secretKey, company } = req.body || {};
            if (secretKey !== ADMIN_KEY) {
                return res.status(403).json({ success: false, error: 'Invalid admin key' });
            }
            if (!company || !company.id) {
                return res.status(400).json({ success: false, error: 'company.id is required' });
            }
            await setDoc(doc(db, 'companies', company.id), company);
            return res.json({ success: true, message: `✅ تم إضافة الشركة ${company.id}`, id: company.id });
        }

        return res.status(400).json({ success: false, error: 'Use GET?action=add-jamjoum&key=... or POST' });

    } catch (error) {
        console.error('add-company-manual error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
