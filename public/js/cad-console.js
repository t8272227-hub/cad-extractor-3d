// ═══════════════════════════════════════════════════════════════════════════════
// CAD COMMAND CONSOLE — AutoCAD-style command line
// Commands: POINT, INTERP, LINE, Z, ORTHO, GRID, ZOOM, PAN, HELP, CLEAR...
// ═══════════════════════════════════════════════════════════════════════════════

var _CMD = {
  history: [],          // command history
  historyIdx: -1,       // navigation index
  buffer: '',           // multi-step command buffer
  activeCmd: null,      // current multi-step command
  activePts: [],        // points collected for active cmd
  waitingForPoint: false,
  suggestions: [],
};

// ── COMMAND DEFINITIONS ───────────────────────────────────────────────────────
var CAD_COMMANDS = {

  // Place point at exact coords
  'POINT': {
    alias: ['PT','P'],
    desc: 'Разместить точку: POINT x y [z]',
    exec: function(args){
      var x=parseFloat(args[0]), y=parseFloat(args[1]), z=args[2]!=null?parseFloat(args[2]):null;
      if(!isFinite(x)||!isFinite(y)) return _cmdErr('Синтаксис: POINT x y [z]');
      addPoint(x,y,z,'Ввод');
      _cmdLog('✓ P'+((currentMode==='dxf'?points:manualPoints).length)+': X='+x.toFixed(4)+' Y='+y.toFixed(4)+(z!=null?' Z='+z.toFixed(4):''));
      requestDraw();
    }
  },

  // Interpolate Z at position
  'INTERP': {
    alias: ['I','INT'],
    desc: 'Интерполяция Z: INTERP x y',
    exec: function(args){
      var x=parseFloat(args[0]), y=parseFloat(args[1]);
      if(!isFinite(x)||!isFinite(y)) return _cmdErr('Синтаксис: INTERP x y');
      addInterpolatedPoint(x,y);
      _cmdLog('Интерполяция в ('+x.toFixed(4)+', '+y.toFixed(4)+')');
    }
  },

  // Set Z for point
  'Z': {
    alias: ['SETZ','ZSET'],
    desc: 'Задать Z: Z pointId value [type]',
    exec: function(args){
      var pid=parseInt(args[0]), zv=parseFloat(args[1]), tp=args[2]||'Абс.';
      var arr=currentMode==='dxf'?points:manualPoints;
      var p=arr.find(function(pt){return pt.id===pid;});
      if(!p) return _cmdErr('Точка P'+pid+' не найдена');
      p.z=zv; p.type=tp;
      updateTable(); requestDraw();
      _cmdLog('✓ P'+pid+': Z='+zv.toFixed(4)+' ['+tp+']');
    }
  },

  // Go to coordinates (pan canvas)
  'GOTO': {
    alias: ['GO','G'],
    desc: 'Перейти к координатам: GOTO x y',
    exec: function(args){
      var x=parseFloat(args[0]), y=parseFloat(args[1]);
      if(!isFinite(x)||!isFinite(y)) return _cmdErr('Синтаксис: GOTO x y');
      var cv=document.getElementById('cad-canvas');
      if(!cv) return;
      panX = cv.width/2 - (x-cadOriginX)*scale;
      panY = cv.height/2 + (y-cadOriginY)*scale;
      requestDraw();
      _cmdLog('→ X='+x.toFixed(3)+' Y='+y.toFixed(3));
    }
  },

  // Zoom
  'ZOOM': {
    alias: ['Z','ZE'],
    desc: 'Масштаб: ZOOM [in|out|fit|число]',
    exec: function(args){
      var arg=(args[0]||'fit').toLowerCase();
      if(arg==='in'){scale*=2;requestDraw();_cmdLog('Масштаб: ×2');}
      else if(arg==='out'){scale/=2;requestDraw();_cmdLog('Масштаб: ÷2');}
      else if(arg==='fit'||arg==='e'){
        if(typeof fitView==='function')fitView();
        _cmdLog('Вписать в экран');
      } else {
        var z=parseFloat(arg);
        if(isFinite(z)&&z>0){scale=z;requestDraw();_cmdLog('Масштаб: '+z);}
        else _cmdErr('ZOOM [in|out|fit|число]');
      }
    }
  },

  // Distance between two points
  'DIST': {
    alias: ['D','DI'],
    desc: 'Расстояние: DIST x1 y1 x2 y2  или  DIST P1 P2',
    exec: function(args){
      var arr=currentMode==='dxf'?points:manualPoints;
      var x1,y1,x2,y2,z1=null,z2=null;
      // Format: DIST P3 P7
      if(args[0]&&args[0].toUpperCase().startsWith('P')&&args[1]&&args[1].toUpperCase().startsWith('P')){
        var id1=parseInt(args[0].slice(1)),id2=parseInt(args[1].slice(1));
        var p1=arr.find(function(p){return p.id===id1;}),p2=arr.find(function(p){return p.id===id2;});
        if(!p1||!p2) return _cmdErr('Точки не найдены');
        x1=p1.x;y1=p1.y;z1=p1.z; x2=p2.x;y2=p2.y;z2=p2.z;
      } else {
        x1=parseFloat(args[0]);y1=parseFloat(args[1]);x2=parseFloat(args[2]);y2=parseFloat(args[3]);
        if(!isFinite(x1)||!isFinite(y1)||!isFinite(x2)||!isFinite(y2))
          return _cmdErr('DIST x1 y1 x2 y2');
      }
      var d2d=Math.hypot(x2-x1,y2-y1);
      var d3d=z1!=null&&z2!=null?Math.hypot(x2-x1,y2-y1,z2-z1):null;
      var az=Math.atan2(x2-x1,y2-y1)*180/Math.PI; if(az<0)az+=360;
      _cmdLog('2D: '+d2d.toFixed(4)+' м | Аз: '+az.toFixed(2)+'°'+
        (d3d!=null?' | 3D: '+d3d.toFixed(4)+' м':''));
    }
  },

  // List points
  'LIST': {
    alias: ['LS','L'],
    desc: 'Список точек: LIST [all|z|count]',
    exec: function(args){
      var arr=currentMode==='dxf'?points:manualPoints;
      var mode=(args[0]||'').toLowerCase();
      if(mode==='count'){return _cmdLog('Точек: '+arr.length);}
      if(mode==='z'){
        var zp=arr.filter(function(p){return p.z!=null;});
        _cmdLog('Точки с Z ('+zp.length+'):');
        zp.forEach(function(p){_cmdLog(' P'+p.id+': X='+p.x.toFixed(3)+' Y='+p.y.toFixed(3)+' Z='+p.z.toFixed(3));});
        return;
      }
      _cmdLog('Точки ('+arr.length+'):');
      arr.slice(0,15).forEach(function(p){
        _cmdLog(' P'+p.id+': X='+p.x.toFixed(4)+' Y='+p.y.toFixed(4)+(p.z!=null?' Z='+p.z.toFixed(4):''));
      });
      if(arr.length>15)_cmdLog(' ...ещё '+(arr.length-15));
    }
  },

  // Delete point
  'DEL': {
    alias: ['DELETE','ERASE','E'],
    desc: 'Удалить точку: DEL P3 или DEL last',
    exec: function(args){
      var arr=currentMode==='dxf'?points:manualPoints;
      var arg=(args[0]||'').toUpperCase();
      if(arg==='LAST'||arg==='L'){
        if(!arr.length) return _cmdErr('Нет точек');
        var p=arr.pop();
        _cmdLog('Удалена P'+p.id);
      } else if(arg.startsWith('P')){
        var id=parseInt(arg.slice(1));
        var idx=arr.findIndex(function(p){return p.id===id;});
        if(idx<0) return _cmdErr('P'+id+' не найдена');
        arr.splice(idx,1);
        _cmdLog('Удалена P'+id);
      } else return _cmdErr('DEL Pn или DEL last');
      updateTable(); requestDraw();
    }
  },

  // Toggle ortho
  'ORTHO': {
    alias: ['OR','O'],
    desc: 'Режим ORTHO (F8)',
    exec: function(){
      if(typeof toggleOrthoMode==='function')toggleOrthoMode();
      else _cmdLog('ORTHO: '+(typeof cadTools!=='undefined'&&cadTools.orthoMode?'ВКЛ':'ВЫКЛ'));
    }
  },

  // Toggle grid
  'GRID': {
    alias: ['GR'],
    desc: 'Координатная сетка (F7)',
    exec: function(){
      if(typeof toggleGrid==='function')toggleGrid();
      _cmdLog('GRID: '+(typeof cadTools!=='undefined'&&cadTools.gridVisible?'ВКЛ':'ВЫКЛ'));
    }
  },

  // Measure
  'MEASURE': {
    alias: ['ME','M'],
    desc: 'Быстрое измерение (2 клика)',
    exec: function(){
      if(typeof toggleMeasure==='function')toggleMeasure();
    }
  },

  // Interpolate ALL points without Z
  'INTERPALL': {
    alias: ['IA'],
    desc: 'Интерполировать все точки без Z',
    exec: function(){
      if(typeof interpolateMissingZ==='function') interpolateMissingZ();
      else _cmdErr('Функция не найдена');
    }
  },

  // Area/volume
  'AREA': {
    alias: ['AR','A'],
    desc: 'Площадь/объём текущего контура',
    exec: function(){
      if(typeof _savedArea!=='undefined'&&_savedArea>0){
        _cmdLog('Площадь: '+_savedArea.toFixed(4)+' м²');
        _cmdLog('Периметр: '+_savedPerimeter.toFixed(4)+' м');
        if(typeof _savedVolume!=='undefined'&&_savedVolume>0)
          _cmdLog('Объём: '+_savedVolume.toFixed(4)+' м³');
      } else _cmdLog('Контур не замкнут. Постройте контур инструментом ✏');
    }
  },

  // Set Z for current point (interactive)
  'SETZ': {
    alias: ['SZ'],
    desc: 'Задать Z ближайшей точке: SETZ z',
    exec: function(args){
      var z=parseFloat(args[0]);
      if(!isFinite(z)) return _cmdErr('SETZ число');
      var arr=currentMode==='dxf'?points:manualPoints;
      if(!arr.length) return _cmdErr('Нет точек');
      var last=arr[arr.length-1];
      last.z=z; updateTable(); requestDraw();
      _cmdLog('✓ P'+last.id+': Z='+z.toFixed(4));
    }
  },

  // Export
  'EXPORT': {
    alias: ['EX'],
    desc: 'Экспорт: EXPORT dxf|xyz|pdf',
    exec: function(args){
      var fmt=(args[0]||'').toLowerCase();
      if(fmt==='dxf'&&typeof exportToDXF==='function'){exportToDXF();_cmdLog('DXF экспортирован');}
      else if(fmt==='xyz'&&typeof openXYZExportDialog==='function'){openXYZExportDialog();_cmdLog('XYZ...');}
      else if(fmt==='pdf'&&typeof openPdfSettings==='function'){openPdfSettings('dxf');_cmdLog('PDF...');}
      else _cmdErr('EXPORT [dxf|xyz|pdf]');
    }
  },

  // Info about project
  'INFO': {
    alias: ['IN','STATUS'],
    desc: 'Информация о проекте',
    exec: function(){
      var arr=currentMode==='dxf'?points:manualPoints;
      var dims=typeof dimensions!=='undefined'?dimensions:[];
      _cmdLog('═══ ПРОЕКТ ═══');
      _cmdLog('Режим: '+(currentMode==='dxf'?'DXF':'Ручной ввод'));
      _cmdLog('Точек: '+arr.length);
      _cmdLog('Размеров: '+dims.length);
      if(typeof cadSymbols!=='undefined') _cmdLog('Символов: '+cadSymbols.length);
      if(typeof _savedArea!=='undefined'&&_savedArea>0) _cmdLog('Площадь: '+_savedArea.toFixed(4)+' м²');
      _cmdLog('Масштаб: '+scale.toFixed(4));
      if(typeof cadTools!=='undefined'){
        _cmdLog('ORTHO: '+(cadTools.orthoMode?'ВКЛ':'ВЫКЛ'));
        _cmdLog('GRID: '+(cadTools.gridVisible?'ВКЛ':'ВЫКЛ'));
      }
    }
  },

  // Clear console
  'CLEAR': {
    alias: ['CL','CLS'],
    desc: 'Очистить консоль',
    exec: function(){
      var log=document.getElementById('cad-cmd-log');
      if(log){log.innerHTML=''; _cmdLog('Консоль очищена');}
    }
  },

  // Help
  'HELP': {
    alias: ['H','?'],
    desc: 'Список команд',
    exec: function(args){
      if(args[0]){
        var name=args[0].toUpperCase();
        var cmd=_findCommand(name);
        if(cmd) return _cmdLog(cmd.desc);
        return _cmdErr('Команда '+name+' не найдена');
      }
      _cmdLog('═══ КОМАНДЫ CAD ═══');
      Object.keys(CAD_COMMANDS).forEach(function(k){
        var c=CAD_COMMANDS[k];
        _cmdLog(k+(c.alias?' ['+c.alias.join('|')+']':'')+' — '+c.desc);
      });
    }
  }
};

