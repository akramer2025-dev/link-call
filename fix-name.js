const https = require('https');
const data = JSON.stringify({
    companyName: 'Jamjoum Group',
    adminName: 'Jamjoum Admin',
    country: 'السعودية',
    adminTitle: 'مدير عام',
    city: 'الرياض',
    balance: 61.00,
    totalMinutesUsed: 0,
    totalCostDeducted: 0
});
const options = {
    hostname: 'link-call-jade.vercel.app',
    path: '/api/companies/COMP-1772387540280-N0XTXR4DW',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data)
    }
};
const req = https.request(options, res => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', d => body += d);
    res.on('end', () => console.log(body));
});
req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();
