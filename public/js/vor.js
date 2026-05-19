// ════════════════════════════════════════════════════════════════════════════
// VOR.JS — ВОР и конструктивный блок
// Ведомость объёмов работ, раскладка ФБС, связь геометрии со сметой
// ════════════════════════════════════════════════════════════════════════════
'use strict';

var VOR = {
  items: [],      // [{name,unit,count,thickness,density,price}]
  fbsBlocks: [],  // раскладка ФБС/плит
};

// ── ФБС типоразмеры ─────────────────────────────────────────────────────────
VOR.FBS_TYPES = [
  { name: 'ФБС 24-4-6', l: 2.38, w: 0.4,  h: 0.58, weight: 1.3  },
  { name: 'ФБС 24-5-6', l: 2.38, w: 0.5,  h: 0.58, weight: 1.63 },
  { name: 'ФБС 24-6-6', l: 2.38, w: 0.6,  h: 0.58, weight: 1.96 },
  { name: 'ФБС 12-4-6', l: 1.18, w: 0.4,  h: 0.58, weight: 0.64 },
  { name: 'ФБС 12-5-6', l: 1.18, w: 0.5,  h: 0.58, weight: 0.78 },
  { name: 'ФБС 12-6-6', l: 1.18, w: 0.6,  h: 0.58, weight: 0.96 },
];

// ── ВОР номенклатура ────────────────────────────────────────────────────────
VOR.CATALOG = [
  { name: 'Разработка грунта (экскаватор)',     unit: 'м³', price: 420  },
  { name: 'Вывоз грунта',                       unit: 'м³', price: 380  },
  { name: 'Устройство песчаного основания',      unit: 'м³', price: 650  },
  { name: 'Устройство щебёночного основания',    unit: 'м³', price: 890  },
  { name: 'Бетон М200 (монолитный)',             unit: 'м³', price: 6500 },
  { name: 'Бетон М300 (монолитный)',             unit: 'м³', price: 7200 },
  { name: 'Армирование',                         unit: 'т',  price: 68000},
  { name: 'Устройство ФБС фундаментов',          unit: 'м³', price: 3800 },
  { name: 'Кирпичная кладка',                    unit: 'м³', price: 8500 },
  { name: 'Обратная засыпка',                    unit: 'м³', price: 320  },
  { name: 'Устройство рулонной гидроизоляции',   unit: 'м²', price: 420  },
  { name: 'Асфальтобетонное покрытие t=50мм',   unit: 'м²', price: 1200 },
  { name: 'Бортовой камень БР100.30.15',         unit: 'м',  price: 380  },
  { name: 'Прокладка трубы Ø200',               unit: 'м',  price: 1800 },
  { name: 'Прокладка трубы Ø300',               unit: 'м',  price: 2600 },
  { name: 'Монтаж колодца КЦ-1500',             unit: 'шт', price: 28000},
  { name: 'Устройство откосов',                  unit: 'м²', price: 180  },
  { name: 'Геотекстиль',                         unit: 'м²', price: 95   },
];

