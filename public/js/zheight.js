// ── zheight.js ──────────────────────────────────────────

function toggleDxfZPanel(){const p=document.getElementById('dxf-z-panel'),b=document.getElementById('btn-show-dxf-z-panel');isDxfZPanelOpen=!isDxfZPanelOpen;if(isDxfZPanelOpen){p.classList.remove('hidden');p.classList.add('flex');b.classList.add('hidden');b.classList.remove('flex');}else{p.classList.add('hidden');p.classList.remove('flex');b.classList.remove('hidden');b.classList.add('flex');}}

function updateZDropdown(){const s=document.getElementById('edit-z-point-select');if(!s)return;const v=s.value;s.innerHTML='<option value="" disabled selected>Выберите точку...</option>';const tp=currentMode==='dxf'?points:manualPoints;if(tp.length===0){s.disabled=true;document.getElementById('edit-z-value').disabled=true;document.getElementById('edit-z-type').disabled=true;document.getElementById('btn-apply-z').disabled=true;return;}else{s.disabled=false;document.getElementById('edit-z-value').disabled=false;document.getElementById('edit-z-type').disabled=false;document.getElementById('btn-apply-z').disabled=false;}tp.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=`P${p.id} ${p.z!==null?'(Z: '+p.z.toFixed(3)+')':'(Z: нет)'}`;s.appendChild(o);});if(v&&tp.find(p=>p.id==v))s.value=v;}

function applyZToPoint(){const s=document.getElementById('edit-z-point-select'),i=parseInt(s.value),zi=document.getElementById('edit-z-value').value,t=document.getElementById('edit-z-type').value;if(isNaN(i)||zi===''){showMessage('Внимание','Выберите точку и введите Z.','warning');return;}const tp=currentMode==='dxf'?points:manualPoints,p=tp.find(pt=>pt.id===i);if(p){p.z=parseFloat(zi.replace(',','.'));p.type=t;if(currentMode==='dxf'){updateTable();requestDraw();}else{saveManState();updateManualTable();requestManualDraw();}const b=document.getElementById('btn-apply-z'),o=b.innerHTML;b.innerHTML='<i class="fa-solid fa-check"></i> Сохранено!';b.className='w-full bg-emerald-600 text-white text-[10px] md:text-sm font-medium py-1 md:py-1.5 rounded transition shadow-sm flex items-center justify-center gap-1 md:gap-1.5 mt-0.5 md:mt-1';setTimeout(()=>{b.innerHTML=o;b.className='w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] md:text-sm font-medium py-1 md:py-1.5 rounded transition shadow-sm flex items-center justify-center gap-1 md:gap-1.5 mt-0.5 md:mt-1';},1500);}}

function onZTypeChange(){
  var t=document.getElementById('edit-z-type').value;
  var vf=document.getElementById('z-vekha-fields');
  var er=document.getElementById('z-extra-h-row');
  if(t==='Призма'||t==='Поверхность'){
    if(vf)vf.style.display='flex';
    // Extra height only for Поверхность
    if(er)er.style.display=(t==='Поверхность')?'flex':'none';
    calcVekhaZ();
  } else {
    if(vf)vf.style.display='none';
  }
}

function calcVekhaZ(){
  var zRaw=parseFloat(document.getElementById('edit-z-value').value)||0;
  var vh=parseFloat(document.getElementById('z-vekha-h').value)||0;
  var corr=parseFloat(document.getElementById('z-vekha-corr').value)||0;
  var eh=parseFloat((document.getElementById('z-extra-h')||{}).value)||0;
  var t=document.getElementById('edit-z-type').value;
  var zFinal;
  if(t==='Призма'){
    // Z = measured - vekha_height + correction
    zFinal=zRaw-vh+corr;
  } else if(t==='Поверхность'){
    // Z = measured - vekha_height + correction + extra_height
    zFinal=zRaw-vh+corr+eh;
  } else {
    zFinal=zRaw;
  }
  var r=document.getElementById('z-vekha-result');
  if(r)r.textContent=zFinal.toFixed(3)+' м';
  return zFinal;
}

function applyZToPoint(){
  var t=document.getElementById('edit-z-type').value;
  if(t==='Призма'||t==='Поверхность'){
    // Get computed Z and write it to the Z input
    var zFinal=calcVekhaZ();
    document.getElementById('edit-z-value').value=zFinal.toFixed(3);
    // Temporarily set type to Абс. so it saves correctly
    document.getElementById('edit-z-type').value='Абс.';
    _origApplyZ();
    document.getElementById('edit-z-type').value=t;
    document.getElementById('edit-z-value').value='';
    return;
  }
  _origApplyZ();
}
