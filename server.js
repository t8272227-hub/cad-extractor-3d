const express    = require('express');
const compression= require('compression');
const session    = require('express-session');
const path       = require('path');
const https      = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

const APP_LOGIN      = process.env.APP_LOGIN    || 'admin';
const APP_PASSWORD   = process.env.APP_PASSWORD || 'password';
const SESSION_SECRET = process.env.SESSION_SECRET || 'cad-secret-2024';
const ZVENO_KEY      = process.env.ZVENO_API_KEY || '';

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  if (req.headers['accept'] && !req.headers['accept'].includes('text/html'))
    return res.status(401).json({ error: 'Не авторизован' });
  res.redirect('/login');
}

// ── Public: favicon (no auth) ──────────────────────────────────────────────
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ── Login ──────────────────────────────────────────────────────────────────
const LOGIN_HTML = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CAD Extractor 3D — Вход</title>
<style>*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;
background:linear-gradient(135deg,#0f172a,#1e3a5f);font-family:system-ui,sans-serif}
.card{background:#fff;border-radius:16px;padding:40px;width:360px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.logo{text-align:center;margin-bottom:28px}
h1{font-size:22px;font-weight:800;color:#1e3a5f;margin-top:8px}
p{font-size:12px;color:#64748b;margin-top:4px}
label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px}
input{width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:14px;margin-bottom:16px;outline:none}
input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
button{width:100%;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:12px;font-size:15px;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8}
.err{background:#fef2f2;color:#be123c;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px;display:none}
.err.show{display:block}</style></head>
<body><div class="card"><div class="logo"><div style="font-size:40px">🗺</div>
<h1>CAD Extractor 3D</h1><p>Геодезическое приложение</p></div>
ERRBLOCK
<form method="POST" action="/login">
<label>Логин</label><input type="text" name="login" autocomplete="username" required autofocus>
<label>Пароль</label><input type="password" name="password" autocomplete="current-password" required>
<button type="submit">Войти →</button></form></div></body></html>`;

app.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/');
  res.send(LOGIN_HTML.replace('ERRBLOCK', ''));
});
app.post('/login', (req, res) => {
  if (req.body.login === APP_LOGIN && req.body.password === APP_PASSWORD) {
    req.session.authenticated = true;
    req.session.login = req.body.login;
    return res.redirect('/');
  }
  res.send(LOGIN_HTML.replace('ERRBLOCK', '<div class="err show">Неверный логин или пароль</div>'));
});
app.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

// ── AI Proxy ───────────────────────────────────────────────────────────────
app.post('/api/ai', requireAuth, (req, res) => {
  if (!ZVENO_KEY) return res.status(503).json({ error: 'ZVENO_API_KEY не задан' });
  const body = JSON.stringify({
    model: req.body.model || 'openai/gpt-4o-mini',
    messages: req.body.messages || [],
    max_tokens: req.body.max_tokens || 1500,
    temperature: 0.3
  });
  const zv = https.request({
    hostname: 'api.zveno.ai', path: '/v1/chat/completions', method: 'POST',
    headers: { 'Authorization': `Bearer ${ZVENO_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body) }
  }, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => { try { res.status(r.statusCode).json(JSON.parse(d)); } catch(e) { res.status(502).json({ error: d.slice(0,200) }); } });
  });
  zv.on('error', e => res.status(502).json({ error: e.message }));
  zv.write(body); zv.end();
});

app.get('/api/me', requireAuth, (req, res) => res.json({ login: req.session.login, ok: true }));


// ── DOCX Export ─────────────────────────────────────────────────────────────

