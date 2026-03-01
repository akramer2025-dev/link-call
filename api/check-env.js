// debug only - check what env vars are available
module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const keys = Object.keys(process.env)
        .filter(k => k.includes('KV') || k.includes('REDIS') || k.includes('UPSTASH') || k.includes('DATABASE') || k.includes('STORAGE'))
        .map(k => ({ key: k, hasValue: !!process.env[k], preview: process.env[k]?.substring(0, 15) + '...' }));
    res.json({ keys });
};
