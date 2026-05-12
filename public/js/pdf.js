// ── pdf.js ──────────────────────────────────────────

function openPdfSettings(mode){currentPdfMode=mode;var m=document.getElementById('pdf-modal'),c=document.getElementById('pdf-modal-content');m.classList.remove('hidden');setTimeout(function(){m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}

function closePdfSettings(){var m=document.getElementById('pdf-modal'),c=document.getElementById('pdf-modal-content');m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(function(){m.classList.add('hidden');},300);}

function executeExportPDF(){
  function _g(id){var el=document.getElementById(id);return el?(el.value||'').trim():'';}
  var pdfMeta={
    org:_g('pdf-org'),
    project:_g('pdf-project-name')||'Без названия',
    drawing:_g('pdf-drawing-name')||'Исполнительная схема',
    developer:_g('pdf-developer'),
    geodesist:_g('pdf-geodesist'),
    checker:_g('pdf-checker'),
    scale:_g('pdf-scale'),
    date:new Date().toLocaleDateString('ru-RU')
  };
  var li=document.getElementById('pdf-logo-input');
  if(li.files&&li.files[0]){
    var reader=new FileReader();
    reader.onload=function(ev){pdfLogoDataUrl=ev.target.result;doExportPDF(pdfMeta);};
    reader.readAsDataURL(li.files[0]);
  } else doExportPDF(pdfMeta);
}

function doExportPDF(pdfMeta){var btn=document.getElementById('pdf-modal-generate-btn');if(btn){btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Генерация...';btn.disabled=true;}closePdfSettings();setTimeout(function(){try{if(currentPdfMode==='dxf'){isExportingPDF=true;_buildAndSavePDF(pdfMeta,'cad-canvas',points,dimensions,[]);}else{manIsExportingPDF=true;_buildAndSavePDF(pdfMeta,'manual-canvas',manualPoints,[],manualLines);}}catch(err){showMessage('Ошибка','PDF: '+err.message,'error');isExportingPDF=false;manIsExportingPDF=false;if(isDxf){draw();}else{drawManualCanvas();}var b=document.getElementById('pdf-modal-generate-btn');if(b){b.innerHTML='<i class="fa-solid fa-download"></i> Сгенерировать';b.disabled=false;}}},120);}

function _buildAndSavePDF(meta,canvasId,pts,dims,lines){
var isDxf=canvasId==='cad-canvas';

// STEP 1: BBox — use pdfFrame if drawn, else marked data
var mnX,mnY,mxX,mxY;
if(pdfFrame&&Number.isFinite(pdfFrame.x1)){
  mnX=Math.min(pdfFrame.x1,pdfFrame.x2);mnY=Math.min(pdfFrame.y1,pdfFrame.y2);
  mxX=Math.max(pdfFrame.x1,pdfFrame.x2);mxY=Math.max(pdfFrame.y1,pdfFrame.y2);
} else {
  mnX=Infinity;mnY=Infinity;mxX=-Infinity;mxY=-Infinity;
  function _bb(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return;mnX=Math.min(mnX,x);mnY=Math.min(mnY,y);mxX=Math.max(mxX,x);mxY=Math.max(mxY,y);}
  pts.forEach(function(p){_bb(p.x,p.y);});
  dims.forEach(function(d){if(d.p1){_bb(d.p1.x,d.p1.y);}if(d.p2){_bb(d.p2.x,d.p2.y);}});
  lines.forEach(function(l){if(l.p1){_bb(l.p1.x,l.p1.y);}if(l.p2){_bb(l.p2.x,l.p2.y);}});
  if(!isFinite(mnX)){mnX=cadMinX||0;mnY=cadMinY||0;mxX=cadMaxX||100;mxY=cadMaxY||100;}
}
var dataW=mxX-mnX||10,dataH=mxY-mnY||10;
var pad=Math.max(dataW,dataH)*0.08;
mnX-=pad;mnY-=pad;mxX+=pad;mxY+=pad;dataW=mxX-mnX;dataH=mxY-mnY;

// STEP 2: Render to high-res offscreen canvas
// A4 landscape: 297x210mm. Drawing area = left ~200mm, stamp = right ~90mm
// At 300dpi: drawing = 2362x2480px, stamp = 1063x2480px → total ~3425x2480
// Use simpler: draw canvas 2800x2480, stamp built in HTML
var PW=2800,PH=2480,PAD=80;
var scX=(PW-PAD*2)/dataW,scY=(PH-PAD*2)/dataH;
var pdfScale=Math.min(scX,scY);
var pdfPanX=PAD+(PW-PAD*2-(dataW*pdfScale))/2-(mnX-cadOriginX)*pdfScale;
var pdfPanY=PH-PAD-(PH-PAD*2-(dataH*pdfScale))/2+(mnY-cadOriginY)*pdfScale;

var svPX=panX,svPY=panY,svSc=scale,svNA=northAngle;
panX=pdfPanX;panY=pdfPanY;scale=pdfScale;northAngle=0;
var cv=document.getElementById(canvasId);
var svW=cv.width,svH=cv.height;
cv.width=PW;cv.height=PH;
if(isDxf){isExportingPDF=true;draw();}else{manIsExportingPDF=true;drawManualCanvas();}
_northDrawPDF(cv.getContext('2d'),PW,PH,1);
var imgData=cv.toDataURL('image/png');
cv.width=svW;cv.height=svH;
panX=svPX;panY=svPY;scale=svSc;northAngle=svNA;
if(isDxf){isExportingPDF=false;draw();}else{manIsExportingPDF=false;drawManualCanvas();}

// STEP 3: Build tables HTML
// Auto font size: fit all rows in ~150mm height
var totalRows=pts.length+dims.length+lines.length+(_savedArea>0?3:0);
// Use 2-column layout when many rows (>20)
var _twoCol=totalRows>20;
var fontPt=Math.min(5.5,Math.max(3.5,Math.floor(380/(Math.max(totalRows/_twoCol?2:1,1)*2.0))));
var thFontPt=Math.min(6.0,fontPt+0.5);
var cp='0.2mm 0.8mm';

function _th(txt){return '<th style="font-size:'+thFontPt+'pt;padding:'+cp+';background:#1e293b;color:#fff;border:0.3pt solid #334155;text-align:left;white-space:nowrap;">'+txt+'</th>';}
function _td(txt,bg){return '<td style="font-size:'+fontPt+'pt;padding:'+cp+';border:0.3pt solid #e2e8f0;font-family:monospace;white-space:nowrap;'+(bg?'background:#f8fafc;':'')+'">'+txt+'</td>';}
function _h2(txt){return '<div style="font-size:'+(fontPt+1)+'pt;font-weight:bold;margin:1.5mm 0 0.5mm;border-bottom:0.3pt solid #94a3b8;padding-bottom:0.3mm;color:#1e293b;">'+txt+'</div>';}
function _tbl(hdrs,rows){
  var h='<table style="width:100%;border-collapse:collapse;"><thead><tr>'+hdrs.map(function(t){return _th(t);}).join('')+'</tr></thead><tbody>';
  rows.forEach(function(r,i){h+='<tr>'+r.map(function(c){return _td(c,i%2===0);}).join('')+'</tr>';});
  return h+'</tbody></table>';
}
var tables='';
if(pts.length>0){
  tables+=_h2('Координаты точек');
  if(_twoCol&&pts.length>12){
    var _half=Math.ceil(pts.length/2);
    var _pA=pts.slice(0,_half),_pB=pts.slice(_half);
    var _cell='font-size:'+fontPt+'pt;padding:'+cp+';border:0.3pt solid #e2e8f0;font-family:monospace;';
    var _hcell='font-size:'+thFontPt+'pt;padding:'+cp+';background:#1e293b;color:#fff;border:0.3pt solid #334155;';
    tables+='<table style="width:100%;border-collapse:collapse;">';
    tables+='<thead><tr>';
    tables+='<th style="'+_hcell+'">№</th><th style="'+_hcell+'">X</th><th style="'+_hcell+'">Y</th><th style="'+_hcell+'">Z</th>';
    tables+='<th style="'+_hcell+'width:2mm;"> </th>';
    tables+='<th style="'+_hcell+'">№</th><th style="'+_hcell+'">X</th><th style="'+_hcell+'">Y</th><th style="'+_hcell+'">Z</th>';
    tables+='</tr></thead><tbody>';
    for(var _ri=0;_ri<_pA.length;_ri++){
      var _pa=_pA[_ri],_pb=_pB[_ri];
      var _bg=_ri%2===0?'':'background:#f8fafc;';
      tables+='<tr>';
      tables+='<td style="'+_cell+_bg+'">P'+_pa.id+'</td>';
      tables+='<td style="'+_cell+_bg+'">'+_pa.x.toFixed(3)+'</td>';
      tables+='<td style="'+_cell+_bg+'">'+_pa.y.toFixed(3)+'</td>';
      tables+='<td style="'+_cell+_bg+'">'+(_pa.z!==null&&_pa.z!==undefined?_pa.z.toFixed(3):'-')+'</td>';
      tables+='<td style="'+_cell+'border:none;"> </td>';
      if(_pb){
        tables+='<td style="'+_cell+_bg+'">P'+_pb.id+'</td>';
        tables+='<td style="'+_cell+_bg+'">'+_pb.x.toFixed(3)+'</td>';
        tables+='<td style="'+_cell+_bg+'">'+_pb.y.toFixed(3)+'</td>';
        tables+='<td style="'+_cell+_bg+'">'+(_pb.z!==null&&_pb.z!==undefined?_pb.z.toFixed(3):'-')+'</td>';
      }else{
        tables+='<td colspan="4"></td>';
      }
      tables+='</tr>';
    }
    tables+='</tbody></table>';
  } else {
    tables+=_tbl(['№','X, м','Y, м','Z, м'],pts.map(function(p){
      return['P'+p.id,p.x.toFixed(3),p.y.toFixed(3),(p.z!==null&&p.z!==undefined?p.z.toFixed(3):'-')];
    }));
  }
}
if(dims.length>0){
  tables+=_h2('Размеры');
  tables+=_tbl(['Линия','Длина, м'],dims.map(function(d){return[d.label,d.distance.toFixed(3)];}));
}
if(lines.length>0){
  tables+=_h2('Линии');
  tables+=_tbl(['Отрезок','Длина, м'],lines.map(function(l){
    return['P'+l.p1.id+'-P'+l.p2.id,Math.hypot(l.p2.x-l.p1.x,l.p2.y-l.p1.y).toFixed(3)];
  }));
}
if(_savedArea>0||(_savedPileVolume>0)){
  tables+=_h2('Площадь и объём');
  var _atbl=[['Площадь',_savedArea.toFixed(3)+' м²'],['Периметр',_savedPerimeter.toFixed(3)+' м']];
  if(_savedWellsInside&&_savedWellsInside.length)_atbl.push(['Вычтено (колодцы)',_savedWellsInside.length+' шт.']);
  _atbl.push(['Объём грунта',_savedVolume.toFixed(3)+' м³']);
  if(_savedPileVolume>0){_atbl.push(['Объём бетона (сваи)',_savedPileVolume.toFixed(3)+' м³']);
    _atbl.push(['Итого',(_savedVolume+_savedPileVolume).toFixed(3)+' м³']);}
  tables+=_tbl(['Параметр','Значение'],_atbl);
}
// Symbol table
var _symTblPdf=_buildSymTableHtml();if(_symTblPdf)tables+=_symTblPdf;
// Saved filled contours
if(savedContours.length>0){
  var _mats2={concrete:'Бетон',sand:'Песок',gravel:'Щебень',clay:'Глина',
    soil:'Грунт',asphalt:'Асфальт',brick:'Кирпич',metal:'Металл'};
  var _fpt2=fontPt;
  tables+=_h2('Ведомость площадей с материалом');
  tables+=_tbl(['Материал','Площадь, м²','Периметр, м','Глубина, м','Объём грунта, м³','Объём бетона (сваи), м³','Итого, м³'],
    savedContours.map(function(sc){
      var tot=(sc.volume||0)+(sc.pileVol||0);
      return[_mats2[sc.material]||sc.material||'—',
        sc.area?sc.area.toFixed(3):'—',
        sc.perimeter?sc.perimeter.toFixed(3):'—',
        sc.height?Math.abs(sc.height).toFixed(2):'—',
        sc.volume?sc.volume.toFixed(3):'—',
        sc.pileVol?sc.pileVol.toFixed(3):'—',
        tot?tot.toFixed(3):'—'];
    }));
}


// STEP 4: Title block (GOST-style)
var logoHtml=pdfLogoDataUrl?('<img src="'+pdfLogoDataUrl+'" style="max-height:10mm;max-width:40mm;display:block;margin-bottom:1mm;">'):
  '<div style="height:10mm;background:#f1f5f9;border-radius:2mm;margin-bottom:1mm;display:flex;align-items:center;justify-content:center;font-size:5pt;color:#94a3b8;">Логотип</div>';
var dt=meta.date||new Date().toLocaleDateString('ru-RU');
var titleBlock=(
  '<table style="width:100%;border-collapse:collapse;font-size:6pt;margin-top:2mm;">'
  // Header row: logo + org
  +'<tr><td colspan="3" style="padding:1mm;border:0.5pt solid #334155;vertical-align:top;">'
  +logoHtml
  +'<div style="font-weight:bold;font-size:7pt;line-height:1.3;">'+(meta.org||'')+'</div>'
  +'<div style="font-size:5.5pt;color:#475569;margin-top:0.5mm;">'+(meta.project||'')+'</div>'
  +'</td></tr>'
  // Drawing name
  +'<tr><td colspan="3" style="padding:1mm 1.5mm;border:0.5pt solid #334155;font-weight:bold;font-size:6.5pt;background:#f8fafc;">'+(meta.drawing||'Исполнительная схема')+'</td></tr>'
  // Roles
  +(meta.developer?'<tr><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;font-size:5.5pt;white-space:nowrap;">Разработал</td><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;font-weight:bold;">'+meta.developer+'</td><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;">'+dt+'</td></tr>':'')
  +(meta.geodesist?'<tr><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;font-size:5.5pt;white-space:nowrap;">Геодезист</td><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;font-weight:bold;">'+meta.geodesist+'</td><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;">'+dt+'</td></tr>':'')
  +(meta.checker?'<tr><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;font-size:5.5pt;white-space:nowrap;">Проверил</td><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;font-weight:bold;">'+meta.checker+'</td><td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;">'+dt+'</td></tr>':'')
  // Scale + sheet
  +'<tr>'
  +'<td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;font-size:5.5pt;">Масштаб</td>'
  +'<td colspan="2" style="padding:0.5mm 1mm;border:0.5pt solid #334155;font-weight:bold;">'+(meta.scale||'—')+'</td>'
  +'</tr>'
  +'<tr>'
  +'<td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;font-size:5.5pt;">Дата</td>'
  +'<td colspan="2" style="padding:0.5mm 1mm;border:0.5pt solid #334155;">'+dt+'</td>'
  +'</tr>'
  +'<tr>'
  +'<td style="padding:0.5mm 1mm;border:0.5pt solid #334155;color:#475569;font-size:5.5pt;">Лист</td>'
  +'<td colspan="2" style="padding:0.5mm 1mm;border:0.5pt solid #334155;">1 / 1</td>'
  +'</tr>'
  +'</table>'
);

// STEP 5: Assemble preview
var frameHtml=(
  '<div class="pdf-preview-frame">'
  +'<div class="po-draw"><img src="'+imgData+'"></div>'
  +'<div class="po-stamp">'
  +'<div class="po-table-wrap">'+tables+'</div>'
  +'<div class="po-title-block">'+titleBlock+'</div>'
  +'</div></div>'
);
var barHtml=(
  '<div id="pdf-preview-bar">'
  +'<span style="color:#94a3b8;font-size:11px;margin-right:auto;">Предварительный просмотр — A4 горизонтальная</span>'
  +'<button onclick="_closePdfPreview()" style="background:#475569;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;">&#10005; Закрыть</button>'
  +'<button onclick="_doPrintNow()" style="background:#16a34a;color:#fff;border:none;padding:7px 18px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">&#128424; Печать / PDF</button>'
  +'</div>'
);
var ov=document.getElementById('print-overlay');
ov.innerHTML=frameHtml+barHtml;
ov.classList.add('pdf-preview-open');
window._closePdfPreview=function(){
  ov.classList.remove('pdf-preview-open');ov.innerHTML='';pdfLogoDataUrl=null;
  var b=document.getElementById('pdf-modal-generate-btn');
  if(b){b.innerHTML='<i class="fa-solid fa-download"></i> Сгенерировать';b.disabled=false;}
};
window._doPrintNow=function(){
  ov.classList.remove('pdf-preview-open');ov.classList.add('pdf-printing');
  setTimeout(function(){window.print();setTimeout(function(){
    ov.classList.remove('pdf-printing');ov.innerHTML='';pdfLogoDataUrl=null;
    var b=document.getElementById('pdf-modal-generate-btn');
    if(b){b.innerHTML='<i class="fa-solid fa-download"></i> Сгенерировать';b.disabled=false;}
  },600);},120);
};
var b2=document.getElementById('pdf-modal-generate-btn');
if(b2){b2.innerHTML='<i class="fa-solid fa-download"></i> Сгенерировать';b2.disabled=false;}
}
