// ── dxf.js ──────────────────────────────────────────

function toggleDxfContoursConfig(){const p=document.getElementById('dxf-contours-panel');if(p.classList.contains('hidden')){p.classList.remove('hidden');p.style.display='flex';}else{p.classList.add('hidden');p.style.display='none';}}

function toggleDxfLayersPanel(){const p=document.getElementById('dxf-layers-panel');if(p.classList.contains('hidden')){p.classList.remove('hidden');p.classList.add('flex');}else{p.classList.add('hidden');p.classList.remove('flex');}}

function rebuildCachedPath(){
if(!dxfElements||!dxfElements.length)return;
cadSnapPoints=[];cadTexts=[];cadPoints=[];
cadMinX=Infinity;cadMinY=Infinity;cadMaxX=-Infinity;cadMaxY=-Infinity;

const ab=(p)=>{
  cadSnapPoints.push(p);
  if(p.x<cadMinX)cadMinX=p.x;if(p.x>cadMaxX)cadMaxX=p.x;
  if(p.y<cadMinY)cadMinY=p.y;if(p.y>cadMaxY)cadMaxY=p.y;
};

// Filter visible elements
const vis=dxfElements.filter(e=>{
  const lv=dxfLayers[e.layer];
  return !lv||(lv===true)||(lv.visible!==false);
});

// PASS 1: collect bounds and snap points
vis.forEach(e=>{
  if(e.type==='POLYLINE'){e.pts.forEach(p=>ab(p));}
  else if(e.type==='CIRCLE'){
    ab(e.c);ab({x:e.c.x+e.r,y:e.c.y});ab({x:e.c.x-e.r,y:e.c.y});
    ab({x:e.c.x,y:e.c.y+e.r});ab({x:e.c.x,y:e.c.y-e.r});
  }else if(e.type==='ARC'){
    ab(e.c);
    ab({x:e.c.x+e.r*Math.cos(e.sa),y:e.c.y+e.r*Math.sin(e.sa)});
    ab({x:e.c.x+e.r*Math.cos(e.ea),y:e.c.y+e.r*Math.sin(e.ea)});
  }else if(e.type==='POINT'){cadPoints.push(e.p);ab(e.p);}
  else if(e.type==='TEXT'){cadTexts.push(e);}
});

if(cadMinX===Infinity){cadMinX=0;cadMinY=0;cadMaxX=0;cadMaxY=0;}

// Calculate origin BEFORE building path
cadOriginX=(cadMinX+cadMaxX)/2;
cadOriginY=(cadMinY+cadMaxY)/2;

// PASS 2: build Path2D with correct origin offset
cachedPath=new Path2D();
vis.forEach(e=>{
  if(e.type==='POLYLINE'){
    let f=true;
    e.pts.forEach(p=>{
      if(f){cachedPath.moveTo(p.x-cadOriginX,p.y-cadOriginY);f=false;}
      else cachedPath.lineTo(p.x-cadOriginX,p.y-cadOriginY);
    });
    if(e.closed)cachedPath.closePath();
  }else if(e.type==='CIRCLE'){
    cachedPath.moveTo((e.c.x-cadOriginX)+e.r,e.c.y-cadOriginY);
    cachedPath.arc(e.c.x-cadOriginX,e.c.y-cadOriginY,e.r,0,Math.PI*2);
  }else if(e.type==='ARC'){
    cachedPath.moveTo(
      (e.c.x-cadOriginX)+e.r*Math.cos(e.sa),
      (e.c.y-cadOriginY)+e.r*Math.sin(e.sa)
    );
    cachedPath.arc(e.c.x-cadOriginX,e.c.y-cadOriginY,e.r,e.sa,e.ea,false);
  }
});

if(secondDxfElements&&secondDxfElements.length>0)_rebuildSnapWithDxf2();
requestDraw();
}

function clearDxfContours(){dxfShowContours=false;dxfCachedContours=[];const b=document.getElementById('btn-build-dxf-contours');if(b){b.textContent='Построить';b.className='w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] md:text-sm font-medium py-1 md:py-1.5 rounded transition shadow-sm mt-1';}document.getElementById('dxf-contour-visible').checked=true;requestDraw();}

