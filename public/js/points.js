// ── points.js ──────────────────────────────────────────

function addPoint(x,y,fz=undefined,ft=undefined){if(!Number.isFinite(x)||!Number.isFinite(y))return;let z=null,t='-';if(fz!==undefined){z=fz;t=ft||'Интерп.';}points.push({id:points.length>0?Math.max(...points.map(p=>p.id))+1:1,x,y,z,type:t});updateTable();requestDraw();}

function addInterpolatedPoint(tx,ty){const zp=points.filter(p=>p.z!==null&&Number.isFinite(p.z));if(zp.length<3){showMessage('Ошибка','Минимум 3 точки с Z','warning');return;}let sw=0,swz=0;for(let i=0;i<zp.length;i++){const p=zp[i],d2=(p.x-tx)**2+(p.y-ty)**2;if(d2<0.0001){addPoint(tx,ty,p.z,p.type);return;}const w=1/d2;sw+=w;swz+=p.z*w;}addPoint(tx,ty,swz/sw,'Интерп.');}

function interpolateMissingZ(){const tp=currentMode==='dxf'?points:manualPoints,zp=tp.filter(p=>p.z!==null&&Number.isFinite(p.z));if(zp.length<3){showMessage('Внимание','Задайте Z минимум 3 точкам.','warning');return;}let c=0;tp.forEach(t=>{if(t.z===null||!Number.isFinite(t.z)){let sw=0,swz=0;for(let i=0;i<zp.length;i++){const p=zp[i],d2=(p.x-t.x)**2+(p.y-t.y)**2;if(d2<0.0001){t.z=p.z;t.type=p.type;break;}const w=1/d2;sw+=w;swz+=p.z*w;}if(sw>0&&t.z===null){t.z=swz/sw;t.type='Интерп.';c++;}}});if(c>0){if(currentMode==='dxf'){updateTable();requestDraw();}else{saveManState();updateManualTable();requestManualDraw();}showMessage('Готово',`Интерполировано: ${c}`,'success');}else showMessage('Внимание','Все с высотами.','warning');}

function deletePoint(id){points=points.filter(p=>p.id!==id);points.forEach((p,i)=>p.id=i+1);updateTable();requestDraw();}

function clearPoints(){points=[];clearDxfContours();updateTable();requestDraw();}

function clearArea(){exportArea=null;setTool('point');requestDraw();}

function getPointLabel(x,y){for(let i=0;i<points.length;i++){if(Math.abs(points[i].x-x)<0.001&&Math.abs(points[i].y-y)<0.001)return `P${points[i].id}`;}return `(${x.toFixed(3)}, ${y.toFixed(3)})`;}

function addDimension(p1,p2){if(!p1||!p2||!Number.isFinite(p1.x)||!Number.isFinite(p2.x))return;const d=Math.hypot(p2.x-p1.x,p2.y-p1.y);if(d>0.001){dimensions.push({id:dimensions.length+1,p1,p2,distance:d,label:`${getPointLabel(p1.x,p1.y)} ⟷ ${getPointLabel(p2.x,p2.y)}`});updateDimsTable();}}

function deleteDimension(id){dimensions=dimensions.filter(d=>d.id!==id);dimensions.forEach((d,i)=>d.id=i+1);updateDimsTable();requestDraw();}

function clearDims(){dimensions=[];updateDimsTable();requestDraw();}

function updateTable(){const tb=document.getElementById('points-tbody'),be=document.getElementById('export-btn'),bd=document.getElementById('points-badge');if(points.length>0){bd.textContent=points.length;bd.classList.remove('hidden');be.disabled=false;}else{bd.classList.add('hidden');be.disabled=true;}updateZDropdown();if(points.length===0){tb.innerHTML=`<tr id="empty-state"><td colspan="6" class="px-3 py-8 text-center text-slate-400 italic">Нет точек.</td></tr>`;return;}let h='';points.forEach(p=>{h+=`<tr class="hover:bg-slate-50 transition border-b border-slate-100"><td class="px-2 py-1 font-medium text-xs">P${p.id}</td><td class="px-1 py-0.5"><input type="number" step="0.001" value="${p.x.toFixed(3)}" onchange="editPtField(${p.id},'x',this.value)" class="w-20 font-mono text-[9px] border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white"></td><td class="px-1 py-0.5"><input type="number" step="0.001" value="${p.y.toFixed(3)}" onchange="editPtField(${p.id},'y',this.value)" class="w-20 font-mono text-[9px] border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white"></td><td class="px-1 py-0.5"><input type="number" step="0.001" value="${p.z!==null&&p.z!==undefined?p.z.toFixed(3):''}" placeholder="-" onchange="editPtField(${p.id},'z',this.value)" class="w-16 font-mono text-[9px] text-sky-600 font-bold border border-transparent hover:border-slate-300 focus:border-sky-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white"></td><td class="px-1 py-1 text-[9px] text-slate-500">${p.type||'-'}</td><td class="px-1 py-1 text-right"><button onclick="deletePoint(${p.id})" class="text-red-400 hover:text-red-600 text-xs"><i class="fa-solid fa-xmark"></i></button></td></tr>`;});tb.innerHTML=h;const tc=document.getElementById('table-container');if(tc)tc.scrollTop=tc.scrollHeight;}

function updateDimsTable(){const tb=document.getElementById('dims-tbody'),bd=document.getElementById('dims-badge');if(dimensions.length>0){bd.textContent=dimensions.length;bd.classList.remove('hidden');}else bd.classList.add('hidden');if(dimensions.length===0){tb.innerHTML=`<tr><td colspan="3" class="px-3 py-8 text-center text-slate-400 italic">Нет линий.</td></tr>`;return;}let h='';dimensions.forEach(d=>{h+=`<tr class="hover:bg-slate-50 border-b border-slate-100"><td class="px-2 md:px-3 py-1.5 md:py-2 font-medium text-purple-700 text-[9px] md:text-xs">${d.label}</td><td class="px-2 md:px-3 py-1.5 md:py-2 font-mono font-bold text-[9px] md:text-xs">${d.distance.toFixed(2)}</td><td class="px-1 md:px-2 py-1.5 md:py-2 text-right"><button onclick="deleteDimension(${d.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button></td></tr>`;});tb.innerHTML=h;}

function sendPointsToManual(){if(points.length===0){showMessage("Нет точек","Сначала отметьте точки.","warning");return;}let a=0;points.forEach(p=>{manualPoints.push({id:manualPoints.length>0?Math.max(...manualPoints.map(pt=>pt.id))+1:1,x:p.x,y:p.y,z:p.z});a++;});saveManState();updateManualTable();fitManualView();switchMode('manual');showMessage("Успех",`Перенесено: ${a}`,"success");}

function editPtField(id,field,val){
  var p=points.find(function(pt){return pt.id===id;});
  if(!p)return;
  var num=parseFloat((val+'').replace(',','.'));
  if(field==='z'){
    p.z=val===''?null:isNaN(num)?null:num;
    p.type=p.type||'Абс.';
  } else if(field==='x'||field==='y'){
    if(!isNaN(num))p[field]=num;
  }
  // Rebuild snap for updated point
  rebuildCachedPath();
  updateDimsTable();
  requestDraw();
}
