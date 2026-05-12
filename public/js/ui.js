// ── ui.js ──────────────────────────────────────────

function showMessage(t,txt,type='error'){const m=document.getElementById('custom-modal'),c=document.getElementById('modal-content'),i=document.getElementById('modal-icon');document.getElementById('modal-title').textContent=t;document.getElementById('modal-text').textContent=txt;if(type==='error')i.className='fa-solid fa-circle-exclamation text-xl md:text-2xl text-red-500';else if(type==='warning')i.className='fa-solid fa-triangle-exclamation text-xl md:text-2xl text-amber-500';else if(type==='success')i.className='fa-solid fa-circle-check text-xl md:text-2xl text-emerald-500';else i.className='fa-solid fa-circle-info text-xl md:text-2xl text-blue-500';m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}

function hideMessage(){const m=document.getElementById('custom-modal'),c=document.getElementById('modal-content');m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}

function showConfirm(t,txt,onYes){const m=document.getElementById('confirm-modal'),c=document.getElementById('confirm-modal-content');document.getElementById('confirm-modal-title').textContent=t;document.getElementById('confirm-modal-text').textContent=txt;document.getElementById('confirm-modal-btn-yes').onclick=()=>{hideConfirm();onYes();};document.getElementById('confirm-modal-btn-no').onclick=hideConfirm;m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);function hideConfirm(){m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}

function switchMode(m){currentMode=m;const act="px-3 md:px-4 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 bg-blue-600 text-white shadow-sm",inact="px-3 md:px-4 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white";['desktop'].forEach(d=>{const bd=document.getElementById(`tab-dxf-${d}`),bm=document.getElementById(`tab-manual-${d}`);if(bd)bd.className=m==='dxf'?act:inact;if(bm)bm.className=m==='manual'?act:inact;});const cd=document.getElementById('controls-dxf'),cm=document.getElementById('controls-manual'),md=document.getElementById('mode-dxf'),mm=document.getElementById('mode-manual');if(m==='dxf'){if(cd){cd.classList.remove('hidden');cd.classList.add('flex');}if(cm){cm.classList.add('hidden');cm.classList.remove('flex');}if(md)md.classList.remove('hidden');if(mm)mm.classList.add('hidden');setTimeout(()=>{resizeCanvas();requestDraw();},50);}else{if(cm){cm.classList.remove('hidden');cm.classList.add('flex');}if(cd){cd.classList.add('hidden');cd.classList.remove('flex');}if(mm)mm.classList.remove('hidden');if(md)md.classList.add('hidden');setTimeout(()=>{resizeManualCanvas();requestManualDraw();},50);}}

function toggleHelpModal(){const m=document.getElementById('help-modal'),c=document.getElementById('help-content');isHelpModalOpen=!isHelpModalOpen;if(isHelpModalOpen){m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}

function toggleEarthworksModal(){const m=document.getElementById('earthworks-modal'),c=document.getElementById('earthworks-content');isEarthworksModalOpen=!isEarthworksModalOpen;if(isEarthworksModalOpen){if(isPointsModalOpen)togglePointsModal();if(isDimsModalOpen)toggleDimsModal();m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);const a=document.querySelector('input[name="ew-bounds-type"][value="auto"]');if(a)a.checked=true;toggleEwBoundsInput();}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}