function openVORPanel() {
  var p = document.getElementById('vor-panel');
  if (p) { p.style.display = p.style.display === 'none' ? 'flex' : 'none'; return; }

  var panel = document.createElement('div');
  panel.id = 'vor-panel';
  panel.style.cssText =
    'position:fixed;top:90px;left:80px;width:480px;max-height:88vh;overflow-y:auto;' +
    'background:#1a2744;color:#f1f5f9;border-radius:12px;border:1px solid #2d3e6a;' +
    'box-shadow:0 16px 48px rgba(0,0,0,.5);z-index:9998;display:flex;' +
    'flex-direction:column;font-family:Arial,sans-serif;font-size:12px;';

  panel.innerHTML =
    '<div style="background:#0f1d38;padding:10px 14px;border-bottom:1px solid #2d3e6a;' +
    'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:16px;">📋</span>' +
        '<span style="font-weight:700;font-size:13px;">Ведомость объёмов работ</span>' +
      '</div>' +
      '<button onclick="document.getElementById(\'vor-panel\').style.display=\'none\'" ' +
      'style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;">✕</button>' +
    '</div>' +
    '<div style="padding:14px;display:flex;flex-direction:column;gap:12px;">' +

      // Auto-fill from geometry
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Автозаполнение из геометрии</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
          '<button onclick="VOR.addFromContours()" ' +
          'style="background:rgba(99,102,241,.2);border:1px solid #6366f1;color:#a5b4fc;' +
          'border-radius:6px;padding:7px;cursor:pointer;font-size:10px;font-weight:700;">' +
          '📐 Из контуров (площадь)</button>' +
          '<button onclick="VOR.addFromEarthworks()" ' +
          'style="background:rgba(16,185,129,.15);border:1px solid #10b981;color:#6ee7b7;' +
          'border-radius:6px;padding:7px;cursor:pointer;font-size:10px;font-weight:700;">' +
          '🏔 Из земляных работ</button>' +
          '<button onclick="VOR.addFromDimensions()" ' +
          'style="background:rgba(245,158,11,.15);border:1px solid #f59e0b;color:#fcd34d;' +
          'border-radius:6px;padding:7px;cursor:pointer;font-size:10px;font-weight:700;">' +
          '📏 Из размеров (длины)</button>' +
          '<button onclick="VOR.openFBSDialog()" ' +
          'style="background:rgba(239,68,68,.15);border:1px solid #ef4444;color:#f87171;' +
          'border-radius:6px;padding:7px;cursor:pointer;font-size:10px;font-weight:700;">' +
          '🧱 Раскладка ФБС</button>' +
        '</div>' +
      '</div>' +

      // Add manually
      '<div>' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:6px;">Добавить позицию</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<select id="vor-cat" style="flex:2;background:#2d3e6a;border:1px solid #3d5080;' +
          'border-radius:6px;color:#f1f5f9;padding:5px 7px;font-size:10px;">' +
          VOR.CATALOG.map(function(c) {
            return '<option value="' + c.name + '" data-unit="' + c.unit + '" data-price="' + c.price + '">' + c.name + '</option>';
          }).join('') +
          '</select>' +
          '<input type="number" id="vor-qty" placeholder="Кол-во" min="0" step="0.01" ' +
          'style="width:80px;background:#2d3e6a;border:1px solid #3d5080;border-radius:6px;' +
          'color:#60a5fa;padding:5px 7px;font-size:12px;text-align:center;outline:none;">' +
          '<button onclick="VOR.addManual()" ' +
          'style="background:#2563eb;border:none;color:#fff;border-radius:6px;' +
          'padding:5px 10px;cursor:pointer;font-size:13px;font-weight:bold;">+</button>' +
        '</div>' +
        '<div style="font-size:9px;color:#334155;margin-top:3px;">' +
        'Или: своё наименование + ед.изм + кол-во:</div>' +
        '<div style="display:flex;gap:4px;margin-top:3px;">' +
          '<input type="text" id="vor-cname" placeholder="Наименование" ' +
          'style="flex:3;background:#2d3e6a;border:1px solid #3d5080;border-radius:5px;' +
          'color:#f1f5f9;padding:4px 7px;font-size:10px;outline:none;">' +
          '<input type="text" id="vor-cunit" placeholder="м³" ' +
          'style="width:45px;background:#2d3e6a;border:1px solid #3d5080;border-radius:5px;' +
          'color:#f1f5f9;padding:4px 6px;font-size:10px;text-align:center;outline:none;">' +
          '<input type="number" id="vor-cqty" placeholder="0" step="0.01" ' +
          'style="width:65px;background:#2d3e6a;border:1px solid #3d5080;border-radius:5px;' +
          'color:#60a5fa;padding:4px 6px;font-size:10px;text-align:center;outline:none;">' +
          '<input type="number" id="vor-cprice" placeholder="Цена" ' +
          'style="width:70px;background:#2d3e6a;border:1px solid #3d5080;border-radius:5px;' +
          'color:#34d399;padding:4px 6px;font-size:10px;text-align:center;outline:none;">' +
          '<button onclick="VOR.addCustom()" ' +
          'style="background:#10b981;border:none;color:#fff;border-radius:5px;' +
          'padding:4px 8px;cursor:pointer;font-size:12px;font-weight:bold;">+</button>' +
        '</div>' +
      '</div>' +

      // VOR table
      '<div id="vor-table-wrap" style="max-height:240px;overflow-y:auto;">' +
        '<div style="font-size:10px;color:#334155;text-align:center;padding:8px;">Ведомость пуста</div>' +
      '</div>' +

      // Total
      '<div id="vor-total" style="background:#0f1d38;border-radius:8px;padding:10px;' +
      'display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="color:#64748b;font-size:11px;">Итого:</span>' +
        '<span id="vor-total-sum" style="font-size:16px;font-weight:700;color:#34d399;">0 ₽</span>' +
      '</div>' +

      // Export buttons
      '<div style="display:flex;gap:6px;">' +
        '<button onclick="VOR.exportPDF()" ' +
        'style="flex:2;background:#2563eb;border:none;color:#fff;border-radius:8px;' +
        'padding:8px;cursor:pointer;font-weight:700;font-size:12px;">📄 ВОР PDF</button>' +
        '<button onclick="VOR.exportCSV()" ' +
        'style="flex:1;background:#2d3e6a;border:none;color:#94a3b8;border-radius:8px;' +
        'padding:8px;cursor:pointer;font-size:11px;">📊 CSV</button>' +
        '<button onclick="VOR.items=[];VOR.renderTable();" ' +
        'style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;' +
        'border-radius:8px;padding:8px;cursor:pointer;font-size:11px;">🗑</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(panel);
}

