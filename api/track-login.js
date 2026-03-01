// API endpoint for tracking user login
let redis;
try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
        url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} catch (error) {
    console.log('⚠️ Upstash Redis غير متاح للـ track-login');
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
        const { userId, userName, loginTime } = req.body || {};

        if (!userId) {
            return res.status(400).json({ 
                success: false,
                error: 'User ID is required' 
            });
        }

        console.log('🔐 تسجيل دخول:', userName || userId);

        // حفظ بيانات تسجيل الدخول في Redis
        if (redis) {
            const key = `online:${userId}`;
            const ttl = 300; // 5 minutes
            
            await redis.setex(key, ttl, JSON.stringify({
                userId,
                userName,
                loginTime: loginTime || new Date().toISOString(),
                status: 'online'
            }));
            
            console.log('✅ تم حفظ حالة تسجيل الدخول في Redis');
        }

        res.status(200).json({
            success: true,
            message: 'Login tracked successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ خطأ في تتبع تسجيل الدخول:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            details: error.message 
        });
    }
};
