// ════════════════════════════════════════════════════════════════════════════
// EARTHWORKS.JS — Земляные работы и картограммы
// Картограмма квадратов, расчёт объёмов, откосы
// ════════════════════════════════════════════════════════════════════════════
'use strict';

var EW = {
  gridStep: 10,       // размер квадрата сетки, м
  blackSurface: null, // TIN чёрной поверхности (точки до работ)
  redSurface: null,   // TIN красной поверхности (проектная/факт)
  cells: [],          // [{x,y,cut,fill,corners:[{bz,rz,work}]}]
  showCartogram: true,
};

// ── Открыть панель ──────────────────────────────────────────────────────────
function openEarthworksPanel() {
  var p = document.getElementById('ew-panel');
  if (p) { p.style.display = p.style.display === 'none' ? 'flex' : 'none'; return; }

  var panel = document.createElement('div');
  panel.id = 'ew-panel';
  panel.style.cssText =
    'position:fixed;top:90px;left:80px;width:340px;max-height:85vh;overflow-y:auto;' +
    'background:#1a2744;color:#f1f5f9;border-radius:12px;border:1px solid #2d3e6a;' +
    'box-shadow:0 16px 48px rgba(0,0,0,.5);z-index:9998;display:flex;' +
    'flex-direction:column;font-family:Arial,sans-serif;font-size:12px;';

  panel.innerHTML =
    '<div style="background:#0f1d38;padding:10px 14px;border-bottom:1px solid #2d3e6a;' +
    'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:16px;">🏔</span>' +
        '<span style="font-weight:700;font-size:13px;">Земляные работы</span>' +
      '</div>' +
      '<button onclick="document.getElementById(\'ew-panel\').style.display=\'none\'" ' +
      'style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;">✕</button>' +
    '</div>' +
    '<div style="padding:14px;display:flex;flex-direction:column;gap:12px;">' +

      // Surface sources
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Поверхности</div>' +
        '<button onclick="EW.useCurrentAsBlack()" ' +
        'style="width:100%;background:rgba(100,116,139,.2);border:1px solid #475569;color:#94a3b8;' +
        'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;margin-bottom:4px;">' +
        '📍 Текущие точки → Чёрная (существующая)</button>' +
        '<button onclick="EW.useProjectDXFasRed()" ' +
        'style="width:100%;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);color:#f87171;' +
        'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;">' +
        '📐 DXF Z-отметки → Красная (проектная)</button>' +
        '<div id="ew-surfaces-info" style="font-size:10px;color:#475569;margin-top:4px;"></div>' +
      '</div>' +

      // Grid step
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Шаг квадратов картограммы</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<input type="number" id="ew-step" value="10" min="1" max="100" ' +
          'style="width:70px;background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;' +
          'color:#60a5fa;padding:5px 8px;font-size:14px;text-align:center;outline:none;">' +
          '<span style="color:#475569;font-size:10px;">м</span>' +
          '<div style="display:flex;gap:4px;">' +
            '<button onclick="EW.setStep(5)"  style="' + _ewBtn() + '">5</button>' +
            '<button onclick="EW.setStep(10)" style="' + _ewBtn() + '">10</button>' +
            '<button onclick="EW.setStep(20)" style="' + _ewBtn() + '">20</button>' +
            '<button onclick="EW.setStep(50)" style="' + _ewBtn() + '">50</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Slope
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Откос (заложение)</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="color:#94a3b8;">1 :</span>' +
          '<input type="number" id="ew-slope" value="1.5" min="0.1" max="10" step="0.1" ' +
          'style="width:70px;background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;' +
          'color:#60a5fa;padding:5px 8px;font-size:14px;text-align:center;outline:none;">' +
          '<button onclick="EW.buildSlopes()" ' +
          'style="flex:1;background:rgba(99,102,241,.2);border:1px solid #6366f1;color:#a5b4fc;' +
          'border-radius:6px;padding:5px;cursor:pointer;font-size:11px;">Построить откосы</button>' +
        '</div>' +
      '</div>' +

      // Calculate
      '<button onclick="EW.calculate()" ' +
      'style="background:#2563eb;border:none;color:#fff;border-radius:8px;padding:10px;' +
      'cursor:pointer;font-weight:700;font-size:13px;">📊 Рассчитать картограмму</button>' +

      // Results
      '<div id="ew-results" style="display:flex;flex-direction:column;gap:6px;"></div>' +

      // Legend
      '<div style="display:flex;gap:8px;font-size:10px;justify-content:center;">' +
        '<span style="display:flex;align-items:center;gap:4px;">' +
          '<span style="width:16px;height:16px;background:rgba(37,99,235,.5);border-radius:2px;"></span>Выемка</span>' +
        '<span style="display:flex;align-items:center;gap:4px;">' +
          '<span style="width:16px;height:16px;background:rgba(220,38,38,.5);border-radius:2px;"></span>Насыпь</span>' +
      '</div>' +

      '<div style="display:flex;gap:6px;">' +
        '<button onclick="EW.exportReport()" ' +
        'style="flex:1;background:#2d3e6a;border:none;color:#94a3b8;border-radius:6px;padding:7px;cursor:pointer;font-size:11px;">📄 Отчёт</button>' +
        '<button onclick="EW.cells=[];EW.blackSurface=null;EW.redSurface=null;' +
        'document.getElementById(\'ew-results\').innerHTML=\'\';requestDraw();" ' +
        'style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;' +
        'border-radius:6px;padding:7px;cursor:pointer;font-size:11px;">🗑 Сброс</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(panel);
}

