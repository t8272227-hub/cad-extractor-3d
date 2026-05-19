// ════════════════════════════════════════════════════════════════════════════
// PROFILES.JS — Продольные профили и поперечные сечения
// ════════════════════════════════════════════════════════════════════════════
'use strict';

var PR = {
  route: [],        // [{x,y,z,dist}] — точки трассы
  xsections: [],    // поперечные сечения
  mode: null,       // 'pick-route'
};

function openProfilesPanel() {
  var p = document.getElementById('pr-panel');
  if (p) { p.style.display = p.style.display === 'none' ? 'flex' : 'none'; return; }

  var panel = document.createElement('div');
  panel.id = 'pr-panel';
  panel.style.cssText =
    'position:fixed;top:90px;left:50%;transform:translateX(-50%);width:360px;' +
    'max-height:85vh;overflow-y:auto;background:#1a2744;color:#f1f5f9;' +
    'border-radius:12px;border:1px solid #2d3e6a;box-shadow:0 16px 48px rgba(0,0,0,.5);' +
    'z-index:9998;display:flex;flex-direction:column;font-family:Arial,sans-serif;font-size:12px;';

  panel.innerHTML =
    '<div style="background:#0f1d38;padding:10px 14px;border-bottom:1px solid #2d3e6a;' +
    'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:16px;">📈</span>' +
        '<span style="font-weight:700;font-size:13px;">Профили и сечения</span>' +
      '</div>' +
      '<button onclick="document.getElementById(\'pr-panel\').style.display=\'none\'" ' +
      'style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;">✕</button>' +
    '</div>' +
    '<div style="padding:14px;display:flex;flex-direction:column;gap:12px;">' +

      // Route picking
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Трасса профиля</div>' +
        '<button id="pr-btn-pick" onclick="PR.startPick()" ' +
        'style="width:100%;background:rgba(99,102,241,.2);border:1px solid #6366f1;color:#a5b4fc;' +
        'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;font-weight:700;margin-bottom:4px;">' +
        '🖱 Указать точки трассы (Enter = завершить)</button>' +
        '<div style="display:flex;gap:4px;">' +
          '<button onclick="PR.useExistingPoints()" ' +
          'style="flex:1;background:rgba(16,185,129,.15);border:1px solid #10b981;color:#6ee7b7;' +
          'border-radius:6px;padding:5px;cursor:pointer;font-size:10px;">' +
          '📍 Из точек проекта</button>' +
          '<button onclick="PR.useExistingPolyline()" ' +
          'style="flex:1;background:rgba(245,158,11,.15);border:1px solid #f59e0b;color:#fcd34d;' +
          'border-radius:6px;padding:5px;cursor:pointer;font-size:10px;">' +
          '📐 Из полилинии DXF</button>' +
        '</div>' +
        '<div id="pr-route-info" style="font-size:10px;color:#475569;margin-top:4px;">Трасса: не задана</div>' +
      '</div>' +

      // Profile scale
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
        '<div>' +
          '<div style="font-size:10px;color:#64748b;margin-bottom:3px;">М горизонт.</div>' +
          '<input type="number" id="pr-hscale" value="500" ' +
          'style="width:100%;background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;' +
          'color:#60a5fa;padding:5px 8px;font-size:12px;box-sizing:border-box;outline:none;">' +
        '</div>' +
        '<div>' +
          '<div style="font-size:10px;color:#64748b;margin-bottom:3px;">М верт.</div>' +
          '<input type="number" id="pr-vscale" value="100" ' +
          'style="width:100%;background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;' +
          'color:#60a5fa;padding:5px 8px;font-size:12px;box-sizing:border-box;outline:none;">' +
        '</div>' +
      '</div>' +

      // Pipe params
      '<div style="border-top:1px solid #2d3e6a;padding-top:10px;">' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Параметры трубопровода (необяз.)</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          '<div><div style="font-size:9px;color:#64748b;margin-bottom:2px;">Диаметр, мм</div>' +
          '<input type="number" id="pr-diam" value="200" placeholder="200" ' +
          'style="width:100%;background:#2d3e6a;border:1px solid #3d5080;border-radius:5px;' +
          'color:#f1f5f9;padding:4px 7px;font-size:11px;box-sizing:border-box;outline:none;"></div>' +
          '<div><div style="font-size:9px;color:#64748b;margin-bottom:2px;">Уклон, ‰</div>' +
          '<input type="number" id="pr-slope" value="2" step="0.1" placeholder="2" ' +
          'style="width:100%;background:#2d3e6a;border:1px solid #3d5080;border-radius:5px;' +
          'color:#f1f5f9;padding:4px 7px;font-size:11px;box-sizing:border-box;outline:none;"></div>' +
        '</div>' +
      '</div>' +

      // Generate
      '<button onclick="PR.generate()" ' +
      'style="background:#2563eb;border:none;color:#fff;border-radius:8px;padding:10px;' +
      'cursor:pointer;font-weight:700;font-size:13px;">📊 Построить продольный профиль</button>' +

      // Cross section
      '<div style="border-top:1px solid #2d3e6a;padding-top:10px;">' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Поперечное сечение</div>' +
        '<button onclick="PR.generateCrossSection()" ' +
        'style="width:100%;background:rgba(168,85,247,.2);border:1px solid #a855f7;color:#d8b4fe;' +
        'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;font-weight:700;">' +
        '✂ Сечение по текущей линии (Ctrl+клик дважды)</button>' +
      '</div>' +

    '</div>';

  document.body.appendChild(panel);
}

