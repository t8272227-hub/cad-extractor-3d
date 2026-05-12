// ── symbols.js ──────────────────────────────────────────

function _symInit(){
  var g=document.getElementById('sym-grid');if(!g)return;g.innerHTML='';
  Object.entries(_ST).forEach(function(e){var id=e[0],t=e[1];
    var b=document.createElement('button');b.id='sb-'+id;
    b.innerHTML=t.icon+'<br><span style="font-size:9px;font-weight:700;">'+t.label+'</span>';
    b.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:5px 3px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:18px;cursor:pointer;background:white;min-height:50px;transition:all .12s;';
    b.onclick=function(){_symSel(id);};g.appendChild(b);
  });
  _symLegend();
  // Draggable panel
  var p=document.getElementById('sym-panel'),h=document.getElementById('sym-drag');
  var ox=0,oy=0,mx=0,my=0,dr=false;
  h.addEventListener('mousedown',function(e){if(e.target.closest('button'))return;dr=true;ox=p.offsetLeft;oy=p.offsetTop;mx=e.clientX;my=e.clientY;e.preventDefault();});
  document.addEventListener('mousemove',function(e){if(!dr)return;p.style.left=(ox+e.clientX-mx)+'px';p.style.top=Math.max(0,oy+e.clientY-my)+'px';p.style.bottom='auto';});
  document.addEventListener('mouseup',function(){dr=false;});
  // Canvas click handlers for symbol placement (high priority)
  ['cad-canvas','manual-canvas'].forEach(function(cid){
    var el=document.getElementById(cid);if(!el)return;
    el.addEventListener('click',function(ev){
      if(!symTool)return;
      var t=_ST[symTool];var rect=el.getBoundingClientRect();
      var sx=ev.clientX-rect.left,sy=ev.clientY-rect.top;
      // Snap to nearest point
      var cad=(cid==='cad-canvas')?screenToCad(sx,sy):screenToMan(sx,sy);
      if(cid==='cad-canvas'&&cadSnapPoints&&cadSnapPoints.length){
        var th2=15/scale,bd2=Infinity,best2=null;
        cadSnapPoints.forEach(function(p){var d=Math.hypot(p.x-cad.x,p.y-cad.y);if(d<th2&&d<bd2){bd2=d;best2=p;}});
        if(best2)cad=best2;
      }
      symPoints.push({x:cad.x,y:cad.y});
      if(t.clicks==='one'||(t.clicks==='two'&&symPoints.length===2)){_symFinish();}
      else{document.getElementById('sym-hint').textContent=t.hint+' ('+symPoints.length+' точ.)';}
      ev.stopPropagation();requestDraw();if(cid==='manual-canvas')requestManualDraw();
    },true);
  });
}

function _symSel(id){
  symTool=id;symPoints=[];symProp={};var t=_ST[id];
  Object.keys(_ST).forEach(function(k){var b=document.getElementById('sb-'+k);if(b){b.style.background=k===id?'#eff6ff':'white';b.style.borderColor=k===id?'#3b82f6':'#e2e8f0';}});
  var fld=document.getElementById('sym-props');fld.innerHTML='';
  t.props.forEach(function(prop){
    symProp[prop.id]=prop.def;
    var row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;';
    var lbl=document.createElement('span');lbl.textContent=prop.label;lbl.style.cssText='flex:1;font-size:10px;color:#64748b;';row.appendChild(lbl);
    var inp;
    if(prop.type==='sel'){
      inp=document.createElement('select');inp.style.cssText='width:88px;border:1px solid #cbd5e1;border-radius:6px;padding:2px 4px;font-size:11px;font-weight:600;';
      prop.opts.forEach(function(o,oi){var op=document.createElement('option');op.value=o;op.textContent=(prop.optLabels&&prop.optLabels[oi])?prop.optLabels[oi]:o;if(o===prop.def)op.selected=true;inp.appendChild(op);});
    }else{
      inp=document.createElement('input');inp.type='number';inp.value=prop.def;inp.step=prop.step||'1';inp.min='0';
      inp.style.cssText='width:68px;border:1px solid #cbd5e1;border-radius:6px;padding:2px 6px;font-size:11px;font-weight:600;text-align:center;';
    }
    inp.onchange=function(){symProp[prop.id]=this.value;};row.appendChild(inp);fld.appendChild(row);
  });
  document.getElementById('sym-props-wrap').style.display=t.props.length?'block':'none';
  document.getElementById('sym-hint').textContent=t.hint;
  document.getElementById('sym-finish').style.display=(t.clicks==='multi')?'block':'none';
  document.getElementById('sym-cancel').style.display='block';
}

