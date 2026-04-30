// ============================================
// Passenger (cPanel) support
// ============================================
if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'Kj8m2xPq9vNzR4wL7sFh3bYt6cUa0dEi';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4200;

// ============================================
// Middleware
// ============================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// ============================================
// JWT Helper (simple, no external dependency)
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'Kj8m2xPq9vNzR4wL7sFh3bYt6cUa0dEi';
const JWT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + JWT_EXPIRY })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

// ============================================
// Admin credentials (hashed, stored in file)
// ============================================
const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === test;
}

function getAdminCredentials() {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
    }
  } catch {}
  const defaultAdmin = {
    username: 'rladmin',
    password: hashPassword('admin1')
  };
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(defaultAdmin, null, 2), 'utf8');
  console.log('⚠️  Default admin created (rladmin/admin1). Change password immediately!');
  return defaultAdmin;
}

// ============================================
// Auth middleware
// ============================================
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
  req.admin = payload;
  next();
}

// ============================================
// Rate limiter (in-memory, simple)
// ============================================
const rateLimitMap = new Map();

function rateLimit(windowMs, maxRequests, keyFn) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.ip;
    const now = Date.now();
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, []);
    }
    const timestamps = rateLimitMap.get(key).filter(t => t > now - windowMs);
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже.' });
    }
    timestamps.push(now);
    rateLimitMap.set(key, timestamps);
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap) {
    const filtered = timestamps.filter(t => t > now - 600000);
    if (filtered.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, filtered);
  }
}, 600000);

// ============================================
// Input sanitization
// ============================================
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

// ============================================
// Data
// ============================================
const services = require('./data/services');
const plans = require('./data/plans');
const companyInfo = require('./data/company');

// ============================================
// Public API Routes
// ============================================

app.get('/api/company', (req, res) => {
  res.json(companyInfo);
});

app.get('/api/services', (req, res) => {
  res.json(services);
});

// ============================================
// Auth Routes
// ============================================

app.post('/api/auth/login', rateLimit(15 * 60 * 1000, 5), (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }
  const admin = getAdminCredentials();
  if (username !== admin.username || !verifyPassword(password, admin.password)) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }
  const token = createToken({ username: admin.username, role: 'admin' });
  res.json({ success: true, token });
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ valid: true, username: req.admin.username });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
  }
  const admin = getAdminCredentials();
  if (!verifyPassword(currentPassword, admin.password)) {
    return res.status(401).json({ error: 'Неверный текущий пароль' });
  }
  admin.password = hashPassword(newPassword);
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2), 'utf8');
  res.json({ success: true });
});

// ============================================
// Dynamic service tabs
// ============================================
const TABS_FILE = path.join(__dirname, 'data', 'service-tabs.json');

const defaultTabs = {
  personal: [{ id: 'internet', icon: 'wifi' }],
  business: [
    { id: 'internet', icon: 'wifi' },
    { id: 'hosting', icon: 'harddrive' },
    { id: 'vps', icon: 'server' },
    { id: 'security', icon: 'shield' }
  ]
};

function loadTabs() {
  try {
    if (fs.existsSync(TABS_FILE)) {
      return JSON.parse(fs.readFileSync(TABS_FILE, 'utf8'));
    }
  } catch {}
  return defaultTabs;
}

function saveTabs(data) {
  fs.writeFileSync(TABS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/service-tabs/:type', (req, res) => {
  const tabs = loadTabs();
  res.json(tabs[req.params.type] || []);
});

app.post('/api/service-tabs/:type', requireAuth, (req, res) => {
  const tabs = loadTabs();
  tabs[req.params.type] = req.body.tabs;
  saveTabs(tabs);
  res.json({ success: true });
});

// ============================================
// Plans (public: read, protected: write)
// ============================================
const PLANS_JSON = path.join(__dirname, 'data', 'plans.json');

function loadPlans() {
  try {
    if (fs.existsSync(PLANS_JSON)) {
      return JSON.parse(fs.readFileSync(PLANS_JSON, 'utf8'));
    }
    return plans;
  } catch { return plans; }
}

function savePlans(data) {
  fs.writeFileSync(PLANS_JSON, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/plans', (req, res) => {
  const { category, type } = req.query;
  let result = loadPlans();
  if (type) result = result.filter(p => p.type === type);
  if (category) result = result.filter(p => p.category === category);
  res.json(result);
});

app.put('/api/plans/:id', requireAuth, (req, res) => {
  const allPlans = loadPlans();
  const idx = allPlans.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plan not found' });
  allPlans[idx] = { ...allPlans[idx], ...req.body };
  savePlans(allPlans);
  res.json(allPlans[idx]);
});

app.delete('/api/plans/:id', requireAuth, (req, res) => {
  let allPlans = loadPlans();
  allPlans = allPlans.filter(p => p.id !== req.params.id);
  savePlans(allPlans);
  res.json({ success: true });
});

app.post('/api/plans/new', requireAuth, (req, res) => {
  const allPlans = loadPlans();
  const newPlan = { id: 'plan-' + Date.now(), ...req.body };
  allPlans.push(newPlan);
  savePlans(allPlans);
  res.json(newPlan);
});

