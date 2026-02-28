// Vercel Serverless Function - Root Handler
// This file handles the root path and redirects to appropriate pages

module.exports = (req, res) => {
    // Set security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Handle different methods
    if (req.method === 'GET') {
        // Redirect root to login page
        res.writeHead(302, { Location: '/login.html' });
        res.end();
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
