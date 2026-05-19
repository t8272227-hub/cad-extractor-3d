// ════════════════════════════════════════════════════════════════════════════
// TACHEOMETER.JS — Импорт/экспорт данных тахеометра
// Форматы: SDR, RAW, CSV, TXT | Экспорт для выноса в натуру
// ════════════════════════════════════════════════════════════════════════════
'use strict';

var TACH = {
  importedPoints: [],
  stakeoutPoints: [],   // точки для выноса
  codeMap: {           // маппинг кодов → условные знаки
    'ДЕРЕВО': 'tree', 'ДЕР': 'tree', 'TREE': 'tree',
    'СТОЛБ': 'pole', 'СТБ': 'pole', 'POLE': 'pole',
    'КОЛОДЕЦ': 'well', 'КЛД': 'well', 'WELL': 'well',
    'УГОЛ': 'corner', 'УГЛ': 'corner',
    'СВАЯ': 'pile', 'СВА': 'pile', 'PILE': 'pile',
    'КАН': 'sewer', 'КАНАЛ': 'sewer',
  }
};

function openTacheometerPanel() {
  var p = document.getElementById('tach-panel');
  if (p) { p.style.display = p.style.display === 'none' ? 'flex' : 'none'; return; }

  var panel = document.createElement('div');
  panel.id = 'tach-panel';
  panel.style.cssText =
    'position:fixed;top:90px;right:16px;width:360px;max-height:85vh;overflow-y:auto;' +
    'background:#1a2744;color:#f1f5f9;border-radius:12px;border:1px solid #2d3e6a;' +
    'box-shadow:0 16px 48px rgba(0,0,0,.5);z-index:9998;display:flex;' +
    'flex-direction:column;font-family:Arial,sans-serif;font-size:12px;';

  panel.innerHTML =
    '<div style="background:#0f1d38;padding:10px 14px;border-bottom:1px solid #2d3e6a;' +
    'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:16px;">📡</span>' +
        '<span style="font-weight:700;font-size:13px;">Тахеометр</span>' +
      '</div>' +
      '<button onclick="document.getElementById(\'tach-panel\').style.display=\'none\'" ' +
      'style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;">✕</button>' +
    '</div>' +
    '<div style="padding:14px;display:flex;flex-direction:column;gap:12px;">' +

      // IMPORT section
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">📥 Импорт сырых данных</div>' +
        '<div style="font-size:10px;color:#334155;margin-bottom:6px;">' +
        'Форматы: CSV, TXT, SDR, RAW (X Y Z или N Y X Z)</div>' +

        // File input
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;' +
        'background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;padding:8px;">' +
          '<i class="fa-solid fa-upload" style="color:#60a5fa;font-size:16px;"></i>' +
          '<span style="flex:1;font-size:11px;">Выбрать файл тахеометра</span>' +
          '<input type="file" id="tach-file" accept=".csv,.txt,.sdr,.raw,.dat" ' +
          'onchange="TACH.importFile(this)" style="display:none;">' +
        '</label>' +

        // Paste area
        '<div style="margin-top:6px;">' +
          '<div style="font-size:9px;color:#475569;margin-bottom:3px;">Или вставьте данные:</div>' +
          '<textarea id="tach-paste" rows="5" placeholder="1 2227481.850 398841.180 155.320 СТОЛБ&#10;2 2227492.110 398852.440 155.891 ДЕРЕВО&#10;..." ' +
          'style="width:100%;background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;' +
          'color:#f1f5f9;padding:6px 8px;font-size:10px;font-family:monospace;' +
          'resize:vertical;box-sizing:border-box;"></textarea>' +
          '<button onclick="TACH.parsePaste()" ' +
          'style="width:100%;margin-top:4px;background:rgba(16,185,129,.2);border:1px solid #10b981;' +
          'color:#6ee7b7;border-radius:6px;padding:7px;cursor:pointer;font-size:11px;">✓ Разобрать</button>' +
        '</div>' +

        // Format selector
        '<div style="margin-top:8px;">' +
          '<div style="font-size:9px;color:#475569;margin-bottom:3px;">Формат колонок:</div>' +
          '<select id="tach-fmt" style="width:100%;background:#2d3e6a;border:1px solid #3d5080;' +
          'border-radius:6px;color:#f1f5f9;padding:5px 8px;font-size:11px;">' +
            '<option value="n_y_x_z">№ Y X Z (Код)</option>' +
            '<option value="n_x_y_z">№ X Y Z (Код)</option>' +
            '<option value="x_y_z">X Y Z (Код)</option>' +
            '<option value="sdr">SDR автоопределение</option>' +
          '</select>' +
        '</div>' +

        '<div id="tach-import-info" style="font-size:10px;color:#475569;margin-top:4px;min-height:14px;"></div>' +

        '<button onclick="TACH.addToProject()" ' +
        'style="width:100%;background:#2563eb;border:none;color:#fff;border-radius:6px;' +
        'padding:8px;cursor:pointer;font-size:12px;font-weight:700;margin-top:6px;">' +
        '📍 Добавить в проект</button>' +
      '</div>' +

      // EXPORT section
      '<div style="border-top:1px solid #2d3e6a;padding-top:12px;">' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">📤 Экспорт для выноса в натуру</div>' +
        '<div style="font-size:10px;color:#334155;margin-bottom:6px;">' +
        'Кликните точки на чертеже → экспорт в TXT для тахеометра</div>' +
        '<button id="tach-stake-btn" onclick="TACH.startStakeout()" ' +
        'style="width:100%;background:rgba(245,158,11,.15);border:1px solid #f59e0b;color:#fcd34d;' +
        'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;font-weight:700;margin-bottom:6px;">' +
        '🎯 Выбрать точки для выноса</button>' +
        '<div id="tach-stake-info" style="font-size:10px;color:#475569;margin-bottom:6px;min-height:14px;">Выбрано: 0 точек</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button onclick="TACH.exportStakeout(\'txt\')" ' +
          'style="flex:1;background:#2d3e6a;border:none;color:#94a3b8;border-radius:6px;padding:7px;cursor:pointer;font-size:11px;">TXT</button>' +
          '<button onclick="TACH.exportStakeout(\'csv\')" ' +
          'style="flex:1;background:#2d3e6a;border:none;color:#94a3b8;border-radius:6px;padding:7px;cursor:pointer;font-size:11px;">CSV</button>' +
          '<button onclick="TACH.stakeoutPoints=[];document.getElementById(\'tach-stake-info\').textContent=\'Выбрано: 0 точек\'" ' +
          'style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;' +
          'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;">🗑</button>' +
        '</div>' +
      '</div>' +

      // Code map
      '<div style="border-top:1px solid #2d3e6a;padding-top:12px;">' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">🏷 Маппинг кодов → знаки</div>' +
        '<div style="background:#2d3e6a;border-radius:6px;padding:8px;font-size:10px;' +
        'font-family:monospace;color:#94a3b8;max-height:80px;overflow-y:auto;">' +
        Object.entries(TACH.codeMap).map(function(e) {
          return e[0] + ' → ' + e[1];
        }).join(' | ') +
        '</div>' +
      '</div>' +

    '</div>';

  document.body.appendChild(panel);
}