function _symFinish(){
  if(!symTool||!symPoints.length)return;
  var col=document.getElementById('sym-color').value||'#1e293b';
  cadSymbols.push({type:symTool,pts:symPoints.slice(),props:Object.assign({},symProp),color:col,label:_ST[symTool].label});
  symPoints=[];document.getElementById('sym-hint').textContent='\u2713 '+_ST[symTool].label+' добавлен';
  _symLegend();requestDraw();requestManualDraw();
}

function _symCancel(){
  symTool=null;symPoints=[];
  Object.keys(_ST).forEach(function(k){var b=document.getElementById('sb-'+k);if(b){b.style.background='white';b.style.borderColor='#e2e8f0';}});
  document.getElementById('sym-props-wrap').style.display='none';
  document.getElementById('sym-cancel').style.display='none';
  document.getElementById('sym-finish').style.display='none';
  document.getElementById('sym-hint').textContent='Выберите тип объекта';
}

function _symLegend(){
  var lg=document.getElementById('sym-legend');if(!lg)return;
  if(!cadSymbols.length){lg.innerHTML='<span style="color:#94a3b8;font-style:italic;">Нет объектов</span>';return;}
  var g={};cadSymbols.forEach(function(s){g[s.type]=(g[s.type]||0)+1;});
  lg.innerHTML=Object.entries(g).map(function(e){var t=_ST[e[0]];return t.icon+' <b>'+t.label+'</b> &times;'+e[1];}).join('&nbsp;&nbsp;');
}