function generateDxfContours(){const st=parseFloat(document.getElementById('dxf-contour-step').value);if(isNaN(st)||st<=0){showMessage('Ошибка','Шаг > 0','warning');return;}const p=points.filter(pt=>pt.z!==null&&Number.isFinite(pt.z));if(p.length<3){showMessage('Ошибка','Мин 3 точки с Z','warning');return;}try{const c=[];p.forEach(pt=>c.push(pt.x,pt.y));const d=new Delaunator(c);dxfCachedContours=[];const eps=0.00001,s={};for(let i=0;i<d.triangles.length;i+=3){const i0=d.triangles[i],i1=d.triangles[i+1],i2=d.triangles[i+2],p0={x:p[i0].x,y:p[i0].y,z:p[i0].z+eps},p1={x:p[i1].x,y:p[i1].y,z:p[i1].z+eps*2},p2={x:p[i2].x,y:p[i2].y,z:p[i2].z+eps*3},mz=Math.min(p0.z,p1.z,p2.z),Mz=Math.max(p0.z,p1.z,p2.z),sl=Math.ceil(mz/st)*st;for(let l=sl;l<=Mz;l+=st){let x=[];const e=[[p0,p1],[p1,p2],[p2,p0]];e.forEach(ed=>{const a=ed[0],b=ed[1];if((a.z<l&&b.z>l)||(a.z>l&&b.z<l)){const t=(l-a.z)/(b.z-a.z);x.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}});if(x.length===2){if(!s[l])s[l]=[];s[l].push({p1:x[0],p2:x[1]});}}}const pm=(a,b)=>Math.abs(a.x-b.x)<0.0001&&Math.abs(a.y-b.y)<0.0001;for(const ls in s){const l=parseFloat(ls),seg=s[l],pa=[];let r=[...seg];while(r.length>0){const cp=[];let sg=r.shift();cp.push(sg.p1,sg.p2);let a;do{a=false;for(let i=0;i<r.length;i++){const rs=r[i],h=cp[0],t=cp[cp.length-1];if(pm(t,rs.p1)){cp.push(rs.p2);r.splice(i,1);a=true;break;}else if(pm(t,rs.p2)){cp.push(rs.p1);r.splice(i,1);a=true;break;}else if(pm(h,rs.p1)){cp.unshift(rs.p2);r.splice(i,1);a=true;break;}else if(pm(h,rs.p2)){cp.unshift(rs.p1);r.splice(i,1);a=true;break;}}}while(a);pa.push(cp);}pa.forEach(pt=>dxfCachedContours.push({z:l,points:pt}));}dxfShowContours=true;document.getElementById('dxf-contour-visible').checked=true;const btn=document.getElementById('btn-build-dxf-contours');btn.textContent='Обновить';btn.className='w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] md:text-sm font-medium py-1 md:py-1.5 rounded transition shadow-sm mt-1';requestDraw();}catch(e){showMessage('Ошибка','Сбой триангуляции','error');}}

function processCADData(){dxfElements=[];dxfLayers={};if(!dxfData||!dxfData.entities)return;function tr(e,tf,d){if(d>15||!e)return;for(let i=0;i<e.length;i++){let en=e[i];if(!en)continue;const ln=en.layer||'0';dxfLayers[ln]=true;if(en.type==='INSERT'&&dxfData.blocks&&dxfData.blocks[en.name]){let bl=dxfData.blocks[en.name];const bx=en.position?(en.position.x||0):0,by=en.position?(en.position.y||0):0,bz=en.position&&en.position.z!==undefined?en.position.z:null;let nx=bx*tf.sx,ny=by*tf.sy;if(tf.rot!==0){const r=tf.rot*Math.PI/180,c=Math.cos(r),s=Math.sin(r),tx=nx*c-ny*s,ty=nx*s+ny*c;nx=tx;ny=ty;}dxfElements.push({type:'POINT',p:{x:nx+tf.x,y:ny+tf.y,z:bz},layer:ln});tr(bl.entities,{x:nx+tf.x,y:ny+tf.y,sx:tf.sx*(en.scale?(en.scale.x||1):1),sy:tf.sy*(en.scale?(en.scale.y||1):1),rot:tf.rot+(en.rotation||0)},d+1);}else{const wp=(p)=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;let nx=p.x*tf.sx,ny=p.y*tf.sy;if(tf.rot!==0){const r=tf.rot*Math.PI/180,c=Math.cos(r),s=Math.sin(r),tx=nx*c-ny*s,ty=nx*s+ny*c;nx=tx;ny=ty;}return{x:nx+tf.x,y:ny+tf.y,z:p.z!==undefined?p.z:null};};try{if(en.type==='LINE'&&en.vertices&&en.vertices.length>=2){let p1=wp(en.vertices[0]),p2=wp(en.vertices[1]);if(p1&&p2)dxfElements.push({type:'POLYLINE',pts:[p1,p2],closed:false,layer:ln});}else if((en.type==='LWPOLYLINE'||en.type==='POLYLINE'||en.type==='SPLINE')&&en.vertices){let pts=[];en.vertices.forEach(v=>{let p=wp(v);if(p)pts.push(p);});if(pts.length>0)dxfElements.push({type:'POLYLINE',pts,closed:!!en.closed,layer:ln});}else if(en.type==='SPLINE'&&en.controlPoints){let pts=[];en.controlPoints.forEach(v=>{let p=wp(v);if(p)pts.push(p);});if(pts.length>0)dxfElements.push({type:'POLYLINE',pts,closed:!!en.closed,layer:ln});}else if(en.type==='CIRCLE'&&en.center&&Number.isFinite(en.radius)){let c=wp(en.center),r=en.radius*Math.abs(tf.sx);if(c&&Number.isFinite(r))dxfElements.push({type:'CIRCLE',c,r:Math.abs(r),layer:ln});}else if(en.type==='ARC'&&en.center&&Number.isFinite(en.radius)){let c=wp(en.center),r=en.radius*Math.abs(tf.sx);if(c&&Number.isFinite(r)&&Number.isFinite(en.startAngle)&&Number.isFinite(en.endAngle))dxfElements.push({type:'ARC',c,r:Math.abs(r),sa:en.startAngle+(tf.rot*Math.PI/180),ea:en.endAngle+(tf.rot*Math.PI/180),layer:ln});}else if(en.type==='POINT'&&en.position){let p=wp(en.position);if(p)dxfElements.push({type:'POINT',p,layer:ln});}else if(en.type==='TEXT'||en.type==='MTEXT'){if(en.startPoint&&en.text){let p=wp(en.startPoint);if(p)dxfElements.push({type:'TEXT',text:en.text,x:p.x,y:p.y,h:(en.textHeight||1)*Math.abs(tf.sy),rot:(en.rotation||0)*Math.PI/180+(tf.rot*Math.PI/180),layer:ln});}}}catch(err){}}}}tr(dxfData.entities,{x:0,y:0,sx:1,sy:1,rot:0},0);buildDxfLayersPanel();rebuildCachedPath();_autoImportDxfZ();}

