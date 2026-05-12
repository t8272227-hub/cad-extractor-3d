// ── draw.js ──────────────────────────────────────────

function requestDraw(){if(!isDrawingScheduled){isDrawingScheduled=true;requestAnimationFrame(()=>{draw();isDrawingScheduled=false;});}}

function setTool(t){currentTool=t;currentDimStart=null;document.getElementById('tool-point').className=t==='point'?'p-2 md:p-2.5 rounded-lg bg-blue-100 text-blue-600 shadow-inner transition w-full':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-full';document.getElementById('tool-interpolate').className=t==='interpolate'?'p-2 md:p-2.5 rounded-lg bg-indigo-100 text-indigo-600 shadow-inner transition w-full':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-full';document.getElementById('tool-dimension').className=t==='dimension'?'p-2 md:p-2.5 rounded-lg bg-purple-100 text-purple-600 shadow-inner transition w-full':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-full';var _ta=document.getElementById('tool-area');if(_ta)_ta.className=t==='area'?'p-2 md:p-2.5 rounded-lg bg-amber-100 text-amber-600 shadow-inner transition w-full':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-full';const h=document.getElementById('tool-hint');if(t==='point'){h.innerHTML='<p><i class="fa-solid fa-mouse-pointer w-3 md:w-4"></i> Клик ЛКМ по узлу — отметить</p><p><i class="fa-solid fa-hand w-3 md:w-4"></i> Панорамирование</p>';document.getElementById('cad-canvas').style.cursor='crosshair';}else if(t==='interpolate'){h.innerHTML='<p><i class="fa-solid fa-mountain w-3 md:w-4 text-indigo-500"></i> Вычислить Z</p>';document.getElementById('cad-canvas').style.cursor='crosshair';}else if(t==='dimension'){h.innerHTML='<p><i class="fa-solid fa-ruler-horizontal w-3 md:w-4 text-purple-500"></i> Рулетка (Shift=Орто)</p>';document.getElementById('cad-canvas').style.cursor='crosshair';}else{h.innerHTML='<p><i class="fa-solid fa-crop-simple w-3 md:w-4 text-amber-500"></i> Рамка для PDF</p>';document.getElementById('cad-canvas').style.cursor='cell';}requestDraw();}

function resizeCanvas(){const c=document.getElementById('canvas-container'),cv=document.getElementById('cad-canvas');if(c&&cv){cv.width=c.clientWidth;cv.height=c.clientHeight;if(dxfData)draw();}}

function fitViewToDXF(){
if(!dxfData||!cachedPath)return;
const c=document.getElementById('cad-canvas'),pad=40;
const dx=Math.max(cadMaxX-cadMinX,1),dy=Math.max(cadMaxY-cadMinY,1);
scale=Math.min((c.width-pad*2)/dx,(c.height-pad*2)/dy);
if(!Number.isFinite(scale)||scale<=0)scale=1;
baseScale=scale;
panX=c.width/2;
panY=c.height/2;
draw();
}

function cadToScreen(x,y){return{x:panX+(x-cadOriginX)*scale,y:panY-(y-cadOriginY)*scale};}

function screenToCad(x,y){if(northAngle!==0){var _cv=document.getElementById('cad-canvas'),_cx=_cv.width/2,_cy=_cv.height/2;var _a=northAngle*Math.PI/180,_dx=x-_cx,_dy=y-_cy;x=_cx+_dx*Math.cos(_a)-_dy*Math.sin(_a);y=_cy+_dx*Math.sin(_a)+_dy*Math.cos(_a);}return{x:cadOriginX+(x-panX)/scale,y:cadOriginY+(panY-y)/scale};}

