// ═══════════════════════════════════════════════════════════════════════════════
// AI GEODETIC REPORT MODULE
// Provides: AI-powered geodetic analysis + structured PDF report generation
// ═══════════════════════════════════════════════════════════════════════════════

// ── Build comprehensive geodetic context for AI ───────────────────────────────
function buildGeodeticContext(){
  var pts = currentMode==='dxf' ? points : manualPoints;
  var ctx = '═══ ГЕОДЕЗИЧЕСКИЙ ПРОЕКТ ═══\n';

  // Points summary
  ctx += '\n📍 ТОЧКИ (' + pts.length + ' шт.):\n';
  pts.forEach(function(p){
    ctx += 'P'+p.id+': X='+p.x.toFixed(4)+' Y='+p.y.toFixed(4);
    if(p.z!=null) ctx += ' Z='+p.z.toFixed(4);
    if(p.type) ctx += ' ['+p.type+']';
    ctx += '\n';
  });

  // Bounding box
  if(pts.length>=2){
    var xs=pts.map(function(p){return p.x;}),ys=pts.map(function(p){return p.y;});
    var minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs);
    var minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);
    ctx += '\n📐 ГАБАРИТЫ:\n';
    ctx += 'X: '+minX.toFixed(4)+' ... '+maxX.toFixed(4)+' (Δ='+(maxX-minX).toFixed(4)+' м)\n';
    ctx += 'Y: '+minY.toFixed(4)+' ... '+maxY.toFixed(4)+' (Δ='+(maxY-minY).toFixed(4)+' м)\n';
  }

  // Z statistics
  var zPts = pts.filter(function(p){return p.z!=null;});
  if(zPts.length>=2){
    var zs=zPts.map(function(p){return p.z;});
    var zMin=Math.min.apply(null,zs),zMax=Math.max.apply(null,zs);
    var zMean=zs.reduce(function(a,b){return a+b;},0)/zs.length;
    ctx += '\n🏔 ВЫСОТЫ (Z):\n';
    ctx += 'Мин: '+zMin.toFixed(4)+' м\n';
    ctx += 'Макс: '+zMax.toFixed(4)+' м\n';
    ctx += 'Средняя: '+zMean.toFixed(4)+' м\n';
    ctx += 'Перепад: '+(zMax-zMin).toFixed(4)+' м\n';
    ctx += 'Точек с Z: '+zPts.length+' из '+pts.length+'\n';
  }

  // Dimensions
  var dims = typeof dimensions!=='undefined' ? dimensions : [];
  if(dims.length){
    ctx += '\n📏 РАЗМЕРЫ ('+dims.length+' отрезков):\n';
    dims.slice(0,10).forEach(function(d){
      var l=Math.hypot(d.p2.x-d.p1.x, d.p2.y-d.p1.y);
      ctx += 'P'+d.p1.id+'→P'+d.p2.id+': '+l.toFixed(4)+' м\n';
    });
    if(dims.length>10) ctx += '...ещё '+(dims.length-10)+'\n';
  }

  // Area/Volume
  if(typeof _savedArea!=='undefined'&&_savedArea>0){
    ctx += '\n🏗 ПЛОЩАДЬ И ОБЪЁМ:\n';
    ctx += 'Площадь: '+_savedArea.toFixed(4)+' м²\n';
    ctx += 'Периметр: '+_savedPerimeter.toFixed(4)+' м\n';
    if(typeof _savedVolume!=='undefined'&&_savedVolume>0)
      ctx += 'Объём грунта: '+_savedVolume.toFixed(4)+' м³\n';
    if(typeof _savedPileVolume!=='undefined'&&_savedPileVolume>0)
      ctx += 'Объём свай: '+_savedPileVolume.toFixed(4)+' м³\n';
  }

  // DXF elements
  if(typeof dxfElements!=='undefined'&&dxfElements&&dxfElements.length){
    var types={};
    dxfElements.forEach(function(el){types[el.type]=(types[el.type]||0)+1;});
    ctx += '\n📂 DXF ЭЛЕМЕНТЫ:\n';
    Object.keys(types).forEach(function(t){ctx+=t+': '+types[t]+'\n';});
  }

  // Symbols
  if(typeof cadSymbols!=='undefined'&&cadSymbols&&cadSymbols.length){
    ctx += '\nУСЛОВНЫЕ ЗНАКИ ('+cadSymbols.length+'):\n';
    var symTypes={};
    cadSymbols.forEach(function(s){symTypes[s.label]=(symTypes[s.label]||0)+1;});
    Object.keys(symTypes).forEach(function(t){ctx+=t+': '+symTypes[t]+'\n';});
  }

  return ctx;
}