function _drawSymbols(ctx,scl,oX,oY,pr){
  cadSymbols.forEach(function(sym){
    try{
      var pts=sym.pts,col=sym.color||'#1e293b';ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;
      switch(sym.type){
        case 'wall':{
          if(pts.length<2)break;
          var _ww=parseFloat(sym.props.w||0.25);
          var _wh=sym.props.h||'';
          var _align=sym.props.align||'center'; // center/outer/inner
          var _mark=sym.props.mark||'none';     // none/tick/circle/arrow
          var _minW=Math.max(_ww,2.5/scl);

          // ── Helper: compute offset polyline in world coords ──────────────
          // offset>0 = shift right of travel direction, offset<0 = left
          function _offsetPts(pArr,off){
            var res=[];
            for(var _i=0;_i<pArr.length;_i++){
              // Average normal at each vertex
              var nx=0,ny=0,cnt=0;
              if(_i<pArr.length-1){
                var dx=pArr[_i+1].x-pArr[_i].x,dy=pArr[_i+1].y-pArr[_i].y;
                var ln=Math.hypot(dx,dy)||1;
                nx+=(-dy/ln);ny+=(dx/ln);cnt++;
              }
              if(_i>0){
                var dx2=pArr[_i].x-pArr[_i-1].x,dy2=pArr[_i].y-pArr[_i-1].y;
                var ln2=Math.hypot(dx2,dy2)||1;
                nx+=(-dy2/ln2);ny+=(dx2/ln2);cnt++;
              }
              if(cnt){nx/=cnt;ny/=cnt;}
              var nln=Math.hypot(nx,ny)||1;
              res.push({x:pArr[_i].x+off*(nx/nln),y:pArr[_i].y+off*(ny/nln)});
            }
            return res;
          }

          // ── Compute axis pts based on alignment ───────────────────────────
          // 'center': axis = drawn pts (lineWidth = _ww centered)
          // 'outer' : drawn line is OUTER face → axis shifted inward by _ww/2
          // 'inner' : drawn line is INNER face → axis shifted outward by _ww/2
          var _axisPts=pts;
          if(_align==='outer')  _axisPts=_offsetPts(pts,-_ww/2);
          if(_align==='inner')  _axisPts=_offsetPts(pts, _ww/2);

          // ── Draw outer body line (thick) ──────────────────────────────────
          ctx.lineWidth=_minW;ctx.lineCap='round';ctx.lineJoin='round';
          ctx.beginPath();
          _axisPts.forEach(function(p,_i){
            _i?ctx.lineTo(p.x-oX,p.y-oY):ctx.moveTo(p.x-oX,p.y-oY);
          });
          ctx.stroke();

          // ── Draw center axis (thin dashed) ────────────────────────────────
          ctx.strokeStyle='rgba(255,255,255,0.35)';
          ctx.lineWidth=Math.max(0.02,0.7/scl);
          ctx.setLineDash([Math.max(0.08,2/scl),Math.max(0.08,2/scl)]);
          ctx.beginPath();
          _axisPts.forEach(function(p,_i){
            _i?ctx.lineTo(p.x-oX,p.y-oY):ctx.moveTo(p.x-oX,p.y-oY);
          });
          ctx.stroke();ctx.setLineDash([]);

          // ── Draw alignment reference lines (outer/inner edges) ────────────
          if(_align!=='center'){
            var _edgePts=_offsetPts(_axisPts, _align==='outer'?-_ww/2:_ww/2);
            ctx.strokeStyle='rgba(0,0,0,0.25)';
            ctx.lineWidth=Math.max(0.01,0.4/scl);
            ctx.setLineDash([Math.max(0.05,1.5/scl),Math.max(0.05,1.5/scl)]);
            ctx.beginPath();
            _edgePts.forEach(function(p,_i){
              _i?ctx.lineTo(p.x-oX,p.y-oY):ctx.moveTo(p.x-oX,p.y-oY);
            });
            ctx.stroke();ctx.setLineDash([]);
          }

          // ── Draw start mark symbol ────────────────────────────────────────
          if(_mark!=='none'&&pts.length>=2){
            var _p0=_axisPts[0],_p1=_axisPts[1];
            var _dx=_p1.x-_p0.x,_dy=_p1.y-_p0.y;
            var _dl=Math.hypot(_dx,_dy)||1;
            var _tx=_dx/_dl,_ty=_dy/_dl; // tangent
            var _nx=-_ty,_ny=_tx;         // normal
            var _sx=_p0.x-oX,_sy=_p0.y-oY;
            var _hs=_ww/2; // half-width
            ctx.strokeStyle=col;ctx.fillStyle=col;
            ctx.lineWidth=Math.max(0.04,1.5/scl);
            if(_mark==='tick'){
              // Perpendicular tick ⊥
              ctx.beginPath();
              ctx.moveTo(_sx+_nx*_hs*1.5,_sy+_ny*_hs*1.5);
              ctx.lineTo(_sx-_nx*_hs*1.5,_sy-_ny*_hs*1.5);
              ctx.stroke();
            } else if(_mark==='circle'){
              // Circle ○
              ctx.beginPath();
              ctx.arc(_sx,_sy,_hs*0.8,0,Math.PI*2);
              ctx.stroke();
            } else if(_mark==='arrow'){
              // Arrow → pointing in wall direction
              var _ar=_hs*1.2;
              ctx.beginPath();
              ctx.moveTo(_sx,_sy);
              ctx.lineTo(_sx+_tx*_ar,_sy+_ty*_ar);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(_sx+_tx*_ar,_sy+_ty*_ar);
              ctx.lineTo(_sx+_tx*_ar*0.6+_nx*_ar*0.4,_sy+_ty*_ar*0.6+_ny*_ar*0.4);
              ctx.lineTo(_sx+_tx*_ar*0.6-_nx*_ar*0.4,_sy+_ty*_ar*0.6-_ny*_ar*0.4);
              ctx.closePath();ctx.fill();
            }
          }

          // ── Alignment label next to start ─────────────────────────────────
          if(_align!=='center'&&pts.length>=1){
            var _p0s=_axisPts[0];
            ctx.save();ctx.translate(_p0s.x-oX,_p0s.y-oY);ctx.scale(1/scl,-1/scl);
            ctx.font=(Math.min(9,Math.max(_ww*scl*0.8,6)))+'px sans-serif';
            ctx.fillStyle=col;ctx.textBaseline='top';ctx.textAlign='left';
            ctx.fillText(_align==='outer'?'нар.':'вн.',2,2);
            ctx.restore();
          }

          // ── Height label at midpoint ──────────────────────────────────────
          if(_wh&&_axisPts.length>=2){
            var _wm=_axisPts[Math.floor(_axisPts.length/2)];
            ctx.save();ctx.translate(_wm.x-oX,_wm.y-oY);ctx.scale(1/scl,-1/scl);
            ctx.font='bold '+Math.min(9,Math.max(_ww*scl*1.2,7))+'px sans-serif';
            ctx.fillStyle=col;ctx.textBaseline='bottom';ctx.textAlign='center';
            ctx.fillText('h='+_wh+'м',0,-2);ctx.restore();
          }
          break;}
        case 'column':{
          var _cr=parseFloat(sym.props.d||0.3)/2,_ch=sym.props.h||'3.0';
          var _cshape=sym.props.shape||'circle';
          var _cpx=pts[0].x-oX,_cpy=pts[0].y-oY;
          ctx.lineWidth=1.5/scl;
          if(_cshape==='square'){
            ctx.beginPath();ctx.rect(_cpx-_cr,_cpy-_cr,_cr*2,_cr*2);ctx.stroke();
            ctx.fillStyle=col+'44';ctx.fill();
          } else {
            ctx.beginPath();ctx.arc(_cpx,_cpy,_cr,0,Math.PI*2);ctx.stroke();
            ctx.fillStyle=col+'44';ctx.fill();
          }
          ctx.fillStyle=col;
          ctx.lineWidth=0.5/scl;
          ctx.beginPath();ctx.moveTo(_cpx-_cr*0.3,_cpy);ctx.lineTo(_cpx+_cr*0.3,_cpy);
          ctx.moveTo(_cpx,_cpy-_cr*0.3);ctx.lineTo(_cpx,_cpy+_cr*0.3);ctx.stroke();
          ctx.save();ctx.translate(_cpx+_cr+0.05,_cpy);ctx.scale(1/scl,-1/scl);
          ctx.font='bold '+Math.max(_cr*scl*0.9,7)+'px sans-serif';
          ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=col;
          ctx.fillText('h='+_ch+'м',2,0);ctx.restore();
          break;}
        case 'well':
          var dw=parseFloat(sym.props.d||1.0)/2;
          ctx.lineWidth=2/scl;ctx.beginPath();ctx.arc(pts[0].x-oX,pts[0].y-oY,dw,0,Math.PI*2);ctx.stroke();
          ctx.beginPath();ctx.moveTo(pts[0].x-oX-dw,pts[0].y-oY);ctx.lineTo(pts[0].x-oX+dw,pts[0].y-oY);ctx.moveTo(pts[0].x-oX,pts[0].y-oY-dw);ctx.lineTo(pts[0].x-oX,pts[0].y-oY+dw);ctx.stroke();
          ctx.save();ctx.scale(1,-1);ctx.font='bold '+(dw*0.9)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sym.props.t||'К',pts[0].x-oX,-(pts[0].y-oY));ctx.restore();
          break;
        case 'sewage':_pipe(ctx,pts,oX,oY,scl,col,[0.3/scl,0.15/scl],'К');break;
        case 'water': _pipe(ctx,pts,oX,oY,scl,col,[],'В');break;
        case 'gas':   _pipe(ctx,pts,oX,oY,scl,col,[0.5/scl,0.2/scl],'Г');break;
        case 'heat':  _pipe(ctx,pts,oX,oY,scl,col,[],'Т');break;
        case 'cable': _pipe(ctx,pts,oX,oY,scl,col,[0.2/scl,0.1/scl,0.05/scl,0.1/scl],'Э');break;
        case 'pile':{
          if(!pts.length)break;
          var _pd=parseFloat(sym.props.d||0.3),_pr=_pd/2;
          var _ph=parseFloat(sym.props.h||3.0);
          var _ptop=sym.props.top!==undefined?sym.props.top:'-0.00';
          var _px=pts[0].x-oX,_py=pts[0].y-oY;
          ctx.lineWidth=0.05;ctx.beginPath();ctx.arc(_px,_py,_pr,0,Math.PI*2);ctx.stroke();
          ctx.fillStyle=sym.color||'#7f1d1d';ctx.beginPath();ctx.arc(_px,_py,_pr*0.35,0,Math.PI*2);ctx.fill();
          ctx.lineWidth=0.03;ctx.beginPath();ctx.moveTo(_px,_py+_pr*0.4);ctx.lineTo(_px,_py+_pr*1.5);ctx.stroke();
          ctx.beginPath();ctx.moveTo(_px-_pr*0.2,_py+_pr*1.2);ctx.lineTo(_px,_py+_pr*1.5);ctx.lineTo(_px+_pr*0.2,_py+_pr*1.2);ctx.stroke();
          ctx.save();ctx.translate(_px+_pr*1.3,_py);ctx.scale(1/scl,-1/scl);
          ctx.font='bold '+Math.min(9,Math.max(_pr*scl*0.9,7))+'px sans-serif';ctx.textBaseline='middle';ctx.fillStyle=sym.color||'#7f1d1d';
          ctx.fillText('h='+_ph+'м ('+_ptop+')',2,0);ctx.restore();break;}
        case 'fence':
          if(pts.length<2)break;ctx.lineWidth=1.5/scl;
          ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x-oX,p.y-oY):ctx.moveTo(p.x-oX,p.y-oY);});ctx.stroke();
          for(var i=0;i<pts.length-1;i++){var dx2=pts[i+1].x-pts[i].x,dy2=pts[i+1].y-pts[i].y,seg=Math.hypot(dx2,dy2);for(var t2=1.5;t2<seg;t2+=2){var fx=pts[i].x+dx2/seg*t2-oX,fy=pts[i].y+dy2/seg*t2-oY;var nx=-dy2/seg*0.4,ny=dx2/seg*0.4;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+nx,fy+ny);ctx.stroke();}}
          break;
      }
      ctx.restore();
    }catch(_){}
  });
}

