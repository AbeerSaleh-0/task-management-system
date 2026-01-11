const bcrypt = require('bcryptjs');

const password = 'admin123'; // كلمة المرور اللي تبغاها
const hashedPassword = bcrypt.hashSync(password, 10);

console.log('Hashed Password:', hashedPassword);