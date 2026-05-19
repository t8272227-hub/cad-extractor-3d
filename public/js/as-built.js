// ════════════════════════════════════════════════════════════════════════════
// AS-BUILT.JS — Исполнительные схемы (Проект vs Факт)
// Модуль: отклонения, допуски СНиП, исполнительная по сваям
// ════════════════════════════════════════════════════════════════════════════
'use strict';

var AB = {
  tolerance: 15,          // мм — допуск по умолчанию
  deviations: [],         // [{proj,fact,dx,dy,dz,label,ok}]
  pileDeviations: [],     // исполнительная по сваям
  mode: null,             // 'pick-proj' | 'pick-fact'
  pickProj: null,         // проектная точка (world coords)
  overlayVisible: true,
};

// ── Открыть панель ──────────────────────────────────────────────────────────
function openAsBuiltPanel() {
  var p = document.getElementById('ab-panel');
  if (p) { p.style.display = p.style.display === 'none' ? 'flex' : 'none'; return; }

  var panel = document.createElement('div');
  panel.id = 'ab-panel';
  panel.style.cssText =
    'position:fixed;top:90px;right:16px;width:360px;max-height:80vh;overflow-y:auto;' +
    'background:#1a2744;color:#f1f5f9;border-radius:12px;border:1px solid #2d3e6a;' +
    'box-shadow:0 16px 48px rgba(0,0,0,.5);z-index:9998;display:flex;' +
    'flex-direction:column;font-family:Arial,sans-serif;font-size:12px;';

  panel.innerHTML =
    '<div style="background:#0f1d38;padding:10px 14px;border-bottom:1px solid #2d3e6a;' +
    'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:16px;">📐</span>' +
        '<span style="font-weight:700;font-size:13px;">Исполнительная схема</span>' +
      '</div>' +
      '<button onclick="document.getElementById(\'ab-panel\').style.display=\'none\'" ' +
      'style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;">✕</button>' +
    '</div>' +
    '<div style="padding:14px;display:flex;flex-direction:column;gap:12px;">' +

      // Tolerance
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Допуск (мм)</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<input type="number" id="ab-tol" value="15" min="1" max="500" ' +
          'style="width:70px;background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;' +
          'color:#f59e0b;padding:5px 8px;font-size:14px;font-weight:700;text-align:center;outline:none;" ' +
          'onchange="AB.tolerance=parseInt(this.value)||15">' +
          '<div style="display:flex;flex-wrap:wrap;gap:4px;">' +
            '<button onclick="AB.setTol(5)"  style="' + _abPresetStyle() + '">5 мм</button>' +
            '<button onclick="AB.setTol(10)" style="' + _abPresetStyle() + '">10</button>' +
            '<button onclick="AB.setTol(15)" style="' + _abPresetStyle() + '">15</button>' +
            '<button onclick="AB.setTol(20)" style="' + _abPresetStyle() + '">20</button>' +
            '<button onclick="AB.setTol(30)" style="' + _abPresetStyle() + '">30</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Deviation pick
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Добавить отклонение</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button id="ab-btn-proj" onclick="AB.startPickProj()" ' +
          'style="flex:1;background:rgba(99,102,241,.2);border:1px solid #6366f1;color:#a5b4fc;' +
          'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;font-weight:700;">' +
          '① Проектная точка</button>' +
          '<button id="ab-btn-fact" onclick="AB.startPickFact()" ' +
          'style="flex:1;background:rgba(16,185,129,.15);border:1px solid #10b981;color:#6ee7b7;' +
          'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;font-weight:700;">' +
          '② Фактическая точка</button>' +
        '</div>' +
        '<div id="ab-pick-hint" style="font-size:10px;color:#475569;margin-top:4px;min-height:14px;"></div>' +
      '</div>' +

      // Label input
      '<div>' +
        '<div style="font-size:10px;color:#64748b;margin-bottom:3px;">Подпись (необяз.)</div>' +
        '<input type="text" id="ab-label" placeholder="Свая 1, Ось А и т.д." ' +
        'style="width:100%;background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;' +
        'color:#f1f5f9;padding:5px 8px;font-size:12px;box-sizing:border-box;">' +
      '</div>' +

      // Pile mode
      '<div style="border-top:1px solid #2d3e6a;padding-top:10px;">' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Исполнительная по сваям</div>' +
        '<button onclick="AB.autoDetectPiles()" ' +
        'style="width:100%;background:rgba(245,158,11,.15);border:1px solid #f59e0b;color:#fcd34d;' +
        'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;font-weight:700;">' +
        '🔍 Автопоиск свай в точках проекта</button>' +
      '</div>' +

      // Table
      '<div id="ab-table-wrap" style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:3px;">' +
        '<div style="font-size:10px;color:#334155;text-align:center;padding:8px 0;">Нет отклонений</div>' +
      '</div>' +

      // Export
      '<div style="display:flex;gap:6px;">' +
        '<button onclick="AB.exportReport()" ' +
        'style="flex:1;background:#2563eb;border:none;color:#fff;border-radius:8px;padding:8px;' +
        'cursor:pointer;font-weight:700;font-size:12px;">📄 Отчёт PDF</button>' +
        '<button onclick="AB.exportCSV()" ' +
        'style="flex:1;background:#2d3e6a;border:none;color:#94a3b8;border-radius:8px;padding:8px;' +
        'cursor:pointer;font-size:12px;">📊 CSV</button>' +
        '<button onclick="AB.clearAll()" ' +
        'style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;' +
        'border-radius:8px;padding:8px;cursor:pointer;font-size:11px;">🗑</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(panel);
}