function _pipe(ctx,pts,oX,oY,scl,col,dash,ltr){
  if(pts.length<2)return;
  ctx.strokeStyle=col;ctx.lineWidth=1.5/scl;ctx.setLineDash(dash||[]);
  ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x-oX,p.y-oY):ctx.moveTo(p.x-oX,p.y-oY);});ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=col;for(var i=0;i<pts.length-1;i++){var dx=pts[i+1].x-pts[i].x,dy=pts[i+1].y-pts[i].y,seg=Math.hypot(dx,dy);for(var t=seg/2;t<seg;t+=5){var fx=pts[i].x+dx/seg*t-oX,fy=pts[i].y+dy/seg*t-oY;ctx.save();ctx.scale(1,-1);ctx.font='bold '+(3.5/scl)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ltr,fx,-fy);ctx.restore();}}
}

function openSymTable(){
  var p=document.getElementById('sym-table-panel');
  if(!p)return;
  p.classList.toggle('hidden');
  if(!p.classList.contains('hidden'))refreshSymTable();
}

function _symLen(sym){
  // Calculate length for line-based symbols (wall, sewage, water, gas, heat, cable, fence)
  if(!sym.pts||sym.pts.length<2)return null;
  var total=0;
  for(var i=0;i<sym.pts.length-1;i++){
    total+=Math.hypot(sym.pts[i+1].x-sym.pts[i].x,sym.pts[i+1].y-sym.pts[i].y);
  }
  return total;
}

