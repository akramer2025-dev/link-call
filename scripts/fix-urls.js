const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');

// Read file with UTF-8
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences
content = content.replace(/const baseUrl = window\.location\.origin;/g, 'const baseUrl = API_BASE_URL;');

// Write back with UTF-8
fs.writeFileSync(filePath, content, { encoding: 'utf8' });

console.log('✅ Fixed all API URLs successfully!');