app.post('/api/export-docx', requireAuth, async (req, res) => {
  let docxLib;
  try {
    docxLib = require('docx');
  } catch(e) {
    return res.status(503).json({ error: 'Модуль docx не установлен на сервере' });
  }
  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
            AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
            VerticalAlign, PageOrientation } = docxLib;

    const d = req.body;
    const border = { style: BorderStyle.SINGLE, size: 4, color: '94a3b8' };
    const borders = { top: border, bottom: border, left: border, right: border };
    const hBorder = { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' };
    const hBorders = { top: hBorder, bottom: hBorder, left: hBorder, right: hBorder };
    const cellPad = { top: 60, bottom: 60, left: 100, right: 100 };

    function hCell(text, w) {
      return new TableCell({ borders: hBorders, width: { size: w, type: WidthType.DXA },
        shading: { fill: '1e3a5f', type: ShadingType.CLEAR }, margins: cellPad,
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })] })]
      });
    }
    function dCell(text, w, shade) {
      return new TableCell({ borders, width: { size: w, type: WidthType.DXA },
        shading: shade ? { fill: 'f1f5f9', type: ShadingType.CLEAR } : {},
        margins: cellPad,
        children: [new Paragraph({ children: [new TextRun({ text: String(text || '—'), size: 18, font: 'Arial Narrow' })] })]
      });
    }

    const titleChildren = [
      new Paragraph({ spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: d.org || 'Организация', bold: true, size: 28, font: 'Arial' })] }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1e3a5f', space: 1 } },
        spacing: { after: 200 },
        children: [new TextRun({ text: d.title || 'Исполнительная схема', bold: true, size: 32, font: 'Arial' })] }),
    ];

    const infoRows = [
      ['Система координат', d.coord || '—'],
      ['Система высот', d.height || '—'],
      ['Масштаб', '1:' + (d.scale || '500')],
      ['Дата', d.date || new Date().toLocaleDateString('ru-RU')],
    ];
    if (d.note) infoRows.push(['Примечание', d.note]);

    titleChildren.push(new Table({
      width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 6026],
      rows: infoRows.map(([label, val], i) => new TableRow({
        children: [dCell(label, 3000, false), dCell(val, 6026, i % 2 === 0)]
      }))
    }));
    titleChildren.push(new Paragraph({ spacing: { before: 400 }, children: [] }));

    // Points table
    if (d.points && d.points.length) {
      titleChildren.push(new Paragraph({ spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: 'Ведомость точек', bold: true, size: 24, font: 'Arial' })] }));
      const ptCols = [800, 2400, 2400, 1600, 1826];
      titleChildren.push(new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: ptCols,
        rows: [
          new TableRow({ tableHeader: true, children: ['№','X, м','Y, м','Z, м','Тип'].map((h,i) => hCell(h, ptCols[i])) }),
          ...d.points.map((p, idx) => new TableRow({
            children: [
              dCell('P'+p.id, ptCols[0], idx%2===0),
              dCell(Number(p.x).toFixed(3), ptCols[1], idx%2===0),
              dCell(Number(p.y).toFixed(3), ptCols[2], idx%2===0),
              dCell(p.z != null ? Number(p.z).toFixed(3) : '—', ptCols[3], idx%2===0),
              dCell(p.type || '—', ptCols[4], idx%2===0),
            ]
          }))
        ]
      }));
    }

    // Dimensions table
    if (d.dimensions && d.dimensions.length) {
      titleChildren.push(new Paragraph({ spacing: { before: 400, after: 100 },
        children: [new TextRun({ text: 'Ведомость размеров', bold: true, size: 24, font: 'Arial' })] }));
      titleChildren.push(new Table({
        width: { size: 4000, type: WidthType.DXA }, columnWidths: [2000, 2000],
        rows: [
          new TableRow({ tableHeader: true, children: [hCell('Отрезок', 2000), hCell('Длина, м', 2000)] }),
          ...d.dimensions.map((dd, i) => new TableRow({
            children: [dCell('P'+dd.p1+'–P'+dd.p2, 2000, i%2===0), dCell(Number(dd.len).toFixed(3), 2000, i%2===0)]
          }))
        ]
      }));
    }

    // Area / volume
    if (d.area > 0) {
      titleChildren.push(new Paragraph({ spacing: { before: 400, after: 100 },
        children: [new TextRun({ text: 'Площадь и объём', bold: true, size: 24, font: 'Arial' })] }));
      const avRows = [['Площадь', Number(d.area).toFixed(3)+' м²'],
                      ['Периметр', Number(d.perimeter||0).toFixed(3)+' м']];
      if (d.volume > 0) avRows.push(['Объём грунта', Number(d.volume).toFixed(3)+' м³']);
      if (d.pileVolume > 0) {
        avRows.push(['Объём бетона (сваи)', Number(d.pileVolume).toFixed(3)+' м³']);
        avRows.push(['Итого', (Number(d.volume)+Number(d.pileVolume)).toFixed(3)+' м³']);
      }
      titleChildren.push(new Table({
        width: { size: 5000, type: WidthType.DXA }, columnWidths: [2500, 2500],
        rows: [
          new TableRow({ tableHeader: true, children: [hCell('Параметр', 2500), hCell('Значение', 2500)] }),
          ...avRows.map(([k,v],i) => new TableRow({ children: [dCell(k,2500,i%2===0), dCell(v,2500,i%2===0)] }))
        ]
      }));
    }

    const doc = new Document({
      styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
      sections: [{
        properties: {
          page: { size: { width: 11906, height: 16838 },
                  margin: { top: 1000, bottom: 1000, left: 1440, right: 1000 } }
        },
        children: titleChildren
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const fname = encodeURIComponent((d.title || 'report').replace(/\s+/g, '_') + '.docx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fname}`);
    res.send(buffer);
  } catch (e) {
    console.error('DOCX error:', e);
    res.status(500).send('DOCX: ' + e.message);
  }
});

// ── Protected static ───────────────────────────────────────────────────────
app.use(requireAuth, express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : '0',
  setHeaders: (res, fp) => {
    if (fp.endsWith('.html'))
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));
app.get('*', requireAuth, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Error'); });

app.listen(PORT, () => {
  console.log(`\n🗺  CAD Extractor 3D → http://localhost:${PORT}`);
  console.log(`   ZvenoAI: ${ZVENO_KEY ? '✓' : '✗ ключ не задан'}\n`);
});