// ── Parse text data ─────────────────────────────────────────────────────────
TACH.parseText = function(text, fmt) {
  var pts = [];
  var lines = text.split(/\r?\n/).map(function(l) { return l.trim(); })
    .filter(function(l) { return l && !l.startsWith('#') && !l.startsWith('//'); });

  lines.forEach(function(line) {
    // Try splitting by whitespace, comma, semicolon, tab
    var parts = line.split(/[\s,;\t]+/).filter(Boolean);
    if (parts.length < 3) return;

    var n, x, y, z, code;

    if (fmt === 'n_y_x_z') {
      // № Y X Z Код (ЮГ → X, Восток → Y)
      n = parts[0]; y = parseFloat(parts[1]); x = parseFloat(parts[2]);
      z = parseFloat(parts[3]); code = parts[4] || '';
    } else if (fmt === 'n_x_y_z') {
      n = parts[0]; x = parseFloat(parts[1]); y = parseFloat(parts[2]);
      z = parseFloat(parts[3]); code = parts[4] || '';
    } else if (fmt === 'sdr') {
      // SDR: various formats, try to detect
      if (parts[0] === 'SS' || parts[0] === 'PT') {
        n = parts[1]; x = parseFloat(parts[2]); y = parseFloat(parts[3]);
        z = parseFloat(parts[4]); code = parts[5] || '';
      } else {
        n = parts[0]; x = parseFloat(parts[1]); y = parseFloat(parts[2]);
        z = parseFloat(parts[3]); code = parts[4] || '';
      }
    } else {
      // x_y_z
      if (parts.length >= 4 && isNaN(parseFloat(parts[0]))) {
        n = parts[0]; x = parseFloat(parts[1]); y = parseFloat(parts[2]); z = parseFloat(parts[3]);
        code = parts[4] || '';
      } else {
        x = parseFloat(parts[0]); y = parseFloat(parts[1]); z = parseFloat(parts[2]);
        code = parts[3] || ''; n = String(pts.length + 1);
      }
    }

    if (isFinite(x) && isFinite(y)) {
      pts.push({ n: n || String(pts.length + 1), x: x, y: y,
        z: isFinite(z) ? z : null, code: (code || '').toUpperCase() });
    }
  });
  return pts;
};