function _symPropVal(sym,pid){
  return sym.props&&sym.props[pid]!==undefined?sym.props[pid]:'';
}

function refreshSymTable(){
  // Merge cadSymbols + manual rows into one table
  var tb=document.getElementById('sym-table-body');
  var cnt=document.getElementById('sym-table-count');
  var rows=[];
  
  // From placed symbols on plan
  cadSymbols.forEach(function(sym,i){
    var st=_ST[sym.type]||{};
    var d=_symPropVal(sym,'d');
    var h=_symPropVal(sym,'h');
    var top=_symPropVal(sym,'top');
    var shape=_symPropVal(sym,'shape');
    var len=_symLen(sym);
    rows.push({
      _src:'plan',_idx:i,
      type:sym.type,
      label:sym.label||(st.label||sym.type),
      d:d, h:h, top:top, shape:shape,
      len:len!==null?len.toFixed(2):'',
      note:sym.note||''
    });
  });
  
  // Manual rows
  symTableRows.forEach(function(r,i){
    rows.push(Object.assign({_src:'manual',_idx:i},r));
  });
  
  if(cnt)cnt.textContent='Объектов: '+rows.length;
  
  if(rows.length===0){
    tb.innerHTML='<tr><td colspan="9" class="text-center py-4 text-slate-400 italic">Нет объектов.</td></tr>';
    return;
  }
  
  var h='';
  rows.forEach(function(r,gi){
    var bg=gi%2===0?'background:#fff':'background:#f8fafc';
    var src=r._src,idx=r._idx;
    var typeLabel=(_ST[r.type]&&_ST[r.type].label)||r.label||r.type||'';
    var icon=(_ST[r.type]&&_ST[r.type].icon)||'📋';
    
    // Determine what to show in each column based on type
    var dVal=r.d||'';
    var depthVal=''; // глубина
    var lenVal=r.len||'';
    var hVal=r.h||'';
    var topVal=r.top||'';
    
    // For line symbols, show length in depth/length column
    if(['sewage','water','gas','heat','cable','fence','wall'].includes(r.type)){
      depthVal=lenVal; // length is the "depth/length" column
      lenVal='';
    } else {
      depthVal=r.h||''; // for point symbols h is depth
      hVal=''; // already used
    }
    
    h+='<tr style="'+bg+';border-bottom:1px solid #e2e8f0;">';
    h+='<td class="px-2 py-1 text-slate-500 border-r border-slate-100">'+( gi+1)+'</td>';
    h+='<td class="px-2 py-1 border-r border-slate-100">'+icon+' <span class="font-medium">'+typeLabel+'</span></td>';
    // Name (editable)
    h+='<td class="px-1 py-0.5 border-r border-slate-100">'
      +'<input type="text" value="'+_escHtml(r.label||'')+'" '
      +'onchange="_symTblEdit(\''+src+'\','+idx+',\'label\',this.value)" '
      +'class="w-full text-xs border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white">'
      +'</td>';
    // Diameter (editable)
    h+='<td class="px-1 py-0.5 border-r border-slate-100">'
      +'<input type="text" value="'+_escHtml(dVal)+'" '
      +'onchange="_symTblEdit(\''+src+'\','+idx+',\'d\',this.value)" '
      +'class="w-full text-xs font-mono border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white">'
      +'</td>';
    // Depth/Length (editable)
    h+='<td class="px-1 py-0.5 border-r border-slate-100">'
      +'<input type="text" value="'+_escHtml(depthVal)+'" '
      +'onchange="_symTblEdit(\''+src+'\','+idx+',\'depth\',this.value)" '
      +'class="w-full text-xs font-mono border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white">'
      +'</td>';
    // Height (editable for walls/columns)
    h+='<td class="px-1 py-0.5 border-r border-slate-100">'
      +'<input type="text" value="'+_escHtml(r.type==='pile'?r.h||'':hVal)+'" '
      +'onchange="_symTblEdit(\''+src+'\','+idx+',\'h\',this.value)" '
      +'class="w-full text-xs font-mono border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white">'
      +'</td>';
    // Top mark (editable for piles/wells)
    h+='<td class="px-1 py-0.5 border-r border-slate-100">'
      +'<input type="text" value="'+_escHtml(topVal)+'" '
      +'onchange="_symTblEdit(\''+src+'\','+idx+',\'top\',this.value)" '
      +'class="w-full text-xs font-mono border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white">'
      +'</td>';
    // Note (editable)
    h+='<td class="px-1 py-0.5 border-r border-slate-100">'
      +'<input type="text" value="'+_escHtml(r.note||'')+'" '
      +'onchange="_symTblEdit(\''+src+'\','+idx+',\'note\',this.value)" '
      +'class="w-full text-xs border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white">'
      +'</td>';
    // Delete
    h+='<td class="px-1 py-1 text-right">'
      +'<button onclick="_symTblDel(\''+src+'\','+idx+')" class="text-red-400 hover:text-red-600 text-xs">'
      +'<i class="fa-solid fa-xmark"></i></button>'
      +'</td>';
    h+='</tr>';
  });
  tb.innerHTML=h;
}