function togglePointsModal(){const m=document.getElementById('points-modal'),c=document.getElementById('points-modal-content');isPointsModalOpen=!isPointsModalOpen;if(isPointsModalOpen){if(isDimsModalOpen)toggleDimsModal();m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}

function toggleDimsModal(){const m=document.getElementById('dims-modal'),c=document.getElementById('dims-modal-content');isDimsModalOpen=!isDimsModalOpen;if(isDimsModalOpen){if(isPointsModalOpen)togglePointsModal();m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}

function toggleCadastreModal(){const m=document.getElementById('cadastre-modal'),c=document.getElementById('cadastre-modal-content');if(m.classList.contains('hidden')){m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}

function togglePointLabels(){showPointLabels=!showPointLabels;const cls=showPointLabels?'bg-blue-100 text-blue-600 shadow-inner':'hover:bg-slate-200 text-slate-600',icon=showPointLabels?'<i class="fa-solid fa-eye text-base md:text-lg"></i>':'<i class="fa-solid fa-eye-slash text-base md:text-lg"></i>',bd=document.getElementById('dxf-tool-labels'),bm=document.getElementById('man-tool-labels');if(bd){bd.className=`p-2 md:p-2.5 rounded-lg transition w-full ${cls}`;bd.innerHTML=icon;}if(bm){bm.className=`p-2 md:p-2.5 rounded-lg transition w-full ${cls}`;bm.innerHTML=icon;}if(currentMode==='dxf')requestDraw();else requestManualDraw();}

function setManTool(t){manCurrentTool=t;manLineStartPoint=null;manPolyPoints=[];document.getElementById('man-tool-pan').className=t==='pan'?'p-2 md:p-2.5 rounded-lg bg-blue-100 text-blue-600 shadow-inner transition w-8 md:w-10':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-8 md:w-10';document.getElementById('man-tool-line').className=t==='line'?'p-2 md:p-2.5 rounded-lg bg-indigo-100 text-indigo-600 shadow-inner transition w-8 md:w-10':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-8 md:w-10';document.getElementById('man-tool-polygon').className=t==='polygon'?'p-2 md:p-2.5 rounded-lg bg-amber-100 text-amber-600 shadow-inner transition w-8 md:w-10':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-8 md:w-10';const h=document.getElementById('man-tool-hint'),fb=document.getElementById('man-tool-finish-poly');if(fb)fb.classList.add('hidden');if(t==='pan'){h.innerHTML='<p><i class="fa-solid fa-hand w-3 md:w-4"></i> Панорамирование</p>';document.getElementById('manual-canvas').style.cursor='grab';}else if(t==='polygon'){h.innerHTML='<p><i class="fa-solid fa-draw-polygon w-3 md:w-4 text-amber-500"></i> Клик — узлы полигона</p>';document.getElementById('manual-canvas').style.cursor='crosshair';if(fb)fb.classList.remove('hidden');}else{h.innerHTML='<p><i class="fa-solid fa-pen-nib w-3 md:w-4 text-indigo-500"></i> Линия (Орто: Shift)</p>';document.getElementById('manual-canvas').style.cursor='crosshair';}requestManualDraw();}

function updateManualTable(){const tb=document.getElementById('manual-points-tbody');if(manualPoints.length===0){tb.innerHTML=`<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400 italic">Добавьте точки.</td></tr>`;updateZDropdown();return;}let h='';manualPoints.forEach(p=>{const z=p.z!==null?p.z.toFixed(3):'-';h+=`<tr class="hover:bg-blue-50 border-b border-slate-100 bg-white"><td class="px-2 md:px-4 py-1.5 md:py-3 font-bold text-[10px] md:text-sm">P${p.id}</td><td class="px-1 md:px-2 py-1.5 md:py-3 font-mono text-[9px] md:text-xs text-blue-600">X:${p.x.toFixed(3)}<br><span class="text-emerald-600">Y:${p.y.toFixed(3)}</span></td><td class="px-1 md:px-2 py-1.5 md:py-3 font-mono text-[9px] md:text-xs font-semibold">${z}</td><td class="px-1 md:px-2 py-1.5 md:py-3 text-right"><button onclick="editManualPoint(${p.id})" class="text-blue-400 hover:text-blue-600 mr-1"><i class="fa-solid fa-pen"></i></button><button onclick="deleteManualPoint(${p.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button></td></tr>`;});tb.innerHTML=h;updateZDropdown();}

function updateManualLinesTable(){const tb=document.getElementById('manual-lines-tbody');if(manualLines.length===0){tb.innerHTML=`<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400 italic">Нет линий.</td></tr>`;return;}let h='';manualLines.forEach(l=>{const d=Math.hypot(l.p2.x-l.p1.x,l.p2.y-l.p1.y).toFixed(3);h+=`<tr class="hover:bg-blue-50 border-b border-slate-100 bg-white"><td class="px-2 md:px-4 py-1.5 md:py-3 font-bold text-[10px] md:text-xs">P${l.p1.id}-P${l.p2.id}</td><td class="px-1 md:px-2 py-1.5 md:py-3 font-mono text-[9px] md:text-xs">${d}</td><td class="px-1 md:px-2 py-1.5 md:py-3 text-right"><button onclick="deleteManualLine(${l.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button></td></tr>`;});tb.innerHTML=h;}

function setupTouchEvents(canvasId,isDxf){var cv=document.getElementById(canvasId);if(!cv)return;var lt=[],lpd=null;cv.addEventListener('touchstart',function(e){e.preventDefault();lt=Array.from(e.touches);if(lt.length===2)lpd=Math.hypot(lt[1].clientX-lt[0].clientX,lt[1].clientY-lt[0].clientY);},{passive:false});cv.addEventListener('touchmove',function(e){e.preventDefault();var t=Array.from(e.touches);if(t.length===1&&lt.length>=1){var dx=t[0].clientX-lt[0].clientX,dy=t[0].clientY-lt[0].clientY;if(isDxf){if(northAngle!==0){var _a2=northAngle*Math.PI/180,_c2=Math.cos(_a2),_s2=Math.sin(_a2);panX+=dx*_c2-dy*_s2;panY+=dx*_s2+dy*_c2;}else{panX+=dx;panY+=dy;}}else{manPanX+=dx;manPanY+=dy;}lt=t;if(isDxf)requestDraw();else requestManualDraw();}else if(t.length===2&&lt.length>=2){var cd=Math.hypot(t[1].clientX-t[0].clientX,t[1].clientY-t[0].clientY);if(lpd&&cd>0){var z=cd/lpd,r=cv.getBoundingClientRect(),cx2=(t[0].clientX+t[1].clientX)/2-r.left,cy2=(t[0].clientY+t[1].clientY)/2-r.top;if(isDxf){var rx=cx2-panX,ry=cy2-panY,os=scale;scale*=z;if(scale>baseScale*100000)scale=baseScale*100000;if(scale<baseScale/10000)scale=baseScale/10000;panX=cx2-rx*(scale/os);panY=cy2-ry*(scale/os);}else{var rxM=cx2-manPanX,ryM=manPanY-cy2,osM=manScale;manScale*=z;manPanX=cx2-rxM*(manScale/osM);manPanY=cy2+ryM*(manScale/osM);}lpd=cd;}lt=t;if(isDxf)requestDraw();else requestManualDraw();}},{passive:false});cv.addEventListener('touchend',function(e){lt=Array.from(e.touches);if(lt.length<2)lpd=null;},{passive:false});}

function toggleBgImagePanel(){var p=document.getElementById('bg-image-panel');if(p.classList.contains('hidden')){p.classList.remove('hidden');p.style.display='flex';}else{p.classList.add('hidden');p.style.display='none';}}

function toggleManualPanel(){var p=document.getElementById('manual-left-panel'),b=document.getElementById('btn-toggle-man-panel');isManPanelOpen=!isManPanelOpen;if(isManPanelOpen){p.classList.remove('hidden');if(b)b.innerHTML='<i class="fa-solid fa-bars"></i>';}else{p.classList.add('hidden');if(b)b.innerHTML='<i class="fa-solid fa-chevron-right"></i>';}setTimeout(function(){resizeManualCanvas();},50);}

function toggleContoursConfig(){var p=document.getElementById('contours-panel');if(p.classList.contains('hidden')){p.classList.remove('hidden');p.style.display='flex';}else{p.classList.add('hidden');p.style.display='none';}}

function toggleManContourVis(){showContours=document.getElementById('man-contour-visible').checked;requestManualDraw();}

function toggleDxfContourVis(){dxfShowContours=document.getElementById('dxf-contour-visible').checked;requestDraw();}

function showHelpTab(id){
  document.querySelectorAll('.help-panel').forEach(function(p){p.classList.add('hidden');});
  document.querySelectorAll('.help-tab').forEach(function(t){
    t.classList.remove('active','border-blue-600','text-blue-600');
    t.classList.add('inactive','border-transparent','text-slate-500');
  });
  var panel=document.getElementById(id);
  if(panel)panel.classList.remove('hidden');
  var tab=document.getElementById('ht-'+id.replace('h-',''));
  if(tab){tab.classList.remove('inactive','border-transparent','text-slate-500');tab.classList.add('active','border-blue-600','text-blue-600');}
}

function setLayerTab(n){
  ['lyr-panel-1','lyr-panel-2'].forEach(function(id,i){
    var p=document.getElementById(id);if(p){p.classList.toggle('hidden',i+1!==n);}
  });
  ['lyr-tab-1','lyr-tab-2'].forEach(function(id,i){
    var b=document.getElementById(id);if(!b)return;
    if(i+1===n){
      b.className='flex-1 py-1.5 text-[10px] font-semibold text-blue-600 border-b-2 border-blue-500 bg-white';
    } else {
      b.className='flex-1 py-1.5 text-[10px] font-semibold text-slate-400 border-b-2 border-transparent';
    }
  });
}

function setSecondDxfVisible(v){secondDxfVisible=v;requestDraw();}

function setSecondDxfLinesVis(v){secondDxfLinesVisible=v;requestDraw();}

function setSecondDxfPointsVis(v){secondDxfPointsVisible=v;requestDraw();}

function setContourColor(c){dxfContourColor=c;requestDraw();}

function setContourOpacity(o){dxfContourOpacity=parseFloat(o);requestDraw();}

function openAreaVol(){
  var pts=points.filter(function(p){return Number.isFinite(p.x)&&Number.isFinite(p.y);});
  var av=document.getElementById('area-vol-modal');if(!av)return;
  document.getElementById('av-pt-count').textContent=pts.length;
  if(pts.length<3){
    document.getElementById('av-area').textContent='Нужно >= 3 точек';
    document.getElementById('av-perimeter').textContent='--';
    document.getElementById('av-volume').textContent='--';
    av.classList.remove('hidden');return;
  }
  var area=_shoelaceArea(pts),perim=_perimeterCalc(pts);
  _savedArea=area;_savedPerimeter=perim;
  document.getElementById('av-area').textContent=area.toFixed(3)+' м²';
  document.getElementById('av-perimeter').textContent=perim.toFixed(3)+' м';
  updateVolume();
  av.classList.remove('hidden');
}

function updateVolume(){
  var h=parseFloat(document.getElementById('av-height').value)||0;
  var vol=_savedArea*Math.abs(h);_savedVolume=vol;
  document.getElementById('av-volume').textContent=
    _savedArea>0?(vol.toFixed(3)+' м³'):'--';
}

function closeAreaVol(){document.getElementById('area-vol-modal').classList.add('hidden');}

function saveAreaVolToReport(){
  closeAreaVol();
  showMessage('Записано',
    'Площадь: '+_savedArea.toFixed(3)+' м²\n'+
    'Периметр: '+_savedPerimeter.toFixed(3)+' м\n'+
    'Объём: '+_savedVolume.toFixed(3)+' м³\n\nДанные будут включены в PDF.','success');
}

function toggleSnapPanel(){
  var p=document.getElementById('snap-panel');
  if(p)p.classList.toggle('hidden');
}

function updateSnapModes(){
  snapModes.nodes   =document.getElementById('snap-nodes')   ?document.getElementById('snap-nodes').checked   :true;
  snapModes.lines   =document.getElementById('snap-lines')   ?document.getElementById('snap-lines').checked   :true;
  snapModes.midpoints=document.getElementById('snap-midpoints')?document.getElementById('snap-midpoints').checked:false;
  // Update label
  var active=[];
  if(snapModes.nodes)active.push('Узлы');
  if(snapModes.lines)active.push('Линии');
  if(snapModes.midpoints)active.push('Середина');
  var lbl=document.getElementById('snap-mode-label');
  if(lbl)lbl.textContent=active.length?active.join('+'):'Выкл';
}

function toggleLeaders(){
  showLeaders=!showLeaders;
  var btn=document.getElementById('leaders-toggle-btn');
  if(btn){
    btn.classList.toggle('text-emerald-600',showLeaders);
    btn.classList.toggle('text-slate-400',!showLeaders);
  }
  requestDraw();
}

function _quickWall(){
  // Open sym panel and select wall
  var p=document.getElementById('sym-panel');
  if(p){p.style.display='flex';}
  _symInit();
  setTimeout(function(){_symSel('wall');},60);
}

function _openSymPanelFromBar(){
  var p=document.getElementById('sym-panel');
  if(p){p.style.display=p.style.display==='flex'?'none':'flex';}
  _symInit();
}