function draw(){const cv=document.getElementById('cad-canvas'),cx=cv.getContext('2d'),pr=isExportingPDF?4:1;if(cx.resetTransform)cx.resetTransform();else cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#ffffff';cx.fillRect(0,0,cv.width,cv.height);if(!dxfData||!cachedPath){cx.strokeStyle='#f1f5f9';cx.lineWidth=1*pr;for(let x=0;x<cv.width;x+=50*pr){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,cv.height);cx.stroke();}for(let y=0;y<cv.height;y+=50*pr){cx.beginPath();cx.moveTo(0,y);cx.lineTo(cv.width,y);cx.stroke();}cx.fillStyle='#94a3b8';cx.font=`${16*pr}px sans-serif`;cx.textAlign='center';cx.fillText('Откройте файл для начала работы',cv.width/2,cv.height/2);cx.textAlign='left';return;}cx.save();if(northAngle!==0){cx.translate(cv.width/2,cv.height/2);cx.rotate(-northAngle*Math.PI/180);cx.translate(-cv.width/2,-cv.height/2);}cx.translate(panX,panY);cx.scale(scale,-scale);if(showGrid&&cadMaxX>cadMinX){var _rw=cadMaxX-cadMinX;var _mag=Math.pow(10,Math.floor(Math.log10(_rw/8)));var _gs=[1,2,5].reduce(function(p,v){return Math.abs(_rw/8-v*_mag)<Math.abs(_rw/8-p*_mag)?v:p;})*_mag;cx.save();cx.strokeStyle="rgba(100,140,220,0.18)";cx.lineWidth=0.4/scale;for(var _xi=Math.floor(cadMinX/_gs)*_gs;_xi<=cadMaxX+_gs;_xi+=_gs){cx.beginPath();cx.moveTo(_xi,cadMinY-_gs);cx.lineTo(_xi,cadMaxY+_gs);cx.stroke();}for(var _yi=Math.floor(cadMinY/_gs)*_gs;_yi<=cadMaxY+_gs;_yi+=_gs){cx.beginPath();cx.moveTo(cadMinX-_gs,_yi);cx.lineTo(cadMaxX+_gs,_yi);cx.stroke();}cx.restore();}if(northPickHover){cx.save();cx.strokeStyle="#f59e0b";cx.lineWidth=1.5/scale;cx.beginPath();cx.arc(northPickHover.x-cadOriginX,northPickHover.y-cadOriginY,5/scale,0,Math.PI*2);cx.stroke();cx.restore();}cx.strokeStyle=lineColor;cx.lineWidth=(1.2/scale)*pr;cx.lineCap='round';cx.lineJoin='round';cx.stroke(cachedPath);if(secondDxfElements&&secondDxfElements.length>0&&secondDxfVisible){if(secondDxfLinesVisible){const sp2=new Path2D();secondDxfElements.forEach(e=>{if(e.type==='POLYLINE'){let f=true;e.pts.forEach(p=>{if(f){sp2.moveTo(p.x-cadOriginX,p.y-cadOriginY);f=false;}else sp2.lineTo(p.x-cadOriginX,p.y-cadOriginY);});if(e.closed)sp2.closePath();}else if(e.type==='CIRCLE'){sp2.moveTo((e.c.x-cadOriginX)+e.r,e.c.y-cadOriginY);sp2.arc(e.c.x-cadOriginX,e.c.y-cadOriginY,e.r,0,Math.PI*2);}else if(e.type==='ARC'){sp2.moveTo((e.c.x-cadOriginX)+e.r*Math.cos(e.sa),(e.c.y-cadOriginY)+e.r*Math.sin(e.sa));sp2.arc(e.c.x-cadOriginX,e.c.y-cadOriginY,e.r,e.sa,e.ea,false);}});cx.strokeStyle='#f97316';cx.lineWidth=(1.8/scale)*pr;cx.lineCap='round';cx.stroke(sp2);}if(secondDxfPointsVisible){const _nr=2.5/scale*pr;secondDxfElements.forEach(e=>{if(e.type==='POINT'){const _px=e.p.x-cadOriginX,_py=e.p.y-cadOriginY,_cr=4/scale*pr;cx.strokeStyle='#ea580c';cx.lineWidth=1.5/scale*pr;cx.beginPath();cx.moveTo(_px-_cr,_py);cx.lineTo(_px+_cr,_py);cx.moveTo(_px,_py-_cr);cx.lineTo(_px,_py+_cr);cx.stroke();cx.beginPath();cx.arc(_px,_py,_nr*1.4,0,Math.PI*2);cx.fillStyle='#ea580c';cx.fill();cx.strokeStyle='#fff';cx.lineWidth=0.5/scale*pr;cx.stroke();}else if(e.type==='TEXT'&&e.text){const _th=Math.max(e.h||0.3,4/scale*pr);cx.save();cx.translate(e.p.x-cadOriginX,e.p.y-cadOriginY);cx.scale(1/scale,-1/scale);cx.font='bold '+(Math.max(_th*scale,8))+'px sans-serif';cx.fillStyle='#c2410c';cx.textBaseline='bottom';cx.fillText(e.text,3,0);cx.restore();}});cx.strokeStyle=lineColor;cx.lineWidth=(1.2/scale)*pr;}}_drawSymbols(cx,scale,cadOriginX,cadOriginY,pr);cx.restore();cx.save();if(northAngle!==0){cx.translate(cv.width/2,cv.height/2);cx.rotate(-northAngle*Math.PI/180);cx.translate(-cv.width/2,-cv.height/2);}cx.fillStyle='#334155';cx.beginPath();cadPoints.forEach(p=>{const sp=cadToScreen(p.x,p.y);cx.moveTo(sp.x+1.2*pr,sp.y);cx.arc(sp.x,sp.y,1.2*pr,0,Math.PI*2);});cx.fill();if(earthworksData&&earthworksData.polygon){cx.beginPath();earthworksData.polygon.forEach((p,i)=>{const sp=cadToScreen(p.x,p.y);if(i===0)cx.moveTo(sp.x,sp.y);else cx.lineTo(sp.x,sp.y);});cx.closePath();cx.fillStyle='rgba(249, 115, 22, 0.15)';cx.fill();cx.strokeStyle='#f97316';cx.lineWidth=0.8*pr;cx.setLineDash([4*pr,4*pr]);cx.stroke();cx.setLineDash([]);}if(dxfShowContours&&dxfCachedContours.length>0){cx.lineWidth=1.2*pr;cx.globalAlpha=typeof dxfContourOpacity!=='undefined'?dxfContourOpacity:0.55;cx.strokeStyle=dxfContourColor||'#78716c';cx.beginPath();dxfCachedContours.forEach(c=>{const pt=c.points;if(pt.length<2)return;const s0=cadToScreen(pt[0].x,pt[0].y);cx.moveTo(s0.x,s0.y);if(pt.length===2){const s1=cadToScreen(pt[1].x,pt[1].y);cx.lineTo(s1.x,s1.y);}else{for(let i=1;i<pt.length-1;i++){const sc=cadToScreen(pt[i].x,pt[i].y),sn=cadToScreen(pt[i+1].x,pt[i+1].y),mx=(sc.x+sn.x)/2,my=(sc.y+sn.y)/2;cx.quadraticCurveTo(sc.x,sc.y,mx,my);}const sl=cadToScreen(pt[pt.length-1].x,pt[pt.length-1].y);cx.lineTo(sl.x,sl.y);}});cx.stroke();dxfCachedContours.forEach(c=>{const pt=c.points;if(pt.length>=2){const mid=Math.floor(pt.length/2),p1=pt[mid-1]||pt[0],p2=pt[mid]||pt[1],s1=cadToScreen(p1.x,p1.y),s2=cadToScreen(p2.x,p2.y);let a=Math.atan2(s2.y-s1.y,s2.x-s1.x);if(a>Math.PI/2||a<-Math.PI/2)a+=Math.PI;cx.save();cx.translate((s1.x+s2.x)/2,(s1.y+s2.y)/2);cx.rotate(a);cx.textAlign='center';cx.textBaseline='middle';const t=c.z.toFixed(2);cx.font=`bold ${8*pr}px sans-serif`;cx.lineWidth=1.5*pr;cx.strokeStyle='#ffffff';cx.strokeText(t,0,0);cx.fillStyle='#78350f';cx.fillText(t,0,0);cx.restore();}});}const padX=100/scale,padY=100/scale,mx=cadOriginX-panX/scale-padX,Mx=cadOriginX+(cv.width-panX)/scale+padX,my=cadOriginY+(panY-cv.height)/scale-padY,My=cadOriginY+panY/scale+padY;for(let i=0;i<cadTexts.length;i++){const t=cadTexts[i];if(t.x<mx||t.x>Mx||t.y<my||t.y>My)continue;if(points.some(p=>`P${p.id}`===t.text.trim()||p.id.toString()===t.text.trim()))continue;let sh=t.h*scale;
// Clamp: tiny when zoomed out, capped at 9px max — unobtrusive
let shClamp=Math.max(6,Math.min(sh,9));
if(sh>0.5&&sh<5000){let sp=cadToScreen(t.x,t.y);cx.save();cx.font=`${shClamp}px sans-serif`;cx.fillStyle='rgba(100, 116, 139, 0.75)';cx.textBaseline='bottom';cx.translate(sp.x,sp.y);if(t.rot!==0)cx.rotate(-t.rot);cx.fillText(t.text,0,0);cx.restore();}}// Fixed small screen-size labels (pr=1 normally, 4 for PDF export)
const r=2.5*pr,f=8*pr,sw=0.8*pr;
points.forEach(p=>{const sp=cadToScreen(p.x,p.y);cx.beginPath();cx.arc(sp.x,sp.y,r,0,Math.PI*2);cx.fillStyle='#ef4444';cx.fill();cx.strokeStyle='#ffffff';cx.lineWidth=sw;cx.stroke();if(showPointLabels){cx.fillStyle='#0f172a';cx.font=`bold ${f}px sans-serif`;cx.fillText(`P${p.id}`,sp.x+r+2*pr,sp.y-r-2*pr);}});cx.strokeStyle='#8b5cf6';cx.fillStyle='#8b5cf6';cx.lineWidth=0.8*pr;const dt=3*pr;if(!isExportingPDF&&currentTool==='dimension'&&currentDimStart&&currentMouseCAD){const s1=cadToScreen(currentDimStart.x,currentDimStart.y),tg=currentSnapPoint?currentSnapPoint:currentMouseCAD,s2=cadToScreen(tg.x,tg.y);cx.beginPath();cx.moveTo(s1.x,s1.y);cx.lineTo(s2.x,s2.y);cx.setLineDash([4*pr,4*pr]);cx.strokeStyle=(currentSnapPoint&&currentSnapPoint.x!==currentDimStart.x)?'#10b981':'#ef4444';cx.stroke();cx.setLineDash([]);cx.strokeStyle='#8b5cf6';}dimensions.forEach(d=>{const s1=cadToScreen(d.p1.x,d.p1.y),s2=cadToScreen(d.p2.x,d.p2.y);cx.beginPath();cx.moveTo(s1.x,s1.y);cx.lineTo(s2.x,s2.y);cx.stroke();const a=Math.atan2(s2.y-s1.y,s2.x-s1.x);cx.beginPath();cx.moveTo(s1.x-Math.sin(a)*dt,s1.y+Math.cos(a)*dt);cx.lineTo(s1.x+Math.sin(a)*dt,s1.y-Math.cos(a)*dt);cx.moveTo(s2.x-Math.sin(a)*dt,s2.y+Math.cos(a)*dt);cx.lineTo(s2.x+Math.sin(a)*dt,s2.y-Math.cos(a)*dt);cx.stroke();});if(!isExportingPDF&&exportArea){const p1=cadToScreen(exportArea.x1,exportArea.y1),p2=cadToScreen(exportArea.x2,exportArea.y2),nx=Math.min(p1.x,p2.x),nX=Math.max(p1.x,p2.x),ny=Math.min(p1.y,p2.y),nY=Math.max(p1.y,p2.y);cx.strokeStyle='#f59e0b';cx.lineWidth=2*pr;cx.setLineDash([5*pr,5*pr]);cx.strokeRect(nx,ny,nX-nx,nY-ny);cx.setLineDash([]);cx.fillStyle='#f59e0b';cx.font=`bold ${9*pr}px sans-serif`;cx.fillText('Область печати',nx,ny-6*pr);}// ─── Draw saved filled contours ──────────────────────────────────────────────
if(savedContours.length>0){
  savedContours.forEach(function(sc,sci){
    if(!sc.pts||sc.pts.length<3)return;
    var _spts=sc.pts.map(function(p){return cadToScreen(p.x,p.y);});
    // Fill with material pattern
    cx.save();
    cx.beginPath();
    _spts.forEach(function(p,i){i?cx.lineTo(p.x,p.y):cx.moveTo(p.x,p.y);});
    cx.closePath();
    cx.clip();
    _drawMaterialFill(cx,sc.material||'concrete',sc.color||'rgba(100,180,100,0.15)',
      Math.min.apply(null,_spts.map(function(p){return p.x;})),
      Math.min.apply(null,_spts.map(function(p){return p.y;})),
      Math.max.apply(null,_spts.map(function(p){return p.x;}))-Math.min.apply(null,_spts.map(function(p){return p.x;})),
      Math.max.apply(null,_spts.map(function(p){return p.y;}))-Math.min.apply(null,_spts.map(function(p){return p.y;})));
    cx.restore();
    // Outline
    cx.beginPath();
    _spts.forEach(function(p,i){i?cx.lineTo(p.x,p.y):cx.moveTo(p.x,p.y);});
    cx.closePath();
    cx.strokeStyle=sc.lineColor||'#334155';cx.lineWidth=1*pr;cx.stroke();
    // Label at centroid
    var cx_=_spts.reduce(function(a,p){return a+p.x;},0)/_spts.length;
    var cy_=_spts.reduce(function(a,p){return a+p.y;},0)/_spts.length;
    var _mats={concrete:'Бетон',sand:'Песок',gravel:'Щебень',clay:'Глина',
               soil:'Грунт',asphalt:'Асфальт',brick:'Кирпич',metal:'Металл'};
    cx.fillStyle='#334155';cx.font='bold '+(7*pr)+'px sans-serif';
    cx.textAlign='center';cx.textBaseline='middle';
    cx.fillText((_mats[sc.material]||sc.material||'')+(sc.area?' '+sc.area.toFixed(1)+'м²':''),cx_,cy_);
    cx.textAlign='left';cx.textBaseline='alphabetic';
  });
}
// ─── Draw active (in-progress) contour ───────────────────────────────────────
if(contourPts.length>0){
  var _c0s=cadToScreen(contourPts[0].x,contourPts[0].y);
  cx.strokeStyle='#7c3aed';cx.lineWidth=0.8*pr;cx.setLineDash([4*pr,2*pr]);
  cx.beginPath();cx.moveTo(_c0s.x,_c0s.y);
  for(var _ci=1;_ci<contourPts.length;_ci++){
    var _csi=cadToScreen(contourPts[_ci].x,contourPts[_ci].y);cx.lineTo(_csi.x,_csi.y);
  }
  if(!contourClosed&&contourMousePos){
    var _cm2=cadToScreen(contourMousePos.x,contourMousePos.y);cx.lineTo(_cm2.x,_cm2.y);
  }
  if(contourClosed)cx.closePath();
  cx.stroke();cx.setLineDash([]);
  contourPts.forEach(function(cp,ci){
    var _csv=cadToScreen(cp.x,cp.y);
    cx.fillStyle=ci===0?'#16a34a':'#7c3aed';
    cx.beginPath();cx.arc(_csv.x,_csv.y,3*pr,0,Math.PI*2);cx.fill();
    cx.fillStyle='#fff';cx.font=(7*pr)+'px sans-serif';cx.textAlign='left';
    cx.fillText('V'+(ci+1),_csv.x+4*pr,_csv.y-3*pr);
  });
  if(!contourClosed&&contourPts.length>=3){
    var _c0c=cadToScreen(contourPts[0].x,contourPts[0].y);
    cx.strokeStyle='#16a34a';cx.lineWidth=0.8*pr;cx.setLineDash([3*pr,2*pr]);
    cx.beginPath();cx.arc(_c0c.x,_c0c.y,8*pr,0,Math.PI*2);cx.stroke();cx.setLineDash([]);
  }
  cx.textAlign='left';cx.textBaseline='alphabetic';
}
// ─── Draw pdfFrame ────────────────────────────────────────────────────────────
if(pdfFrame&&Number.isFinite(pdfFrame.x1)){
  var _pf1=cadToScreen(pdfFrame.x1,pdfFrame.y1),_pf2=cadToScreen(pdfFrame.x2,pdfFrame.y2);
  var _pfx=Math.min(_pf1.x,_pf2.x),_pfy=Math.min(_pf1.y,_pf2.y);
  var _pfw=Math.abs(_pf2.x-_pf1.x),_pfh=Math.abs(_pf2.y-_pf1.y);
  cx.strokeStyle='#2563eb';cx.lineWidth=0.8*pr;cx.setLineDash([6*pr,3*pr]);
  cx.strokeRect(_pfx,_pfy,_pfw,_pfh);cx.setLineDash([]);
  cx.fillStyle='rgba(37,99,235,0.04)';cx.fillRect(_pfx,_pfy,_pfw,_pfh);
  cx.fillStyle='#2563eb';cx.font=(8*pr)+'px sans-serif';
  cx.fillText('📄 PDF',_pfx+3*pr,_pfy+10*pr);
}
// Leader callouts
if(!isExportingPDF)_drawLeaders(cx,pr);
if(!isExportingPDF&&currentSnapPoint&&(currentTool==='point'||currentTool==='dimension'||currentTool==='interpolate')){const sp=cadToScreen(currentSnapPoint.x,currentSnapPoint.y),sz=8*pr;var _stp=currentSnapType||'node';
if(_stp==='node'){
  cx.fillStyle='rgba(16,185,129,0.25)';cx.fillRect(sp.x-sz/2,sp.y-sz/2,sz,sz);
  cx.strokeStyle='#10b981';cx.lineWidth=2*pr;cx.strokeRect(sp.x-sz/2,sp.y-sz/2,sz,sz);
} else if(_stp==='line'){
  // Blue diamond — nearest point on line
  cx.fillStyle='rgba(37,99,235,0.2)';cx.strokeStyle='#2563eb';cx.lineWidth=1.5*pr;
  cx.beginPath();cx.moveTo(sp.x,sp.y-sz/2);cx.lineTo(sp.x+sz/2,sp.y);
  cx.lineTo(sp.x,sp.y+sz/2);cx.lineTo(sp.x-sz/2,sp.y);cx.closePath();cx.fill();cx.stroke();
} else if(_stp==='mid'){
  // Purple triangle — midpoint
  cx.fillStyle='rgba(124,58,237,0.2)';cx.strokeStyle='#7c3aed';cx.lineWidth=1.5*pr;
  cx.beginPath();cx.moveTo(sp.x,sp.y-sz/2);cx.lineTo(sp.x+sz/2,sp.y+sz/2);
  cx.lineTo(sp.x-sz/2,sp.y+sz/2);cx.closePath();cx.fill();cx.stroke();
}}cx.restore();}

