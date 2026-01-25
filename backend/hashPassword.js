const bcrypt = require('bcryptjs');

const password = 'As102030'; 
const hashedPassword = bcrypt.hashSync(password, 10);

console.log('Hashed Password:', hashedPassword);