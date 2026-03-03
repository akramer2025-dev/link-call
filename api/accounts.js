// ========== API: الحسابات - سندات الصرف والقبض والرواتب ==========
const { getDb } = require('../utils/firebase');

// ───────── Firestore helpers ─────────
async function getAccountsData(companyId) {
    try {
        const { doc, getDoc } = require('firebase/firestore');
        const db = getDb();
        const snap = await getDoc(doc(db, 'accounts', companyId));
        if (snap.exists()) return snap.data();
        return { vouchers: [], salaries: [], salarySettings: {} };
    } catch (e) {
        console.error('[accounts] Firestore read error:', e.message);
        return { vouchers: [], salaries: [], salarySettings: {} };
    }
}

async function saveAccountsData(companyId, data) {
    try {
        const { doc, setDoc } = require('firebase/firestore');
        const db = getDb();
        await setDoc(doc(db, 'accounts', companyId), data);
        return true;
    } catch (e) {
        console.error('[accounts] Firestore write error:', e.message);
        return false;
    }
}

// ───────── ID generators ─────────
function nextVoucherId(vouchers, type) {
    const prefix = type === 'receipt' ? 'QBD' : 'SRF';
    const nums = vouchers
        .filter(v => v.id && v.id.startsWith(prefix))
        .map(v => parseInt(v.id.replace(prefix + '-', '')) || 0);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `${prefix}-${String(next).padStart(4, '0')}`;
}

function nextSalaryId(salaries) {
    const nums = salaries
        .filter(s => s.id && s.id.startsWith('SAL-'))
        .map(s => parseInt(s.id.replace('SAL-', '')) || 0);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `SAL-${String(next).padStart(4, '0')}`;
}

// ───────── Main handler ─────────
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { companyId, type, id } = req.query;

    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
        if (!companyId) return res.status(400).json({ success: false, message: 'companyId مطلوب' });
        const data = await getAccountsData(companyId);

        // إحصائيات سريعة
        const vouchers  = data.vouchers  || [];
        const salaries  = data.salaries  || [];
        const payments  = vouchers.filter(v => v.type === 'payment');
        const receipts  = vouchers.filter(v => v.type === 'receipt');
        const totalOut  = payments.reduce((s, v) => s + (v.amount || 0), 0);
        const totalIn   = receipts.reduce((s, v) => s + (v.amount || 0), 0);
        const totalSal  = salaries.reduce((s, v) => s + (v.baseSalary || 0), 0);

        if (type === 'vouchers') return res.json({ success: true, vouchers, stats: { totalOut, totalIn, balance: totalIn - totalOut } });
        if (type === 'salaries') return res.json({ success: true, salaries, salarySettings: data.salarySettings || {}, stats: { totalSalaries: totalSal } });
        if (type === 'stats')    return res.json({ success: true, stats: { totalOut, totalIn, balance: totalIn - totalOut, totalSalaries: totalSal, vouchersCount: vouchers.length, salariesCount: salaries.length } });

        return res.json({
            success: true,
            vouchers,
            salaries,
            salarySettings: data.salarySettings || {},
            stats: { totalOut, totalIn, balance: totalIn - totalOut, totalSalaries: totalSal }
        });
    }

    // ── POST (إنشاء) ─────────────────────────────────────────────────────────
    if (req.method === 'POST') {
        const body = req.body || {};
        const cId  = body.companyId || companyId;
        if (!cId) return res.status(400).json({ success: false, message: 'companyId مطلوب' });

        const data = await getAccountsData(cId);
        data.vouchers  = data.vouchers  || [];
        data.salaries  = data.salaries  || [];
        data.salarySettings = data.salarySettings || {};
        const now = new Date().toISOString();

        // ── سند صرف أو قبض
        if (body.action === 'add-voucher') {
            const { voucherType, amount, recipient, recipientType, employeeId, description, category, date, notes, createdBy } = body;
            if (!voucherType || !amount || !recipient) return res.status(400).json({ success: false, message: 'noverType/amount/recipient مطلوبة' });
            const voucher = {
                id:            nextVoucherId(data.vouchers, voucherType),
                type:          voucherType,        // payment | receipt
                amount:        parseFloat(amount),
                currency:      body.currency || 'EGP',
                recipient,
                recipientType: recipientType || 'other',
                employeeId:    employeeId || null,
                description:   description || '',
                category:      category    || 'other',
                date:          date        || now.split('T')[0],
                notes:         notes       || '',
                createdBy:     createdBy   || 'admin',
                createdAt:     now,
                status:        'confirmed',
                companyId:     cId
            };
            data.vouchers.push(voucher);
            await saveAccountsData(cId, data);
            return res.json({ success: true, voucher, message: 'تم إنشاء السند بنجاح' });
        }

        // ── صرف راتب
        if (body.action === 'pay-salary') {
            const { employeeId, employeeName, baseSalary, month, notes, createdBy, bonuses, deductions } = body;
            if (!employeeId || !baseSalary || !month) return res.status(400).json({ success: false, message: 'employeeId/baseSalary/month مطلوبة' });
            // إنشاء سند صرف مرافق
            const voucherBonus    = parseFloat(bonuses   || 0);
            const voucherDeduct   = parseFloat(deductions || 0);
            const netPay = parseFloat(baseSalary) + voucherBonus - voucherDeduct;
            const voucher = {
                id:            nextVoucherId(data.vouchers, 'payment'),
                type:          'payment',
                amount:        netPay,
                currency:      body.currency || 'EGP',
                recipient:     employeeName,
                recipientType: 'employee',
                employeeId,
                description:   `راتب شهر ${month}`,
                category:      'salary',
                date:          now.split('T')[0],
                notes:         notes || '',
                createdBy:     createdBy || 'admin',
                createdAt:     now,
                status:        'confirmed',
                companyId:     cId
            };
            const salaryRecord = {
                id:           nextSalaryId(data.salaries),
                employeeId,
                employeeName: employeeName || '',
                baseSalary:   parseFloat(baseSalary),
                bonuses:      voucherBonus,
                deductions:   voucherDeduct,
                netPay,
                currency:     body.currency || 'EGP',
                month,
                status:       'paid',
                paidDate:     now.split('T')[0],
                voucherId:    voucher.id,
                notes:        notes || '',
                createdAt:    now,
                companyId:    cId
            };
            data.vouchers.push(voucher);
            data.salaries.push(salaryRecord);
            await saveAccountsData(cId, data);
            return res.json({ success: true, salary: salaryRecord, voucher, message: 'تم صرف الراتب بنجاح' });
        }

        // ── حفظ إعدادات الراتب لموظف
        if (body.action === 'save-salary-setting') {
            const { employeeId, baseSalary, currency } = body;
            if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId مطلوب' });
            data.salarySettings[String(employeeId)] = { baseSalary: parseFloat(baseSalary || 0), currency: currency || 'EGP', updatedAt: now };
            await saveAccountsData(cId, data);
            return res.json({ success: true, message: 'تم حفظ الإعداد' });
        }

        return res.status(400).json({ success: false, message: 'action غير معروف' });
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
        const cId = companyId;
        if (!cId || !id) return res.status(400).json({ success: false, message: 'companyId و id مطلوبان' });
        const data = await getAccountsData(cId);
        if (type === 'salary') {
            data.salaries = (data.salaries || []).filter(s => s.id !== id);
        } else {
            data.vouchers = (data.vouchers || []).filter(v => v.id !== id);
        }
        await saveAccountsData(cId, data);
        return res.json({ success: true, message: 'تم الحذف' });
    }

    return res.status(405).json({ success: false, message: 'Method غير مدعوم' });
};