VOR.addItem = function(name, unit, qty, price) {
  VOR.items.push({ name: name, unit: unit, qty: qty, price: price || 0 });
  VOR.renderTable();
};

VOR.addManual = function() {
  var sel = document.getElementById('vor-cat');
  var qty = parseFloat((document.getElementById('vor-qty') || {}).value) || 0;
  if (!sel || !qty) return;
  var opt = sel.selectedOptions[0];
  VOR.addItem(sel.value, opt.dataset.unit, qty, parseFloat(opt.dataset.price) || 0);
};

VOR.addCustom = function() {
  var name  = (document.getElementById('vor-cname') || {}).value || '';
  var unit  = (document.getElementById('vor-cunit') || {}).value || 'шт';
  var qty   = parseFloat((document.getElementById('vor-cqty') || {}).value) || 0;
  var price = parseFloat((document.getElementById('vor-cprice') || {}).value) || 0;
  if (!name || !qty) { if (typeof showMessage === 'function') showMessage('ВОР', 'Введите наименование и количество', 'warning'); return; }
  VOR.addItem(name, unit, qty, price);
};

VOR.addFromContours = function() {
  if (typeof savedContours === 'undefined' || !savedContours.length) {
    if (typeof showMessage === 'function') showMessage('ВОР', 'Нет контуров', 'warning'); return;
  }
  savedContours.forEach(function(c, i) {
    if (!c.area) return;
    VOR.addItem('Площадь контура ' + (i + 1) + ' (' + (c.material || '') + ')',
      'м²', parseFloat(c.area.toFixed(3)), 0);
    if (c.volume) VOR.addItem('Объём ' + (i + 1), 'м³', parseFloat(c.volume.toFixed(3)), 0);
  });
  if (typeof showMessage === 'function') showMessage('ВОР', 'Добавлено из контуров', 'success');
};

VOR.addFromEarthworks = function() {
  if (typeof EW === 'undefined' || !EW.cells.length) {
    if (typeof showMessage === 'function') showMessage('ВОР', 'Сначала рассчитайте картограмму', 'warning'); return;
  }
  var cut  = EW.cells.reduce(function(s, c) { return s + c.cut; }, 0);
  var fill = EW.cells.reduce(function(s, c) { return s + c.fill; }, 0);
  if (cut  > 0) VOR.addItem('Разработка грунта (выемка)', 'м³', parseFloat(cut.toFixed(2)), 420);
  if (fill > 0) VOR.addItem('Отсыпка / насыпь', 'м³', parseFloat(fill.toFixed(2)), 380);
  if (typeof showMessage === 'function') showMessage('ВОР', 'Земляные работы добавлены', 'success');
};

VOR.addFromDimensions = function() {
  if (typeof dimensions === 'undefined' || !dimensions.length) {
    if (typeof showMessage === 'function') showMessage('ВОР', 'Нет размерных линий', 'warning'); return;
  }
  var totalLen = 0;
  dimensions.forEach(function(d) {
    totalLen += Math.hypot(d.p2.x - d.p1.x, d.p2.y - d.p1.y);
  });
  VOR.addItem('Прокладка коммуникаций (длина по чертежу)', 'м', parseFloat(totalLen.toFixed(3)), 1800);
  if (typeof showMessage === 'function') showMessage('ВОР', 'Длина ' + totalLen.toFixed(2) + ' м добавлена', 'success');
};

