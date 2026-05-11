const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers (relaxed CSP for canvas, CDN libs, file API)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",   // inline scripts in HTML
        "'unsafe-eval'",     // three.js / Delaunator eval
        "cdn.tailwindcss.com",
        "cdnjs.cloudflare.com",
        "unpkg.com",
        "cdn.jsdelivr.net",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "cdn.tailwindcss.com",
        "cdnjs.cloudflare.com",
        "fonts.googleapis.com",
      ],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "api.anthropic.com"],
      workerSrc: ["'self'", "blob:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Gzip compression for all responses
app.use(compression());

// Cache static assets
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: true,
}));

// SPA fallback — all routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`\n🗺  CAD Extractor 3D запущен на http://localhost:${PORT}\n`);
});
