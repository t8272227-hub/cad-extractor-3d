// ── north.js ──────────────────────────────────────────

function _northInit(){_northDraw();}

function _northApply(){
  northAngle=parseFloat(document.getElementById('nw-deg').value)||0;
  var r=document.getElementById('nw-range');if(r)r.value=northAngle;
  _northDraw();requestDraw();
}

function _northDraw(){
  var ang=northAngle,r=ang*Math.PI/180,sA=Math.sin(r),cA=Math.cos(r);
  var tks=[0,90,180,270].map(function(a){
    var ra=(a+ang)*Math.PI/180,s=Math.sin(ra),c=Math.cos(ra);
    return '<line x1="'+(s*27).toFixed(1)+'" y1="'+(-c*27).toFixed(1)+'" x2="'+(s*31).toFixed(1)+'" y2="'+(-c*31).toFixed(1)+'" stroke="#cbd5e1" stroke-width="1"/>';
  }).join('');
  var svg='<svg width="64" height="64" viewBox="-32 -32 64 64" xmlns="http://www.w3.org/2000/svg">'
    +'<circle r="30" fill="rgba(255,255,255,.95)" stroke="#94a3b8" stroke-width="1.2"/>'+tks
    +'<g transform="rotate('+ang+')">'
      +'<polygon points="0,-22 6,2 0,4 -6,2" fill="#1e293b"/>'
      +'<polygon points="0,22 6,-2 0,-4 -6,-2" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5"/>'
    +'</g><circle r="2.5" fill="#475569"/>'
    +'<text x="'+(sA*24).toFixed(1)+'" y="'+(-cA*24).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="bold" fill="#1e293b" font-family="Arial">\u0421</text>'
    +'</svg>';
  var el=document.getElementById('nw-svg');if(el)el.innerHTML=svg;
}

function _northFindSnap(cx,cy){
  var cad=screenToCad(cx,cy);
  if(!cadSnapPoints||!cadSnapPoints.length)return{x:cad.x,y:cad.y,sx:cx,sy:cy};
  var th=15/scale,best=null,bd=Infinity;
  cadSnapPoints.forEach(function(p){var d=Math.hypot(p.x-cad.x,p.y-cad.y);if(d<th&&d<bd){bd=d;best=p;}});
  if(best){var scr=cadToScreen(best.x,best.y);return{x:best.x,y:best.y,sx:scr.x,sy:scr.y};}
  return{x:cad.x,y:cad.y,sx:cx,sy:cy};
}

function _northStartPick(){
  northPickMode=true;northPickP1=null;northPickHover=null;
  document.getElementById('nw-overlay').style.display='block';
  document.getElementById('nw-hint').style.display='block';
  document.getElementById('nw-hint').textContent='Клик 1/2: ЮЖНЫЙ конец линии (привязка к узлам \u25cb)';
  document.getElementById('nw-pick-btn').style.display='none';
}

function _northCancelPick(){
  northPickMode=false;northPickP1=null;northPickHover=null;
  document.getElementById('nw-overlay').style.display='none';
  document.getElementById('nw-snap').style.display='none';
  document.getElementById('nw-p1').style.display='none';
  document.getElementById('nw-hint').style.display='none';
  document.getElementById('nw-pick-btn').style.display='block';
  requestDraw();
}

function _northPickMove(e){
  var snap=_northFindSnap(e.clientX,e.clientY);
  northPickHover={x:snap.x,y:snap.y};requestDraw();
  var dot=document.getElementById('nw-snap');
  dot.style.display='block';dot.style.left=snap.sx+'px';dot.style.top=snap.sy+'px';
}

function _northPickClick(e){
  var snap=_northFindSnap(e.clientX,e.clientY);
  if(!northPickP1){
    northPickP1={x:snap.x,y:snap.y};
    var d=document.getElementById('nw-p1');d.style.display='block';d.style.left=snap.sx+'px';d.style.top=snap.sy+'px';
    document.getElementById('nw-hint').textContent='Клик 2/2: СЕВЕРНЫЙ конец (P1: '+snap.x.toFixed(2)+', '+snap.y.toFixed(2)+')';
  } else {
    var dx=snap.x-northPickP1.x,dy=snap.y-northPickP1.y;
    if(Math.hypot(dx,dy)<0.001){_northCancelPick();return;}
    var b=((Math.atan2(dx,dy)*180/Math.PI)%360+360)%360;
    northAngle=Math.round(b*10)/10;
    document.getElementById('nw-deg').value=northAngle;
    _northApply();_northCancelPick();
    var h=document.getElementById('nw-hint');
    h.style.display='block';h.textContent='\u2713 Az='+northAngle.toFixed(1)+'\u00b0 — холст повёрнут';
    setTimeout(function(){h.style.display='none';},3000);
  }
}

function _northDrawPDF(ctx,W,H,PR){
  if(northAngle===0&&!showGrid)return;
  var ang=northAngle*Math.PI/180,SZ=28*PR,MG=12*PR;
  var ox=W-SZ-MG,oy=H-SZ-MG-13*PR;
  ctx.save();
  ctx.beginPath();ctx.arc(ox,oy,SZ,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.93)';ctx.fill();ctx.strokeStyle='#94a3b8';ctx.lineWidth=0.8*PR;ctx.stroke();
  ctx.save();ctx.translate(ox,oy);ctx.rotate(ang);
  ctx.beginPath();ctx.moveTo(0,-SZ*.72);ctx.lineTo(SZ*.18,SZ*.07);ctx.lineTo(0,SZ*.11);ctx.lineTo(-SZ*.18,SZ*.07);ctx.closePath();ctx.fillStyle='#1e293b';ctx.fill();
  ctx.beginPath();ctx.moveTo(0,SZ*.72);ctx.lineTo(SZ*.18,-SZ*.07);ctx.lineTo(0,-SZ*.11);ctx.lineTo(-SZ*.18,-SZ*.07);ctx.closePath();ctx.fillStyle='#e2e8f0';ctx.fill();
  ctx.restore();
  ctx.font='bold '+(9*PR)+'px Arial';ctx.fillStyle='#1e293b';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('\u0421',ox+Math.sin(ang)*SZ*.8,oy-Math.cos(ang)*SZ*.8);
  ctx.font=(7.5*PR)+'px Arial';ctx.fillStyle='#475569';ctx.textBaseline='top';
  ctx.fillText('Az\u00a0'+northAngle.toFixed(1)+'\u00b0',ox,oy+SZ+2*PR);
  ctx.restore();
}