// ── AI Generate Full Geodetic Report ─────────────────────────────────────────
var _aiReportCache = null;

async function generateAIReport(meta){
  var ctx = buildGeodeticContext();
  var orgName = (meta&&meta.org)||'—';
  var objName = (meta&&meta.title)||'Объект';
  var dateStr = new Date().toLocaleDateString('ru-RU');

  var prompt = [
    'Ты профессиональный геодезист-аналитик. Сформируй ПОЛНЫЙ технический отчёт по геодезической съёмке.',
    'Ответ СТРОГО в формате JSON (без markdown-обёрток):',
    '{',
    '  "title": "полное название отчёта",',
    '  "summary": "краткая характеристика объекта 2-3 предложения",',
    '  "geo_analysis": {',
    '    "coordinate_system": "оценка точности/системы координат",',
    '    "relief_description": "описание рельефа по Z-данным",',
    '    "area_comment": "комментарий по площади и периметру",',
    '    "volume_comment": "комментарий по объёмам земляных масс"',
    '  },',
    '  "anomalies": ["список аномалий или нулевых замечаний"],',
    '  "recommendations": ["список рекомендаций 3-5 пунктов"],',
    '  "accuracy_class": "оценка класса точности (I/II/III/IV)",',
    '  "conclusions": "технические выводы 3-4 предложения"',
    '}',
    '',
    'ДАННЫЕ ПРОЕКТА:',
    ctx,
    'Организация: '+orgName,
    'Объект: '+objName,
    'Дата: '+dateStr
  ].join('\n');

  var resp = await fetch('/api/ai', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{role:'user', content: prompt}]
    })
  });

  if(!resp.ok) throw new Error('AI API error: '+resp.status);
  var data = await resp.json();
  var text = data.content&&data.content[0]&&data.content[0].text||'';

  // Parse JSON
  var jsonMatch = text.match(/\{[\s\S]*\}/);
  if(!jsonMatch) throw new Error('AI вернул не JSON');
  _aiReportCache = JSON.parse(jsonMatch[0]);
  return _aiReportCache;
}

