// migrate-to-firestore.js
// ينقل بيانات الشركات من Redis إلى Firestore مرة واحدة
// استدعاء: GET /api/migrate-to-firestore

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // ── 1. قراءة البيانات من Redis ──────────────────────────────────
        // REDIS_URL format: redis://default:TOKEN@HOST:PORT
        const redisUrl = process.env.REDIS_URL
                      || process.env.KV_REST_API_URL
                      || process.env.UPSTASH_REDIS_REST_URL;

        if (!redisUrl) {
            return res.status(500).json({
                success: false,
                step: 'redis_read',
                error: 'No Redis URL found',
                availableEnv: Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS') || k.includes('UPSTASH'))
            });
        }

        // استخدام ioredis مع الـ standard Redis URL
        const Redis = require('ioredis');
        const redis = new Redis(redisUrl, { tls: redisUrl.startsWith('rediss://') ? {} : undefined, connectTimeout: 15000, lazyConnect: true });
        await redis.connect();
        const rawData = await redis.get('companies_data');
        redis.disconnect();
        const redisData = rawData;

        if (!redisData) {
            return res.status(404).json({
                success: false,
                step: 'redis_read',
                error: 'companies_data key not found or empty in Redis',
                rawResult: redisData
            });
        }

        // Upstash REST يرجع string مرتين أحيانًا
        const parsed = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;

        if (!parsed || !parsed.companies || parsed.companies.length === 0) {
            return res.status(404).json({
                success: false,
                step: 'parse',
                error: 'No companies array in parsed data',
                rawParsed: JSON.stringify(parsed).substring(0, 200)
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
                const compId = company.id || ('COMP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)).toUpperCase();
                await setDoc(doc(db, 'companies', compId), { ...company, id: compId });
                results.push({ id: compId, name: company.companyName, username: company.username, status: '✅ تم النقل' });
            } catch (writeErr) {
                results.push({ id: company.id, name: company.companyName, status: `❌ فشل: ${writeErr.message}` });
            }
        }

        const success = results.filter(r => r.status.startsWith('✅')).length;
        const failed  = results.filter(r => r.status.startsWith('❌')).length;

        return res.status(200).json({
            success: true,
            message: `تم نقل ${success} شركة من Redis إلى Firestore`,
            total: companies.length,
            migrated: success,
            failed,
            results
        });

    } catch (error) {
        console.error('❌ Migration error:', error);
        return res.status(500).json({ success: false, error: error.message, stack: error.stack?.substring(0, 300) });
    }
};