// ── COMMAND ENGINE ────────────────────────────────────────────────────────────
function _findCommand(name){
  var n=name.toUpperCase();
  if(CAD_COMMANDS[n]) return CAD_COMMANDS[n];
  for(var k in CAD_COMMANDS){
    if(CAD_COMMANDS[k].alias && CAD_COMMANDS[k].alias.indexOf(n)>=0)
      return CAD_COMMANDS[k];
  }
  return null;
}

function _cmdLog(text){
  var log=document.getElementById('cad-cmd-log');
  if(!log) return;
  var line=document.createElement('div');
  line.style.cssText='padding:1px 0;color:#94a3b8;white-space:pre-wrap;word-break:break-all;';
  line.textContent=text;
  log.appendChild(line);
  log.scrollTop=log.scrollHeight;
}

function _cmdErr(text){
  var log=document.getElementById('cad-cmd-log');
  if(!log) return;
  var line=document.createElement('div');
  line.style.cssText='padding:1px 0;color:#ef4444;white-space:pre-wrap;';
  line.textContent='✕ '+text;
  log.appendChild(line);
  log.scrollTop=log.scrollHeight;
}

function _cmdPrompt(text){
  var log=document.getElementById('cad-cmd-log');
  if(!log) return;
  var line=document.createElement('div');
  line.style.cssText='padding:1px 0;color:#e2e8f0;font-weight:bold;white-space:pre-wrap;';
  line.textContent='» '+text;
  log.appendChild(line);
  log.scrollTop=log.scrollHeight;
}