// ── Build PDF with AI Report ──────────────────────────────────────────────────
async function buildAIPdfReport(pdfMeta){
  var statusEl = document.getElementById('ai-pdf-status');
  if(statusEl) statusEl.textContent = '🤖 ИИ анализирует данные...';

  var aiData;
  try {
    aiData = await generateAIReport(pdfMeta);
  } catch(e){
    if(statusEl) statusEl.textContent = '⚠ ИИ недоступен, PDF без анализа';
    aiData = null;
  }

  // Build HTML report
  var pts = currentMode==='dxf' ? points : manualPoints;
  var dims = typeof dimensions!=='undefined' ? dimensions : [];
  var dateStr = new Date().toLocaleDateString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric'});

  var html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8">
<style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;margin:0;padding:0;color:#1e293b}
  .page{width:297mm;min-height:210mm;padding:10mm;box-sizing:border-box;position:relative}
  h1{font-size:14pt;font-weight:bold;margin:0 0 4px;color:#0f172a}
  h2{font-size:10pt;font-weight:bold;margin:8px 0 4px;color:#1e3a5f;
     border-bottom:1pt solid #94a3b8;padding-bottom:2px}
  h3{font-size:9pt;font-weight:bold;margin:6px 0 3px;color:#334155}
  p{margin:2px 0;line-height:1.4}
  table{border-collapse:collapse;width:100%;font-size:8pt;margin:4px 0}
  th{background:#1e293b;color:#fff;padding:2px 4px;text-align:left;border:0.3pt solid #334155}
  td{padding:2px 4px;border:0.3pt solid #cbd5e1}
  tr:nth-child(even) td{background:#f8fafc}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8mm}
  .box{background:#f8fafc;border:0.5pt solid #e2e8f0;border-radius:3pt;padding:4mm}
  .stamp{border:1pt solid #1e293b;margin-top:6mm}
  .stamp-row{display:flex;border-bottom:0.5pt solid #1e293b}
  .stamp-cell{padding:2mm 3mm;border-right:0.5pt solid #1e293b;font-size:7pt}
  .tag{display:inline-block;background:#dbeafe;color:#1e40af;border-radius:2pt;
       padding:1px 4px;font-size:7pt;margin:1px}
  .warn{color:#dc2626;font-weight:bold}
  .ok{color:#16a34a;font-weight:bold}
  .metric{font-size:11pt;font-weight:bold;color:#1e3a5f}
</style>
</head>
<body>
<div class="page">

<!-- HEADER -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;
  border-bottom:2pt solid #1e293b;padding-bottom:4mm;margin-bottom:6mm">
  <div>
    <div style="font-size:8pt;color:#64748b;font-weight:bold;letter-spacing:.5pt">
      ТЕХНИЧЕСКИЙ ОТЧЁТ
    </div>
    <h1>${aiData ? aiData.title : (pdfMeta.title||'Исполнительная съёмка')}</h1>
    <p style="color:#475569">${pdfMeta.org||'Геодезическая организация'}</p>
  </div>
  <div style="text-align:right;font-size:8pt;color:#64748b">
    <div>Дата: <b>${dateStr}</b></div>
    <div>СК: <b>${pdfMeta.coord||'—'}</b></div>
    <div>ВО: <b>${pdfMeta.height||'—'}</b></div>
    <div>Масштаб: <b>1:${pdfMeta.scale||'500'}</b></div>
  </div>
</div>`;

  // AI Summary
  if(aiData){
    html += `
<div class="box" style="margin-bottom:6mm;background:#eff6ff;border-color:#bfdbfe">
  <h2 style="color:#1e40af;border-color:#bfdbfe">🤖 Аналитическое резюме ИИ</h2>
  <p>${aiData.summary}</p>
  <div style="margin-top:3mm">
    <span class="tag">Класс точности: ${aiData.accuracy_class}</span>
  </div>
</div>

<div class="grid">
  <div>
    <h2>📊 Геодезический анализ</h2>
    ${aiData.geo_analysis ? `
    <h3>Система координат</h3>
    <p>${aiData.geo_analysis.coordinate_system}</p>
    <h3>Рельеф</h3>
    <p>${aiData.geo_analysis.relief_description}</p>
    <h3>Площадь</h3>
    <p>${aiData.geo_analysis.area_comment}</p>
    <h3>Объём</h3>
    <p>${aiData.geo_analysis.volume_comment}</p>
    ` : ''}
  </div>
  <div>
    <h2>⚠ Замечания и рекомендации</h2>
    ${aiData.anomalies&&aiData.anomalies.length>0 ? `
    <h3 class="warn">Аномалии:</h3>
    <ul style="margin:0;padding-left:12pt">${aiData.anomalies.map(function(a){
      return '<li>'+a+'</li>';}).join('')}</ul>` : ''}
    <h3>Рекомендации:</h3>
    <ul style="margin:0;padding-left:12pt">${(aiData.recommendations||[]).map(function(r){
      return '<li>'+r+'</li>';}).join('')}</ul>
    <h3>Выводы:</h3>
    <p>${aiData.conclusions}</p>
  </div>
</div>`;
  }

  // Key metrics
  html += `<h2>📐 Основные показатели</h2><div class="grid">`;
  var zPts = pts.filter(function(p){return p.z!=null;});
  var metrics = [
    ['Точек всего', pts.length],
    ['Точек с Z', zPts.length],
    ['Размеров', dims.length],
  ];
  if(zPts.length>=2){
    var zs=zPts.map(function(p){return p.z;});
    metrics.push(['Z мин, м', Math.min.apply(null,zs).toFixed(4)]);
    metrics.push(['Z макс, м', Math.max.apply(null,zs).toFixed(4)]);
    metrics.push(['Перепад Z, м', (Math.max.apply(null,zs)-Math.min.apply(null,zs)).toFixed(4)]);
  }
  if(typeof _savedArea!=='undefined'&&_savedArea>0){
    metrics.push(['Площадь, м²', _savedArea.toFixed(4)]);
    metrics.push(['Периметр, м', _savedPerimeter.toFixed(4)]);
    if(typeof _savedVolume!=='undefined'&&_savedVolume>0)
      metrics.push(['Объём грунта, м³', _savedVolume.toFixed(4)]);
  }
  metrics.forEach(function(m){
    html += `<div class="box"><div style="color:#64748b;font-size:8pt">${m[0]}</div>
    <div class="metric">${m[1]}</div></div>`;
  });
  html += '</div>';

  // Points table
  if(pts.length){
    html += `<h2>📍 Ведомость точек</h2>
    <table>
      <thead><tr>
        <th>№</th><th>X, м</th><th>Y, м</th><th>Z, м</th><th>Тип</th>
      </tr></thead><tbody>`;
    pts.forEach(function(p,i){
      html += `<tr>
        <td>P${p.id}</td>
        <td style="font-family:monospace">${p.x.toFixed(4)}</td>
        <td style="font-family:monospace">${p.y.toFixed(4)}</td>
        <td style="font-family:monospace">${p.z!=null?p.z.toFixed(4):'—'}</td>
        <td>${p.type||'—'}</td>
      </tr>`;
    });
    html += '</tbody></table>';
  }

  // Dimensions table
  if(dims.length){
    html += `<h2>📏 Ведомость размеров</h2>
    <table><thead><tr><th>Отрезок</th><th>Длина, м</th><th>ΔX, м</th><th>ΔY, м</th></tr></thead><tbody>`;
    dims.forEach(function(d,i){
      var l=Math.hypot(d.p2.x-d.p1.x,d.p2.y-d.p1.y);
      var dx=Math.abs(d.p2.x-d.p1.x),dy=Math.abs(d.p2.y-d.p1.y);
      html += `<tr>
        <td>P${d.p1.id}–P${d.p2.id}</td>
        <td style="font-family:monospace">${l.toFixed(4)}</td>
        <td style="font-family:monospace">${dx.toFixed(4)}</td>
        <td style="font-family:monospace">${dy.toFixed(4)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
  }

  // Title block
  html += `
<div class="stamp" style="margin-top:8mm">
  <div class="stamp-row">
    <div class="stamp-cell" style="flex:3"><b>${pdfMeta.title||'Исполнительная схема'}</b></div>
    <div class="stamp-cell" style="flex:1">Лист 1</div>
    <div class="stamp-cell" style="flex:1">Листов 1</div>
  </div>
  <div class="stamp-row">
    <div class="stamp-cell" style="flex:2">Организация: ${pdfMeta.org||'—'}</div>
    <div class="stamp-cell" style="flex:2">СК: ${pdfMeta.coord||'—'}, ВО: ${pdfMeta.height||'—'}</div>
    <div class="stamp-cell" style="flex:1">Дата: ${dateStr}</div>
  </div>
  <div class="stamp-row">
    <div class="stamp-cell" style="flex:1">Разработал: ___________</div>
    <div class="stamp-cell" style="flex:1">Проверил: ___________</div>
    <div class="stamp-cell" style="flex:1">Геодезист: ___________</div>
    <div class="stamp-cell" style="flex:1">Н.контр: ___________</div>
  </div>
</div>

</div></body></html>`;

  // Show in overlay
  var overlay = document.getElementById('print-overlay');
  if(!overlay){ overlay=document.createElement('div'); overlay.id='print-overlay'; document.body.appendChild(overlay); }
  overlay.className = 'pdf-preview-open';
  overlay.innerHTML =
    '<div style="position:fixed;inset:0;overflow-y:auto;background:#475569;padding:20px;">' +
    '<div style="max-width:317mm;margin:0 auto;">' +
    '<div style="display:flex;gap:10px;margin-bottom:12px;justify-content:flex-end;">' +
    '<button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;border-radius:8px;'+
    'padding:8px 16px;font-size:13px;cursor:pointer;">🖨 Печать / PDF</button>' +
    '<button onclick="_exportDocx(window._aiReportPts,window._aiReportDims,window._aiReportMeta)" '+
    'style="background:#16a34a;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;">📄 DOCX</button>' +
    '<button onclick="document.getElementById(\'print-overlay\').className=\'\'" '+
    'style="background:#64748b;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;">✕ Закрыть</button>' +
    '</div>' +
    '<div style="background:#fff;padding:0;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
    html +
    '</div></div></div>';

  // Store for DOCX
  window._aiReportPts = pts;
  window._aiReportDims = dims;
  window._aiReportMeta = pdfMeta;

  if(statusEl) statusEl.textContent = '✓ Отчёт сформирован';
}

// ── Hook into existing doExportPDF ───────────────────────────────────────────
var _origDoExportPDF = typeof doExportPDF==='function' ? doExportPDF : null;

function doExportPDF(pdfMeta){
  var useAI = document.getElementById('pdf-use-ai');
  if(useAI && useAI.checked){
    closePdfSettings && closePdfSettings();
    buildAIPdfReport(pdfMeta);
  } else if(_origDoExportPDF){
    _origDoExportPDF(pdfMeta);
  }
}

window.buildAIPdfReport = buildAIPdfReport;
window.generateAIReport = generateAIReport;
