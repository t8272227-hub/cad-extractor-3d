// ── contour.js ──────────────────────────────────────────

function startContour(){
  contourPts=[];contourActive=true;contourClosed=false;contourMousePos=null;
  _savedArea=0;_savedPerimeter=0;_savedVolume=0;
  var p=document.getElementById('contour-panel');if(p)p.classList.remove('hidden');
  updateContourPanel();requestDraw();
}

function undoContourPt(){if(contourPts.length>0){contourPts.pop();contourClosed=false;updateContourPanel();requestDraw();}}

function closeContour(){
  if(contourPts.length<3){showMessage('Контур','Нужно минимум 3 точки','warning');return;}
  contourClosed=true;contourActive=false;
  // Calculate area, perimeter, well deduction
  _savedArea=_shoelaceArea(contourPts);
  _savedPerimeter=_perimeterCalc(contourPts);
  // Subtract manhole areas that fall inside contour
  var wellsInside=[];
  cadSymbols.forEach(function(sym){
    if((sym.type==='well'||sym.type==='column')&&sym.pts&&sym.pts.length>0){
      var d=parseFloat(sym.props.d||1.0);
      if(d>0&&_ptInContour(sym.pts[0].x,sym.pts[0].y,contourPts)){
        var isSquare=(sym.props.shape==='square');
        var warea=isSquare?(d*d):Math.PI*(d/2)*(d/2);
        _savedArea=Math.max(0,_savedArea-warea);
        wellsInside.push({label:sym.label||sym.type,d:d,area:warea});
      }
    }
  });
  // Add pile concrete volume
  var pileVol=0;
  cadSymbols.forEach(function(sym){
    if(sym.type==='pile'&&sym.pts&&sym.pts.length>0){
      var pd=parseFloat(sym.props.d||0.3),ph=parseFloat(sym.props.h||3.0);
      if(_ptInContour(sym.pts[0].x,sym.pts[0].y,contourPts)){
        pileVol+=Math.PI*(pd/2)*(pd/2)*ph;
      }
    }
  });
  _savedPileVolume=pileVol;
  _savedWellsInside=wellsInside;
  updateContourPanel();requestDraw();
}

function clearContour(){
  contourPts=[];contourActive=false;contourClosed=false;contourMousePos=null;
  _savedArea=0;_savedPerimeter=0;_savedVolume=0;_savedPileVolume=0;_savedWellsInside=[];
  var p=document.getElementById('contour-panel');if(p)p.classList.add('hidden');
  requestDraw();
}

function updateContourPanel(){
  var el=document.getElementById('ctr-pt-count');if(el)el.textContent=contourPts.length;
  var ea=document.getElementById('ctr-area');
  if(ea)ea.textContent=contourClosed?_savedArea.toFixed(3)+' м²':'— (не замкнут)';
  var ep=document.getElementById('ctr-perim');
  if(ep)ep.textContent=contourClosed?_savedPerimeter.toFixed(3)+' м':'—';
  var ew=document.getElementById('ctr-wells');
  if(ew)ew.textContent=(_savedWellsInside&&_savedWellsInside.length>0)?
    _savedWellsInside.map(function(w){return w.label+' Ø'+w.d+'м (-'+w.area.toFixed(2)+'м²)';}).join(', '):'нет';
  updateContourVol();
}

function updateContourVol(){
  var h=parseFloat(document.getElementById('ctr-height').value)||0;
  var vol=_savedArea*Math.abs(h);_savedVolume=vol;
  var pv=_savedPileVolume||0;
  var el=document.getElementById('ctr-vol');if(el)el.textContent=_savedArea>0?vol.toFixed(3)+' м³':'—';
  var ep=document.getElementById('ctr-pile-vol');if(ep)ep.textContent=pv>0?pv.toFixed(3)+' м³':'—';
  var et=document.getElementById('ctr-total-vol');if(et)et.textContent=_savedArea>0?(vol+pv).toFixed(3)+' м³':'—';
}

function saveContourToReport(){
  var h=parseFloat(document.getElementById('ctr-height').value)||0;
  _savedVolume=_savedArea*Math.abs(h);
  showMessage('Записано в отчёт',
    'Площадь: '+_savedArea.toFixed(3)+' м²\n'+
    'Периметр: '+_savedPerimeter.toFixed(3)+' м\n'+
    'Объём грунта: '+_savedVolume.toFixed(3)+' м³\n'+
    'Объём бетона (сваи): '+(_savedPileVolume||0).toFixed(3)+' м³\n'+
    'Итого: '+((_savedVolume||0)+(_savedPileVolume||0)).toFixed(3)+' м³','success');
}

function saveContourAsFill(){
  if(!contourClosed||contourPts.length<3){
    showMessage('Контур','Сначала замкните контур','warning');return;
  }
  var mat=document.getElementById('ctr-material')?document.getElementById('ctr-material').value:'concrete';
  var col=document.getElementById('ctr-fill-color')?document.getElementById('ctr-fill-color').value:'#334155';
  savedContours.push({
    pts:contourPts.slice(),
    material:mat,
    lineColor:col,
    area:_savedArea,
    perimeter:_savedPerimeter,
    volume:_savedVolume,
    pileVol:_savedPileVolume||0,
    wellsInside:(_savedWellsInside||[]).slice(),
    height:parseFloat(document.getElementById('ctr-height').value)||0
  });
  showMessage('Закрашено','Область сохранена с материалом. Контур очищен.','success');
  clearContour();
}

function _updateQuickBar(){
  var qClose=document.getElementById('qb-close-ctr');
  var qCancel=document.getElementById('qb-cancel-ctr');
  var qContour=document.getElementById('qb-contour');
  if(qClose) qClose.style.display=contourActive?'flex':'none';
  if(qCancel) qCancel.style.display=contourActive?'flex':'none';
  if(qContour) qContour.style.display=contourActive?'none':'flex';
}