function executeCommand(rawInput){
  var input=(rawInput||'').trim();
  if(!input) return;
  _CMD.history.unshift(input);
  _CMD.historyIdx=-1;
  _cmdPrompt(input);

  var parts=input.split(/\s+/);
  var name=parts[0].toUpperCase();
  var args=parts.slice(1);

  var cmd=_findCommand(name);
  if(!cmd){
    // Check if it's a coordinate (x,y or x y)
    var nums=input.split(/[\s,;]+/).map(parseFloat).filter(isFinite);
    if(nums.length>=2){
      // Direct coordinate input
      addPoint(nums[0],nums[1],nums[2]!=null?nums[2]:null,'Ввод');
      _cmdLog('✓ Точка: X='+nums[0].toFixed(4)+' Y='+nums[1].toFixed(4)+(nums[2]!=null?' Z='+nums[2].toFixed(4):''));
      requestDraw();
      return;
    }
    return _cmdErr('Команда "'+name+'" не найдена. HELP — список команд');
  }
  try { cmd.exec(args); } catch(e){ _cmdErr('Ошибка: '+e.message); }
}

// ── AUTOCOMPLETE ─────────────────────────────────────────────────────────────
function _buildSuggestions(partial){
  partial=partial.toUpperCase();
  var all=Object.keys(CAD_COMMANDS);
  Object.values(CAD_COMMANDS).forEach(function(c){if(c.alias)all=all.concat(c.alias);});
  return all.filter(function(k){return k.startsWith(partial);}).slice(0,6);
}

