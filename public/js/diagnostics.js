// ═══════════════════════════════════════════════════════════════════════════════
// CAD EXTRACTOR 3D — DIAGNOSTICS PANEL
// Full component health check: JS modules, DOM, APIs, canvas, libraries
// ═══════════════════════════════════════════════════════════════════════════════

var _DIAG = { results: [], running: false };

// ── Run all checks ────────────────────────────────────────────────────────────
async function runDiagnostics() {
  if (_DIAG.running) return;
  _DIAG.running = true;
  _DIAG.results = [];

  var panel = document.getElementById('diag-panel');
  var log   = document.getElementById('diag-log');
  if (!panel || !log) { _createDiagPanel(); log = document.getElementById('diag-log'); }

  log.innerHTML = '';
  _diagSection('🔄 Запуск диагностики...');

  await _sleep(50);

  // ─ 1. JavaScript Modules ───────────────────────────────────────────────────
  _diagSection('📦 JS МОДУЛИ');
  var modules = [
    { name: 'app.js (core)',     check: () => typeof draw === 'function' },
    { name: 'cad-tools.js',      check: () => typeof toggleGrid === 'function' },
    { name: 'ai-report.js',      check: () => typeof buildAIPdfReport === 'function' },
    { name: 'cad-console.js',    check: () => typeof executeCommand === 'function' },
    { name: 'diagnostics.js',    check: () => typeof runDiagnostics === 'function' },
  ];
  modules.forEach(function(m) { _diagCheck(m.name, m.check()); });

  // ─ 2. Critical functions ───────────────────────────────────────────────────
  _diagSection('⚙️ КЛЮЧЕВЫЕ ФУНКЦИИ');
  var fns = [
    ['draw()', typeof draw],
    ['processCADData()', typeof processCADData],
    ['addPoint()', typeof addPoint],
    ['screenToCad()', typeof screenToCad],
    ['cadToScreen()', typeof cadToScreen],
    ['setTool()', typeof setTool],
    ['applyZToPoint()', typeof applyZToPoint],
    ['addInterpolatedPoint()', typeof addInterpolatedPoint],
    ['interpolateMissingZ()', typeof interpolateMissingZ],
    ['startContour()', typeof startContour],
    ['exportToDXF()', typeof exportToDXF],
    ['runXYZExport()', typeof runXYZExport],
    ['_buildAndSavePDF()', typeof _buildAndSavePDF],
    ['applyRebase()', typeof applyRebase],
    ['computeHelmert()', typeof computeHelmert],
    ['applyGeoref()', typeof applyGeoref],
    ['init3DViewer()', typeof init3DViewer],
    ['openAIPanel()', typeof openAIPanel],
    ['buildAIPdfReport()', typeof buildAIPdfReport],
    ['toggleGrid()', typeof toggleGrid],
    ['toggleOrthoMode()', typeof toggleOrthoMode],
    ['activateTextTool()', typeof activateTextTool],
    ['toggleMeasure()', typeof toggleMeasure],
    ['executeCommand()', typeof executeCommand],
    ['updateSnapModes()', typeof updateSnapModes],
    ['snpFinish()', typeof snpFinish],
    ['openSymDrawPanel()', typeof openSymDrawPanel],
  ];
  fns.forEach(function(f) { _diagCheck(f[0], f[1] === 'function'); });

  // ─ 3. DOM Elements ────────────────────────────────────────────────────────
  _diagSection('🏗️ DOM ЭЛЕМЕНТЫ');
  var ids = [
    'cad-canvas', 'mode-dxf', 'mode-manual', 'canvas-container',
    'toolbar-row2', 'bottom-status-bar',
    'hud-x', 'hud-y', 'hud-z', 'hud-snap-mode', 'hud-scale',
    'snap-nodes', 'snap-lines', 'snap-popup',
    'tb2-point', 'tb2-interp', 'tb2-dim',
    'dxf-z-panel', 'dxf-layers-panel',
    'georef-modal', 'three-modal', 'pdf-modal',
    'contour-panel', 'sym-panel-new',
    'ai-panel',
  ];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    var msg = el ? (el.offsetWidth > 0 ? '' : ' (скрыт)') : '';
    _diagCheck('#' + id + msg, !!el);
  });

  // Duplicate ID check
  _diagSection('🔁 ДУБЛИКАТЫ ID');
  var dupIds = ['hud-x','hud-snap-mode','snap-nodes','snap-lines','bottom-status-bar'];
  dupIds.forEach(function(id) {
    var count = document.querySelectorAll('#' + id).length;
    _diagCheck('#' + id + ' (count=' + count + ')', count === 1, count === 0 ? 'warn' : undefined);
  });

  // ─ 4. Canvas state ───────────────────────────────────────────────────────
  _diagSection('🖼️ ХОЛСТ');
  var cv = document.getElementById('cad-canvas');
  _diagCheck('canvas element', !!cv);
  if (cv) {
    _diagCheck('canvas width > 0', cv.width > 0, undefined, cv.width + 'px');
    _diagCheck('canvas height > 0', cv.height > 0, undefined, cv.height + 'px');
    _diagCheck('getContext(2d)', !!cv.getContext('2d'));
    // Check nothing is overlaying the canvas
    var rect = cv.getBoundingClientRect();
    var topEl = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
    var isCanvas = topEl === cv || (topEl && topEl.id === 'cad-canvas');
    _diagCheck('холст не перекрыт', isCanvas, undefined, topEl ? '#'+topEl.id+' / .'+topEl.className.toString().split(' ')[0] : '?');
  }
  // Float elements on canvas
  var mainDxf = document.getElementById('mode-dxf');
  var floatCount = mainDxf ? mainDxf.querySelectorAll('button, input, select').length : -1;
  _diagCheck('0 кнопок на холсте', floatCount === 0, undefined, floatCount + ' элем.');

  // ─ 5. External Libraries ─────────────────────────────────────────────────
  _diagSection('📚 БИБЛИОТЕКИ');
  _diagCheck('DXF Parser',    typeof DxfParser !== 'undefined');
  _diagCheck('Delaunator',    typeof Delaunator !== 'undefined');
  _diagCheck('Three.js',      typeof THREE !== 'undefined');
  _diagCheck('Font Awesome',  document.querySelector('[class*="fa-"]') !== null || _testFAFont());
  _diagCheck('Tailwind CSS',  typeof window.tailwind !== 'undefined' || document.querySelector('[class*="flex"]') !== null);

  // ─ 6. API Endpoints ──────────────────────────────────────────────────────
  _diagSection('🌐 API СЕРВЕР');
  try {
    var r = await fetch('/api/me', { method: 'GET' });
    _diagCheck('GET /api/me', r.status !== 404, undefined, 'HTTP ' + r.status);
  } catch(e) { _diagCheck('GET /api/me', false, undefined, e.message); }

  try {
    var r2 = await fetch('/api/ai', { method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({model:'test',max_tokens:1,messages:[{role:'user',content:'ping'}]})
    });
    _diagCheck('POST /api/ai', r2.status !== 404, undefined, 'HTTP ' + r2.status);
  } catch(e) { _diagCheck('POST /api/ai', false, undefined, e.message); }

  try {
    var r3 = await fetch('/api/export-docx', { method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({title:'test',points:[],dimensions:[],area:0})
    });
    _diagCheck('POST /api/export-docx', r3.status !== 404, undefined, 'HTTP ' + r3.status);
  } catch(e) { _diagCheck('POST /api/export-docx', false, undefined, e.message); }

  // ─ 7. Data state ─────────────────────────────────────────────────────────
  _diagSection('📊 ДАННЫЕ ПРОЕКТА');
  _diagCheck('points[]',       Array.isArray(typeof points!=='undefined'?points:[]),
    undefined, typeof points!=='undefined' ? points.length + ' точек' : 'undefined');
  _diagCheck('cadSymbols[]',   Array.isArray(typeof cadSymbols!=='undefined'?cadSymbols:[]),
    undefined, typeof cadSymbols!=='undefined' ? cadSymbols.length + ' знаков' : '0');
  _diagCheck('dxfElements[]',  typeof dxfElements !== 'undefined',
    undefined, typeof dxfElements!=='undefined' ? (dxfElements||[]).length + ' элем.' : 'не загружен');
  _diagCheck('scale',          typeof scale === 'number' && scale > 0,
    undefined, typeof scale !== 'undefined' ? scale.toFixed(4) : 'undefined');
  _diagCheck('currentMode',    typeof currentMode !== 'undefined',
    undefined, typeof currentMode !== 'undefined' ? currentMode : 'undefined');

  // ─ 8. CAD Tools state ────────────────────────────────────────────────────
  _diagSection('🛠️ CAD TOOLS');
  _diagCheck('cadTools object',  typeof cadTools !== 'undefined');
  if (typeof cadTools !== 'undefined') {
    _diagCheck('orthoMode',  typeof cadTools.orthoMode === 'boolean', undefined, String(cadTools.orthoMode));
    _diagCheck('gridVisible',typeof cadTools.gridVisible === 'boolean', undefined, String(cadTools.gridVisible));
  }
  _diagCheck('snapModes object', typeof snapModes !== 'undefined');
  if (typeof snapModes !== 'undefined') {
    _diagCheck('snapModes.nodes', typeof snapModes.nodes === 'boolean', undefined, String(snapModes.nodes));
  }

  // ─ 9. Performance ────────────────────────────────────────────────────────
  _diagSection('⚡ ПРОИЗВОДИТЕЛЬНОСТЬ');
  var t0 = performance.now();
  if (typeof requestDraw === 'function') requestDraw();
  var t1 = performance.now();
  _diagCheck('requestDraw()', typeof requestDraw === 'function', undefined, (t1-t0).toFixed(2)+'ms');
  _diagCheck('Memory API', typeof performance.memory !== 'undefined',
    'warn', typeof performance.memory !== 'undefined'
      ? Math.round(performance.memory.usedJSHeapSize/1024/1024) + 'MB'
      : 'unavailable');

  // ─ Summary ───────────────────────────────────────────────────────────────
  var ok   = _DIAG.results.filter(function(r){ return r.ok; }).length;
  var fail = _DIAG.results.filter(function(r){ return !r.ok; }).length;
  var warn = _DIAG.results.filter(function(r){ return r.warn; }).length;

  _diagSection('═══════════════════════════════');
  var summary = document.createElement('div');
  summary.style.cssText = 'display:flex;gap:16px;padding:8px 0;font-size:13px;font-weight:bold;';
  summary.innerHTML =
    '<span style="color:#22c55e">✓ OK: '+ok+'</span>'+
    '<span style="color:#ef4444">✗ FAIL: '+fail+'</span>'+
    '<span style="color:#f59e0b">⚠ WARN: '+warn+'</span>';
  log.appendChild(summary);

  _DIAG.running = false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _sleep(ms){ return new Promise(function(r){setTimeout(r,ms);}); }