function _ewBtn() {
  return 'background:#2d3e6a;border:1px solid #3d5080;color:#94a3b8;' +
    'border-radius:4px;padding:3px 7px;cursor:pointer;font-size:10px;';
}

EW.setStep = function(v) {
  EW.gridStep = v;
  var el = document.getElementById('ew-step'); if (el) el.value = v;
};

EW.useCurrentAsBlack = function() {
  if (typeof points === 'undefined' || !points.length) {
    if (typeof showMessage === 'function') showMessage('Земляные', 'Нет точек', 'warning'); return;
  }
  EW.blackSurface = points.filter(function(p) { return p.z != null; })
    .map(function(p) { return { x: p.x, y: p.y, z: p.z }; });
  EW._updateInfo();
  if (typeof showMessage === 'function')
    showMessage('Земляные', 'Чёрная поверхность: ' + EW.blackSurface.length + ' точек', 'success');
};

EW.useProjectDXFasRed = function() {
  var redPts = [];
  if (typeof cadSnapPoints !== 'undefined' && cadSnapPoints) {
    cadSnapPoints.forEach(function(p) {
      if (p.z != null) redPts.push({ x: p.x, y: p.y, z: p.z });
    });
  }
  if (!redPts.length) {
    if (typeof showMessage === 'function')
      showMessage('Земляные', 'Нет Z-отметок в DXF', 'warning'); return;
  }
  EW.redSurface = redPts;
  EW._updateInfo();
  if (typeof showMessage === 'function')
    showMessage('Земляные', 'Красная поверхность: ' + redPts.length + ' точек', 'success');
};

EW._updateInfo = function() {
  var el = document.getElementById('ew-surfaces-info');
  if (!el) return;
  el.textContent =
    'Чёрная: ' + (EW.blackSurface ? EW.blackSurface.length + ' т.' : 'не задана') +
    ' | Красная: ' + (EW.redSurface ? EW.redSurface.length + ' т.' : 'не задана');
};

// ── IDW interpolation ───────────────────────────────────────────────────────
EW._interpolateZ = function(pts, x, y) {
  if (!pts || !pts.length) return null;
  var sumW = 0, sumWZ = 0;
  pts.forEach(function(p) {
    var d = Math.hypot(p.x - x, p.y - y);
    if (d < 0.001) { sumW = 1; sumWZ = p.z; return; }
    var w = 1 / (d * d);
    sumW += w; sumWZ += w * p.z;
  });
  return sumW > 0 ? sumWZ / sumW : null;
};

