// ═══════════════════════════════════════════════════════════════════════════════
// CAD TOOLS MODULE — AutoCAD-like functionality
// Depends on: app.js globals (points, scale, panX, panY, draw, requestDraw)
// ═══════════════════════════════════════════════════════════════════════════════

// ── STATE ────────────────────────────────────────────────────────────────────
var cadTools = {
  orthoMode: false,          // F8 — constrain to 0/90°
  polarAngle: 0,             // F10 — polar tracking angle (deg)
  polarEnabled: false,       // F10 on/off
  polarAngles: [0,45,90,135,180,225,270,315], // snap angles
  gridVisible: false,        // F7 — coordinate grid
  gridSpacing: 1.0,          // world units
  textMode: false,           // text placement tool
  pendingText: null,         // {x,y,text,height,angle}
  measureActive: false,      // quick measure tool
  measurePts: [],            // [p1, p2]
  lastMouseWorld: {x:0,y:0}, // current world cursor
};

// ── ORTHO MODE (F8) ──────────────────────────────────────────────────────────
function toggleOrthoMode(){
  cadTools.orthoMode = !cadTools.orthoMode;
  cadTools.polarEnabled = false; // mutual exclusion
  _updateToolStatus();
  requestDraw();
  showMessage('Ortho', cadTools.orthoMode ? 'Режим ORTHO включён (90°)' : 'ORTHO выключен', 'info');
}

function applyOrthoConstraint(fromX, fromY, toX, toY){
  if(!cadTools.orthoMode) return {x:toX, y:toY};
  var dx = toX - fromX, dy = toY - fromY;
  if(Math.abs(dx) >= Math.abs(dy)) return {x:toX, y:fromY}; // horizontal
  return {x:fromX, y:toY}; // vertical
}

function applyPolarConstraint(fromX, fromY, toX, toY){
  if(!cadTools.polarEnabled) return {x:toX, y:toY};
  var dx = toX-fromX, dy = toY-fromY;
  var dist = Math.hypot(dx,dy);
  if(dist < 0.001) return {x:toX, y:toY};
  var rawAngle = Math.atan2(dy,dx) * 180/Math.PI;
  var snapAngle = cadTools.polarAngles.reduce(function(best,a){
    var diff = Math.abs(((rawAngle - a + 540)%360) - 180);
    var bestDiff = Math.abs(((rawAngle - best + 540)%360) - 180);
    return diff < bestDiff ? a : best;
  }, cadTools.polarAngles[0]);
  var snap = Math.abs(((rawAngle - snapAngle + 540)%360) - 180);
  if(snap < (cadTools.polarAngle||15)){
    var rad = snapAngle * Math.PI/180;
    return {x: fromX + dist*Math.cos(rad), y: fromY + dist*Math.sin(rad)};
  }
  return {x:toX, y:toY};
}

// ── GRID (F7) ────────────────────────────────────────────────────────────────
function toggleGrid(){
  cadTools.gridVisible = !cadTools.gridVisible;
  requestDraw();
}

function drawGrid(ctx, sc, panX, panY, oX, oY){
  if(!cadTools.gridVisible) return;
  var gs = cadTools.gridSpacing;
  // Auto-adjust grid spacing based on zoom
  while(gs * sc < 20) gs *= 5;
  while(gs * sc > 200) gs /= 5;

  var cv = document.getElementById('cad-canvas');
  if(!cv) return;
  var W = cv.width, H = cv.height;

  // World bounds visible
  var wl = (0 - panX) / sc + oX;
  var wr = (W - panX) / sc + oX;
  var wb = (panY - H) / sc + oY;
  var wt = panY / sc + oY;

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.25)';
  ctx.lineWidth = 0.5 / sc;

  var x0 = Math.floor(wl/gs)*gs;
  for(var gx=x0; gx<=wr; gx+=gs){
    ctx.beginPath(); ctx.moveTo(gx,wb); ctx.lineTo(gx,wt); ctx.stroke();
  }
  var y0 = Math.floor(wb/gs)*gs;
  for(var gy=y0; gy<=wt; gy+=gs){
    ctx.beginPath(); ctx.moveTo(wl,gy); ctx.lineTo(wr,gy); ctx.stroke();
  }

  // Labels
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='rgba(100,116,139,0.6)'; ctx.font='9px monospace';
  ctx.textAlign='left';
  for(var lgx=x0; lgx<=wr; lgx+=gs*5){
    var sx = panX+(lgx-oX)*sc;
    ctx.fillText(lgx.toFixed(1), sx+2, H-4);
  }
  ctx.textAlign='right';
  for(var lgy=y0; lgy<=wt; lgy+=gs*5){
    var sy = panY-(lgy-oY)*sc;
    ctx.fillText(lgy.toFixed(1), W-2, sy-2);
  }
  ctx.restore();
  ctx.restore();
}

// ── TEXT TOOL ────────────────────────────────────────────────────────────────
var cadTexts = []; // [{x,y,text,height,angle,color}]