function _escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _symTblEdit(src,idx,field,val){
  if(src==='plan'){
    var sym=cadSymbols[idx];if(!sym)return;
    if(field==='label'){sym.label=val;}
    else if(field==='note'){sym.note=val;}
    else if(field==='depth'){
      // For line symbols depth = length (read-only from pts), for point = h
      if(['pile','column','well'].includes(sym.type))sym.props.h=val;
    }
    else if(field==='h'){sym.props.h=val;}
    else if(field==='d'){sym.props.d=val;}
    else if(field==='top'){sym.props.top=val;}
    requestDraw();
  } else {
    var r=symTableRows[idx];if(!r)return;
    if(field==='depth')r.h=val;
    else r[field]=val;
  }
}

function _symTblDel(src,idx){
  if(src==='plan'){
    if(confirm('Удалить объект с плана?')){
      cadSymbols.splice(idx,1);
      requestDraw();
      refreshSymTable();
    }
  } else {
    symTableRows.splice(idx,1);
    refreshSymTable();
  }
}

function addSymbolRow(){
  symTableRows.push({type:'',label:'Новый объект',d:'',h:'',top:'',note:''});
  refreshSymTable();
  // Scroll to bottom
  var tb=document.getElementById('sym-table-panel');
  if(tb)tb.querySelector('.overflow-auto').scrollTop=99999;
}

