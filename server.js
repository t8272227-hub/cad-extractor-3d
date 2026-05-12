const express    = require('express');
const compression= require('compression');
const session    = require('express-session');
const path       = require('path');
const https      = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Env ────────────────────────────────────────────────────────────────────────
const APP_LOGIN   = process.env.APP_LOGIN    || 'admin';
const APP_PASSWORD= process.env.APP_PASSWORD || 'password';
const SESSION_SECRET = process.env.SESSION_SECRET || 'cad-extractor-secret-2024';
const ZVENO_KEY   = process.env.ZVENO_API_KEY || '';

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// ── Security headers (no CSP — app uses CDN + canvas) ─────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// ── Auth middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  if (req.xhr || req.headers['content-type'] === 'application/json') {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  res.redirect('/login');
}

// ── Login page ─────────────────────────────────────────────────────────────────
const LOGIN_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CAD Extractor 3D — Вход</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
         background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);font-family:system-ui,sans-serif}
    .card{background:#fff;border-radius:16px;padding:40px;width:360px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
    .logo{text-align:center;margin-bottom:28px}
    .logo h1{font-size:22px;font-weight:800;color:#1e3a5f;margin-top:8px}
    .logo p{font-size:12px;color:#64748b;margin-top:4px}
    label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px}
    input{width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;
          font-size:14px;margin-bottom:16px;outline:none;transition:.15s}
    input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
    button{width:100%;background:#2563eb;color:#fff;border:none;border-radius:8px;
           padding:12px;font-size:15px;font-weight:600;cursor:pointer;transition:.15s}
    button:hover{background:#1d4ed8}
    .err{background:#fef2f2;color:#be123c;border:1px solid #fecaca;border-radius:8px;
         padding:10px 14px;font-size:13px;margin-bottom:16px;display:none}
    .err.show{display:block}
    .icon{font-size:40px;margin-bottom:4px}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="icon">🗺</div>
    <h1>CAD Extractor 3D</h1>
    <p>Геодезическое приложение</p>
  </div>
  ERRBLOCK
  <form method="POST" action="/login">
    <label>Логин</label>
    <input type="text" name="login" autocomplete="username" required autofocus>
    <label>Пароль</label>
    <input type="password" name="password" autocomplete="current-password" required>
    <button type="submit">Войти →</button>
  </form>
</div>
</body>
</html>`;

app.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/');
  res.send(LOGIN_HTML.replace('ERRBLOCK', ''));
});

app.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (login === APP_LOGIN && password === APP_PASSWORD) {
    req.session.authenticated = true;
    req.session.login = login;
    return res.redirect('/');
  }
  const err = '<div class="err show">Неверный логин или пароль</div>';
  res.send(LOGIN_HTML.replace('ERRBLOCK', err));
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ── AI Proxy — ZvenoAI ─────────────────────────────────────────────────────────
app.post('/api/ai', requireAuth, async (req, res) => {
  if (!ZVENO_KEY) {
    return res.status(503).json({ error: 'ZVENO_API_KEY не задан на сервере' });
  }
  try {
    const body = JSON.stringify({
      model: req.body.model || 'openai/gpt-4o-mini',
      messages: req.body.messages || [],
      max_tokens: req.body.max_tokens || 1500,
      temperature: req.body.temperature || 0.3
    });
    const options = {
      hostname: 'api.zveno.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZVENO_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const zvReq = https.request(options, (zvRes) => {
      let data = '';
      zvRes.on('data', chunk => data += chunk);
      zvRes.on('end', () => {
        try {
          res.status(zvRes.statusCode).json(JSON.parse(data));
        } catch(e) {
          res.status(502).json({ error: 'Неверный ответ от ZvenoAI', raw: data.slice(0,300) });
        }
      });
    });
    zvReq.on('error', e => res.status(502).json({ error: e.message }));
    zvReq.write(body);
    zvReq.end();
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Auth status ────────────────────────────────────────────────────────────────
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ login: req.session.login, ok: true });
});

// ── Protected static files ─────────────────────────────────────────────────────
app.use(requireAuth, express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : '0',
  setHeaders: (res, fp) => {
    if (fp.endsWith('.html'))
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

app.get('*', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server Error');
});

app.listen(PORT, () => {
  console.log(`\n🗺  CAD Extractor 3D → http://localhost:${PORT}`);
  console.log(`   Логин: ${APP_LOGIN} | ZvenoAI: ${ZVENO_KEY ? '✓ ключ задан' : '✗ ключ не задан'}\n`);
});