function _getSymLeaderText(sym){
  var t=_ST[sym.type]||{};
  var p=sym.props||{};
  var parts=[sym.label||(t.label||sym.type)];
  switch(sym.type){
    case 'wall':
      if(p.w)parts.push('w='+p.w+'м');
      if(p.h)parts.push('h='+p.h+'м');
      break;
    case 'column':
      var shp=p.shape==='square'?'□':'○';
      parts.push(shp+(p.d||'')+'м');
      if(p.h)parts.push('h='+p.h+'м');
      break;
    case 'pile':
      parts.push('Ø'+(p.d||'')+'м');
      if(p.h)parts.push('H='+p.h+'м');
      if(p.top!==undefined)parts.push(p.top+'м');
      break;
    case 'well':
      parts.push('Ø'+(p.d||'')+'м');
      if(p.t)parts.push(p.t);
      break;
    case 'sewage':case 'water':case 'heat':
      if(p.d)parts.push('Ø'+p.d+'мм');
      break;
    case 'gas':
      if(p.p)parts.push(p.p);
      break;
    case 'cable':
      if(p.v)parts.push(p.v+'кВ');
      break;
    default: break;
  }
  // Add auto-length for line symbols
  if(['sewage','water','gas','heat','cable','fence','wall'].includes(sym.type)&&sym.pts&&sym.pts.length>=2){
    var len=0;
    for(var i=0;i<sym.pts.length-1;i++)
      len+=Math.hypot(sym.pts[i+1].x-sym.pts[i].x,sym.pts[i+1].y-sym.pts[i].y);
    parts.push('L='+len.toFixed(1)+'м');
  }
  return parts;
}