function _buildSymTableHtml(){
  // Build HTML table for PDF (no edit controls)
  var rows=[];
  cadSymbols.forEach(function(sym,i){
    var st=_ST[sym.type]||{};
    var d=sym.props&&sym.props.d!==undefined?sym.props.d:'';
    var h=sym.props&&sym.props.h!==undefined?sym.props.h:'';
    var top=sym.props&&sym.props.top!==undefined?sym.props.top:'';
    var len=_symLen(sym);
    var isLine=['sewage','water','gas','heat','cable','fence','wall'].includes(sym.type);
    rows.push({
      num:i+1,
      icon:(st.icon||''),
      label:sym.label||(st.label||sym.type),
      d:d,
      depth:isLine?(len?len.toFixed(2)+'м':''):h?h+'м':'',
      height:isLine?(h?h+'м':''):'',
      top:top,
      note:sym.note||''
    });
  });
  symTableRows.forEach(function(r,i){
    rows.push({
      num:cadSymbols.length+i+1,
      icon:'',
      label:r.label||'',
      d:r.d||'',
      depth:r.h||'',
      height:'',
      top:r.top||'',
      note:r.note||''
    });
  });
  if(!rows.length)return '';
  
  var fpt=5.5,thS='font-size:'+fpt+'pt;padding:0.3mm 1mm;background:#1e293b;color:#fff;border:0.3pt solid #334155;text-align:left;',
      tdS='font-size:'+(fpt-0.5)+'pt;padding:0.2mm 0.8mm;border:0.3pt solid #e2e8f0;font-family:monospace;';
  var h2='<div style="font-size:'+(fpt+1)+'pt;font-weight:bold;margin:1.5mm 0 0.5mm;border-bottom:0.3pt solid #94a3b8;padding-bottom:0.3mm;">Ведомость объектов</div>';
  var tbl='<table style="width:100%;border-collapse:collapse;">';
  tbl+='<thead><tr>'
    +'<th style="'+thS+'width:6mm;">№</th>'
    +'<th style="'+thS+'">Наименование</th>'
    +'<th style="'+thS+'width:14mm;">Ø/Ст, м</th>'
    +'<th style="'+thS+'width:16mm;">Глуб/Длина</th>'
    +'<th style="'+thS+'width:14mm;">Высота</th>'
    +'<th style="'+thS+'width:14mm;">Отметка</th>'
    +'<th style="'+thS+'">Примечание</th>'
    +'</tr></thead><tbody>';
  rows.forEach(function(r,i){
    var bg=i%2===0?'':'background:#f8fafc;';
    tbl+='<tr>'
      +'<td style="'+tdS+bg+'">'+r.num+'</td>'
      +'<td style="'+tdS+bg+'">'+r.icon+' '+r.label+'</td>'
      +'<td style="'+tdS+bg+'">'+r.d+'</td>'
      +'<td style="'+tdS+bg+'">'+r.depth+'</td>'
      +'<td style="'+tdS+bg+'">'+r.height+'</td>'
      +'<td style="'+tdS+bg+'">'+r.top+'</td>'
      +'<td style="'+tdS+bg+'">'+r.note+'</td>'
      +'</tr>';
  });
  tbl+='</tbody></table>';
  return h2+tbl;
}