TACH.parsePaste = function() {
  var text = (document.getElementById('tach-paste') || {}).value || '';
  var fmt  = (document.getElementById('tach-fmt') || {}).value || 'n_y_x_z';
  TACH.importedPoints = TACH.parseText(text, fmt);
  var info = document.getElementById('tach-import-info');
  if (info) info.textContent = '✓ Разобрано: ' + TACH.importedPoints.length + ' точек';
  if (typeof showMessage === 'function')
    showMessage('Тахеометр', 'Импортировано ' + TACH.importedPoints.length + ' точек', 'success');
};

TACH.importFile = function(input) {
  var file = input.files[0]; if (!file) return;
  var fmt = (document.getElementById('tach-fmt') || {}).value || 'n_y_x_z';
  var reader = new FileReader();
  reader.onload = function(e) {
    TACH.importedPoints = TACH.parseText(e.target.result, fmt);
    var info = document.getElementById('tach-import-info');
    if (info) info.textContent = '✓ ' + file.name + ': ' + TACH.importedPoints.length + ' точек';
    if (typeof showMessage === 'function')
      showMessage('Тахеометр', file.name + ': ' + TACH.importedPoints.length + ' точек', 'success');
  };
  reader.readAsText(file, 'utf-8');
};

// ── Add to project ──────────────────────────────────────────────────────────
TACH.addToProject = function() {
  if (!TACH.importedPoints.length) {
    if (typeof showMessage === 'function') showMessage('Тахеометр', 'Нет данных для импорта', 'warning'); return;
  }
  if (typeof points === 'undefined') {
    if (typeof showMessage === 'function') showMessage('Тахеометр', 'Переключитесь в режим DXF', 'warning'); return;
  }

  var added = 0;
  var maxId = points.length ? Math.max.apply(null, points.map(function(p) { return p.id; })) : 0;

  TACH.importedPoints.forEach(function(tp) {
    maxId++;
    var symType = tp.code ? (TACH.codeMap[tp.code] || null) : null;
    points.push({ id: maxId, x: tp.x, y: tp.y, z: tp.z, type: symType || '', code: tp.code });
    added++;
  });

  if (typeof updateTable === 'function') updateTable();
  if (typeof rebuildCachedPath === 'function') rebuildCachedPath();
  if (typeof requestDraw === 'function') requestDraw();
  if (typeof showMessage === 'function')
    showMessage('Тахеометр', 'Добавлено ' + added + ' точек в проект', 'success');
};

// ── Stakeout ────────────────────────────────────────────────────────────────
TACH.stakeMode = false;

