// migrate-to-firestore.js
// ينقل بيانات الشركات من Redis إلى Firestore مرة واحدة
// استدعاء: GET /api/migrate-to-firestore

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // ── 1. قراءة البيانات من Redis ──────────────────────────────────
        let redisData = null;
        try {
            const { Redis } = require('@upstash/redis');
            const redisUrl   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
            const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
            if (!redisUrl || !redisToken) throw new Error('Redis env vars missing');
            const redis = new Redis({ url: redisUrl, token: redisToken });
            redisData = await redis.get('companies_data');
            console.log('✅ Redis data fetched:', JSON.stringify(redisData)?.substring(0, 100));
        } catch (redisErr) {
            return res.status(500).json({
                success: false,
                step: 'redis_read',
                error: redisErr.message,
                hint: 'تأكد من وجود KV_REST_API_URL و KV_REST_API_TOKEN في Vercel env vars'
            });
        }

        // التحقق من وجود بيانات
        const parsed = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;
        if (!parsed || !parsed.companies || parsed.companies.length === 0) {
            return res.status(404).json({
                success: false,
                step: 'redis_read',
                error: 'Redis فارغ أو لا يحتوي على بيانات شركات',
                rawData: redisData
            });
        }

        const companies = parsed.companies;
        console.log(`📦 وجدنا ${companies.length} شركة في Redis`);

        // ── 2. كتابة كل شركة في Firestore ──────────────────────────────
        const { getDb } = require('../utils/firebase');
        const { doc, setDoc } = require('firebase/firestore');
        const db = getDb();

        const results = [];
        for (const company of companies) {
            try {
                await setDoc(doc(db, 'companies', company.id), company);
                results.push({ id: company.id, name: company.companyName, status: '✅ تم النقل' });
                console.log(`✅ نقل شركة: ${company.companyName} (${company.id})`);
            } catch (writeErr) {
                results.push({ id: company.id, name: company.companyName, status: `❌ فشل: ${writeErr.message}` });
            }
        }

        const success = results.filter(r => r.status.startsWith('✅')).length;
        const failed  = results.filter(r => r.status.startsWith('❌')).length;

        return res.status(200).json({
            success: true,
            message: `تم نقل ${success} شركة من Redis إلى Firestore بنجاح`,
            total: companies.length,
            migrated: success,
            failed,
            results
        });

    } catch (error) {
        console.error('❌ Migration error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