function _drawMaterialFill(cx,mat,baseColor,x,y,w,h){
  var sz=12; // pattern tile size in screen px
  var off=document.createElement('canvas');off.width=sz;off.height=sz;
  var oc=off.getContext('2d');
  oc.clearRect(0,0,sz,sz);
  switch(mat){
    case 'concrete':
      // Grey diagonal hatching — ГОСТ для бетона
      oc.fillStyle='rgba(160,160,160,0.12)';oc.fillRect(0,0,sz,sz);
      oc.strokeStyle='rgba(100,100,120,0.4)';oc.lineWidth=0.7;
      oc.beginPath();oc.moveTo(0,sz);oc.lineTo(sz,0);oc.stroke();
      oc.beginPath();oc.moveTo(-sz/2,sz);oc.lineTo(sz,sz/2);oc.stroke();
      break;
    case 'sand':
      // Yellow dots — ГОСТ для песка
      oc.fillStyle='rgba(240,210,100,0.18)';oc.fillRect(0,0,sz,sz);
      oc.fillStyle='rgba(180,150,50,0.5)';
      [[sz*0.25,sz*0.25],[sz*0.75,sz*0.75],[sz*0.5,sz*0.7],[sz*0.2,sz*0.7]].forEach(function(p){
        oc.beginPath();oc.arc(p[0],p[1],1.2,0,Math.PI*2);oc.fill();
      });
      break;
    case 'gravel':
      // Oval stones — ГОСТ для щебня/гравия
      oc.fillStyle='rgba(180,180,180,0.15)';oc.fillRect(0,0,sz,sz);
      oc.strokeStyle='rgba(100,100,100,0.5)';oc.lineWidth=0.8;
      [[sz*0.3,sz*0.3,2.5,1.5,0.3],[sz*0.7,sz*0.7,2,1.2,-0.2],[sz*0.2,sz*0.7,1.8,1.1,0.5]].forEach(function(p){
        oc.beginPath();oc.ellipse(p[0],p[1],p[2],p[3],p[4],0,Math.PI*2);oc.stroke();
      });
      break;
    case 'clay':
      // Horizontal wavy lines — ГОСТ для глины
      oc.fillStyle='rgba(180,130,80,0.12)';oc.fillRect(0,0,sz,sz);
      oc.strokeStyle='rgba(140,90,40,0.4)';oc.lineWidth=0.7;
      [sz*0.25,sz*0.75].forEach(function(yy){
        oc.beginPath();oc.moveTo(0,yy);
        for(var xi=0;xi<=sz;xi+=sz/4)oc.lineTo(xi,yy+(xi%sz===0?0:1.5*Math.sin(xi/sz*Math.PI*2)));
        oc.stroke();
      });
      break;
    case 'soil':
      // Diagonal + horizontal — ГОСТ для грунта
      oc.fillStyle='rgba(140,100,60,0.12)';oc.fillRect(0,0,sz,sz);
      oc.strokeStyle='rgba(100,70,30,0.4)';oc.lineWidth=0.7;
      oc.beginPath();oc.moveTo(0,sz/2);oc.lineTo(sz,sz/2);oc.stroke();
      oc.beginPath();oc.moveTo(0,sz);oc.lineTo(sz,0);oc.stroke();
      break;
    case 'asphalt':
      // Dense diagonal — ГОСТ для асфальта
      oc.fillStyle='rgba(60,60,70,0.2)';oc.fillRect(0,0,sz,sz);
      oc.strokeStyle='rgba(30,30,40,0.5)';oc.lineWidth=0.7;
      for(var xi=-sz;xi<=sz*2;xi+=4){oc.beginPath();oc.moveTo(xi,0);oc.lineTo(xi+sz,sz);oc.stroke();}
      break;
    case 'brick':
      // Brick rows — ГОСТ для кирпича
      oc.fillStyle='rgba(200,100,80,0.15)';oc.fillRect(0,0,sz,sz);
      oc.strokeStyle='rgba(160,60,40,0.5)';oc.lineWidth=0.7;
      oc.strokeRect(0,0,sz,sz/2);oc.strokeRect(sz/2,sz/2,sz/2,sz/2);oc.strokeRect(0,sz/2,sz/2,sz/2);
      break;
    case 'metal':
      // Cross-hatch — ГОСТ для металла
      oc.fillStyle='rgba(180,190,200,0.12)';oc.fillRect(0,0,sz,sz);
      oc.strokeStyle='rgba(80,100,130,0.45)';oc.lineWidth=0.7;
      oc.beginPath();oc.moveTo(0,sz);oc.lineTo(sz,0);oc.stroke();
      oc.beginPath();oc.moveTo(0,0);oc.lineTo(sz,sz);oc.stroke();
      break;
    default:
      oc.fillStyle=baseColor||'rgba(100,200,100,0.15)';oc.fillRect(0,0,sz,sz);
  }
  var pat=cx.createPattern(off,'repeat');
  cx.fillStyle=pat;
  cx.fillRect(x,y,w,h);
}

function deleteContourFill(i){
  if(confirm('Удалить закрашенную область?')){savedContours.splice(i,1);requestDraw();}
}
