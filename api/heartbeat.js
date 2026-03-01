// API endpoint for heartbeat tracking
let redis;
try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
        url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} catch (error) {
    console.log('⚠️ Upstash Redis غير متاح للـ heartbeat');
}

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { userId, userName, timestamp } = req.body || {};

        if (!userId) {
            return res.status(400).json({ 
                success: false,
                error: 'User ID is required' 
            });
        }

        console.log('💓 Heartbeat من:', userName || userId);

        // حفظ heartbeat في Redis إذا كان متاحاً
        if (redis) {
            const key = `heartbeat:${userId}`;
            const ttl = 60; // 60 seconds
            
            await redis.setex(key, ttl, JSON.stringify({
                userId,
                userName,
                timestamp: timestamp || new Date().toISOString(),
                lastSeen: new Date().toISOString()
            }));
            
            console.log('✅ تم حفظ heartbeat في Redis');
        }

        res.status(200).json({
            success: true,
            message: 'Heartbeat received',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ خطأ في معالجة heartbeat:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            details: error.message 
        });
    }
};