function processSecondDxfData(dxf, transform, mirrorX, mirrorY){
  var elements=[];
  function traverse(entities,tf,depth){
    if(depth>15||!entities)return;
    for(var i=0;i<entities.length;i++){
      var en=entities[i]; if(!en)continue;
      if(en.type==='INSERT'&&dxf.blocks&&dxf.blocks[en.name]){
        var block=dxf.blocks[en.name];
        var bx=en.position?(en.position.x||0):0, by=en.position?(en.position.y||0):0;
        var bz=en.position&&en.position.z!==undefined?en.position.z:null;
        var nx=bx*tf.sx, ny=by*tf.sy;
        if(tf.rot!==0){var r2=tf.rot*Math.PI/180,c2=Math.cos(r2),s2=Math.sin(r2),tx2=nx*c2-ny*s2,ty2=nx*s2+ny*c2;nx=tx2;ny=ty2;}
        traverse(block.entities,{x:nx+tf.x,y:ny+tf.y,sx:tf.sx*(en.scale?(en.scale.x||1):1),sy:tf.sy*(en.scale?(en.scale.y||1):1),rot:tf.rot+(en.rotation||0)},depth+1);
      } else {
        var wp=function(p){
          if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;
          var nx=p.x*tf.sx, ny=p.y*tf.sy;
          if(tf.rot!==0){var r2=tf.rot*Math.PI/180,c2=Math.cos(r2),s2=Math.sin(r2),tx2=nx*c2-ny*s2,ty2=nx*s2+ny*c2;nx=tx2;ny=ty2;}
          return {x:nx+tf.x, y:ny+tf.y, z:p.z!==undefined?p.z:null};
        };
        try{
          var e2=null;
          if(en.type==='LINE'&&en.vertices&&en.vertices.length>=2){
            var pp1=wp(en.vertices[0]),pp2=wp(en.vertices[1]);
            if(pp1&&pp2)e2={type:'POLYLINE',pts:[pp1,pp2],closed:false};
          } else if((en.type==='LWPOLYLINE'||en.type==='POLYLINE'||en.type==='SPLINE')&&en.vertices){
            var pts=[];en.vertices.forEach(function(v){var pp=wp(v);if(pp)pts.push(pp);});
            if(pts.length>0)e2={type:'POLYLINE',pts:pts,closed:!!en.closed};
          } else if(en.type==='SPLINE'&&en.controlPoints){
            var pts=[];en.controlPoints.forEach(function(v){var pp=wp(v);if(pp)pts.push(pp);});
            if(pts.length>0)e2={type:'POLYLINE',pts:pts,closed:!!en.closed};
          } else if(en.type==='CIRCLE'&&en.center&&Number.isFinite(en.radius)){
            var cc=wp(en.center),rr=en.radius*Math.abs(tf.sx);
            if(cc&&Number.isFinite(rr))e2={type:'CIRCLE',c:cc,r:Math.abs(rr)};
          } else if(en.type==='ARC'&&en.center&&Number.isFinite(en.radius)){
            var cc=wp(en.center),rr=en.radius*Math.abs(tf.sx);
            if(cc&&Number.isFinite(rr)&&Number.isFinite(en.startAngle)&&Number.isFinite(en.endAngle))
              e2={type:'ARC',c:cc,r:Math.abs(rr),sa:en.startAngle+(tf.rot*Math.PI/180),ea:en.endAngle+(tf.rot*Math.PI/180)};
          } else if(en.type==='POINT'&&en.position){
            var pp=wp(en.position);if(pp)e2={type:'POINT',p:pp};
          } else if((en.type==='TEXT'||en.type==='MTEXT')&&en.text&&en.position){
            var pt=wp(en.position);
            if(pt){
              var _tp=mirrorX?{x:pt.x,y:-pt.y,z:pt.z}:pt;
              _tp=mirrorY?{x:-_tp.x,y:_tp.y,z:_tp.z}:_tp;
              elements.push({type:'TEXT',p:transformPointGeoref(_tp,transform),text:en.text.replace(/\\[^;]+;/g,'').trim(),h:(en.textHeight||0.3)*Math.abs(tf.sx)*transform.s});
            }
          }
          if(e2){
            // Apply Helmert transform to the already-world-transformed point
            if(e2.type==='POLYLINE'){
              e2.pts=e2.pts.map(function(p){var mx=mirrorX?{x:p.x,y:-p.y,z:p.z}:p;var my=mirrorY?{x:-mx.x,y:mx.y,z:mx.z}:mx;return transformPointGeoref(my,transform);});
            } else if(e2.type==='CIRCLE'){
              e2.c=transformPointGeoref(mirrorY?{x:-e2.c.x,y:e2.c.y,z:e2.c.z}:mirrorX?{x:e2.c.x,y:-e2.c.y,z:e2.c.z}:e2.c,transform);
              e2.r=e2.r*transform.s;
            } else if(e2.type==='ARC'){
              e2.c=transformPointGeoref(mirrorY?{x:-e2.c.x,y:e2.c.y,z:e2.c.z}:mirrorX?{x:e2.c.x,y:-e2.c.y,z:e2.c.z}:e2.c,transform);
              e2.r=e2.r*transform.s;
            } else if(e2.type==='POINT'){
              var _mp=mirrorX?{x:e2.p.x,y:-e2.p.y,z:e2.p.z}:e2.p;
              _mp=mirrorY?{x:-_mp.x,y:_mp.y,z:_mp.z}:_mp;
              e2.p=transformPointGeoref(_mp,transform);
            }
            elements.push(e2);
          }
        }catch(err){}
      }
    }
  }
  traverse(dxf.entities,{x:0,y:0,sx:1,sy:1,rot:0},0);
  return elements;
}