// ============================================
// Contact form — rate limited + sanitized
// ============================================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.rapidlink.md',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false }
});

app.post('/api/contact', rateLimit(15 * 60 * 1000, 3), async (req, res) => {
  const name = sanitize(req.body.name);
  const email = sanitize(req.body.email);
  const phone = sanitize(req.body.phone || '');
  const message = sanitize(req.body.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }

  if (name.length > 100 || email.length > 200 || phone.length > 30 || message.length > 5000) {
    return res.status(400).json({ error: 'Превышена допустимая длина полей' });
  }

  console.log('📩 Новая заявка:', { name, email, phone });

  try {
    await transporter.sendMail({
      from: '"RapidLink Сайт" <control@rapidlink.md>',
      to: 'support@rapidlink.md',
      subject: `Новая заявка с сайта от ${name}`,
      text: [
        `Имя: ${name}`,
        `Email: ${email}`,
        phone ? `Телефон: ${phone}` : '',
        ``,
        `Сообщение:`,
        message,
        ``,
        `---`,
        `IP: ${req.ip}`,
        `Отправлено с сайта RapidLink: ${new Date().toLocaleString('ru-RU')}`
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#FF0000;border-bottom:2px solid #FF0000;padding-bottom:10px">
            Новая заявка с сайта RapidLink
          </h2>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr>
              <td style="padding:8px;font-weight:bold;color:#555;width:100px">Имя:</td>
              <td style="padding:8px">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px;font-weight:bold;color:#555">Email:</td>
              <td style="padding:8px">${email}</td>
            </tr>
            ${phone ? `<tr>
              <td style="padding:8px;font-weight:bold;color:#555">Телефон:</td>
              <td style="padding:8px">${phone}</td>
            </tr>` : ''}
          </table>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0">
            <strong>Сообщение:</strong>
            <p style="margin:8px 0 0;white-space:pre-wrap">${message}</p>
          </div>
          <p style="color:#999;font-size:12px;margin-top:20px">
            IP: ${req.ip} | Отправлено: ${new Date().toLocaleString('ru-RU')}
          </p>
        </div>
      `
    });

    console.log('✅ Email отправлен');
    res.json({ success: true, message: 'Спасибо! Мы свяжемся с вами в ближайшее время.' });
  } catch (err) {
    console.error('❌ Ошибка отправки email:', err.message);
    res.status(500).json({ error: 'Не удалось отправить заявку. Попробуйте позже.' });
  }
});

// ============================================
// Image upload (protected)
// ============================================
const multer = require('multer');
const IMAGES_DIR = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../client/build/images')
  : path.join(__dirname, '../client/public/images');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: IMAGES_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = req.body.name || ('img-' + Date.now());
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, safeName + ext);
  }
});
const uploadImage = multer({ storage: imageStorage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/upload', requireAuth, uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/images/' + req.file.filename });
});

app.use('/images', express.static(IMAGES_DIR));

// ============================================
// Translations (public: read, protected: write)
// ============================================
const TRANSLATIONS_DIR = path.join(__dirname, 'data');

app.get('/api/translations/:lang', (req, res) => {
  const file = path.join(TRANSLATIONS_DIR, `translations-${req.params.lang}.json`);
  try {
    if (fs.existsSync(file)) {
      res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
    } else {
      res.json({});
    }
  } catch { res.json({}); }
});

app.post('/api/translations', requireAuth, (req, res) => {
  try {
    const { lang, key, value } = req.body;
    const safeLang = lang.replace(/[^a-zA-Z0-9_-]/g, '');
    const file = path.join(TRANSLATIONS_DIR, `translations-${safeLang}.json`);
    let data = {};
    if (fs.existsSync(file)) {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    data[key] = value;
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

// ============================================
// Documents
// ============================================
const DOCS_DIR = path.join(__dirname, 'documents');

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

app.use('/api/documents/files', express.static(DOCS_DIR));

app.get('/api/documents', (req, res) => {
  try {
    const categories = fs.readdirSync(DOCS_DIR).filter(f =>
      fs.statSync(path.join(DOCS_DIR, f)).isDirectory()
    );
    res.json(categories);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/documents/:category', (req, res) => {
  const catDir = path.join(DOCS_DIR, req.params.category);
  try {
    if (!fs.existsSync(catDir)) return res.json({ files: [], sections: [] });
    const entries = fs.readdirSync(catDir);
    const topFiles = entries
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .map(f => {
        const stats = fs.statSync(path.join(catDir, f));
        return {
          name: f,
          title: f.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '),
          size: stats.size,
          date: stats.mtime,
          url: `/api/documents/files/${req.params.category}/${encodeURIComponent(f)}`
        };
      });
    const sections = entries
      .filter(f => fs.statSync(path.join(catDir, f)).isDirectory())
      .map(subdir => {
        const subPath = path.join(catDir, subdir);
        const subFiles = fs.readdirSync(subPath)
          .filter(f => f.toLowerCase().endsWith('.pdf'))
          .map(f => {
            const stats = fs.statSync(path.join(subPath, f));
            return {
              name: f,
              title: f.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '),
              size: stats.size,
              date: stats.mtime,
              url: `/api/documents/files/${req.params.category}/${subdir}/${encodeURIComponent(f)}`
            };
          });
        return { id: subdir, title: subdir.replace(/[-_]/g, ' '), files: subFiles };
      })
      .filter(s => s.files.length > 0);
    res.json({ files: topFiles, sections });
  } catch (err) {
    res.json({ files: [], sections: [] });
  }
});

// Documents upload (protected)
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const safeCategory = req.params.category.replace(/[^a-zA-Z0-9_-]/g, '');
    const dir = path.join(DOCS_DIR, safeCategory);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

app.post('/api/documents/:category/upload', requireAuth, uploadPdf.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Нет файлов' });
  }
  console.log(`📄 Загружено ${req.files.length} PDF в категорию "${req.params.category}"`);
  res.json({ success: true, uploaded: req.files.length });
});

app.delete('/api/documents/:category/:filename', requireAuth, (req, res) => {
  const safeCategory = req.params.category.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFilename = path.basename(req.params.filename); // защита от path traversal
  const filePath = path.join(DOCS_DIR, safeCategory, safeFilename);
  if (!filePath.startsWith(DOCS_DIR)) {
    return res.status(400).json({ error: 'Недопустимый путь' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Файл не найден' });
  }
  fs.unlinkSync(filePath);
  console.log(`🗑️  Удалён документ: ${safeCategory}/${safeFilename}`);
  res.json({ success: true });
});

// ============================================
// Content
// ============================================
const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

app.get('/api/content', (req, res) => {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      res.json(JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8')));
    } else {
      res.json({ ro: {}, ru: {} });
    }
  } catch { res.json({ ro: {}, ru: {} }); }
});

app.post('/api/content', requireAuth, (req, res) => {
  try {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

// ============================================
// Cleanup unused images
// ============================================
app.post('/api/cleanup-images', requireAuth, (req, res) => {
  try {
    const allFiles = fs.readdirSync(IMAGES_DIR).filter(f =>
      /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f)
    );
    const referenced = new Set();
    referenced.add('logo.png');

    const transFiles = fs.readdirSync(TRANSLATIONS_DIR).filter(f => f.startsWith('translations-') && f.endsWith('.json'));
    transFiles.forEach(tf => {
      try {
        const raw = fs.readFileSync(path.join(TRANSLATIONS_DIR, tf), 'utf8');
        const allMatches = raw.match(/images\/[^"'\s\\,\]]+\.[a-z]{3,4}/gi) || [];
        allMatches.forEach(m => {
          const filename = m.replace(/^images\//, '');
          if (filename) referenced.add(filename);
        });
      } catch {}
    });

    try {
      const plansData = JSON.stringify(loadPlans());
      const matches = plansData.match(/images\/[^"'\s\\,\]]+\.[a-z]{3,4}/gi) || [];
      matches.forEach(m => {
        const filename = m.replace(/^images\//, '');
        if (filename) referenced.add(filename);
      });
    } catch {}

    try {
      if (fs.existsSync(CONTENT_FILE)) {
        const content = fs.readFileSync(CONTENT_FILE, 'utf8');
        const matches = content.match(/images\/[^"'\s\\,\]]+\.[a-z]{3,4}/gi) || [];
        matches.forEach(m => {
          const filename = m.replace(/^images\//, '');
          if (filename) referenced.add(filename);
        });
      }
    } catch {}

    try {
      if (fs.existsSync(TABS_FILE)) {
        const content = fs.readFileSync(TABS_FILE, 'utf8');
        const matches = content.match(/images\/[^"'\s\\,\]]+\.[a-z]{3,4}/gi) || [];
        matches.forEach(m => {
          const filename = m.replace(/^images\//, '');
          if (filename) referenced.add(filename);
        });
      }
    } catch {}

    let deleted = 0;
    let freedBytes = 0;
    allFiles.forEach(f => {
      if (!referenced.has(f)) {
        try {
          const stats = fs.statSync(path.join(IMAGES_DIR, f));
          freedBytes += stats.size;
          fs.unlinkSync(path.join(IMAGES_DIR, f));
          deleted++;
        } catch {}
      }
    });

    const freedMB = (freedBytes / (1024 * 1024)).toFixed(2);
    console.log(`🧹 Cleanup: deleted ${deleted} files, freed ${freedMB} MB`);
    console.log(`🧹 Referenced files: ${[...referenced].join(', ')}`);
    res.json({ success: true, deleted, freedMB });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Production static
// ============================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// ============================================
// Start
// ============================================
if (typeof(PhusionPassenger) !== 'undefined') {
  app.listen('passenger', () => {
    console.log('RapidLink Server started via Passenger');
  });
} else {
  app.listen(PORT, () => {
    console.log(`
  ⚡ RapidLink Server запущен
  📡 Порт: ${PORT}
  🌍 API: http://localhost:${PORT}/api
    `);
  });
}