// ── CREATE CONSOLE DOM ───────────────────────────────────────────────────────
function _createCadConsole(){
  // Remove existing
  var old=document.getElementById('cad-console-panel');
  if(old)old.remove();

  var panel=document.createElement('div');
  panel.id='cad-console-panel';
  panel.style.display='none'; // hidden by default
  panel.style.cssText=
    'position:fixed;bottom:22px;left:0;right:0;height:130px;'+
    'background:#0f172a;border-top:1px solid #1e3a5f;'+
    'display:flex;flex-direction:column;z-index:9998;'+
    'font-family:"Courier New",monospace;font-size:11px;'+
    'transition:height .2s ease;';

  // Header bar
  var hdr=document.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;padding:3px 8px;background:#1e293b;'+
    'border-bottom:1px solid #1e3a5f;flex-shrink:0;gap:8px;height:22px;';
  hdr.innerHTML=
    '<span style="color:#f59e0b;font-size:10px;font-weight:bold;">⌘ КОМАНДНАЯ СТРОКА</span>'+
    '<span style="flex:1"></span>'+
    '<button onclick="_cmdToggleHeight()" style="background:none;border:none;color:#475569;'+
    'cursor:pointer;font-size:12px;padding:0 4px;" title="Свернуть/развернуть" id="cad-cmd-toggle">▲</button>'+
    '<button onclick="document.getElementById(\'cad-console-panel\').style.display=\'none\'" '+
    'style="background:none;border:none;color:#475569;cursor:pointer;font-size:14px;padding:0;" title="Скрыть">✕</button>';
  panel.appendChild(hdr);

  // Log area
  var log=document.createElement('div');
  log.id='cad-cmd-log';
  log.style.cssText='flex:1;overflow-y:auto;padding:4px 8px;color:#64748b;';
  log.innerHTML='<div style="color:#475569">CAD Extractor — Введите HELP для списка команд</div>';
  panel.appendChild(log);

  // Suggestions bar
  var sug=document.createElement('div');
  sug.id='cad-cmd-suggestions';
  sug.style.cssText='display:flex;gap:4px;padding:2px 8px;flex-shrink:0;min-height:18px;';
  panel.appendChild(sug);

  // Input row
  var inp_row=document.createElement('div');
  inp_row.style.cssText='display:flex;align-items:center;padding:4px 8px;border-top:1px solid #1e3a5f;flex-shrink:0;gap:6px;';
  inp_row.innerHTML=
    '<span style="color:#2563eb;font-weight:bold;font-size:12px;">Command:</span>'+
    '<input id="cad-cmd-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" '+
    'placeholder="POINT x y z · INTERP x y · DIST · LIST · HELP" '+
    'style="flex:1;background:transparent;border:none;outline:none;color:#f1f5f9;font-family:inherit;font-size:12px;">'+
    '<span id="cad-cmd-coords" style="color:#334155;font-size:10px;white-space:nowrap;"></span>';
  panel.appendChild(inp_row);

  document.body.appendChild(panel);

  // Events
  var input=document.getElementById('cad-cmd-input');
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter'){
      executeCommand(this.value);
      this.value='';
      document.getElementById('cad-cmd-suggestions').innerHTML='';
    } else if(e.key==='ArrowUp'){
      e.preventDefault();
      _CMD.historyIdx=Math.min(_CMD.historyIdx+1,_CMD.history.length-1);
      if(_CMD.history[_CMD.historyIdx]) this.value=_CMD.history[_CMD.historyIdx];
    } else if(e.key==='ArrowDown'){
      e.preventDefault();
      _CMD.historyIdx=Math.max(_CMD.historyIdx-1,-1);
      this.value=_CMD.historyIdx>=0?_CMD.history[_CMD.historyIdx]:'';
    } else if(e.key==='Tab'){
      e.preventDefault();
      var sugs=_buildSuggestions(this.value);
      if(sugs.length===1) this.value=sugs[0]+' ';
    } else if(e.key==='Escape'){
      this.value='';
      document.getElementById('cad-cmd-suggestions').innerHTML='';
    }
  });
  input.addEventListener('input',function(){
    var v=this.value.trim();
    var sug_el=document.getElementById('cad-cmd-suggestions');
    if(!v||v.includes(' ')){sug_el.innerHTML='';return;}
    var sugs=_buildSuggestions(v);
    sug_el.innerHTML=sugs.map(function(s){
      return '<button onclick="document.getElementById(\'cad-cmd-input\').value=\''+s+' \';'+
        'document.getElementById(\'cad-cmd-input\').focus()" '+
        'style="background:#1e3a5f;border:none;color:#94a3b8;border-radius:3px;'+
        'padding:1px 6px;cursor:pointer;font-size:10px;font-family:inherit;">'+s+'</button>';
    }).join('');
  });

  // Keyboard shortcut to focus console
  document.addEventListener('keydown',function(e){
    if(e.key===':'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){
      e.preventDefault();
      var p=document.getElementById('cad-console-panel');
      if(p){p.style.display='flex';document.getElementById('cad-cmd-input').focus();}
    }
  });

  _cmdLog('Горячие клавиши: F7=Grid, F8=Ortho, F10=Polar, ":"=Фокус консоли');
}

