
const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');
console.log('Generated ENCRYPTION_KEY (32 bytes hex):');
console.log('------------------------------------------------');
console.log(key);
console.log('------------------------------------------------');
console.log(`ENCRYPTION_KEY=${key}`);
