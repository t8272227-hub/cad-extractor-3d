// ── utils.js ──────────────────────────────────────────

function lonLatToMeters(lon,lat){const R=6378137;return{x:lon*R*Math.PI/180,y:R*Math.log(Math.tan(Math.PI/4+(lat*Math.PI/180)/2))};}

function isPointInPolygon(p,vs){let x=p.x,y=p.y,ins=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){let xi=vs[i].x,yi=vs[i].y,xj=vs[j].x,yj=vs[j].y;let int=((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi);if(int)ins=!ins;}return ins;}

function getConvexHull(pts){if(pts.length<3)return pts;let h=[];pts.sort((a,b)=>a.x===b.x?a.y-b.y:a.x-b.x);const cp=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);for(let p of pts){while(h.length>=2&&cp(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}let t=h.length+1;for(let i=pts.length-1;i>=0;i--){let p=pts[i];while(h.length>=t&&cp(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}h.pop();return h;}

function calcPolygonArea(pts){let a=0;for(let i=0,j=pts.length-1;i<pts.length;j=i++)a+=(pts[j].x+pts[i].x)*(pts[j].y-pts[i].y);return Math.abs(a/2);}

function offsetPolygon(h,d){if(d===0)return h;const o=[];for(let i=0;i<h.length;i++){let p0=h[(i-1+h.length)%h.length],p1=h[i],p2=h[(i+1)%h.length],dx1=p1.x-p0.x,dy1=p1.y-p0.y,l1=Math.hypot(dx1,dy1),nx1=dy1/l1,ny1=-dx1/l1,dx2=p2.x-p1.x,dy2=p2.y-p1.y,l2=Math.hypot(dx2,dy2),nx2=dy2/l2,ny2=-dx2/l2,nx=nx1+nx2,ny=ny1+ny2,ln=Math.hypot(nx,ny);if(ln<0.0001)o.push({x:p1.x+nx1*d,y:p1.y+ny1*d});else{nx/=ln;ny/=ln;let dt=nx*nx1+ny*ny1,ol=d/dt;o.push({x:p1.x+nx*ol,y:p1.y+ny*ol});}}if(d>0&&calcPolygonArea(o)<calcPolygonArea(h))return offsetPolygon(h,-d);return o;}

function aciToHex(aci){
  var t={1:'#ff2020',2:'#ffff00',3:'#00c800',4:'#00dddd',5:'#0055ff',
    6:'#ff00ff',7:'#1e293b',8:'#808080',9:'#aaaaaa',10:'#ff5500',
    20:'#ff8800',30:'#ffaa00',40:'#ffcc00',50:'#dddd00',60:'#88cc00',
    70:'#00bb44',80:'#009988',90:'#00aacc',100:'#0088cc',110:'#0044ff',
    120:'#5500ff',130:'#aa00cc',140:'#cc0088',150:'#993333',160:'#336633',
    170:'#333388',250:'#111111',251:'#333333',252:'#555555',253:'#888888',254:'#aaaaaa',255:'#cccccc'};
  return t[aci]||'#64748b';
}

function fitManualView(){const cv=document.getElementById('manual-canvas');if(manualPoints.length===0){manScale=1;manOriginX=0;manOriginY=0;manPanX=cv.width/2;manPanY=cv.height/2;requestManualDraw();return;}if(manualPoints.length===1){manScale=1;manOriginX=manualPoints[0].x;manOriginY=manualPoints[0].y;manPanX=cv.width/2;manPanY=cv.height/2;requestManualDraw();return;}let mx=Infinity,my=Infinity,Mx=-Infinity,My=-Infinity;manualPoints.forEach(p=>{if(p.x<mx)mx=p.x;if(p.x>Mx)Mx=p.x;if(p.y<my)my=p.y;if(p.y>My)My=p.y;});if(Mx-mx<1){Mx+=10;mx-=10;}if(My-my<1){My+=10;my-=10;}manOriginX=(mx+Mx)/2;manOriginY=(my+My)/2;const pad=60,dx=Mx-mx,dy=My-my;manScale=Math.min((cv.width-pad*2)/dx,(cv.height-pad*2)/dy);manPanX=cv.width/2;manPanY=cv.height/2;requestManualDraw();}

function manToScreen(x,y){return{x:manPanX+(x-manOriginX)*manScale,y:manPanY-(y-manOriginY)*manScale};}

function finishPolygon(){if(manPolyPoints.length>2){let a=0,p=0;for(let i=0;i<manPolyPoints.length;i++){let j=(i+1)%manPolyPoints.length;a+=(manPolyPoints[i].x*manPolyPoints[j].y)-(manPolyPoints[j].x*manPolyPoints[i].y);p+=Math.hypot(manPolyPoints[j].x-manPolyPoints[i].x,manPolyPoints[j].y-manPolyPoints[i].y);}a=Math.abs(a/2);customBoundaryPoly=[...manPolyPoints];showMessage("Измерение",`Площадь: ${a.toFixed(2)} кв.м\nПериметр: ${p.toFixed(2)} м\nКонтур сохранен.`,"success");}else if(manPolyPoints.length>0)showMessage("Внимание","Минимум 3 точки.","warning");manPolyPoints=[];requestManualDraw();}

function switchManTab(t){const tp=document.getElementById('tab-man-points'),tl=document.getElementById('tab-man-lines'),cp=document.getElementById('man-points-container'),cl=document.getElementById('man-lines-container');if(t==='points'){tp.className='flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-blue-600 border-b-2 border-blue-600 transition';tl.className='flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 border-b-2 border-transparent hover:text-slate-700 transition';cp.classList.remove('hidden');cl.classList.add('hidden');}else{tl.className='flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-blue-600 border-b-2 border-blue-600 transition';tp.className='flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 border-b-2 border-transparent hover:text-slate-700 transition';cl.classList.remove('hidden');cp.classList.add('hidden');}}

function editManualPoint(id){const p=manualPoints.find(pt=>pt.id===id);if(!p)return;document.getElementById('input-x').value=p.x;document.getElementById('input-y').value=p.y;document.getElementById('input-z').value=p.z!==null?p.z:'';editingManualPointId=id;const b=document.getElementById('btn-add-manual-point');b.innerHTML='<i class="fa-solid fa-save mr-1"></i> Сохранить';b.classList.remove('bg-blue-600','hover:bg-blue-500');b.classList.add('bg-emerald-600','hover:bg-emerald-500');}

function addManualPoint(){const x=parseFloat(document.getElementById('input-x').value.replace(',','.')),y=parseFloat(document.getElementById('input-y').value.replace(',','.')),z=parseFloat(document.getElementById('input-z').value.replace(',','.'));if(isNaN(x)||isNaN(y)){showMessage('Ошибка','X и Y обязательны.','warning');return;}if(editingManualPointId!==null){const p=manualPoints.find(pt=>pt.id===editingManualPointId);if(p){p.x=x;p.y=y;p.z=isNaN(z)?null:z;}editingManualPointId=null;const b=document.getElementById('btn-add-manual-point');b.innerHTML='<i class="fa-solid fa-plus mr-1"></i> Добавить';b.classList.remove('bg-emerald-600','hover:bg-emerald-500');b.classList.add('bg-blue-600','hover:bg-blue-500');}else manualPoints.push({id:manualPoints.length>0?Math.max(...manualPoints.map(pt=>pt.id))+1:1,x,y,z:isNaN(z)?null:z});saveManState();document.getElementById('input-x').value='';document.getElementById('input-y').value='';document.getElementById('input-z').value='';document.getElementById('input-x').focus();updateManualTable();updateManualLinesTable();fitManualView();if(showContours)generateContours();}

function deleteManualPoint(id){manualPoints=manualPoints.filter(p=>p.id!==id);manualLines=manualLines.filter(l=>l.p1.id!==id&&l.p2.id!==id);saveManState();updateManualTable();updateManualLinesTable();fitManualView();if(showContours)generateContours();}

function deleteManualLine(id){manualLines=manualLines.filter(l=>l.id!==id);saveManState();updateManualLinesTable();requestManualDraw();}

function clearManualPoints(){manualPoints=[];manualLines=[];manLineStartPoint=null;earthworksData=null;editingManualPointId=null;customBoundaryPoly=null;const b=document.getElementById('btn-add-manual-point');b.innerHTML='<i class="fa-solid fa-plus mr-1"></i> Добавить';b.classList.remove('bg-emerald-600');b.classList.add('bg-blue-600');const r=document.getElementById('ew-result-box');if(r)r.classList.add('hidden');clearContours();saveManState();updateManualTable();updateManualLinesTable();fitManualView();}

function exportManualToDXF(){if(manualPoints.length===0){showMessage('Нет данных','Добавьте точки.','warning');return;}let d=`0\nSECTION\n2\nHEADER\n9\n$PDMODE\n70\n0\n9\n$PDSIZE\n40\n0.0\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;manualPoints.forEach(p=>{const z=p.z!==null?p.z:0;d+=`0\nPOINT\n8\nPoints\n10\n${p.x}\n20\n${p.y}\n30\n${z}\n0\nTEXT\n8\nLabels\n10\n${p.x+0.5}\n20\n${p.y+0.5}\n30\n${z}\n40\n1.0\n1\nP${p.id}\n`;});manualLines.forEach(l=>{d+=`0\nLINE\n8\nLines\n10\n${l.p1.x}\n20\n${l.p1.y}\n30\n${l.p1.z||0}\n11\n${l.p2.x}\n21\n${l.p2.y}\n31\n${l.p2.z||0}\n`;});if(showContours&&cachedContours.length>0)cachedContours.forEach(c=>{for(let i=0;i<c.points.length-1;i++)d+=`0\nLINE\n8\nContours\n62\n30\n10\n${c.points[i].x}\n20\n${c.points[i].y}\n30\n${c.z}\n11\n${c.points[i+1].x}\n21\n${c.points[i+1].y}\n31\n${c.z}\n`;});d+=`0\nENDSEC\n0\nEOF\n`;const b=new Blob([d],{type:'text/plain'}),u=window.URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='manual.dxf';document.body.appendChild(a);a.click();document.body.removeChild(a);window.URL.revokeObjectURL(u);}

function saveManState(){manHistory=manHistory.slice(0,manHistoryStep+1);manHistory.push({points:JSON.parse(JSON.stringify(manualPoints)),lines:manualLines.map(function(l){return{id:l.id,p1:Object.assign({},l.p1),p2:Object.assign({},l.p2)};})});if(manHistory.length>50)manHistory.shift();manHistoryStep=manHistory.length-1;}

function undoMan(){if(manHistoryStep>0){manHistoryStep--;var s=manHistory[manHistoryStep];manualPoints=JSON.parse(JSON.stringify(s.points));manualLines=s.lines.map(function(l){var p1=manualPoints.find(function(p){return p.id===l.p1.id;})||Object.assign({},l.p1);var p2=manualPoints.find(function(p){return p.id===l.p2.id;})||Object.assign({},l.p2);return{id:l.id,p1:p1,p2:p2};});updateManualTable();updateManualLinesTable();requestManualDraw();}}

function redoMan(){if(manHistoryStep<manHistory.length-1){manHistoryStep++;var s=manHistory[manHistoryStep];manualPoints=JSON.parse(JSON.stringify(s.points));manualLines=s.lines.map(function(l){var p1=manualPoints.find(function(p){return p.id===l.p1.id;})||Object.assign({},l.p1);var p2=manualPoints.find(function(p){return p.id===l.p2.id;})||Object.assign({},l.p2);return{id:l.id,p1:p1,p2:p2};});updateManualTable();updateManualLinesTable();requestManualDraw();}}

function clearBgImage(){bgImageProps={img:null,x:0,y:0,scale:1,opacity:0.5,visible:true};var b=document.getElementById('btn-bg-settings');if(b)b.classList.add('hidden');var bi=document.getElementById('bg-img-input');if(bi)bi.value='';toggleBgImagePanel();requestManualDraw();}

function clearContours(){showContours=false;cachedContours=[];var b=document.getElementById('btn-build-contours');if(b){b.textContent='Построить';b.className='w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] md:text-sm font-medium py-1 md:py-1.5 rounded transition shadow-sm mt-1';}var cb=document.getElementById('man-contour-visible');if(cb)cb.checked=true;requestManualDraw();}

function generateContours(){var st=parseFloat(document.getElementById('contour-step').value);if(isNaN(st)||st<=0){showMessage('Ошибка','Шаг > 0','warning');return;}var pts=manualPoints.filter(function(pt){return pt.z!==null&&Number.isFinite(pt.z);});if(pts.length<3){showMessage('Ошибка','Мин 3 точки с Z','warning');return;}try{var coords=[];pts.forEach(function(pt){coords.push(pt.x,pt.y);});var d=new Delaunator(coords);cachedContours=[];var eps=0.00001,segs={};for(var i=0;i<d.triangles.length;i+=3){var i0=d.triangles[i],i1=d.triangles[i+1],i2=d.triangles[i+2];var p0={x:pts[i0].x,y:pts[i0].y,z:pts[i0].z+eps},p1={x:pts[i1].x,y:pts[i1].y,z:pts[i1].z+eps*2},p2={x:pts[i2].x,y:pts[i2].y,z:pts[i2].z+eps*3};var mzT=Math.min(p0.z,p1.z,p2.z),MzT=Math.max(p0.z,p1.z,p2.z),sl=Math.ceil(mzT/st)*st;for(var l=sl;l<=MzT;l+=st){var xs=[];[[p0,p1],[p1,p2],[p2,p0]].forEach(function(ed){var a=ed[0],b=ed[1];if((a.z<l&&b.z>l)||(a.z>l&&b.z<l)){var t=(l-a.z)/(b.z-a.z);xs.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}});if(xs.length===2){if(!segs[l])segs[l]=[];segs[l].push({p1:xs[0],p2:xs[1]});}}}var pm=function(a,b){return Math.abs(a.x-b.x)<0.0001&&Math.abs(a.y-b.y)<0.0001;};for(var ls in segs){var lv=parseFloat(ls),seg=segs[ls],pa=[];var rem=seg.slice();while(rem.length>0){var cp=[];var sg=rem.shift();cp.push(sg.p1,sg.p2);var again;do{again=false;for(var ri=0;ri<rem.length;ri++){var rs=rem[ri],h=cp[0],t=cp[cp.length-1];if(pm(t,rs.p1)){cp.push(rs.p2);rem.splice(ri,1);again=true;break;}else if(pm(t,rs.p2)){cp.push(rs.p1);rem.splice(ri,1);again=true;break;}else if(pm(h,rs.p1)){cp.unshift(rs.p2);rem.splice(ri,1);again=true;break;}else if(pm(h,rs.p2)){cp.unshift(rs.p1);rem.splice(ri,1);again=true;break;}}}while(again);pa.push(cp);}pa.forEach(function(pt){cachedContours.push({z:lv,points:pt});});}showContours=true;var vcb=document.getElementById('man-contour-visible');if(vcb)vcb.checked=true;var btn=document.getElementById('btn-build-contours');if(btn){btn.textContent='Обновить';btn.className='w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] md:text-sm font-medium py-1 md:py-1.5 rounded transition shadow-sm mt-1';}requestManualDraw();}catch(err){showMessage('Ошибка','Сбой триангуляции: '+err.message,'error');}}

function _th(txt){return '<th style="font-size:'+thFontPt+'pt;padding:'+cp+';background:#1e293b;color:#fff;border:0.3pt solid #334155;text-align:left;white-space:nowrap;">'+txt+'</th>';}

function _td(txt,bg){return '<td style="font-size:'+fontPt+'pt;padding:'+cp+';border:0.3pt solid #e2e8f0;font-family:monospace;white-space:nowrap;'+(bg?'background:#f8fafc;':'')+'">'+txt+'</td>';}

function _h2(txt){return '<div style="font-size:'+(fontPt+1)+'pt;font-weight:bold;margin:1.5mm 0 0.5mm;border-bottom:0.3pt solid #94a3b8;padding-bottom:0.3mm;color:#1e293b;">'+txt+'</div>';}

function _tbl(hdrs,rows){
  var h='<table style="width:100%;border-collapse:collapse;"><thead><tr>'+hdrs.map(function(t){return _th(t);}).join('')+'</tr></thead><tbody>';
  rows.forEach(function(r,i){h+='<tr>'+r.map(function(c){return _td(c,i%2===0);}).join('')+'</tr>';});
  return h+'</tbody></table>';
}

function startGeorefPick(pointIdx){
  georefPickMode=pointIdx;
  closeGeoreferenceModal();
  var hint=document.getElementById('gr-pick-hint');
  var hintText=document.getElementById('gr-pick-hint-text');
  hint.classList.remove('hidden');
  hintText.textContent='Кликните по Точке '+pointIdx+' на основном чертеже...';
  // Show floating hint on canvas
  showMessage('Режим выбора','Кликните по нужной точке на кадастровом чертеже.\nКоординаты будут перенесены автоматически.','info');
}

function transformPointGeoref(p, t){
  return {
    x: t.s*(p.x*t.cosT - p.y*t.sinT) + t.tx,
    y: t.s*(p.x*t.sinT + p.y*t.cosT) + t.ty,
    z: p.z
  };
}

function georefPickMini(target){
  if(!_georefParsedDxf){
    showMessage('Файл не загружен','Сначала загрузите DXF файл съёмки.','warning');return;
  }
  _georefPickTarget=target;
  var cv=document.getElementById('georef-mini-canvas');
  cv.style.cursor='crosshair';cv.style.outline='2px solid '+(target===1?'#f97316':'#8b5cf6');
  document.getElementById('gr-mini-status').textContent=
    (target===1?'🟠 Кликните по Точке 1':'🟣 Кликните по Точке 2')+' в окне предпросмотра';
  // Add one-time click listener
  cv.onclick=function(e){
    var rect=cv.getBoundingClientRect();
    var px=e.clientX-rect.left,py=e.clientY-rect.top;
    // Convert to DXF coords
    var sc=_georefMiniScale,oX=_georefMiniOX,oY=_georefMiniOY,H=cv.height;
    var cx2=px/sc+oX,cy2=(H-py)/sc+oY;
    // Snap to nearest
    if(_georefMiniSnaps.length){
      var best=_georefMiniSnaps.reduce(function(a,b){
        return Math.hypot(b.x-cx2,b.y-cy2)<Math.hypot(a.x-cx2,a.y-cy2)?b:a;
      });
      if(Math.hypot(best.x-cx2,best.y-cy2)*sc<15){cx2=best.x;cy2=best.y;}
    }
    // Fill input fields
    var suffix=(_georefPickTarget===1)?'1':'2';
    document.getElementById('gr-p'+suffix+'-lx').value=cx2.toFixed(3);
    document.getElementById('gr-p'+suffix+'-ly').value=cy2.toFixed(3);
    if(suffix==='1')_grP1L={x:cx2,y:cy2}; else _grP2L={x:cx2,y:cy2};
    // Also fill manual input fields
    var _mx=document.getElementById('gr-mini-x'+suffix);if(_mx)_mx.value=cx2.toFixed(4);
    var _my=document.getElementById('gr-mini-y'+suffix);if(_my)_my.value=cy2.toFixed(4);
    // Store visual point
    if(_georefPickTarget===1)_georefMiniP1={x:cx2,y:cy2};
    else _georefMiniP2={x:cx2,y:cy2};
    _georefRenderMini();
    // Reset
    cv.style.outline='1px solid #fed7aa';cv.style.cursor='crosshair';
    _georefPickTarget=0;cv.onclick=null;
    document.getElementById('gr-mini-status').textContent=
      'P'+suffix+' = ('+cx2.toFixed(3)+', '+cy2.toFixed(3)+')  ✓';
  };
}

function georefSnapSel(n,val){
  if(val==='')return;
  // Read coords from selected option's data attributes (robust, no array lookup)
  var sel=document.getElementById('gr-mini-snap-sel-'+n);
  if(!sel)return;
  var opt=sel.options[sel.selectedIndex];
  if(!opt||!opt.dataset.x)return;
  var x=parseFloat(opt.dataset.x),y=parseFloat(opt.dataset.y);
  if(isNaN(x)||isNaN(y))return;
  var ex=document.getElementById('gr-mini-x'+n);
  var ey=document.getElementById('gr-mini-y'+n);
  if(ex)ex.value=x.toFixed(4);
  if(ey)ey.value=y.toFixed(4);
  var hx=document.getElementById('gr-p'+n+'-lx');
  var hy=document.getElementById('gr-p'+n+'-ly');
  if(hx)hx.value=x.toFixed(3);
  if(hy)hy.value=y.toFixed(3);
  if(n===1){_georefMiniP1={x:x,y:y}; _grP1L={x:x,y:y};}
  else      {_georefMiniP2={x:x,y:y}; _grP2L={x:x,y:y};}
  _georefRenderMini();
  var st=document.getElementById('gr-mini-status');
  if(st)st.textContent='P'+n+' = ('+x.toFixed(3)+', '+y.toFixed(3)+') ✓';
}

function georefManualFill(n){
  var ex=document.getElementById('gr-mini-x'+n);
  var ey=document.getElementById('gr-mini-y'+n);
  if(!ex||!ey)return;
  if(ex.value===''||ey.value==='')return;
  var x=parseFloat(ex.value),y=parseFloat(ey.value);
  if(isNaN(x)||isNaN(y))return;
  var hx=document.getElementById('gr-p'+n+'-lx');
  var hy=document.getElementById('gr-p'+n+'-ly');
  if(hx)hx.value=x.toFixed(3);
  if(hy)hy.value=y.toFixed(3);
  if(n===1)_grP1L={x:x,y:y}; else _grP2L={x:x,y:y};
  // Mark on canvas
  if(n===1){_georefMiniP1={x:x,y:y};}
  else{_georefMiniP2={x:x,y:y};}
  _georefRenderMini();
  document.getElementById('gr-mini-status').textContent=
    'P'+n+' введено вручную: ('+x.toFixed(3)+', '+y.toFixed(3)+')';
}

function _autoImportDxfZ(){
  if(!dxfElements||!dxfElements.length)return;
  var added=0;
  dxfElements.forEach(function(el){
    if(el.type!=='POINT'||!el.p)return;
    var z=el.p.z;
    // Only import if Z is a valid finite number (not null/undefined)
    if(z===null||z===undefined||!Number.isFinite(z))return;
    // Skip if point already exists at same location
    var exists=points.find(function(p){
      return Math.abs(p.x-el.p.x)<0.001&&Math.abs(p.y-el.p.y)<0.001;
    });
    if(exists){
      // Update Z if existing point has no Z
      if(exists.z===null||exists.z===undefined)exists.z=z;
      return;
    }
    var id=points.length>0?Math.max.apply(null,points.map(function(p){return p.id;}))+1:1;
    points.push({id:id,x:el.p.x,y:el.p.y,z:z});
    added++;
  });
  if(added>0){
    updateTable();
    updateDimsTable();
    var msg='Из DXF загружено '+added+' высотных точек (Z)\nГоризонтали: нажмите кнопку «Построить»';
    showMessage('Высотные точки',msg,'info');
  }
}

function importDxf2Z(){
  if(!secondDxfElements.length){showMessage('Нет данных','Вложенный DXF не загружен.','warning');return;}
  var addedXY=0,addedZ=0,updatedZ=0;
  secondDxfElements.forEach(function(el){
    if(el.type!=='POINT'||!el.p)return;
    var z=el.p.z,hasZ=z!==null&&z!==undefined&&Number.isFinite(z);
    var ex=points.find(function(p){return Math.abs(p.x-el.p.x)<0.01&&Math.abs(p.y-el.p.y)<0.01;});
    if(ex){if(hasZ&&(ex.z===null||ex.z===undefined)){ex.z=z;updatedZ++;}}
    else{var id=points.length>0?Math.max.apply(null,points.map(function(p){return p.id;}))+1:1;
      points.push({id:id,x:el.p.x,y:el.p.y,z:hasZ?z:null});addedXY++;if(hasZ)addedZ++;}
  });
  var total=addedXY+updatedZ;
  if(total>0){
    _rebuildSnapWithDxf2();
    updateTable();updateDimsTable();requestDraw();
    var msg='Точек перенесено: '+addedXY;
    if(addedZ>0)msg+='  (с Z: '+addedZ+')';
    if(updatedZ>0)msg+='\nZ обновлено: '+updatedZ;
    msg+='\n\n✓ Привязка к точкам активна для:\n• Измерения расстояний\n• Рисования линий\n• Горизонталей';
    showMessage('Координаты перенесены',msg,'success');
  } else showMessage('Нет новых точек','Все точки уже импортированы.','info');
}

function _shoelaceArea(pts){
  var a=0,n=pts.length;
  for(var i=0;i<n;i++){var j=(i+1)%n;a+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;}
  return Math.abs(a)/2;
}

function _perimeterCalc(pts){
  var p=0,n=pts.length;
  for(var i=0;i<n;i++){var j=(i+1)%n;p+=Math.hypot(pts[j].x-pts[i].x,pts[j].y-pts[i].y);}
  return p;
}

function _ptInContour(px,py,poly){
  var n=poly.length,inside=false;
  for(var i=0,j=n-1;i<n;j=i++){
    var xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;
    if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}

function startPdfFrame(){
  pdfFrame=null;pdfFrameDrawing=true;pdfFrameStart=null;
  showMessage('PDF-рамка','Нарисуйте прямоугольник на плане — эта область попадёт в PDF','info');
}

function clearPdfFrame(){pdfFrame=null;pdfFrameDrawing=false;requestDraw();}