// ── Calculate cartogram ─────────────────────────────────────────────────────
EW.calculate = function() {
  var black = EW.blackSurface || (typeof points !== 'undefined' ?
    points.filter(function(p) { return p.z != null; }) : []);
  var red   = EW.redSurface || [];

  if (!black.length || !red.length) {
    if (typeof showMessage === 'function')
      showMessage('Земляные', 'Задайте обе поверхности', 'warning');
    return;
  }

  var step = parseFloat((document.getElementById('ew-step') || {}).value) || EW.gridStep;
  EW.gridStep = step;

  // Bounds
  var xs = black.concat(red).map(function(p) { return p.x; });
  var ys = black.concat(red).map(function(p) { return p.y; });
  var x0 = Math.floor(Math.min.apply(null, xs) / step) * step;
  var x1 = Math.ceil(Math.max.apply(null, xs) / step) * step;
  var y0 = Math.floor(Math.min.apply(null, ys) / step) * step;
  var y1 = Math.ceil(Math.max.apply(null, ys) / step) * step;

  EW.cells = [];
  var totalCut = 0, totalFill = 0;

  for (var cx2 = x0; cx2 < x1; cx2 += step) {
    for (var cy2 = y0; cy2 < y1; cy2 += step) {
      var corners = [
        { x: cx2, y: cy2 }, { x: cx2 + step, y: cy2 },
        { x: cx2 + step, y: cy2 + step }, { x: cx2, y: cy2 + step }
      ].map(function(c) {
        var bz = EW._interpolateZ(black, c.x, c.y);
        var rz = EW._interpolateZ(red, c.x, c.y);
        return { x: c.x, y: c.y, bz: bz, rz: rz,
          work: (bz != null && rz != null) ? rz - bz : null };
      });

      var validWork = corners.filter(function(c) { return c.work != null; });
      if (!validWork.length) continue;

      var avgWork = validWork.reduce(function(s, c) { return s + c.work; }, 0) / validWork.length;
      var vol = avgWork * step * step;
      var cut = 0, fill = 0;
      if (vol < 0) cut = Math.abs(vol);
      else fill = vol;

      totalCut += cut; totalFill += fill;

      EW.cells.push({
        x: cx2, y: cy2, w: step, h: step,
        avgWork: avgWork, vol: vol, cut: cut, fill: fill, corners: corners
      });
    }
  }

  // Show results
  var res = document.getElementById('ew-results');
  if (res) {
    res.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
        '<div style="background:rgba(37,99,235,.2);border:1px solid #2563eb;border-radius:8px;padding:10px;text-align:center;">' +
          '<div style="font-size:10px;color:#64748b;margin-bottom:4px;">ВЫЕМКА</div>' +
          '<div style="font-size:18px;font-weight:700;color:#60a5fa;">' + totalCut.toFixed(1) + '</div>' +
          '<div style="font-size:9px;color:#475569;">м³</div>' +
        '</div>' +
        '<div style="background:rgba(239,68,68,.2);border:1px solid #ef4444;border-radius:8px;padding:10px;text-align:center;">' +
          '<div style="font-size:10px;color:#64748b;margin-bottom:4px;">НАСЫПЬ</div>' +
          '<div style="font-size:18px;font-weight:700;color:#f87171;">' + totalFill.toFixed(1) + '</div>' +
          '<div style="font-size:9px;color:#475569;">м³</div>' +
        '</div>' +
      '</div>' +
      '<div style="background:#1e293b;border-radius:6px;padding:8px;font-size:10px;color:#64748b;">' +
        '📊 Квадратов: ' + EW.cells.length + ' | Шаг: ' + step + ' м | Баланс: ' +
        (totalFill - totalCut > 0 ? '+' : '') + (totalFill - totalCut).toFixed(1) + ' м³' +
      '</div>';
  }

  if (typeof requestDraw === 'function') requestDraw();
  if (typeof showMessage === 'function')
    showMessage('Картограмма', 'Выемка: ' + totalCut.toFixed(1) + ' м³ | Насыпь: ' + totalFill.toFixed(1) + ' м³', 'success');
};

// ── Build slopes ────────────────────────────────────────────────────────────
EW.buildSlopes = function() {
  var slope = parseFloat((document.getElementById('ew-slope') || {}).value) || 1.5;
  // Find contour boundary
  if (typeof savedContours === 'undefined' || !savedContours.length) {
    if (typeof showMessage === 'function')
      showMessage('Откосы', 'Сначала постройте контур котлована', 'warning');
    return;
  }
  var contour = savedContours[savedContours.length - 1];
  if (!contour || !contour.pts) return;

  // Average depth
  var depths = contour.pts.map(function(p) {
    var bz = EW._interpolateZ(EW.blackSurface || [], p.x, p.y);
    return bz != null ? Math.abs(bz) : 0;
  });
  var avgD = depths.reduce(function(s, v) { return s + v; }, 0) / depths.length;
  var slopeW = avgD * slope; // horizontal width of slope

  if (typeof showMessage === 'function')
    showMessage('Откосы', 'Откос 1:' + slope + ' | Ср. глубина: ' + avgD.toFixed(2) +
      ' м | Ширина откоса: ' + slopeW.toFixed(2) + ' м', 'success');
};