function _drawLeaders(ctx,pr){
  if(!showLeaders||!cadSymbols.length)return;
  var FONT_SZ=6.5*pr, LINE_H=8*pr;
  var DIST=38*pr;   // leader length in screen px
  var DOT_R=1.8*pr; // dot at symbol
  
  cadSymbols.forEach(function(sym,idx){
    if(!sym.pts||!sym.pts.length)return;
    // Anchor: centroid of pts
    var ax=0,ay=0;
    sym.pts.forEach(function(p){ax+=p.x;ay+=p.y;});
    ax/=sym.pts.length;ay/=sym.pts.length;
    var sp=cadToScreen(ax,ay);
    
    // Leader direction using Fibonacci/golden angle spread → no overlap
    var angle=(idx*137.508)*Math.PI/180;
    
    // Check if symbol is on right or left of canvas center to flip angle
    var cx0=document.getElementById('cad-canvas').width/2;
    if(sp.x>cx0) angle=Math.abs(angle)%(Math.PI*2); // bias right
    
    var ex=sp.x+Math.cos(angle)*DIST;
    var ey=sp.y+Math.sin(angle)*DIST;
    
    var col=sym.color||'#334155';
    var lines=_getSymLeaderText(sym);
    
    // Elbow: horizontal extension from end point
    ctx.save();
    ctx.font=FONT_SZ+'px sans-serif';
    
    // Measure max text width
    var maxW=0;
    lines.forEach(function(l){maxW=Math.max(maxW,ctx.measureText(l).width);});
    
    // Elbow direction
    var elbowRight=(Math.cos(angle)>=0);
    var elbowLen=Math.min(maxW+6*pr,55*pr);
    var ex2=elbowRight?ex+elbowLen:ex-elbowLen;
    
    // Leader line
    ctx.strokeStyle=col;
    ctx.lineWidth=0.5*pr;
    ctx.globalAlpha=0.85;
    ctx.beginPath();
    ctx.moveTo(sp.x,sp.y);
    ctx.lineTo(ex,ey);
    ctx.lineTo(ex2,ey);
    ctx.stroke();
    
    // Dot at symbol
    ctx.fillStyle=col;
    ctx.beginPath();
    ctx.arc(sp.x,sp.y,DOT_R,0,Math.PI*2);
    ctx.fill();
    
    // Tick at elbow
    ctx.beginPath();
    ctx.arc(ex,ey,DOT_R*0.8,0,Math.PI*2);
    ctx.fill();
    
    // Text lines (tiny)
    ctx.fillStyle=col;
    ctx.globalAlpha=0.95;
    var tx=elbowRight?ex+2*pr:ex-2*pr-maxW;
    lines.forEach(function(line,li){
      var ty=ey+(li===0?0:LINE_H*li)-(lines.length>1?LINE_H*(lines.length-1)/2:0);
      // White knockout for readability
      ctx.save();
      ctx.strokeStyle='rgba(255,255,255,0.85)';
      ctx.lineWidth=2.5*pr;
      ctx.strokeText(line,tx,ty);
      ctx.restore();
      ctx.fillText(line,tx,ty);
    });
    ctx.globalAlpha=1;
    ctx.restore();
  });
}