// ── FBS layout dialog ────────────────────────────────────────────────────────
VOR.openFBSDialog = function() {
  var win = window.open('', '_blank', 'width=500,height=400');
  if (!win) return;
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>body{font-family:Arial;margin:20px;font-size:12px;background:#1a2744;color:#f1f5f9;}' +
    'select,input{background:#2d3e6a;border:1px solid #3d5080;border-radius:5px;color:#f1f5f9;padding:5px 8px;width:100%;}' +
    'button{background:#2563eb;border:none;color:#fff;border-radius:6px;padding:8px 16px;cursor:pointer;margin-top:10px;}' +
    'table{border-collapse:collapse;width:100%;margin-top:10px;font-size:11px;}' +
    'th{background:#0f1d38;color:#94a3b8;padding:4px;border:0.5px solid #334155;text-align:left;}' +
    'td{padding:4px;border:0.5px solid #334155;}' +
    '</style></head><body>' +
    '<h3 style="margin-top:0;">🧱 Раскладка ФБС</h3>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      '<div><label>Тип ФБС<br><select id="fbs-type">' +
        VOR.FBS_TYPES.map(function(f) {
          return '<option value="' + f.name + '" data-l="' + f.l + '" data-w="' + f.w + '" data-h="' + f.h + '" data-wt="' + f.weight + '">' +
            f.name + ' (' + f.l + '×' + f.w + '×' + f.h + ' м)</option>';
        }).join('') +
      '</select></label></div>' +
      '<div><label>Длина фундамента, м<br><input type="number" id="fbs-len" value="20" step="0.1"></label></div>' +
      '<div><label>Высота фундамента, м<br><input type="number" id="fbs-ht" value="1.2" step="0.1"></label></div>' +
      '<div><label>Шов, мм<br><input type="number" id="fbs-seam" value="20" step="5"></label></div>' +
    '</div>' +
    '<button onclick="calcFBS()">Рассчитать</button>' +
    '<div id="fbs-result"></div>' +
    '<script>function calcFBS(){' +
      'var sel=document.getElementById("fbs-type");' +
      'var opt=sel.selectedOptions[0];' +
      'var l=parseFloat(opt.dataset.l),h=parseFloat(opt.dataset.h),wt=parseFloat(opt.dataset.wt);' +
      'var len=parseFloat(document.getElementById("fbs-len").value)||20;' +
      'var ht=parseFloat(document.getElementById("fbs-ht").value)||1.2;' +
      'var seam=parseFloat(document.getElementById("fbs-seam").value)/1000||0.02;' +
      'var perRow=Math.ceil(len/(l+seam));' +
      'var rows=Math.ceil(ht/h);' +
      'var total=perRow*rows;' +
      'var totalWt=(total*wt).toFixed(2);' +
      'var vol=(total*l*parseFloat(opt.dataset.w)*h).toFixed(3);' +
      'document.getElementById("fbs-result").innerHTML=' +
        '"<table><tr><th>Параметр</th><th>Значение</th></tr>" +' +
        '"<tr><td>Блоков в ряду</td><td><b>"+perRow+"</b></td></tr>" +' +
        '"<tr><td>Рядов</td><td><b>"+rows+"</b></td></tr>" +' +
        '"<tr><td>Всего блоков</td><td><b>"+total+"</b></td></tr>" +' +
        '"<tr><td>Объём бетона</td><td><b>"+vol+" м³</b></td></tr>" +' +
        '"<tr><td>Масса</td><td><b>"+totalWt+" т</b></td></tr>" +' +
        '"</table>";' +
      '}' +
    '</s'+'cript></body></html>';
  win.document.write(html); win.document.close();
};

VOR.renderTable = function() {
  var wrap = document.getElementById('vor-table-wrap');
  if (!wrap) return;
  if (!VOR.items.length) {
    wrap.innerHTML = '<div style="font-size:10px;color:#334155;text-align:center;padding:8px;">Ведомость пуста</div>';
    document.getElementById('vor-total-sum').textContent = '0 ₽';
    return;
  }
  var totalSum = 0;
  wrap.innerHTML =
    '<table style="width:100%;border-collapse:collapse;font-size:10px;">' +
    '<thead><tr style="color:#64748b;">' +
    '<th style="text-align:left;padding:3px 4px;border-bottom:1px solid #1e3a5f;">Наименование</th>' +
    '<th style="padding:3px 4px;border-bottom:1px solid #1e3a5f;">Ед.</th>' +
    '<th style="padding:3px 4px;border-bottom:1px solid #1e3a5f;">Кол-во</th>' +
    '<th style="padding:3px 4px;border-bottom:1px solid #1e3a5f;">Цена</th>' +
    '<th style="padding:3px 4px;border-bottom:1px solid #1e3a5f;">Сумма</th>' +
    '<th style="padding:3px 4px;border-bottom:1px solid #1e3a5f;"></th>' +
    '</tr></thead><tbody>' +
    VOR.items.map(function(it, i) {
      var sum = it.qty * (it.price || 0);
      totalSum += sum;
      return '<tr style="border-bottom:1px solid #1e3a5f;">' +
        '<td style="padding:3px 4px;color:#e2e8f0;">' + it.name + '</td>' +
        '<td style="padding:3px 4px;text-align:center;color:#94a3b8;">' + it.unit + '</td>' +
        '<td style="padding:3px 4px;text-align:right;color:#60a5fa;font-family:monospace;">' +
          parseFloat(it.qty.toFixed(3)) + '</td>' +
        '<td style="padding:3px 4px;text-align:right;color:#94a3b8;">' +
          (it.price ? it.price.toLocaleString('ru-RU') : '—') + '</td>' +
        '<td style="padding:3px 4px;text-align:right;color:#34d399;font-weight:700;">' +
          (sum > 0 ? sum.toLocaleString('ru-RU') : '—') + '</td>' +
        '<td><button onclick="VOR.items.splice(' + i + ',1);VOR.renderTable()" ' +
          'style="background:none;border:none;color:#475569;cursor:pointer;font-size:12px;">✕</button></td>' +
        '</tr>';
    }).join('') +
    '</tbody></table>';

  var ts = document.getElementById('vor-total-sum');
  if (ts) ts.textContent = totalSum > 0 ? totalSum.toLocaleString('ru-RU') + ' ₽' : '0 ₽';
};

// ── Export PDF ───────────────────────────────────────────────────────────────
VOR.exportPDF = function() {
  if (!VOR.items.length) { if (typeof showMessage === 'function') showMessage('ВОР', 'Нет данных', 'warning'); return; }
  var totalSum = VOR.items.reduce(function(s, it) { return s + it.qty * (it.price || 0); }, 0);
  var date = new Date().toLocaleDateString('ru-RU');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    'body{font-family:Arial;font-size:9pt;margin:15mm;}' +
    'h1{font-size:13pt;text-align:center;}' +
    'table{border-collapse:collapse;width:100%;}' +
    'th{background:#1e293b;color:#fff;padding:3pt 5pt;border:0.3pt solid #334155;text-align:left;}' +
    'td{padding:2pt 5pt;border:0.3pt solid #cbd5e1;}' +
    'tr:nth-child(even) td{background:#f8fafc;}' +
    '.total{font-weight:bold;background:#f1f5f9;}' +
    '</style></head><body>' +
    '<h1>ВЕДОМОСТЬ ОБЪЁМОВ РАБОТ (ВОР)</h1>' +
    '<p style="text-align:center;color:#475569;">Дата: ' + date + '</p>' +
    '<table><thead><tr>' +
    '<th>№</th><th>Наименование работ</th><th>Ед.изм.</th>' +
    '<th style="text-align:right;">Объём</th>' +
    '<th style="text-align:right;">Цена, ₽</th>' +
    '<th style="text-align:right;">Стоимость, ₽</th>' +
    '</tr></thead><tbody>' +
    VOR.items.map(function(it, i) {
      var sum = it.qty * (it.price || 0);
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + it.name + '</td>' +
        '<td style="text-align:center;">' + it.unit + '</td>' +
        '<td style="text-align:right;font-family:monospace;">' + it.qty.toFixed(3) + '</td>' +
        '<td style="text-align:right;">' + (it.price ? it.price.toLocaleString('ru-RU') : '—') + '</td>' +
        '<td style="text-align:right;font-weight:bold;">' +
          (sum > 0 ? sum.toLocaleString('ru-RU') : '—') + '</td></tr>';
    }).join('') +
    '<tr class="total"><td colspan="5">ИТОГО</td>' +
    '<td style="text-align:right;">' + totalSum.toLocaleString('ru-RU') + ' ₽</td></tr>' +
    '</tbody></table>' +
    '<p style="margin-top:20pt;font-size:8pt;color:#475569;">Ведомость сформирована в CAD Extractor 3D</p>' +
    '</body></html>';

  var win = window.open('', '_blank', 'width=1000,height=700');
  if (!win) { alert('Разрешите всплывающие окна'); return; }
  win.document.write(html); win.document.close();
  setTimeout(function() { win.print(); }, 600);
};

VOR.exportCSV = function() {
  var rows = ['\uFEFF№,Наименование,Ед.изм.,Объём,Цена,Сумма'];
  VOR.items.forEach(function(it, i) {
    rows.push([i + 1, '"' + it.name + '"', it.unit,
      it.qty.toFixed(3), it.price || 0,
      (it.qty * (it.price || 0)).toFixed(2)].join(','));
  });
  var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'VOR-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
};

window.openVORPanel = openVORPanel;
window.VOR = VOR;