function _diagSection(title) {
  var log = document.getElementById('diag-log'); if(!log) return;
  var el = document.createElement('div');
  el.style.cssText = 'color:#475569;font-size:10px;font-weight:700;text-transform:uppercase;'+
    'letter-spacing:.5px;padding:6px 0 2px;margin-top:4px;border-top:1px solid #1e293b;';
  el.textContent = title;
  log.appendChild(el);
}

function _diagCheck(label, ok, forceWarn, detail) {
  var log = document.getElementById('diag-log'); if(!log) return;
  _DIAG.results.push({ label, ok, warn: forceWarn === 'warn' });
  var el = document.createElement('div');
  el.style.cssText = 'display:flex;align-items:center;gap:6px;padding:2px 0;font-size:11px;font-family:monospace;';
  var icon = ok ? '✓' : (forceWarn === 'warn' ? '⚠' : '✗');
  var color = ok ? '#22c55e' : (forceWarn === 'warn' ? '#f59e0b' : '#ef4444');
  el.innerHTML =
    '<span style="color:'+color+';width:14px;text-align:center;font-size:12px;">'+icon+'</span>'+
    '<span style="color:'+(ok?'#94a3b8':'#f1f5f9')+';flex:1;">'+label+'</span>'+
    (detail ? '<span style="color:#475569;font-size:10px;">'+detail+'</span>' : '');
  log.appendChild(el);
}

