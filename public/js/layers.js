// ── layers.js ──────────────────────────────────────────

function buildDxfLayersPanel(){
var l=document.getElementById('lyr-panel-1');
var keys=Object.keys(dxfLayers);
if(keys.length===0){l.innerHTML='<div class="italic text-center py-4 text-slate-400 text-xs">Слои не найдены</div>';return;}
keys.sort(function(a,b){return a.localeCompare(b,'ru');});
var h='';
keys.forEach(function(name){
  var ly=dxfLayers[name];
  var vis=(ly===true)||(ly&&ly.visible!==false);
  var col=(ly&&typeof ly==='object'&&ly.color)?ly.color:'#64748b';
  var cnt=(ly&&typeof ly==='object'&&ly.count)?ly.count:0;
  var desc=(ly&&typeof ly==='object'&&ly.description)?ly.description:'';
  var incl=(ly&&typeof ly==='object'&&ly.printInclude)||false;
  var safeN=name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  var encN=encodeURIComponent(name);
  h+='<div class="border-b border-slate-100 last:border-0">';
  // Main row
  h+='<div class="flex items-start gap-2 px-3 py-2 hover:bg-slate-50">';
  // Color swatch
  h+='<span style="width:14px;height:14px;border-radius:3px;flex-shrink:0;margin-top:1px;background:'+col+';border:1px solid rgba(0,0,0,.15)" title="Цвет слоя"></span>';
  // Visibility
  h+='<input type="checkbox" '+(vis?'checked':'')+' onchange="toggleDxfLayer(\''+safeN+'\',this.checked)" class="accent-indigo-600 flex-shrink-0 mt-0.5">';
  // Full layer name — no truncate
  h+='<span class="flex-1 text-xs font-medium leading-snug break-all '+(vis?'text-slate-700':'text-slate-400 line-through')+'">'+name+'</span>';
  // Count
  h+='<span class="text-[10px] text-slate-400 flex-shrink-0 mt-0.5 min-w-[24px] text-right">'+cnt+'</span>';
  // PDF checkbox
  h+='<label class="flex items-center gap-1 flex-shrink-0 cursor-pointer" title="Включить в PDF">';
  h+='<input type="checkbox" '+(incl?'checked':'')+' onchange="setLayerPrint(\''+safeN+'\',this.checked)" class="accent-emerald-600 rounded">';
  h+='<i class="fa-solid fa-file-pdf text-[11px] '+(incl?'text-emerald-500':'text-slate-300')+'"></i></label>';
  // Expand btn
  h+='<button onclick="toggleLayerRow(\''+encN+'\')" class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-300 hover:text-slate-600 mt-0.5">';
  h+='<i id="la-'+encN+'" class="fa-solid fa-chevron-down text-[10px] transition-transform '+(desc?'rotate-180':'')+'"></i></button>';
  h+='</div>';
  // Description row
  h+='<div id="ld-'+encN+'" class="px-3 pb-2 pt-0 '+(desc?'':'hidden')+'">';
  h+='<input type="text" value="'+desc.replace(/"/g,'&quot;')+'" ';
  h+='placeholder="Описание слоя (будет напечатано в PDF-отчёте)..." ';
  h+='oninput="setLayerDesc(\''+safeN+'\',this.value)" ';
  h+='class="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400 bg-white">';
  h+='</div>';
  h+='</div>';
});
l.innerHTML=h;
}

function toggleLayerRow(enc){
  var d=document.getElementById('ld-'+enc),a=document.getElementById('la-'+enc);
  if(d)d.classList.toggle('hidden');
  if(a)a.classList.toggle('rotate-180');
}

function setLayerDesc(n,v){if(dxfLayers[n]&&typeof dxfLayers[n]==='object')dxfLayers[n].description=v;}

function setLayerPrint(n,v){
  if(dxfLayers[n]&&typeof dxfLayers[n]==='object'){
    dxfLayers[n].printInclude=v;
    var enc=encodeURIComponent(n);
    var icon=document.querySelector('#ld-'+enc+' ~ * .fa-file-pdf, [id="la-'+enc+'"]');
    buildDxfLayersPanel(); // refresh to update icon color
  }
}

function toggleAllLayers(vis){
  Object.keys(dxfLayers).forEach(function(n){
    if(dxfLayers[n]===null||dxfLayers[n]===undefined)return;
    if(typeof dxfLayers[n]!=='object')dxfLayers[n]={visible:!!dxfLayers[n]};
    dxfLayers[n].visible=vis;
  });
  buildDxfLayersPanel();rebuildCachedPath();
}

function toggleDxfLayer(n,vis){
  if(dxfLayers[n]===null||dxfLayers[n]===undefined)return;
  // If layer stored as boolean, upgrade to object
  if(typeof dxfLayers[n]!=='object')dxfLayers[n]={visible:!!dxfLayers[n]};
  dxfLayers[n].visible=vis;
  rebuildCachedPath();
}

function _updateDxf2LayerPanel(){
  var c=document.getElementById('lyr-dxf2-controls');
  var e=document.getElementById('lyr-dxf2-empty');
  if(secondDxfElements.length>0){
    if(c)c.classList.remove('hidden');
    if(e)e.classList.add('hidden');
  } else {
    if(c)c.classList.add('hidden');
    if(e)e.classList.remove('hidden');
  }
  // Reset checkboxes
  var cv=document.getElementById('lyr-dxf2-visible');if(cv)cv.checked=true;
  var cl=document.getElementById('lyr-dxf2-lines');if(cl)cl.checked=true;
  var cp=document.getElementById('lyr-dxf2-points');if(cp)cp.checked=true;
  secondDxfVisible=true;secondDxfLinesVisible=true;secondDxfPointsVisible=true;
}
