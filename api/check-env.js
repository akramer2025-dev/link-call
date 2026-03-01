// debug only - check what env vars are available
module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const redisUrl = process.env.REDIS_URL || '';
    // show structure without exposing full token
    let urlInfo = {};
    if (redisUrl) {
        try {
            const match = redisUrl.match(/^(redis[s]?):\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
            if (match) {
                urlInfo = {
                    protocol: match[1],
                    user: match[2],
                    tokenLen: match[3].length,
                    tokenPreview: match[3].substring(0, 8) + '...',
                    host: match[4],
                    port: match[5]
                };
            } else {
                urlInfo = { raw: redisUrl.substring(0, 40), couldNotParse: true };
            }
        } catch(e) { urlInfo = { error: e.message }; }
    }
    const keys = Object.keys(process.env)
        .filter(k => k.includes('KV') || k.includes('REDIS') || k.includes('UPSTASH'))
        .map(k => ({ key: k, hasValue: !!process.env[k] }));
    res.json({ keys, redisUrlInfo: urlInfo });
};
