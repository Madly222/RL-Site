# ⚡ RapidLink

Корпоративный сайт компании RapidLink — провайдера интернета, хостинга и облачных решений.

## 🏗 Архитектура

Проект разделён на **два независимых приложения**:

```
rapidlink/
├── server/              ← Backend (Node.js + Express)
│   ├── index.js         ← Главный файл сервера (порт 5000)
│   ├── data/            ← Данные (услуги, тарифы, контакты)
│   └── package.json
├── client/              ← Frontend (React + Vite)
│   ├── index.html       ← Точка входа
│   ├── vite.config.js   ← Конфигурация Vite + proxy на сервер
│   ├── src/
│   │   ├── components/  ← Header, Footer, PlanCard
│   │   ├── pages/       ← HomePage, ServicesPage, ContactPage
│   │   ├── api.js       ← Модуль для запросов к API
│   │   └── App.jsx      ← Роутинг
│   └── package.json
├── .gitignore
└── package.json          ← Корневые скрипты
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Из корня проекта:
npm run install-all

# Или вручную:
cd server && npm install
cd ../client && npm install
```

### 2. Запуск в режиме разработки

Нужно **два терминала**:

**Терминал 1 — Сервер (порт 5000):**
```bash
cd server
npm start
```

**Терминал 2 — Клиент (порт 3000):**
```bash
cd client
npm run dev
```

Клиент автоматически проксирует `/api` запросы на `localhost:5000` (настроено в `vite.config.js`).

Откройте **http://localhost:3000** в браузере.

### 3. Production-сборка

```bash
# Собрать клиент
cd client
npm run build

# Запустить сервер, который раздаёт собранный клиент
cd ../server
NODE_ENV=production node index.js
```

Откройте **http://localhost:5000** — сервер раздаёт и API, и статику.

## 📡 API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/company` | Информация о компании |
| GET | `/api/services` | Список услуг |
| GET | `/api/plans` | Все тарифные планы |
| GET | `/api/plans?category=internet` | Планы по категории (internet / hosting / cloud) |
| POST | `/api/contact` | Отправка формы обратной связи |

## 🛠 Технологии

**Backend:** Node.js, Express, CORS, Helmet, Morgan  
**Frontend:** React 18, Vite, React Router, Lucide Icons  
**Стиль:** CSS Variables, тёмная тема, адаптивная вёрстка

## 📝 Как редактировать

- **Изменить тарифы** → `server/data/plans.js`
- **Изменить услуги** → `server/data/services.js`
- **Изменить контакты** → `server/data/company.js`
- **Изменить стили** → `client/src/index.css` (глобальные переменные)
- **Добавить страницу** → создать файл в `client/src/pages/`, добавить роут в `App.jsx`