function activateTextTool(){
  cadTools.textMode = true;
  var cv=document.getElementById('cad-canvas');
  if(cv) cv.style.cursor='text';
  showMessage('Текст','Кликните на чертеже для размещения текста','info');
}

function handleTextClick(wx, wy){
  if(!cadTools.textMode) return false;
  var txt = window.prompt('Введите текст:', '');
  if(!txt) { cadTools.textMode=false; return true; }
  var ht = parseFloat(window.prompt('Высота текста (м):', '0.5')||'0.5');
  cadTexts.push({x:wx, y:wy, text:txt, height:ht, angle:0, color:'#1e293b'});
  cadTools.textMode = false;
  var cv=document.getElementById('cad-canvas');
  if(cv) cv.style.cursor='';
  requestDraw();
  return true;
}

function drawCadTexts(ctx, sc){
  cadTexts.forEach(function(t){
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle * Math.PI/180);
    ctx.scale(1/sc, -1/sc);
    ctx.font = 'bold '+(t.height*sc)+'px Arial';
    ctx.fillStyle = t.color||'#1e293b';
    ctx.textBaseline = 'bottom';
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  });
}

// ── QUICK MEASURE ────────────────────────────────────────────────────────────
function toggleMeasure(){
  cadTools.measureActive = !cadTools.measureActive;
  cadTools.measurePts = [];
  requestDraw();
  if(cadTools.measureActive)
    showMessage('Измерение','Кликните 2 точки для измерения расстояния','info');
}

function handleMeasureClick(wx,wy){
  if(!cadTools.measureActive) return false;
  cadTools.measurePts.push({x:wx,y:wy});
  if(cadTools.measurePts.length>=2){
    var p1=cadTools.measurePts[0], p2=cadTools.measurePts[1];
    var d=Math.hypot(p2.x-p1.x, p2.y-p1.y);
    var az=Math.atan2(p2.x-p1.x, p2.y-p1.y)*180/Math.PI;
    if(az<0)az+=360;
    showMessage('Измерение',
      'Расстояние: '+d.toFixed(4)+' м\nАзимут: '+az.toFixed(2)+'°\n'+
      'ΔX='+Math.abs(p2.x-p1.x).toFixed(4)+' ΔY='+Math.abs(p2.y-p1.y).toFixed(4),
      'success');
    cadTools.measurePts = [];
    cadTools.measureActive = false;
  }
  requestDraw();
  return true;
}

function drawMeasurePreview(ctx,sc){
  if(!cadTools.measureActive||cadTools.measurePts.length===0) return;
  var p1=cadTools.measurePts[0];
  var p2=cadTools.lastMouseWorld;
  ctx.save();
  ctx.strokeStyle='#f59e0b'; ctx.lineWidth=1.5/sc; ctx.setLineDash([4/sc,2/sc]);
  ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
  ctx.setLineDash([]);
  // Distance label
  var d=Math.hypot(p2.x-p1.x,p2.y-p1.y);
  var mx=(p1.x+p2.x)/2, my=(p1.y+p2.y)/2;
  ctx.save(); ctx.translate(mx,my); ctx.scale(1/sc,-1/sc);
  ctx.font='bold 11px Arial'; ctx.fillStyle='#f59e0b';
  ctx.textAlign='center'; ctx.textBaseline='bottom';
  ctx.fillText(d.toFixed(3)+' м',0,-4);
  ctx.restore();
  // Start dot
  ctx.fillStyle='#f59e0b';
  ctx.beginPath(); ctx.arc(p1.x,p1.y,4/sc,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// ── STATUS BAR UPDATE ────────────────────────────────────────────────────────
function _updateToolStatus(){
  var el=document.getElementById('hud-status');
  if(!el) return;
  var parts=[];
  if(cadTools.orthoMode) parts.push('ORTHO');
  if(cadTools.polarEnabled) parts.push('POLAR');
  if(cadTools.gridVisible) parts.push('GRID');
  if(cadTools.textMode) parts.push('TEXT');
  if(cadTools.measureActive) parts.push('MEASURE');
  el.textContent = parts.length ? parts.join(' · ') : '';
}

// ── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
document.addEventListener('keydown', function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  switch(e.key){
    case 'F7': e.preventDefault(); toggleGrid(); break;
    case 'F8': e.preventDefault(); toggleOrthoMode(); break;
    case 'F9': e.preventDefault(); showMessage('Snap','Привязка уже активна','info'); break;
    case 'F10': e.preventDefault();
      cadTools.polarEnabled=!cadTools.polarEnabled;
      cadTools.orthoMode=false;
      _updateToolStatus(); requestDraw();
      showMessage('Polar',cadTools.polarEnabled?'Polar tracking ON':'Polar tracking OFF','info');
      break;
    case 'Escape':
      cadTools.textMode=false; cadTools.measureActive=false;
      cadTools.measurePts=[]; _updateToolStatus(); requestDraw();
      break;
  }
});

// Export to global scope
window.cadTools=cadTools;
window.toggleGrid=toggleGrid;
window.toggleOrthoMode=toggleOrthoMode;
window.activateTextTool=activateTextTool;
window.toggleMeasure=toggleMeasure;
