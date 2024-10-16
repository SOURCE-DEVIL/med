const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();

// الاتصال بقاعدة بيانات MongoDB السحابية
mongoose.connect('mongodb+srv://save:save1@cluster0.pwg3bgc.mongodb.net/medicineDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Cloud'))
  .catch(err => console.error('MongoDB connection error:', err));

// إنشاء نموذج (Schema) للأدوية
const medicineSchema = new mongoose.Schema({
  name: String,
  benefits: String,
  sideEffects: String,
  dosage: String
});

const Medicine = mongoose.model('Medicine', medicineSchema);

// جلسات المستخدم
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// إعدادات للـ body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // لخدمة الملفات الثابتة مثل HTML

// بيانات تسجيل الدخول للأدمن
const adminUser = {
  username: "admin",
  password: "admin123" // كلمة مرور الأدمن
};

// توجيه المستخدم العادي إلى صفحة البحث
app.get('/', (req, res) => {
  if (req.session.isAdmin) {
    res.redirect('/admin/dashboard');
  } else {
    res.sendFile(path.join(__dirname, '/public/search.html')); // صفحة البحث للمستخدم العادي
  }
});

// صفحة تسجيل الدخول للأدمن
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/login.html'));
});

// معالجة تسجيل الدخول للأدمن
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser.username && password === adminUser.password) {
    req.session.isAdmin = true;
    res.redirect('/admin/dashboard');
  } else {
    res.send('اسم المستخدم أو كلمة المرور غير صحيحة');
  }
});

// لوحة التحكم للأدمن
app.get('/admin/dashboard', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, '/public/dashboard.html'));
  } else {
    res.redirect('/admin/login');
  }
});

// معالجة إضافة علاج جديد
app.post('/admin/add-medicine', (req, res) => {
  if (req.session.isAdmin) {
    const { name, benefits, sideEffects, dosage } = req.body;
    const newMedicine = new Medicine({
      name,
      benefits,
      sideEffects,
      dosage
    });

    newMedicine.save()
      .then(() => res.redirect('/admin/dashboard'))
      .catch(err => res.status(500).send('خطأ في إضافة العلاج'));
  } else {
    res.redirect('/admin/login');
  }
});

// بحث عن علاج
app.post('/search', (req, res) => {
  const query = req.body.query;

  Medicine.findOne({ name: query }, (err, medicine) => {
    if (err || !medicine) {
      return res.status(404).send('العلاج غير موجود');
    }
    res.send(`
      <h1>${medicine.name}</h1>
      <p><strong>الفوائد:</strong> ${medicine.benefits}</p>
      <p><strong>الأعراض الجانبية:</strong> ${medicine.sideEffects}</p>
      <p><strong>الجرعة:</strong> ${medicine.dosage}</p>
    `);
  });
});

// تسجيل الخروج للأدمن
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