// ── Draw cartogram ──────────────────────────────────────────────────────────
EW.draw = function(cx2, sc) {
  if (!EW.cells.length || !EW.showCartogram) return;
  if (typeof cadToScreen !== 'function') return;

  EW.cells.forEach(function(cell) {
    var p0 = cadToScreen(cell.x, cell.y);
    var p1 = cadToScreen(cell.x + cell.w, cell.y + cell.h);
    var w  = Math.abs(p1.x - p0.x), h = Math.abs(p1.y - p0.y);
    var sx = Math.min(p0.x, p1.x), sy = Math.min(p0.y, p1.y);

    // Intensity by volume (max 2 m³/m² = full color)
    var intensity = Math.min(Math.abs(cell.avgWork) / 2, 1);
    cx2.save();
    cx2.globalAlpha = 0.15 + intensity * 0.45;
    cx2.fillStyle = cell.avgWork < 0 ? '#2563eb' : '#ef4444';
    cx2.fillRect(sx, sy, w, h);
    cx2.globalAlpha = 1;

    // Border
    cx2.strokeStyle = cell.avgWork < 0 ? 'rgba(37,99,235,.4)' : 'rgba(239,68,68,.4)';
    cx2.lineWidth = 0.5;
    cx2.strokeRect(sx, sy, w, h);

    // Label (working mark)
    if (w > 30 && h > 16) {
      cx2.font = 'bold ' + Math.min(11, w / 5) + 'px Arial';
      cx2.textAlign = 'center'; cx2.textBaseline = 'middle';
      cx2.fillStyle = '#fff';
      var txt = (cell.avgWork > 0 ? '+' : '') + cell.avgWork.toFixed(2);
      cx2.strokeStyle = 'rgba(0,0,0,.5)'; cx2.lineWidth = 2;
      cx2.strokeText(txt, sx + w / 2, sy + h / 2);
      cx2.fillText(txt, sx + w / 2, sy + h / 2);
    }
    cx2.restore();
  });
};

// ── Export report ───────────────────────────────────────────────────────────
EW.exportReport = function() {
  if (!EW.cells.length) {
    if (typeof showMessage === 'function') showMessage('Земляные', 'Нет данных', 'warning'); return;
  }
  var totalCut = EW.cells.reduce(function(s, c) { return s + c.cut; }, 0);
  var totalFill = EW.cells.reduce(function(s, c) { return s + c.fill; }, 0);
  var date = new Date().toLocaleDateString('ru-RU');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    'body{font-family:Arial;font-size:9pt;margin:15mm;}' +
    'h1{font-size:13pt;text-align:center;}' +
    'table{border-collapse:collapse;width:100%;font-size:8pt;}' +
    'th{background:#1e293b;color:#fff;padding:3pt;border:0.3pt solid #334155;}' +
    'td{padding:2pt 4pt;border:0.3pt solid #cbd5e1;text-align:center;}' +
    '.cut{background:#dbeafe;}.fill{background:#fee2e2;}' +
    '</style></head><body>' +
    '<h1>ВЕДОМОСТЬ ОБЪЁМОВ ЗЕМЛЯНЫХ РАБОТ</h1>' +
    '<p style="text-align:center;color:#475569;">Дата: ' + date + ' | Шаг сетки: ' + EW.gridStep + ' м</p>' +
    '<p><b>Выемка: ' + totalCut.toFixed(2) + ' м³</b> | ' +
    '<b style="color:#dc2626;">Насыпь: ' + totalFill.toFixed(2) + ' м³</b> | ' +
    'Баланс: ' + (totalFill - totalCut > 0 ? '+' : '') + (totalFill - totalCut).toFixed(2) + ' м³</p>' +
    '<table><thead><tr>' +
    '<th>X, м</th><th>Y, м</th><th>Раб. отметка, м</th><th>Выемка, м³</th><th>Насыпь, м³</th>' +
    '</tr></thead><tbody>' +
    EW.cells.map(function(c) {
      return '<tr class="' + (c.avgWork < 0 ? 'cut' : 'fill') + '">' +
        '<td>' + c.x.toFixed(1) + '</td>' +
        '<td>' + c.y.toFixed(1) + '</td>' +
        '<td>' + (c.avgWork > 0 ? '+' : '') + c.avgWork.toFixed(3) + '</td>' +
        '<td>' + (c.cut > 0 ? c.cut.toFixed(2) : '') + '</td>' +
        '<td>' + (c.fill > 0 ? c.fill.toFixed(2) : '') + '</td></tr>';
    }).join('') +
    '<tr style="font-weight:bold;background:#f1f5f9;">' +
    '<td colspan="3">ИТОГО</td>' +
    '<td>' + totalCut.toFixed(2) + '</td>' +
    '<td>' + totalFill.toFixed(2) + '</td>' +
    '</tr></tbody></table></body></html>';

  var win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Разрешите всплывающие окна'); return; }
  win.document.write(html); win.document.close();
  setTimeout(function() { win.print(); }, 600);
};

window.openEarthworksPanel = openEarthworksPanel;
window.EW = EW;