function _abPresetStyle() {
  return 'background:#2d3e6a;border:1px solid #3d5080;color:#94a3b8;' +
    'border-radius:4px;padding:3px 7px;cursor:pointer;font-size:10px;';
}

AB.setTol = function(v) {
  AB.tolerance = v;
  var el = document.getElementById('ab-tol');
  if (el) el.value = v;
};

AB.startPickProj = function() {
  AB.mode = 'pick-proj';
  AB.pickProj = null;
  var h = document.getElementById('ab-pick-hint');
  if (h) h.textContent = '① Кликните на проектную точку (ось/угол) на чертеже';
  var b = document.getElementById('ab-btn-proj');
  if (b) { b.style.background = 'rgba(99,102,241,.4)'; b.textContent = '⏳ Ожидание клика...'; }
  if (typeof showMessage === 'function')
    showMessage('Исполнительная', '① Кликните ПРОЕКТНУЮ точку на холсте', 'info');
};

AB.startPickFact = function() {
  if (!AB.pickProj) { AB.startPickProj(); return; }
  AB.mode = 'pick-fact';
  var h = document.getElementById('ab-pick-hint');
  if (h) h.textContent = '② Кликните на фактическую (отснятую) точку';
  var b = document.getElementById('ab-btn-fact');
  if (b) { b.style.background = 'rgba(16,185,129,.35)'; b.textContent = '⏳ Ожидание...'; }
  if (typeof showMessage === 'function')
    showMessage('Исполнительная', '② Кликните ФАКТИЧЕСКУЮ точку', 'info');
};

