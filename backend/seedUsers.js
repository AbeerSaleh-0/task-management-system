// backend/seedUsers.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const defaultUsers = [
  {
    username: 'admin1',
    name: 'المدير العام',
    password: 'Aa@100szn',
    role: 'admin',
    phone: ''
  },
  {
    username: 'user1',
    name: 'بشرى متى بشرى إسحاق',
    password: 'Aa@101szn',
    role: 'user',
    phone: '966574490804'
  },
  {
    username: 'user2',
    name: 'سلوى احمد سعدون الجوفي',
    password: 'Aa@102szn',
    role: 'user',
    phone: '966545552214'
  },
  {
    username: 'user3',
    name: 'لمى صلاح بن سالم العماري',
    password: 'Aa@103szn',
    role: 'user',
    phone: '966563745973'
  },
  {
    username: 'user4',
    name: 'طارق محمد محمد إبراهيم',
    password: 'Aa@104szn',
    role: 'user',
    phone: '966541037651'
  },
  {
    username: 'user5',
    name: 'مرام محيا بن فايز العتيبي',
    password: 'Aa@105szn',
    role: 'user',
    phone: '966548308913'
  },
  {
    username: 'user6',
    name: 'مريم علي جمعان الزهراني',
    password: 'Aa@106szn',
    role: 'user',
    phone: '966595999850'
  },
  {
    username: 'user7',
    name: 'ياسر سيف العزي محمد',
    password: 'Aa@107szn',
    role: 'user',
    phone: '966548324892'
  },
  {
    username: 'user8',
    name: 'حازم محمد محمد أبو زامل',
    password: 'Aa@108szn',
    role: 'user',
    phone: '966547109606'
  },
  {
    username: 'user9',
    name: 'باسم حلمي محمد ناجي',
    password: 'Aa@109szn',
    role: 'user',
    phone: '966532463010'
  },
  {
    username: 'user10',
    name: 'منى عادل عارف هنيه',
    password: 'Aa@110szn',
    role: 'user',
    phone: '966577393236'
  },
  {
    username: 'user11',
    name: 'عبير محمد صالح',
    password: 'Aa@111szn',
    role: 'user',
    phone: '966502533209'
  },
  {
    username: 'user12',
    name: 'تهاني ردمان جمعان احمد عبدالله',
    password: 'Aa@112szn',
    role: 'user',
    phone: '966553552532'
  },
  {
    username: 'user13',
    name: 'اشواق احمد سعدون الجوفي',
    password: 'Aa@113szn',
    role: 'user',
    phone: '966532185555'
  },
  {
    username: 'user14',
    name: 'حنين خالد عبدالله ناجي',
    password: 'Aa@114szn',
    role: 'user',
    phone: '009700568373949'
  },
  {
    username: 'user15',
    name: 'ريما زياد محمد',
    password: 'Aa@115szn',
    role: 'user',
    phone: '966562630510'
  },
  {
    username: 'user16',
    name: 'مشاعل مساعد احمد بن طالب',
    password: 'Aa@116szn',
    role: 'user',
    phone: ''
  },
  {
    username: 'user17',
    name: 'محمد قنديل',
    password: 'Aa@117szn',
    role: 'user',
    phone: ''
  },
  {
    username: 'user18',
    name: 'احمد قنديل',
    password: 'Aa@118szn',
    role: 'user',
    phone: ''
  },
  {
    username: 'user19',
    name: 'محمد الغريبي',
    password: 'Aa@119szn',
    role: 'user',
    phone: ''
  },
  {
    username: 'user20',
    name: 'ريان سمير المصري',
    password: 'Aa@120szn',
    role: 'user',
    phone: '966563923255'
  },
  {
    username: 'user21',
    name: 'اسامه الهادي',
    password: 'Aa@121szn',
    role: 'user',
    phone: '966553598882'
  },
  {
    username: 'user22',
    name: 'احمد',
    password: 'Aa@122szn',
    role: 'user',
    phone: '966566261361'
  },
  {
    username: 'user23',
    name: 'هاني',
    password: 'Aa@123szn',
    role: 'user',
    phone: '966565669455'
  },
  {
    username: 'user24',
    name: 'ناني',
    password: 'Aa@124szn',
    role: 'user',
    phone: '201556284428'
  },
];

async function seedUsers() {
  try {
    console.log('🌱 بدء تسجيل المستخدمين...\n');

    for (const userData of defaultUsers) {
      // التحقق من وجود المستخدم
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [userData.username]
      );

      if (existing.length > 0) {
        console.log(`⚠️  المستخدم ${userData.username} موجود مسبقاً - تم التخطي`);
        continue;
      }

      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // إضافة المستخدم
      const [result] = await db.execute(
        'INSERT INTO users (username, name, phone, password, role) VALUES (?, ?, ?, ?, ?)',
        [userData.username, userData.name, userData.phone, hashedPassword, userData.role]
      );

      console.log(`✅ تم تسجيل: ${userData.username} (${userData.role}) - ID: ${result.insertId}`);
    }

    console.log('\n🎉 تم تسجيل جميع المستخدمين بنجاح!');
    console.log('\n📋 بيانات تسجيل الدخول:');
    console.log('════════════════════════════════════════');
    
    defaultUsers.forEach(user => {
      console.log(`\n👤 ${user.role.toUpperCase()}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Name: ${user.name}`);
    });
    
    console.log('\n════════════════════════════════════════');
    console.log('⚠️  احفظ هذه البيانات في مكان آمن!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ في تسجيل المستخدمين:', error.message);
    process.exit(1);
  }
}

// تشغيل السكريبت
seedUsers();