window._cmdToggleHeight=function(){
  var p=document.getElementById('cad-console-panel');
  var btn=document.getElementById('cad-cmd-toggle');
  if(!p)return;
  var collapsed=p.style.height==='22px';
  p.style.height=collapsed?'130px':'22px';
  if(btn)btn.textContent=collapsed?'▲':'▼';
};

// ── Hook into existing coord HUD update ──────────────────────────────────────
var _origCreateBottomBar=window.createBottomBar;
// Patch bottom-bar to shift up
function _patchBottomBar(){
  try{
    var bar=document.getElementById('bottom-status-bar');
    if(bar) bar.style.bottom='0'; // no console by default
    var snap=document.getElementById('snap-popup');
    if(snap) snap.style.bottom='162px';
  }catch(e){}
}

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  setTimeout(function(){
    _createCadConsole();
    _patchBottomBar();
    // Update coord display in console
    var cv=document.getElementById('cad-canvas');
    if(cv) cv.addEventListener('mousemove',function(e){
      var r=cv.getBoundingClientRect();
      var wc=screenToCad(e.clientX-r.left, e.clientY-r.top);
      var el=document.getElementById('cad-cmd-coords');
      if(el) el.textContent='X:'+wc.x.toFixed(3)+' Y:'+wc.y.toFixed(3);
    });
  }, 600);
});

window.executeCommand=executeCommand;
window.CAD_COMMANDS=CAD_COMMANDS;