// Called from canvas click handler
AB.handleCanvasClick = function(wx, wy) {
  if (!AB.mode) return false;

  if (AB.mode === 'pick-proj') {
    AB.pickProj = { x: wx, y: wy };
    AB.mode = null;
    var h = document.getElementById('ab-pick-hint');
    if (h) h.textContent = '✓ Проектная задана. Теперь нажмите ② и кликните фактическую.';
    var b = document.getElementById('ab-btn-proj');
    if (b) { b.style.background = 'rgba(99,102,241,.2)'; b.textContent = '① Проектная точка ✓'; }
    return true;
  }

  if (AB.mode === 'pick-fact' && AB.pickProj) {
    var proj = AB.pickProj;
    var fact = { x: wx, y: wy };

    // Find nearest survey point for Z
    var factPt = null;
    if (typeof points !== 'undefined') {
      var best = Infinity;
      points.forEach(function(p) {
        var d = Math.hypot(p.x - wx, p.y - wy);
        if (d < best) { best = d; factPt = p; }
      });
    }
    var factZ = (factPt && factPt.z != null) ? factPt.z : null;

    // Find nearest DXF point for projected Z
    var projZ = null;
    if (typeof cadSnapPoints !== 'undefined' && cadSnapPoints) {
      var best2 = Infinity;
      cadSnapPoints.forEach(function(s) {
        var d = Math.hypot(s.x - proj.x, s.y - proj.y);
        if (d < best2 && s.z != null) { best2 = d; projZ = s.z; }
      });
    }

    var dx = Math.round((fact.x - proj.x) * 1000); // мм
    var dy = Math.round((fact.y - proj.y) * 1000);
    var dz = (factZ != null && projZ != null) ? Math.round((factZ - projZ) * 1000) : null;
    var dist = Math.round(Math.hypot(fact.x - proj.x, fact.y - proj.y) * 1000);
    var ok = dist <= AB.tolerance;
    var lbl = (document.getElementById('ab-label') || {}).value || '';

    AB.deviations.push({
      proj: proj, fact: fact,
      dx: dx, dy: dy, dz: dz, dist: dist,
      label: lbl || ('Откл.' + AB.deviations.length),
      ok: ok, tol: AB.tolerance
    });

    AB.mode = null; AB.pickProj = null;
    var b2 = document.getElementById('ab-btn-fact');
    if (b2) { b2.style.background = 'rgba(16,185,129,.15)'; b2.textContent = '② Фактическая точка'; }
    var h2 = document.getElementById('ab-pick-hint');
    if (h2) h2.textContent = (ok ? '✅ В допуске' : '❌ ПРЕВЫШЕНИЕ') + ' | ' + dist + ' мм';
    AB.renderTable();
    if (typeof requestDraw === 'function') requestDraw();
    return true;
  }
  return false;
};

AB.renderTable = function() {
  var wrap = document.getElementById('ab-table-wrap');
  if (!wrap) return;
  if (!AB.deviations.length) {
    wrap.innerHTML = '<div style="font-size:10px;color:#334155;text-align:center;padding:8px 0;">Нет отклонений</div>';
    return;
  }
  wrap.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 40px 40px 40px 50px 24px;' +
    'gap:2px;font-size:9px;color:#64748b;font-weight:700;padding:0 2px 4px;' +
    'text-transform:uppercase;letter-spacing:.4px;">' +
    '<span>Подпись</span><span>ΔX</span><span>ΔY</span><span>ΔZ</span><span>Δ мм</span><span></span>' +
    '</div>' +
    AB.deviations.map(function(d, i) {
      return '<div style="display:grid;grid-template-columns:1fr 40px 40px 40px 50px 24px;' +
        'gap:2px;align-items:center;padding:4px 6px;border-radius:5px;' +
        'background:' + (d.ok ? '#1e3a5f' : 'rgba(239,68,68,.2)') + ';">' +
        '<span style="font-size:10px;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + d.label + '">' + d.label + '</span>' +
        '<span style="font-size:10px;font-family:monospace;color:#60a5fa;">' + (d.dx > 0 ? '+' : '') + d.dx + '</span>' +
        '<span style="font-size:10px;font-family:monospace;color:#60a5fa;">' + (d.dy > 0 ? '+' : '') + d.dy + '</span>' +
        '<span style="font-size:10px;font-family:monospace;color:#34d399;">' + (d.dz != null ? (d.dz > 0 ? '+' : '') + d.dz : '—') + '</span>' +
        '<span style="font-size:10px;font-weight:700;color:' + (d.ok ? '#22c55e' : '#ef4444') + ';">' +
          d.dist + ' мм ' + (d.ok ? '✓' : '✗') + '</span>' +
        '<button onclick="AB.removeDeviation(' + i + ')" style="background:none;border:none;' +
          'color:#475569;cursor:pointer;font-size:12px;padding:0;">✕</button>' +
        '</div>';
    }).join('');
};

AB.removeDeviation = function(i) {
  AB.deviations.splice(i, 1);
  AB.renderTable();
  if (typeof requestDraw === 'function') requestDraw();
};

AB.clearAll = function() {
  AB.deviations = []; AB.pileDeviations = [];
  AB.renderTable();
  if (typeof requestDraw === 'function') requestDraw();
};