function loadSecondDxfFile(input){
  var file=input.files[0];
  if(!file)return;
  document.getElementById('gr-file-name').textContent=file.name;
  input._pendingFile=file;
  input.value='';
}

function clearSecondDxf(){
  secondDxfElements=[];secondDxfVisible=false;
  var b=document.getElementById('gr-clear-btn');if(b)b.classList.add('hidden');
  var c=document.getElementById('lyr-dxf2-controls');if(c)c.classList.add('hidden');
  var e=document.getElementById('lyr-dxf2-empty');if(e)e.classList.remove('hidden');
  requestDraw();showMessage('Удалено','Вложенный DXF убран.','info');
}

function _rebuildSnapWithDxf2(){
  if(!secondDxfElements||!secondDxfElements.length)return;
  // Add POINT entities
  secondDxfElements.forEach(function(el){
    if(el.type!=='POINT'||!el.p)return;
    if(!cadSnapPoints.some(function(s){return Math.abs(s.x-el.p.x)<0.001&&Math.abs(s.y-el.p.y)<0.001;}))
      cadSnapPoints.push({x:el.p.x,y:el.p.y,z:el.p.z||null});
  });
  // Add polyline vertices
  secondDxfElements.forEach(function(el){
    if(el.type!=='POLYLINE'||!el.pts)return;
    el.pts.forEach(function(p){
      if(!cadSnapPoints.some(function(s){return Math.abs(s.x-p.x)<0.001&&Math.abs(s.y-p.y)<0.001;}))
        cadSnapPoints.push({x:p.x,y:p.y,z:p.z||null});
    });
  });
}