PR.startPick = function() {
  PR.mode = 'pick-route';
  PR.route = [];
  var b = document.getElementById('pr-btn-pick');
  if (b) { b.style.background = 'rgba(99,102,241,.4)'; b.textContent = '⏳ Кликайте точки трассы... Enter = готово'; }
  if (typeof showMessage === 'function')
    showMessage('Профиль', 'Кликайте точки трассы, Enter = завершить', 'info');
};

PR.handleCanvasClick = function(wx, wy) {
  if (PR.mode !== 'pick-route') return false;
  PR.route.push({ x: wx, y: wy });
  var el = document.getElementById('pr-route-info');
  if (el) el.textContent = 'Трасса: ' + PR.route.length + ' точек';
  if (typeof requestDraw === 'function') requestDraw();
  return true;
};

PR.handleKeydown = function(e) {
  if (e.key === 'Enter' && PR.mode === 'pick-route') {
    PR.mode = null;
    var b = document.getElementById('pr-btn-pick');
    if (b) { b.style.background = 'rgba(99,102,241,.2)'; b.textContent = '✓ Трасса задана (' + PR.route.length + ' точек)'; }
    if (typeof showMessage === 'function')
      showMessage('Профиль', 'Трасса задана: ' + PR.route.length + ' точек', 'success');
  }
};
window.addEventListener('keydown', PR.handleKeydown.bind(PR));

PR.useExistingPoints = function() {
  if (typeof points === 'undefined' || !points.length) return;
  PR.route = points.slice().sort(function(a, b) { return a.id - b.id; })
    .map(function(p) { return { x: p.x, y: p.y, z: p.z }; });
  var el = document.getElementById('pr-route-info');
  if (el) el.textContent = 'Трасса из точек: ' + PR.route.length + ' точек';
  if (typeof showMessage === 'function')
    showMessage('Профиль', 'Трасса из точек проекта', 'success');
};

PR.useExistingPolyline = function() {
  if (typeof dxfElements === 'undefined' || !dxfElements) return;
  var poly = dxfElements.find(function(el) {
    return el.type === 'POLYLINE' || el.type === 'LWPOLYLINE';
  });
  if (!poly || !poly.pts) { if (typeof showMessage === 'function') showMessage('Профиль', 'Полилиния не найдена', 'warning'); return; }
  PR.route = poly.pts.map(function(p) { return { x: p.x, y: p.y, z: p.z || 0 }; });
  var el = document.getElementById('pr-route-info');
  if (el) el.textContent = 'Трасса из полилинии: ' + PR.route.length + ' точек';
};