function _testFAFont() {
  // Test if FA font is actually rendering
  var span = document.createElement('span');
  span.className = 'fa-solid fa-check';
  span.style.cssText = 'position:absolute;left:-9999px;font-size:16px;';
  document.body.appendChild(span);
  var w = span.offsetWidth;
  document.body.removeChild(span);
  return w > 0;
}

// ── Create Diagnostics Panel ──────────────────────────────────────────────────
function _createDiagPanel() {
  var old = document.getElementById('diag-panel');
  if (old) old.remove();

  var panel = document.createElement('div');
  panel.id = 'diag-panel';
  panel.style.cssText =
    'position:fixed;top:90px;right:16px;width:380px;max-height:75vh;'+
    'background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;'+
    'box-shadow:0 20px 60px rgba(0,0,0,.6);z-index:99999;'+
    'display:flex;flex-direction:column;font-family:monospace;overflow:hidden;';

  panel.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;'+
      'padding:10px 14px;background:#1e293b;border-bottom:1px solid #1e3a5f;flex-shrink:0;">'+
      '<div style="display:flex;align-items:center;gap:8px;">'+
        '<span style="font-size:16px;">🔬</span>'+
        '<span style="color:#f1f5f9;font-weight:700;font-size:13px;">ДИАГНОСТИКА</span>'+
        '<span style="color:#475569;font-size:10px;">CAD Extractor 3D</span>'+
      '</div>'+
      '<div style="display:flex;gap:6px;align-items:center;">'+
        '<button onclick="runDiagnostics()" style="background:#2563eb;border:none;color:#fff;'+
          'border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-family:monospace;">▶ Запустить</button>'+
        '<button onclick="document.getElementById(\'diag-panel\').remove()" '+
          'style="background:none;border:none;color:#475569;cursor:pointer;font-size:18px;">✕</button>'+
      '</div>'+
    '</div>'+
    '<div id="diag-log" style="flex:1;overflow-y:auto;padding:8px 14px;'+
      'scrollbar-width:thin;scrollbar-color:#1e3a5f #0f172a;">'+
      '<div style="color:#475569;font-size:11px;padding:8px 0;">'+
        'Нажмите ▶ Запустить для полной проверки компонентов</div>'+
    '</div>'+
    '<div style="padding:6px 14px;background:#1e293b;border-top:1px solid #1e3a5f;'+
      'display:flex;gap:8px;flex-shrink:0;">'+
      '<button onclick="_exportDiagReport()" style="background:#1e3a5f;border:none;color:#94a3b8;'+
        'border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-family:monospace;">💾 Экспорт</button>'+
      '<button onclick="document.getElementById(\'diag-log\').innerHTML=\'\'" style="background:#1e3a5f;border:none;color:#94a3b8;'+
        'border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-family:monospace;">🗑 Очистить</button>'+
    '</div>';

  document.body.appendChild(panel);
}

