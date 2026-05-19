// ════════════════════════════════════════════════════════════════════════════
// CADASTRE-SEARCH.JS — Кадастровый поиск (ПКК Росреестр)
// Открывает pkk.rosreestr.ru в модальном окне / новой вкладке
// ════════════════════════════════════════════════════════════════════════════
'use strict';

var CADASTRE = {
  PKK_URL: 'https://pkk.rosreestr.ru',
  history: [],
};

function openCadastreSearch() {
  var p = document.getElementById('cadastre-modal');
  if (p) { p.style.display = p.style.display === 'none' ? 'flex' : 'none'; return; }
  _buildCadastreModal();
}

function _buildCadastreModal() {
  var modal = document.createElement('div');
  modal.id = 'cadastre-modal';
  modal.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99999;' +
    'display:flex;align-items:center;justify-content:center;padding:16px;';

  modal.innerHTML =
    '<div style="width:min(680px,100%);background:#1a2744;border-radius:14px;' +
    'border:1px solid #2d3e6a;box-shadow:0 24px 64px rgba(0,0,0,.7);' +
    'display:flex;flex-direction:column;max-height:90vh;font-family:Arial,sans-serif;">' +

      // ── Header ──────────────────────────────────────────────────────────
      '<div style="background:#0f1d38;padding:14px 18px;border-bottom:1px solid #2d3e6a;' +
      'border-radius:14px 14px 0 0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:22px;">🗺</span>' +
          '<div>' +
            '<div style="font-weight:700;font-size:14px;color:#f1f5f9;">Кадастровый поиск</div>' +
            '<div style="font-size:10px;color:#475569;margin-top:1px;">Публичная кадастровая карта · Росреестр</div>' +
          '</div>' +
        '</div>' +
        '<button onclick="document.getElementById(\'cadastre-modal\').style.display=\'none\'" ' +
        'style="background:rgba(255,255,255,.05);border:1px solid #334155;color:#64748b;' +
        'border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px;" title="Закрыть">✕</button>' +
      '</div>' +

      // ── Search ──────────────────────────────────────────────────────────
      '<div style="padding:16px 18px;border-bottom:1px solid #1e3a5f;flex-shrink:0;">' +

        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:8px;">Кадастровый номер</div>' +

        '<div style="display:flex;gap:8px;">' +
          '<input id="cad-num-input" type="text" placeholder="77:06:0001001:1234" ' +
          'style="flex:1;background:#2d3e6a;border:1px solid #3d5080;border-radius:8px;' +
          'color:#f1f5f9;padding:8px 12px;font-size:13px;font-family:monospace;outline:none;' +
          'letter-spacing:.5px;" ' +
          'oninput="CADASTRE.formatInput(this)" ' +
          'onkeydown="if(event.key===\'Enter\')CADASTRE.openPKK()">' +
          '<button onclick="CADASTRE.openPKK()" ' +
          'style="background:#2563eb;border:none;color:#fff;border-radius:8px;' +
          'padding:8px 16px;cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap;">' +
          '🔍 Найти</button>' +
        '</div>' +

        '<div style="font-size:10px;color:#334155;margin-top:6px;">' +
        'Формат: <span style="color:#60a5fa;font-family:monospace;">РР:КК:GGGGGG:НН</span> ' +
        '· напр. <span style="color:#60a5fa;font-family:monospace;">77:06:0001001:1</span></div>' +

        // Format presets
        '<div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">' +
          '<span style="font-size:10px;color:#475569;align-self:center;">Регион:</span>' +
          '<button onclick="CADASTRE.setRegion(\'77\')" style="' + _cadBtn() + '">77 Москва</button>' +
          '<button onclick="CADASTRE.setRegion(\'78\')" style="' + _cadBtn() + '">78 СПб</button>' +
          '<button onclick="CADASTRE.setRegion(\'50\')" style="' + _cadBtn() + '">50 МО</button>' +
          '<button onclick="CADASTRE.setRegion(\'23\')" style="' + _cadBtn() + '">23 Краснодар</button>' +
          '<button onclick="CADASTRE.setRegion(\'66\')" style="' + _cadBtn() + '">66 Свердловск</button>' +
        '</div>' +
      '</div>' +

      // ── Actions ─────────────────────────────────────────────────────────
      '<div style="padding:14px 18px;border-bottom:1px solid #1e3a5f;flex-shrink:0;">' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:10px;">Открыть карту</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +

          // Main PKK button
          '<button onclick="CADASTRE.openPKK()" ' +
          'style="display:flex;align-items:center;justify-content:center;gap:8px;' +
          'background:linear-gradient(135deg,#1d4ed8,#2563eb);border:none;color:#fff;' +
          'border-radius:10px;padding:12px;cursor:pointer;font-size:12px;font-weight:700;">' +
          '<span style="font-size:18px;">🗺</span>' +
          '<div style="text-align:left;">' +
            '<div>Публичная кадастровая карта</div>' +
            '<div style="font-size:9px;font-weight:400;color:#93c5fd;margin-top:1px;">pkk.rosreestr.ru</div>' +
          '</div></button>' +

          // New tab button
          '<button onclick="CADASTRE.openNewTab()" ' +
          'style="display:flex;align-items:center;justify-content:center;gap:8px;' +
          'background:#1e293b;border:1px solid #334155;color:#94a3b8;' +
          'border-radius:10px;padding:12px;cursor:pointer;font-size:12px;">' +
          '<span style="font-size:18px;">↗</span>' +
          '<div style="text-align:left;">' +
            '<div style="color:#e2e8f0;">Открыть в новой вкладке</div>' +
            '<div style="font-size:9px;color:#475569;margin-top:1px;">без ограничений</div>' +
          '</div></button>' +

        '</div>' +

        // Alternate sources
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin:12px 0 8px;">Дополнительные источники</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button onclick="window.open(\'https://pkk.rosreestr.ru\',\'_blank\')" ' +
          'style="' + _cadSourceBtn('#1e3a5f','#60a5fa') + '">📍 ПКК Росреестр</button>' +
          '<button onclick="window.open(\'https://egrnka.ru\',\'_blank\')" ' +
          'style="' + _cadSourceBtn('#1e2a1e','#4ade80') + '">📋 ЕГРН онлайн</button>' +
          '<button onclick="window.open(\'https://rosreestr.gov.ru\',\'_blank\')" ' +
          'style="' + _cadSourceBtn('#2a1e1e','#f87171') + '">🏛 Росреестр</button>' +
          '<button onclick="window.open(\'https://map.ru/pkk\',\'_blank\')" ' +
          'style="' + _cadSourceBtn('#1e2a2a','#34d399') + '">🗺 map.ru/pkk</button>' +
        '</div>' +
      '</div>' +

      // ── History ─────────────────────────────────────────────────────────
      '<div style="padding:14px 18px;flex:1;overflow-y:auto;">' +
        '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:.5px;margin-bottom:8px;">История поиска</div>' +
        '<div id="cadastre-history" style="display:flex;flex-direction:column;gap:4px;">' +
          '<div style="font-size:11px;color:#334155;text-align:center;padding:8px;">История пуста</div>' +
        '</div>' +
      '</div>' +

      // ── Footer ───────────────────────────────────────────────────────────
      '<div style="padding:10px 18px;background:#0f1d38;border-top:1px solid #1e3a5f;' +
      'border-radius:0 0 14px 14px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">' +
        '<span style="font-size:10px;color:#334155;">Данные: Росреестр РФ</span>' +
        '<button onclick="CADASTRE.history=[];CADASTRE.renderHistory()" ' +
        'style="background:none;border:none;color:#475569;cursor:pointer;font-size:10px;">Очистить историю</button>' +
      '</div>' +

    '</div>';

  // Close on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  document.body.appendChild(modal);
}

function _cadBtn() {
  return 'background:#2d3e6a;border:1px solid #3d5080;color:#94a3b8;border-radius:5px;' +
    'padding:3px 8px;cursor:pointer;font-size:10px;white-space:nowrap;';
}
function _cadSourceBtn(bg, col) {
  return 'background:' + bg + ';border:1px solid ' + col + '33;color:' + col + ';' +
    'border-radius:6px;padding:5px 10px;cursor:pointer;font-size:11px;white-space:nowrap;';
}

// ── Format cadastre number as user types ────────────────────────────────────
CADASTRE.formatInput = function(input) {
  var raw = input.value.replace(/[^\d:]/g, '');
  // Keep colons in positions 2, 5, 12
  input.value = raw;
};

CADASTRE.setRegion = function(code) {
  var inp = document.getElementById('cad-num-input');
  if (!inp) return;
  if (!inp.value || !inp.value.startsWith(code)) {
    inp.value = code + ':';
  }
  inp.focus();
};

// ── Open PKK in iframe modal ─────────────────────────────────────────────────
CADASTRE.openPKK = function() {
  var num = (document.getElementById('cad-num-input') || {}).value || '';
  var url = CADASTRE.PKK_URL;
  if (num.trim()) {
    url = CADASTRE.PKK_URL + '/#' + encodeURIComponent(num.trim());
    CADASTRE._addHistory(num.trim());
  }

  // Try iframe first, fall back to new tab if blocked
  var iwin = document.getElementById('cadastre-iframe-win');
  if (iwin) { iwin.remove(); }

  var imodal = document.createElement('div');
  imodal.id = 'cadastre-iframe-win';
  imodal.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100000;' +
    'display:flex;flex-direction:column;padding:12px;gap:0;';

  imodal.innerHTML =
    '<div style="background:#0f1d38;border-radius:12px 12px 0 0;padding:8px 14px;' +
    'display:flex;align-items:center;justify-content:space-between;border:1px solid #2d3e6a;border-bottom:none;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:14px;">🗺</span>' +
        '<span style="color:#f1f5f9;font-size:12px;font-weight:600;">Публичная кадастровая карта</span>' +
        '<span style="color:#475569;font-size:10px;">pkk.rosreestr.ru' + (num ? ' · ' + num : '') + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;">' +
        '<button onclick="window.open(\'' + url + '\',\'_blank\')" ' +
        'style="background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;' +
        'padding:4px 10px;cursor:pointer;font-size:11px;" title="Открыть в новой вкладке">↗ Вкладка</button>' +
        '<button onclick="document.getElementById(\'cadastre-iframe-win\').remove()" ' +
        'style="background:#1e293b;border:1px solid #334155;color:#64748b;border-radius:6px;' +
        'padding:4px 10px;cursor:pointer;font-size:13px;">✕</button>' +
      '</div>' +
    '</div>' +
    '<div style="flex:1;border:1px solid #2d3e6a;border-radius:0 0 12px 12px;overflow:hidden;">' +
      '<iframe id="cadastre-iframe" src="' + url + '" ' +
      'style="width:100%;height:100%;border:none;" ' +
      'allow="geolocation" ' +
      'onerror="CADASTRE._iframeBlocked()">' +
      '</iframe>' +
      '<div id="cad-iframe-fallback" style="display:none;height:100%;background:#1a2744;' +
      'align-items:center;justify-content:center;flex-direction:column;gap:12px;">' +
        '<span style="font-size:40px;">🔒</span>' +
        '<div style="color:#f1f5f9;font-weight:700;font-size:14px;">Сайт запрещает встроенный просмотр</div>' +
        '<div style="color:#64748b;font-size:12px;">Откройте в новой вкладке</div>' +
        '<button onclick="window.open(\'' + url + '\',\'_blank\')" ' +
        'style="background:#2563eb;border:none;color:#fff;border-radius:8px;' +
        'padding:10px 24px;cursor:pointer;font-size:13px;font-weight:700;">↗ Открыть в новой вкладке</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(imodal);

  // Close on backdrop
  imodal.addEventListener('click', function(e) {
    if (e.target === imodal) imodal.remove();
  });

  // Detect X-Frame-Options block after 2s
  setTimeout(function() {
    var iframe = document.getElementById('cadastre-iframe');
    if (!iframe) return;
    try {
      var test = iframe.contentDocument;
      if (!test || test.body === null || test.body.innerHTML === '') {
        CADASTRE._iframeBlocked();
      }
    } catch(e) {
      CADASTRE._iframeBlocked();
    }
  }, 2500);

  // Close the search panel
  var searchModal = document.getElementById('cadastre-modal');
  if (searchModal) searchModal.style.display = 'none';
};

CADASTRE._iframeBlocked = function() {
  var iframe = document.getElementById('cadastre-iframe');
  var fallback = document.getElementById('cad-iframe-fallback');
  if (iframe)   { iframe.style.display = 'none'; }
  if (fallback) { fallback.style.display = 'flex'; }
};

CADASTRE.openNewTab = function() {
  var num = (document.getElementById('cad-num-input') || {}).value || '';
  var url = CADASTRE.PKK_URL + (num.trim() ? '/#' + encodeURIComponent(num.trim()) : '');
  if (num.trim()) CADASTRE._addHistory(num.trim());
  window.open(url, '_blank');
};

// ── History ──────────────────────────────────────────────────────────────────
CADASTRE._addHistory = function(num) {
  if (!num) return;
  CADASTRE.history = CADASTRE.history.filter(function(h) { return h.num !== num; });
  CADASTRE.history.unshift({ num: num, date: new Date().toLocaleTimeString('ru-RU') });
  if (CADASTRE.history.length > 20) CADASTRE.history.pop();
  CADASTRE.renderHistory();
};

CADASTRE.renderHistory = function() {
  var el = document.getElementById('cadastre-history');
  if (!el) return;
  if (!CADASTRE.history.length) {
    el.innerHTML = '<div style="font-size:11px;color:#334155;text-align:center;padding:8px;">История пуста</div>';
    return;
  }
  el.innerHTML = CADASTRE.history.map(function(h, i) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;' +
      'background:#1e293b;border-radius:6px;cursor:pointer;" ' +
      'onclick="document.getElementById(\'cad-num-input\').value=\'' + h.num + '\';CADASTRE.openPKK()">' +
      '<i class="fa-solid fa-clock" style="color:#334155;font-size:9px;"></i>' +
      '<span style="flex:1;font-family:monospace;font-size:11px;color:#94a3b8;">' + h.num + '</span>' +
      '<span style="font-size:9px;color:#334155;">' + h.date + '</span>' +
      '<button onclick="event.stopPropagation();CADASTRE.history.splice(' + i + ',1);CADASTRE.renderHistory()" ' +
      'style="background:none;border:none;color:#334155;cursor:pointer;font-size:11px;padding:0;">✕</button>' +
      '</div>';
  }).join('');
};

window.openCadastreSearch = openCadastreSearch;
window.CADASTRE = CADASTRE;