// ── Generate longitudinal profile ───────────────────────────────────────────
PR.generate = function() {
  if (PR.route.length < 2) {
    if (typeof showMessage === 'function') showMessage('Профиль', 'Нужно минимум 2 точки трассы', 'warning'); return;
  }

  // Calculate distances and Z
  var pts = PR.route.map(function(p, i) {
    var dist = 0;
    if (i > 0) {
      var prev = PR.route[i - 1];
      dist = PR._accDist ? PR._accDist[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y) : 0;
    }
    return { x: p.x, y: p.y, z: p.z || 0, dist: dist };
  });
  // Accumulate distances
  var acc = 0;
  pts.forEach(function(p, i) {
    if (i > 0) acc += Math.hypot(p.x - pts[i-1].x, p.y - pts[i-1].y);
    p.dist = acc;
  });
  PR._accDist = pts.map(function(p) { return p.dist; });

  var totalLen = pts[pts.length - 1].dist;
  var zMin = Math.min.apply(null, pts.map(function(p) { return p.z; }));
  var zMax = Math.max.apply(null, pts.map(function(p) { return p.z; }));
  var diam = parseFloat((document.getElementById('pr-diam') || {}).value) || 200;
  var slope = parseFloat((document.getElementById('pr-slope') || {}).value) || 2;

  // Build HTML profile
  var W = 900, H = 400, marginL = 60, marginB = 120, marginR = 20, marginT = 30;
  var plotW = W - marginL - marginR;
  var plotH = H - marginT - marginB;
  var scaleH = plotW / totalLen;
  var zRange = Math.max(zMax - zMin, 1) * 1.2;
  var scaleV = plotH / zRange;

  function px(dist) { return marginL + dist * scaleH; }
  function py(z)    { return H - marginB - (z - (zMin - zRange * 0.1)) * scaleV; }

  var svgPts = pts.map(function(p) { return px(p.dist) + ',' + py(p.z); }).join(' ');

  // Pipe invert line
  var pipeZ0 = zMin - 1.5;
  var pipePts = pts.map(function(p) {
    return px(p.dist) + ',' + py(pipeZ0 - (p.dist * slope / 1000));
  }).join(' ');

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" ' +
    'style="background:#fff;font-family:Arial;font-size:9px;">';

  // Grid
  for (var i = 0; i <= 10; i++) {
    var gx = marginL + i * plotW / 10;
    svg += '<line x1="' + gx + '" y1="' + marginT + '" x2="' + gx + '" y2="' + (H - marginB) + '" stroke="#e2e8f0" stroke-width="0.5"/>';
    svg += '<text x="' + gx + '" y="' + (H - marginB + 12) + '" text-anchor="middle" fill="#94a3b8">' + (totalLen * i / 10).toFixed(1) + '</text>';
  }
  // Z axis
  var zSteps = 6;
  for (var j = 0; j <= zSteps; j++) {
    var gz = H - marginB - j * plotH / zSteps;
    var gzVal = (zMin - zRange * 0.1) + j * zRange / zSteps;
    svg += '<line x1="' + marginL + '" y1="' + gz + '" x2="' + (W - marginR) + '" y2="' + gz + '" stroke="#e2e8f0" stroke-width="0.5"/>';
    svg += '<text x="' + (marginL - 4) + '" y="' + (gz + 3) + '" text-anchor="end" fill="#475569">' + gzVal.toFixed(2) + '</text>';
  }

  // Ground surface (hatching)
  svg += '<polyline points="' + svgPts + '" fill="none" stroke="#1e293b" stroke-width="2"/>';
  // Pipe
  svg += '<polyline points="' + pipePts + '" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6,3"/>';

  // Point markers
  pts.forEach(function(p, i) {
    var vx = px(p.dist), vy = py(p.z);
    svg += '<circle cx="' + vx + '" cy="' + vy + '" r="3" fill="#2563eb"/>';
    svg += '<text x="' + vx + '" y="' + (vy - 6) + '" text-anchor="middle" fill="#1e293b" font-size="8">' + p.z.toFixed(3) + '</text>';
  });

  // Axes
  svg += '<line x1="' + marginL + '" y1="' + marginT + '" x2="' + marginL + '" y2="' + (H - marginB) + '" stroke="#334155" stroke-width="1.5"/>';
  svg += '<line x1="' + marginL + '" y1="' + (H - marginB) + '" x2="' + (W - marginR) + '" y2="' + (H - marginB) + '" stroke="#334155" stroke-width="1.5"/>';

  // Labels
  svg += '<text x="' + W / 2 + '" y="15" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">ПРОДОЛЬНЫЙ ПРОФИЛЬ ТРАССЫ</text>';
  svg += '<text x="' + (marginL - 50) + '" y="' + (marginT + plotH / 2) + '" text-anchor="middle" font-size="9" fill="#64748b" transform="rotate(-90,' + (marginL - 50) + ',' + (marginT + plotH / 2) + ')">Отметка, м</text>';
  svg += '<text x="' + (marginL + plotW / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="9" fill="#64748b">Расстояние, м | Уклон: ' + slope + '‰ | Ø' + diam + ' мм</text>';

  // Legend
  svg += '<line x1="700" y1="25" x2="730" y2="25" stroke="#1e293b" stroke-width="2"/><text x="735" y="28" fill="#475569">Рельеф</text>';
  svg += '<line x1="700" y1="40" x2="730" y2="40" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6,3"/><text x="735" y="43" fill="#475569">Труба</text>';

  svg += '</svg>';

  var win = window.open('', '_blank', 'width=1000,height=600');
  if (!win) { alert('Разрешите всплывающие окна'); return; }
  win.document.write('<html><head><title>Продольный профиль</title></head><body style="margin:0">' + svg +
    '<br><button onclick="window.print()" style="margin:10px;padding:8px 20px;">🖨 Печать</button></body></html>');
  win.document.close();
};

// ── Cross section ────────────────────────────────────────────────────────────
PR.generateCrossSection = function() {
  if (!PR.route.length) {
    if (typeof showMessage === 'function') showMessage('Сечение', 'Задайте трассу', 'warning'); return;
  }
  // Use midpoint of route
  var mid = Math.floor(PR.route.length / 2);
  var center = PR.route[mid];

  if (typeof points === 'undefined' || !points.length) {
    if (typeof showMessage === 'function') showMessage('Сечение', 'Нет точек с Z', 'warning'); return;
  }

  // Collect points within 50m of center
  var nearby = points.filter(function(p) {
    return p.z != null && Math.hypot(p.x - center.x, p.y - center.y) < 50;
  }).sort(function(a, b) {
    return (a.y - center.y) - (b.y - center.y);
  });

  if (nearby.length < 2) {
    if (typeof showMessage === 'function') showMessage('Сечение', 'Недостаточно точек вблизи трассы', 'warning'); return;
  }

  // SVG cross section
  var W = 700, H = 350, mL = 50, mB = 60, mR = 20, mT = 30;
  var pW = W - mL - mR, pH = H - mT - mB;
  var xs = nearby.map(function(p) { return p.y - center.y; });
  var zs = nearby.map(function(p) { return p.z; });
  var xMin = Math.min.apply(null, xs), xMax = Math.max.apply(null, xs);
  var zMin2 = Math.min.apply(null, zs) - 0.5, zMax2 = Math.max.apply(null, zs) + 0.5;
  function sx2(x) { return mL + (x - xMin) / (xMax - xMin) * pW; }
  function sy2(z) { return H - mB - (z - zMin2) / (zMax2 - zMin2) * pH; }

  var pts2 = nearby.map(function(p) { return sx2(p.y - center.y) + ',' + sy2(p.z); }).join(' ');
  // Close to bottom for hatching
  var ptsClose = pts2 + ' ' + sx2(xMax) + ',' + (H - mB) + ' ' + sx2(xMin) + ',' + (H - mB);

  var area = 0;
  for (var i = 0; i < nearby.length - 1; i++) {
    area += Math.abs((nearby[i + 1].y - nearby[i].y) * (nearby[i + 1].z + nearby[i].z) / 2);
  }

  var svg2 = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" style="background:#fff;font-family:Arial;">';
  svg2 += '<polygon points="' + ptsClose + '" fill="rgba(180,210,160,.5)" stroke="none"/>';
  svg2 += '<polyline points="' + pts2 + '" fill="none" stroke="#1e293b" stroke-width="2"/>';
  nearby.forEach(function(p, i) {
    var vx = sx2(p.y - center.y), vy = sy2(p.z);
    svg2 += '<circle cx="' + vx + '" cy="' + vy + '" r="3" fill="#2563eb"/>';
    svg2 += '<text x="' + vx + '" y="' + (vy - 6) + '" text-anchor="middle" font-size="8" fill="#1e293b">' + p.z.toFixed(3) + '</text>';
  });
  svg2 += '<line x1="' + mL + '" y1="' + mT + '" x2="' + mL + '" y2="' + (H - mB) + '" stroke="#334155" stroke-width="1.5"/>';
  svg2 += '<line x1="' + mL + '" y1="' + (H - mB) + '" x2="' + (W - mR) + '" y2="' + (H - mB) + '" stroke="#334155" stroke-width="1.5"/>';
  svg2 += '<text x="' + W / 2 + '" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">ПОПЕРЕЧНОЕ СЕЧЕНИЕ | Площадь: ' + area.toFixed(2) + ' м²</text>';
  svg2 += '</svg>';

  var win2 = window.open('', '_blank', 'width=800,height=450');
  if (!win2) return;
  win2.document.write('<html><head><title>Поперечное сечение</title></head><body style="margin:0">' + svg2 + '</body></html>');
  win2.document.close();
};

// Draw route on canvas
PR.draw = function(cx2) {
  if (!PR.route.length || typeof cadToScreen !== 'function') return;
  cx2.save();
  cx2.strokeStyle = '#a855f7'; cx2.lineWidth = 2; cx2.setLineDash([6, 3]);
  cx2.beginPath();
  PR.route.forEach(function(p, i) {
    var s = cadToScreen(p.x, p.y);
    i ? cx2.lineTo(s.x, s.y) : cx2.moveTo(s.x, s.y);
  });
  cx2.stroke(); cx2.setLineDash([]);
  PR.route.forEach(function(p) {
    var s = cadToScreen(p.x, p.y);
    cx2.beginPath(); cx2.arc(s.x, s.y, 4, 0, Math.PI * 2);
    cx2.fillStyle = '#a855f7'; cx2.fill();
  });
  cx2.restore();
};

window.openProfilesPanel = openProfilesPanel;
window.PR = PR;