function openDiagPanel() {
  _createDiagPanel();
  runDiagnostics();
}

function _exportDiagReport() {
  var log = document.getElementById('diag-log'); if(!log) return;
  var lines = [];
  log.querySelectorAll('div').forEach(function(el){ lines.push(el.textContent); });
  var txt = 'CAD EXTRACTOR 3D — ДИАГНОСТИКА\n'+ new Date().toLocaleString('ru-RU')+'\n'+
    '═'.repeat(50)+'\n'+ lines.join('\n');
  var a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
  a.download = 'cad-diagnostics-'+Date.now()+'.txt';
  a.click();
}

window.openDiagPanel = openDiagPanel;
window.runDiagnostics = runDiagnostics;

// Auto-run light check on load (just log errors to console)
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    var missing = [];
    ['draw','setTool','processCADData','addPoint','updateTable'].forEach(function(f){
      if(typeof window[f] !== 'function') missing.push(f);
    });
    if(missing.length){
      console.error('[DIAG] Missing critical functions:', missing.join(', '));
    } else {
      console.log('[DIAG] Core functions OK ✓');
    }
  }, 1000);
});

// F12 keyboard shortcut
document.addEventListener('keydown', function(e){
  if(e.key === 'F12' && !e.ctrlKey && !e.altKey){
    e.preventDefault();
    openDiagPanel();
  }
});
