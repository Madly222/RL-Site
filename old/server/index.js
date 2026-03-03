const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;

// ============================================
// Middleware
// ============================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// ============================================
// Data (в будущем заменить на БД)
// ============================================
const services = require('./data/services');
const plans = require('./data/plans');
const companyInfo = require('./data/company');

// ============================================
// API Routes
// ============================================

// Информация о компании
app.get('/api/company', (req, res) => {
  res.json(companyInfo);
});

// Все услуги
app.get('/api/services', (req, res) => {
  res.json(services);
});

// Тарифные планы (фильтр по категории)
app.get('/api/plans', (req, res) => {
  const { category, type } = req.query;
  let result = plans;
  if (type) {
    result = result.filter(p => p.type === type);
  }
  if (category) {
    result = result.filter(p => p.category === category);
  }
  res.json(result);
});

// Отправка формы обратной связи → email
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.rapidlink.md',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }

  console.log('📩 Новая заявка:', { name, email, phone, message });

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
        `Отправлено с сайта RapidLink: ${new Date().toLocaleString('ru-RU')}`
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#FF0000;border-bottom:2px solid #FF0000;padding-bottom:10px">
            ⚡ Новая заявка с сайта RapidLink
          </h2>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr>
              <td style="padding:8px;font-weight:bold;color:#555;width:100px">Имя:</td>
              <td style="padding:8px">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px;font-weight:bold;color:#555">Email:</td>
              <td style="padding:8px"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${phone ? `<tr>
              <td style="padding:8px;font-weight:bold;color:#555">Телефон:</td>
              <td style="padding:8px"><a href="tel:${phone}">${phone}</a></td>
            </tr>` : ''}
          </table>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0">
            <strong>Сообщение:</strong>
            <p style="margin:8px 0 0;white-space:pre-wrap">${message}</p>
          </div>
          <p style="color:#999;font-size:12px;margin-top:20px">
            Отправлено: ${new Date().toLocaleString('ru-RU')}
          </p>
        </div>
      `
    });

    console.log('✅ Email отправлен на support@rapidlink.md');
    res.json({ success: true, message: 'Спасибо! Мы свяжемся с вами в ближайшее время.' });

  } catch (err) {
    console.error('❌ Ошибка отправки email:', err.message);
    res.status(500).json({ error: 'Не удалось отправить заявку. Попробуйте позже.' });
  }
});

// ============================================
// Documents — PDF files
// ============================================
const fs = require('fs');

const DOCS_DIR = path.join(__dirname, 'documents');

// Serve PDF files statically
app.use('/api/documents/files', express.static(DOCS_DIR));

// List document categories
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

// List PDFs in a category (with subcategory support)
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
        return {
          id: subdir,
          title: subdir.replace(/[-_]/g, ' '),
          files: subFiles
        };
      })
      .filter(s => s.files.length > 0);

    res.json({ files: topFiles, sections });
  } catch (err) {
    res.json({ files: [], sections: [] });
  }
});

// ============================================
// В production: раздача статики клиента
// ============================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// ============================================
// Запуск
// ============================================
app.listen(PORT, () => {
  console.log(`
  ⚡ RapidLink Server запущен
  📡 Порт: ${PORT}
  🌍 API: http://localhost:${PORT}/api
  `);
});