// ── Draw on canvas ──────────────────────────────────────────────────────────
AB.draw = function(cx, sc) {
  if (!AB.deviations.length || !AB.overlayVisible) return;
  if (typeof cadToScreen !== 'function') return;

  AB.deviations.forEach(function(d) {
    var ps = cadToScreen(d.proj.x, d.proj.y);
    var fs = cadToScreen(d.fact.x, d.fact.y);
    var col = d.ok ? '#22c55e' : '#ef4444';

    cx.save();
    // Arrow from proj to fact
    cx.strokeStyle = col; cx.lineWidth = 1.5;
    cx.setLineDash([]);
    cx.beginPath(); cx.moveTo(ps.x, ps.y); cx.lineTo(fs.x, fs.y); cx.stroke();

    // Arrowhead
    var ang = Math.atan2(fs.y - ps.y, fs.x - ps.x);
    cx.beginPath();
    cx.moveTo(fs.x, fs.y);
    cx.lineTo(fs.x - 10 * Math.cos(ang - 0.4), fs.y - 10 * Math.sin(ang - 0.4));
    cx.lineTo(fs.x - 10 * Math.cos(ang + 0.4), fs.y - 10 * Math.sin(ang + 0.4));
    cx.closePath(); cx.fillStyle = col; cx.fill();

    // Proj point (cross)
    cx.strokeStyle = '#6366f1'; cx.lineWidth = 1.5;
    cx.beginPath();
    cx.moveTo(ps.x - 6, ps.y); cx.lineTo(ps.x + 6, ps.y);
    cx.moveTo(ps.x, ps.y - 6); cx.lineTo(ps.x, ps.y + 6);
    cx.stroke();

    // Label bubble
    var lx = (ps.x + fs.x) / 2 + 8, ly = (ps.y + fs.y) / 2 - 8;
    var txt = d.dist + ' мм' + (d.dz != null ? ' / ' + (d.dz > 0 ? '+' : '') + d.dz + ' мм' : '');
    cx.font = 'bold 10px Arial';
    var tw = cx.measureText(txt).width;
    cx.fillStyle = d.ok ? 'rgba(22,163,74,.9)' : 'rgba(220,38,38,.9)';
    cx.beginPath();
    cx.roundRect ? cx.roundRect(lx - 2, ly - 11, tw + 8, 14, 3) :
      cx.rect(lx - 2, ly - 11, tw + 8, 14);
    cx.fill();
    cx.fillStyle = '#fff';
    cx.fillText(txt, lx + 2, ly);

    // Sub-label
    if (d.label) {
      cx.font = '9px Arial'; cx.fillStyle = '#94a3b8';
      cx.fillText(d.label, lx + 2, ly + 12);
    }
    cx.restore();
  });
};

// ── Auto-detect piles ───────────────────────────────────────────────────────
AB.autoDetectPiles = function() {
  if (typeof points === 'undefined' || !points.length) {
    if (typeof showMessage === 'function')
      showMessage('Сваи', 'Нет точек в проекте', 'warning');
    return;
  }
  // Find points named 'свая' or with type containing pile
  var piles = points.filter(function(p) {
    return p.type && (p.type.toLowerCase().includes('сва') ||
      p.type.toLowerCase().includes('pile') || p.type.toLowerCase().includes('ф'));
  });
  if (!piles.length) piles = points; // use all if no filter

  // Find circle elements in DXF = projected pile positions
  var projCircles = [];
  if (typeof dxfElements !== 'undefined' && dxfElements) {
    dxfElements.forEach(function(el) {
      if (el.type === 'CIRCLE') projCircles.push(el);
    });
  }

  if (!projCircles.length) {
    if (typeof showMessage === 'function')
      showMessage('Сваи', 'Не найдены окружности (проектные оси) в DXF', 'warning');
    return;
  }

  AB.pileDeviations = [];
  piles.forEach(function(p, i) {
    var best = null, bestD = Infinity;
    projCircles.forEach(function(c) {
      var d = Math.hypot(c.center.x - p.x, c.center.y - p.y);
      if (d < bestD) { bestD = d; best = c; }
    });
    if (best) {
      var dx = Math.round((p.x - best.center.x) * 1000);
      var dy = Math.round((p.y - best.center.y) * 1000);
      var dist = Math.round(bestD * 1000);
      AB.pileDeviations.push({
        n: i + 1, proj: best.center, fact: { x: p.x, y: p.y },
        dx: dx, dy: dy, dist: dist, ok: dist <= AB.tolerance
      });
      AB.deviations.push({
        proj: best.center, fact: { x: p.x, y: p.y },
        dx: dx, dy: dy, dz: null, dist: dist,
        label: 'Свая ' + (i + 1), ok: dist <= AB.tolerance, tol: AB.tolerance
      });
    }
  });
  AB.renderTable();
  if (typeof requestDraw === 'function') requestDraw();
  if (typeof showMessage === 'function')
    showMessage('Сваи', 'Найдено ' + AB.pileDeviations.length + ' свай', 'success');
};