TACH.startStakeout = function() {
  TACH.stakeMode = !TACH.stakeMode;
  var b = document.getElementById('tach-stake-btn');
  if (TACH.stakeMode) {
    if (b) { b.style.background = 'rgba(245,158,11,.35)'; b.textContent = '⏳ Кликайте точки для выноса...'; }
    if (typeof showMessage === 'function')
      showMessage('Вынос', 'Кликайте на точки или узлы DXF для добавления', 'info');
  } else {
    if (b) { b.style.background = 'rgba(245,158,11,.15)'; b.textContent = '🎯 Выбрать точки для выноса'; }
  }
};

TACH.handleCanvasClick = function(wx, wy) {
  if (!TACH.stakeMode) return false;
  // Snap to nearest survey point
  var best = null, bestD = 5 / (typeof scale !== 'undefined' ? scale : 1);
  if (typeof points !== 'undefined') {
    points.forEach(function(p) {
      var d = Math.hypot(p.x - wx, p.y - wy);
      if (d < bestD) { bestD = d; best = p; }
    });
  }
  if (!best) {
    // Use clicked world coordinate
    best = { x: wx, y: wy, z: null, id: TACH.stakeoutPoints.length + 1 };
  }
  // Avoid duplicates
  var dup = TACH.stakeoutPoints.find(function(p) { return Math.hypot(p.x - best.x, p.y - best.y) < 0.01; });
  if (!dup) {
    TACH.stakeoutPoints.push(best);
    var info = document.getElementById('tach-stake-info');
    if (info) info.textContent = 'Выбрано: ' + TACH.stakeoutPoints.length + ' точек';
  }
  return true;
};

TACH.exportStakeout = function(fmt) {
  if (!TACH.stakeoutPoints.length) {
    if (typeof showMessage === 'function') showMessage('Вынос', 'Выберите точки', 'warning'); return;
  }
  var lines = [];
  if (fmt === 'csv') {
    lines.push('№,X,Y,Z,Код');
    TACH.stakeoutPoints.forEach(function(p, i) {
      lines.push([i + 1, p.x.toFixed(4), p.y.toFixed(4),
        p.z != null ? p.z.toFixed(4) : '0.0000', p.code || ''].join(','));
    });
  } else {
    lines.push('# Файл выноса в натуру | CAD Extractor 3D | ' + new Date().toLocaleDateString('ru-RU'));
    TACH.stakeoutPoints.forEach(function(p, i) {
      lines.push([String(i + 1).padStart(4, ' '), '\t',
        p.x.toFixed(4), '\t', p.y.toFixed(4), '\t',
        (p.z != null ? p.z.toFixed(4) : '0.0000'), '\t',
        p.code || ''].join(''));
    });
  }
  var blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'stakeout-' + new Date().toISOString().slice(0, 10) + '.' + fmt;
  a.click();
  if (typeof showMessage === 'function')
    showMessage('Вынос', 'Экспортировано ' + TACH.stakeoutPoints.length + ' точек (' + fmt.toUpperCase() + ')', 'success');
};

// Draw stakeout markers
TACH.draw = function(cx2) {
  if (!TACH.stakeoutPoints.length || typeof cadToScreen !== 'function') return;
  cx2.save();
  TACH.stakeoutPoints.forEach(function(p, i) {
    var s = cadToScreen(p.x, p.y);
    cx2.strokeStyle = '#f59e0b'; cx2.lineWidth = 2;
    cx2.beginPath(); cx2.arc(s.x, s.y, 8, 0, Math.PI * 2); cx2.stroke();
    cx2.beginPath();
    cx2.moveTo(s.x - 5, s.y - 5); cx2.lineTo(s.x + 5, s.y + 5);
    cx2.moveTo(s.x + 5, s.y - 5); cx2.lineTo(s.x - 5, s.y + 5);
    cx2.stroke();
    cx2.fillStyle = '#fcd34d'; cx2.font = 'bold 9px Arial';
    cx2.textAlign = 'center';
    cx2.fillText(i + 1, s.x, s.y - 12);
  });
  cx2.restore();
};

window.openTacheometerPanel = openTacheometerPanel;
window.TACH = TACH;
