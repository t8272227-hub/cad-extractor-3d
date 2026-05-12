// ── georef.js ──────────────────────────────────────────

function openGeoreferenceModal(){
  var m=document.getElementById('georef-modal'),c=document.getElementById('georef-modal-content');
  m.classList.remove('hidden');
  setTimeout(function(){m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);
  // Show clear button if overlay is active
  document.getElementById('gr-clear-btn').classList.toggle('hidden',secondDxfElements.length===0);
  // Reset mini-canvas pick state (NOT coordinate values)
  _georefPickTarget=0;
  var _mcv=document.getElementById('georef-mini-canvas');
  if(_mcv){_mcv.style.outline='1px solid #fed7aa';_mcv.onclick=null;}
  if(_georefParsedDxf)_georefRenderMini();
}

function closeGeoreferenceModal(){
  var m=document.getElementById('georef-modal'),c=document.getElementById('georef-modal-content');
  m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');
  setTimeout(function(){m.classList.add('hidden');},200);
}

function stopGeorefPick(){
  georefPickMode=null;
  var hint=document.getElementById('gr-pick-hint');
  if(hint)hint.classList.add('hidden');
}

function computeHelmert(p1s,p2s,p1d,p2d){
  // Source vector
  var dsx=p2s.x-p1s.x, dsy=p2s.y-p1s.y;
  // Destination vector
  var ddx=p2d.x-p1d.x, ddy=p2d.y-p1d.y;
  var lenSrc=Math.sqrt(dsx*dsx+dsy*dsy);
  var lenDst=Math.sqrt(ddx*ddx+ddy*ddy);
  if(lenSrc<1e-10)return null;
  var s=lenDst/lenSrc;
  // Rotation: angle between vectors
  var angleSrc=Math.atan2(dsy,dsx);
  var angleDst=Math.atan2(ddy,ddx);
  var theta=angleDst-angleSrc;
  var cosT=Math.cos(theta), sinT=Math.sin(theta);
  // tx,ty: after rotating and scaling p1s it must equal p1d
  // Rotated+scaled p1s: (0,0) → apply to any point P:
  //   Px' = s*(P.x*cosT - P.y*sinT) + tx
  //   Py' = s*(P.x*sinT + P.y*cosT) + ty
  // tx = p1d.x - s*(p1s.x*cosT - p1s.y*sinT)
  // ty = p1d.y - s*(p1s.x*sinT + p1s.y*cosT)
  var tx=p1d.x - s*(p1s.x*cosT - p1s.y*sinT);
  var ty=p1d.y - s*(p1s.x*sinT + p1s.y*cosT);
  // Verify on p2:
  var vx=s*(p2s.x*cosT-p2s.y*sinT)+tx;
  var vy=s*(p2s.x*sinT+p2s.y*cosT)+ty;
  var residual=Math.sqrt((vx-p2d.x)*(vx-p2d.x)+(vy-p2d.y)*(vy-p2d.y));
  return {s:s, theta:theta, cosT:cosT, sinT:sinT, tx:tx, ty:ty,
          scale:s, angleDeg:theta*180/Math.PI, residual:residual};
}

function georefLoadPreview(input){
  var file=input.files[0];
  if(!file)return;
  document.getElementById('gr-file-name').textContent=file.name;
  var fi=document.getElementById('georef-file-input');
  if(fi)fi._pendingFile=file;
  input.value='';

  // Show loading state on canvas
  var cv=document.getElementById('georef-mini-canvas');
  if(cv){
    var ctx=cv.getContext('2d');
    ctx.fillStyle='#fefce8';ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle='#78350f';ctx.font='14px sans-serif';ctx.textAlign='center';
    ctx.fillText('Загрузка '+file.name+'...',cv.width/2,cv.height/2);
    ctx.textAlign='left';
  }

  // Try UTF-8 first, then windows-1251
  function tryParse(text){
    var PC=window.DxfParser||(typeof DxfParser!=='undefined'?DxfParser:null);
    if(!PC){
      _grShowError('DxfParser не загружен. Перезагрузите страницу.');return;
    }
    try{
      var dxf=(new PC()).parseSync(text);
      if(!dxf){_grShowError('Файл не распознан как DXF');return;}
      _georefParsedDxf=dxf;
      _georefBuildElems(dxf);
      _georefRenderMini();
      _georefPopulateSnapList();
      var hint=document.getElementById('georef-mini-hint');
      if(hint)hint.style.display='none';
      var st=document.getElementById('gr-mini-status');
      if(st)st.textContent='Файл загружен: '+file.name+'. Укажите базовые точки кнопками выше.';
      ['gr-mini-x1','gr-mini-y1','gr-mini-x2','gr-mini-y2',
       'gr-p1-lx','gr-p1-ly','gr-p2-lx','gr-p2-ly'].forEach(function(id){
        var el=document.getElementById(id);if(el)el.value='';
      });
      _georefMiniP1=null;_georefMiniP2=null;_grP1L=null;_grP2L=null;
    }catch(err){
      _grShowError('Ошибка разбора DXF: '+err.message);
    }
  }
  function _grShowError(msg){
    var cv2=document.getElementById('georef-mini-canvas');
    if(cv2){
      var c2=cv2.getContext('2d');
      c2.fillStyle='#fff1f2';c2.fillRect(0,0,cv2.width,cv2.height);
      c2.fillStyle='#be123c';c2.font='13px sans-serif';c2.textAlign='center';
      var lines=msg.match(/.{1,50}/g)||[msg];
      lines.forEach(function(l,i){c2.fillText(l,cv2.width/2,cv2.height/2-10+i*18);});
      c2.textAlign='left';
    }
    var st=document.getElementById('gr-mini-status');
    if(st)st.textContent=msg;
  }

  var r=new FileReader();
  r.onload=function(ev){tryParse(ev.target.result);};
  r.onerror=function(){_grShowError('Ошибка чтения файла');};
  // Try UTF-8 (works for most DXF)
  r.readAsText(file,'UTF-8');
}

function applyGeoref(){
  // Read from JS vars (primary) — survives modal reopen
  var _missing=[];
  if(!_grP1L)_missing.push('P1 съёмки — выберите точку в разделе 1б');
  if(!_grP2L)_missing.push('P2 съёмки — выберите точку в разделе 1б');
  if(!_grP1G)_missing.push('P1 на основном чертеже — нажмите «На карте» в разделе 2');
  if(!_grP2G)_missing.push('P2 на основном чертеже — нажмите «На карте» в разделе 2');
  if(_missing.length>0){
    showMessage('Не указаны точки','Не заполнены:\n• '+_missing.join('\n• '),'warning');return;
  }
  var p1lx=_grP1L.x,p1ly=_grP1L.y,p2lx=_grP2L.x,p2ly=_grP2L.y;
  var p1gx=_grP1G.x,p1gy=_grP1G.y,p2gx=_grP2G.x,p2gy=_grP2G.y;

  var p1s={x:p1lx,y:p1ly}, p2s={x:p2lx,y:p2ly};
  var p1d={x:p1gx,y:p1gy}, p2d={x:p2gx,y:p2gy};
  var t=computeHelmert(p1s,p2s,p1d,p2d);
  if(!t){showMessage('Ошибка','Базовые точки совпадают — расстояние между точками должно быть ненулевым.','error');return;}
  georefTransform=t;

  // Show transform info
  var _ib=document.getElementById('gr-info-box');if(_ib)_ib.classList.remove('hidden');
  var _gs=document.getElementById('gr-scale');if(_gs)_gs.textContent=t.s.toFixed(6);
  var _ga=document.getElementById('gr-angle');if(_ga)_ga.textContent=t.angleDeg.toFixed(4)+'°';
  var _gac=document.getElementById('gr-accuracy');if(_gac)_gac.textContent=t.residual.toFixed(4)+' м';
  var _gtx=document.getElementById('gr-tx');if(_gtx)_gtx.textContent=t.tx.toFixed(3);
  var _gty=document.getElementById('gr-ty');if(_gty)_gty.textContent=t.ty.toFixed(3);

  // Use DXF already parsed in 1б preview section
  try{
    var dxf=_georefParsedDxf;
    if(!dxf||!dxf.entities||dxf.entities.length===0)throw new Error('Загрузите файл съёмки в разделе «Предпросмотр» (1б)');
    var _mx_el=document.getElementById('gr-mirror-x');var _my_el=document.getElementById('gr-mirror-y');var mX=_mx_el?_mx_el.checked:false;var mY=_my_el?_my_el.checked:false;secondDxfElements=processSecondDxfData(dxf,t,mX,mY);
      secondDxfVisible=true;
      // Points stay in secondDxfElements (no auto-merge).
      // User can import Z via Layers panel → "Импортировать Z-высоты"
      rebuildCachedPath();
      _updateDxf2LayerPanel();
      document.getElementById('gr-clear-btn').classList.remove('hidden');
      closeGeoreferenceModal();
      requestDraw();
      showMessage('Успешно',
        'Наложение выполнено.\nОбъектов в съёмочном файле: '+secondDxfElements.length+
        '\nМасштаб: '+t.s.toFixed(4)+' | Поворот: '+t.angleDeg.toFixed(2)+'°'+
        (mX?' | Зерк.X':'')+
        (mY?' | Зерк.Y':'')+
        '\n\nСъёмочный чертёж — оранжевым.\nZ-высоты: импортируйте через Слои → Вложенный DXF',
        'success');
  }catch(err){
    showMessage('Ошибка','Не удалось обработать DXF: '+err.message,'error');
  }
}

function clearGeoref(){
  secondDxfElements=[];secondDxfVisible=false;georefTransform=null;
  document.getElementById('gr-clear-btn').classList.add('hidden');
  document.getElementById('gr-info-box').classList.add('hidden');
  document.getElementById('gr-file-name').textContent='файл не выбран';
  requestDraw();
  closeGeoreferenceModal();
  showMessage('Очищено','Наложение второго чертежа удалено.','info');
}

function mirrorManualPoints(axis){
  if(!manualPoints||manualPoints.length===0){
    showMessage('Нет точек','Добавьте точки для зеркального отображения.','warning');
    return;
  }
  saveManState();
  // Centroid
  var cx=0,cy=0;
  manualPoints.forEach(function(p){cx+=p.x;cy+=p.y;});
  cx/=manualPoints.length;
  cy/=manualPoints.length;
  // Mirror around centroid
  manualPoints.forEach(function(p){
    if(axis==='x'){
      p.y=2*cy-p.y;          // reflect around horizontal centre line
    }else{
      p.x=2*cx-p.x;          // reflect around vertical centre line
    }
  });
  updateManualTable();
  updateManualLinesTable();
  requestManualDraw();
}

function _georefBuildElems(dxf){
  _georefMiniSnaps=[];
  _georefMiniElems=[];
  var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;

  function bb(x,y){
    if(!isFinite(x)||!isFinite(y))return;
    if(x<minX)minX=x;if(x>maxX)maxX=x;
    if(y<minY)minY=y;if(y>maxY)maxY=y;
    _georefMiniSnaps.push({x:x,y:y});
  }

  // Universal entity → points extractor
  function extractPts(en,tx,ty,sx,sy){
    tx=tx||0;ty=ty||0;sx=sx||1;sy=sy||1;
    var pts=[];
    var t=en.type;
    // LINE — dxf-parser uses start/end
    if(t==='LINE'){
      if(en.start&&en.end){
        pts.push({x:en.start.x*sx+tx,y:en.start.y*sy+ty});
        pts.push({x:en.end.x*sx+tx,y:en.end.y*sy+ty});
      }
      if(en.vertices&&en.vertices.length){
        en.vertices.forEach(function(v){pts.push({x:v.x*sx+tx,y:v.y*sy+ty});});
      }
    }
    // POLYLINES
    else if(t==='LWPOLYLINE'||t==='POLYLINE'||t==='SPLINE'){
      var verts=en.vertices||[];
      verts.forEach(function(v){
        var px=(v.x!==undefined?v.x:(v[0]||0))*sx+tx;
        var py=(v.y!==undefined?v.y:(v[1]||0))*sy+ty;
        pts.push({x:px,y:py});
      });
    }
    // CIRCLE / ARC
    else if((t==='CIRCLE'||t==='ARC')&&en.center){
      pts.push({x:en.center.x*sx+tx,y:en.center.y*sy+ty});
      // Add 8 perimeter points for bbox
      var R=en.radius||0;
      for(var a=0;a<Math.PI*2;a+=Math.PI/4)
        pts.push({x:(en.center.x+Math.cos(a)*R)*sx+tx,y:(en.center.y+Math.sin(a)*R)*sy+ty});
    }
    // POINT
    else if(t==='POINT'){
      var pp=en.position||en.point;
      if(pp)pts.push({x:pp.x*sx+tx,y:pp.y*sy+ty});
    }
    // TEXT / MTEXT
    else if(t==='TEXT'||t==='MTEXT'){
      var tp=en.startPoint||en.position||en.insertionPoint;
      if(tp)pts.push({x:tp.x*sx+tx,y:tp.y*sy+ty});
    }
    // ELLIPSE
    else if(t==='ELLIPSE'&&en.center){
      pts.push({x:en.center.x*sx+tx,y:en.center.y*sy+ty});
    }
    return pts;
  }

  function traverse(entities,tx,ty,sx,sy){
    if(!entities||!entities.length)return;
    entities.forEach(function(en){
      if(!en||!en.type)return;
      try{
        if(en.type==='INSERT'){
          var blk=dxf.blocks&&en.name?dxf.blocks[en.name]:null;
          if(blk&&blk.entities){
            var bx=(en.position?en.position.x:0)*(sx||1)+(tx||0);
            var by=(en.position?en.position.y:0)*(sy||1)+(ty||0);
            var bsx=(sx||1)*(en.scaleX||en.scale&&en.scale.x||1);
            var bsy=(sy||1)*(en.scaleY||en.scale&&en.scale.y||1);
            traverse(blk.entities,bx,by,bsx,bsy);
          }
          return;
        }
        var pts=extractPts(en,tx||0,ty||0,sx||1,sy||1);
        if(pts.length===0)return;
        pts.forEach(function(p){bb(p.x,p.y);});
        if(pts.length>=2){
          _georefMiniElems.push({type:'line',pts:pts,
            isCircle:(en.type==='CIRCLE'||en.type==='ARC'),
            cx:en.center&&en.center.x*(sx||1)+(tx||0),
            cy:en.center&&en.center.y*(sy||1)+(ty||0),
            r:en.radius});
        } else if(pts.length===1){
          _georefMiniElems.push({type:'point',pt:pts[0]});
        }
      }catch(e){}
    });
  }

  traverse(dxf.entities,0,0,1,1);

  // Compute scale for mini canvas
  var cv=document.getElementById('georef-mini-canvas');
  if(!cv)return;
  var W=cv.width||460,H=cv.height||320,pad=24;
  if(!isFinite(minX)||minX===maxX||minY===maxY){
    // Fallback: can't compute scale
    _georefMiniScale=1;_georefMiniOX=0;_georefMiniOY=0;
    return;
  }
  var rangeX=maxX-minX,rangeY=maxY-minY;
  var scX=(W-pad*2)/rangeX,scY=(H-pad*2)/rangeY;
  _georefMiniScale=Math.min(scX,scY);
  _georefMiniOX=minX-pad/_georefMiniScale;
  _georefMiniOY=minY-pad/_georefMiniScale;
}

function _georefExtractMiniSnaps(dxf){
  _georefMiniSnaps=[];
  _georefMiniElems=[];
  var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  function addPt(x,y){
    if(!isFinite(x)||!isFinite(y))return;
    _georefMiniSnaps.push({x:x,y:y});
    if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
  }
  function traverse(entities,tx,ty,sx,sy){
    if(!entities)return;
    entities.forEach(function(en){
      if(!en)return;
      try{
        if(en.type==='INSERT'&&dxf.blocks&&en.name&&dxf.blocks[en.name]){
          var _blk=dxf.blocks[en.name];
          var bx=(en.position?(en.position.x||0):0)*sx+tx;
          var by=(en.position?(en.position.y||0):0)*sy+ty;
          var bsx=sx*(en.scaleX||en.scale&&en.scale.x||1);
          var bsy=sy*(en.scaleY||en.scale&&en.scale.y||1);
          if(_blk.entities)traverse(_blk.entities,bx,by,bsx,bsy);
          return;
        }
        var pts=[];
        if(en.type==='LINE'){
          // dxf-parser v1.x uses start/end; some versions use vertices
          if(en.start&&en.end){
            pts.push({x:en.start.x*sx+tx,y:en.start.y*sy+ty});
            pts.push({x:en.end.x*sx+tx,y:en.end.y*sy+ty});
          } else if(en.vertices&&en.vertices.length>=2){
            en.vertices.forEach(function(v){pts.push({x:v.x*sx+tx,y:v.y*sy+ty});});
          }
        } else if((en.type==='LWPOLYLINE'||en.type==='POLYLINE'||en.type==='SPLINE')){
          var _verts=en.vertices||[];
          _verts.forEach(function(v){pts.push({x:(v.x||0)*sx+tx,y:(v.y||0)*sy+ty});});
        } else if(en.type==='TEXT'||en.type==='MTEXT'){
          if(en.startPoint)pts.push({x:en.startPoint.x*sx+tx,y:en.startPoint.y*sy+ty});
          else if(en.position)pts.push({x:en.position.x*sx+tx,y:en.position.y*sy+ty});
        } else if((en.type==='CIRCLE'||en.type==='ARC')&&en.center){
          pts.push({x:en.center.x*sx+tx,y:en.center.y*sy+ty});
        } else if(en.type==='ELLIPSE'&&en.center){
          pts.push({x:en.center.x*sx+tx,y:en.center.y*sy+ty});
        } else if(en.type==='POINT'){
          var _pp=en.position||en.point;
          if(_pp)pts.push({x:_pp.x*sx+tx,y:_pp.y*sy+ty});
        }
        pts.forEach(function(p){addPt(p.x,p.y);});
        if(pts.length>=2)_georefMiniElems.push({type:'line',pts:pts});
        else if(pts.length===1)_georefMiniElems.push({type:'point',pt:pts[0]});
        if((en.type==='CIRCLE'||en.type==='ARC')&&en.center&&en.radius)
          _georefMiniElems.push({type:'circle',cx:en.center.x*sx+tx,cy:en.center.y*sy+ty,r:en.radius*Math.abs(sx)});
      }catch(_){}
    });
  }
  traverse(dxf.entities,0,0,1,1);
  // Compute transform for mini canvas
  var cv=document.getElementById('georef-mini-canvas');
  if(!cv||!isFinite(minX))return;
  var W=cv.width,H=cv.height,pad=20;
  var rangeX=maxX-minX||1,rangeY=maxY-minY||1;
  _georefMiniScale=Math.min((W-2*pad)/rangeX,(H-2*pad)/rangeY);
  _georefMiniOX=minX-(W/2-rangeX*_georefMiniScale/2)/_georefMiniScale;
  _georefMiniOY=minY-(H/2-rangeY*_georefMiniScale/2)/_georefMiniScale;
}

function _georefRenderMini(){
  var cv=document.getElementById('georef-mini-canvas');
  if(!cv)return;
  var ctx=cv.getContext('2d');
  var W=cv.width||460,H=cv.height||320;
  var sc=_georefMiniScale,oX=_georefMiniOX,oY=_georefMiniOY;

  // Background
  ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,W,H);

  if(!sc||!isFinite(sc)||sc<=0||!_georefMiniElems||!_georefMiniElems.length){
    ctx.fillStyle='#64748b';ctx.font='13px sans-serif';ctx.textAlign='center';
    ctx.fillText('Нет данных для отображения',W/2,H/2-8);
    ctx.fillStyle='#94a3b8';ctx.font='11px sans-serif';
    ctx.fillText('Элементов: '+(_georefMiniElems?_georefMiniElems.length:0)+
                 ' | Точек: '+(_georefMiniSnaps?_georefMiniSnaps.length:0),W/2,H/2+12);
    ctx.textAlign='left';
    return;
  }

  // World→screen helpers
  function wx(x){return (x-oX)*sc;}
  function wy(y){return H-(y-oY)*sc;}

  // Draw elements
  ctx.strokeStyle='#1e293b';
  ctx.lineWidth=0.8;
  ctx.lineCap='round';

  _georefMiniElems.forEach(function(el){
    try{
      if(el.type==='line'&&el.pts&&el.pts.length>=2){
        if(el.isCircle&&el.r&&isFinite(el.cx)&&isFinite(el.cy)){
          ctx.beginPath();
          ctx.arc(wx(el.cx),wy(el.cy),Math.abs(el.r*sc),0,Math.PI*2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          el.pts.forEach(function(p,i){
            var sx2=wx(p.x),sy2=wy(p.y);
            i===0?ctx.moveTo(sx2,sy2):ctx.lineTo(sx2,sy2);
          });
          ctx.stroke();
        }
      } else if(el.type==='point'&&el.pt){
        ctx.fillStyle='#ef4444';
        ctx.beginPath();
        ctx.arc(wx(el.pt.x),wy(el.pt.y),2.5,0,Math.PI*2);
        ctx.fill();
      }
    }catch(e){}
  });

  // Draw selected points
  function drawMark(p,label,col){
    var sx2=wx(p.x),sy2=wy(p.y);
    ctx.fillStyle=col;
    ctx.strokeStyle='#fff';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(sx2,sy2,7,0,Math.PI*2);
    ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
    ctx.fillText(label,sx2,sy2+3.5);ctx.textAlign='left';
    ctx.lineWidth=0.8;ctx.strokeStyle='#1e293b';
  }
  if(_georefMiniP1)drawMark(_georefMiniP1,'P1','#16a34a');
  if(_georefMiniP2)drawMark(_georefMiniP2,'P2','#dc2626');

  // Stats overlay
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fillRect(4,4,140,18);
  ctx.fillStyle='#475569';ctx.font='9px sans-serif';
  ctx.fillText('Эл: '+_georefMiniElems.length+' | Узл: '+_georefMiniSnaps.length,8,15);
}

function _georefPopulateSnapList(){
  [1,2].forEach(function(n){
    var sel=document.getElementById('gr-mini-snap-sel-'+n);
    if(!sel)return;
    while(sel.options.length>1)sel.remove(1);
    _georefMiniSnaps.forEach(function(p,i){
      var opt=document.createElement('option');
      opt.value=i;
      opt.dataset.x=p.x;
      opt.dataset.y=p.y;
      opt.textContent='#'+(i+1)+': ('+p.x.toFixed(3)+', '+p.y.toFixed(3)+')';
      sel.appendChild(opt);
    });
  });
}