// ── Export CSV ──────────────────────────────────────────────────────────────
AB.exportCSV = function() {
  var rows = ['№,Подпись,ΔX мм,ΔY мм,ΔZ мм,Δ мм,Допуск мм,Статус'];
  AB.deviations.forEach(function(d, i) {
    rows.push([i + 1, d.label, d.dx, d.dy, d.dz != null ? d.dz : '',
      d.dist, d.tol, d.ok ? 'В допуске' : 'ПРЕВЫШЕНИЕ'].join(','));
  });
  var blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'as-built-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
};

// ── Export PDF report ───────────────────────────────────────────────────────
AB.exportReport = function() {
  var date = new Date().toLocaleDateString('ru-RU');
  var ok = AB.deviations.filter(function(d) { return d.ok; }).length;
  var fail = AB.deviations.length - ok;

  var html = '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><style>' +
    'body{font-family:Arial;font-size:9pt;margin:15mm;}' +
    'h1{font-size:14pt;text-align:center;}h2{font-size:11pt;}' +
    'table{border-collapse:collapse;width:100%;}' +
    'th{background:#1e293b;color:#fff;padding:3pt 5pt;border:0.5pt solid #334155;}' +
    'td{padding:2pt 5pt;border:0.5pt solid #cbd5e1;}' +
    '.ok{background:#dcfce7;}.fail{background:#fee2e2;font-weight:bold;}' +
    '.summary{display:flex;gap:20pt;margin:8pt 0;padding:8pt;background:#f8fafc;border:0.5pt solid #e2e8f0;}' +
    '</style></head><body>' +
    '<h1>ВЕДОМОСТЬ ОТКЛОНЕНИЙ (ИСПОЛНИТЕЛЬНАЯ)</h1>' +
    '<p style="text-align:center;color:#475569;">Дата: ' + date + ' | Допуск: ' + AB.tolerance + ' мм</p>' +
    '<div class="summary">' +
    '<span>Всего: <b>' + AB.deviations.length + '</b></span>' +
    '<span style="color:#16a34a;">✓ В допуске: <b>' + ok + '</b></span>' +
    '<span style="color:#dc2626;">✗ Превышений: <b>' + fail + '</b></span>' +
    '</div>' +
    '<table><thead><tr>' +
    '<th>№</th><th>Подпись</th><th>ΔX, мм</th><th>ΔY, мм</th><th>ΔZ, мм</th><th>Δ, мм</th><th>Статус</th>' +
    '</tr></thead><tbody>' +
    AB.deviations.map(function(d, i) {
      return '<tr class="' + (d.ok ? 'ok' : 'fail') + '">' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + d.label + '</td>' +
        '<td>' + (d.dx > 0 ? '+' : '') + d.dx + '</td>' +
        '<td>' + (d.dy > 0 ? '+' : '') + d.dy + '</td>' +
        '<td>' + (d.dz != null ? (d.dz > 0 ? '+' : '') + d.dz : '—') + '</td>' +
        '<td><b>' + d.dist + '</b></td>' +
        '<td>' + (d.ok ? '✓ В допуске' : '✗ ПРЕВЫШЕНИЕ') + '</td></tr>';
    }).join('') +
    '</tbody></table></body></html>';

  var win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Разрешите всплывающие окна'); return; }
  win.document.write(html); win.document.close();
  setTimeout(function() { win.print(); }, 600);
};

window.openAsBuiltPanel = openAsBuiltPanel;
window.AB = AB;
