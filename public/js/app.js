// CAD Extractor 3D

let georefPickMode=null,secondDxfElements=[],secondDxfVisible=true,secondDxfLinesVisible=true,secondDxfPointsVisible=true,georefTransform=null;
let northAngle=0,showGrid=false,northPickMode=false,northPickP1=null,northPickHover=null;
let cadSymbols=[],symTool=null,symPoints=[],symProp={};
let contourPts=[],contourActive=false,contourClosed=false,contourMousePos=null;
let savedContours=[]; // stored filled areas [{pts,material,color,area,volume}]
var showLeaders=true; // show leader callouts for symbols
var _contourMaterial='concrete'; // current fill material
// Snap modes
var snapModes={nodes:true,lines:true,midpoints:false,intersections:false};
var currentSnapType=''; // 'node','line','mid'
let pdfFrame=null,pdfFrameDrawing=false,pdfFrameStart=null;
let currentMode='dxf',earthworksData=null,dxfData=null,scale=1,baseScale=1,panX=0,panY=0,cadOriginX=0,cadOriginY=0,cadMinX=0,cadMinY=0,cadMaxX=0,cadMaxY=0,cachedPath=null,cadTexts=[],cadSnapPoints=[],cadPoints=[],dxfElements=[],dxfLayers={};
let currentTool='point',points=[],dimensions=[],exportArea=null,currentSnapPoint=null,currentMouseCAD=null,currentDimStart=null,isDrawingArea=false,isExportingPDF=false,isDrawingScheduled=false,isPointsModalOpen=false,isDimsModalOpen=false,isEarthworksModalOpen=false,isHelpModalOpen=false,isDragging=false,lastMouseX=0,lastMouseY=0,dragMoved=false,dxfShowContours=false,dxfCachedContours=[],dxfContourColor='#78716c',dxfContourOpacity=0.55;
let manualPoints=[],manualLines=[],manScale=1,manPanX=0,manPanY=0,manOriginX=0,manOriginY=0,manCurrentTool='pan',manSnapPoint=null,manLineStartPoint=null,manCurrentMousePos=null,manIsDrawingScheduled=false,manIsExportingPDF=false,manIsDragging=false,manLastX=0,manLastY=0,manDragMoved=false,editingManualPointId=null,showContours=false,cachedContours=[],manPolyPoints=[],manHistory=[],manHistoryStep=-1,isManPanelOpen=true,isDxfZPanelOpen=true,customBoundaryPoly=null;
let bgImageProps={img:null,x:0,y:0,scale:1,opacity:0.5,visible:true},threeScene,threeCamera,threeRenderer,threeControls,threeMesh,threeWireframe,showPointLabels=true,currentPdfMode='dxf',pdfLogoDataUrl=null,lineColor='#334155',manLineColor='#334155';

function showMessage(t,txt,type='error'){const m=document.getElementById('custom-modal'),c=document.getElementById('modal-content'),i=document.getElementById('modal-icon');document.getElementById('modal-title').textContent=t;document.getElementById('modal-text').textContent=txt;if(type==='error')i.className='fa-solid fa-circle-exclamation text-xl md:text-2xl text-red-500';else if(type==='warning')i.className='fa-solid fa-triangle-exclamation text-xl md:text-2xl text-amber-500';else if(type==='success')i.className='fa-solid fa-circle-check text-xl md:text-2xl text-emerald-500';else i.className='fa-solid fa-circle-info text-xl md:text-2xl text-blue-500';m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}
function hideMessage(){const m=document.getElementById('custom-modal'),c=document.getElementById('modal-content');m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}
function showConfirm(t,txt,onYes){const m=document.getElementById('confirm-modal'),c=document.getElementById('confirm-modal-content');document.getElementById('confirm-modal-title').textContent=t;document.getElementById('confirm-modal-text').textContent=txt;document.getElementById('confirm-modal-btn-yes').onclick=()=>{hideConfirm();onYes();};document.getElementById('confirm-modal-btn-no').onclick=hideConfirm;m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);function hideConfirm(){m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}
function switchMode(m){currentMode=m;const act="px-3 md:px-4 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 bg-blue-600 text-white shadow-sm",inact="px-3 md:px-4 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white";['desktop'].forEach(d=>{const bd=document.getElementById(`tab-dxf-${d}`),bm=document.getElementById(`tab-manual-${d}`);if(bd)bd.className=m==='dxf'?act:inact;if(bm)bm.className=m==='manual'?act:inact;});const cd=document.getElementById('controls-dxf'),cm=document.getElementById('controls-manual'),md=document.getElementById('mode-dxf'),mm=document.getElementById('mode-manual');if(m==='dxf'){if(cd){cd.classList.remove('hidden');cd.classList.add('flex');}if(cm){cm.classList.add('hidden');cm.classList.remove('flex');}if(md)md.classList.remove('hidden');if(mm)mm.classList.add('hidden');setTimeout(()=>{resizeCanvas();requestDraw();},50);}else{if(cm){cm.classList.remove('hidden');cm.classList.add('flex');}if(cd){cd.classList.add('hidden');cd.classList.remove('flex');}if(mm)mm.classList.remove('hidden');if(md)md.classList.add('hidden');setTimeout(()=>{resizeManualCanvas();requestManualDraw();},50);}}
function toggleHelpModal(){const m=document.getElementById('help-modal'),c=document.getElementById('help-content');isHelpModalOpen=!isHelpModalOpen;if(isHelpModalOpen){m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}
function toggleEarthworksModal(){const m=document.getElementById('earthworks-modal'),c=document.getElementById('earthworks-content');isEarthworksModalOpen=!isEarthworksModalOpen;if(isEarthworksModalOpen){if(isPointsModalOpen)togglePointsModal();if(isDimsModalOpen)toggleDimsModal();m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);const a=document.querySelector('input[name="ew-bounds-type"][value="auto"]');if(a)a.checked=true;toggleEwBoundsInput();}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}
function togglePointsModal(){const m=document.getElementById('points-modal'),c=document.getElementById('points-modal-content');isPointsModalOpen=!isPointsModalOpen;if(isPointsModalOpen){if(isDimsModalOpen)toggleDimsModal();m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}
function toggleDimsModal(){const m=document.getElementById('dims-modal'),c=document.getElementById('dims-modal-content');isDimsModalOpen=!isDimsModalOpen;if(isDimsModalOpen){if(isPointsModalOpen)togglePointsModal();m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}
function toggleCadastreModal(){const m=document.getElementById('cadastre-modal'),c=document.getElementById('cadastre-modal-content');if(m.classList.contains('hidden')){m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');},10);}else{m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');},300);}}
function togglePointLabels(){showPointLabels=!showPointLabels;const cls=showPointLabels?'bg-blue-100 text-blue-600 shadow-inner':'hover:bg-slate-200 text-slate-600',icon=showPointLabels?'<i class="fa-solid fa-eye text-base md:text-lg"></i>':'<i class="fa-solid fa-eye-slash text-base md:text-lg"></i>',bd=document.getElementById('dxf-tool-labels'),bm=document.getElementById('man-tool-labels');if(bd){bd.className=`p-2 md:p-2.5 rounded-lg transition w-full ${cls}`;bd.innerHTML=icon;}if(bm){bm.className=`p-2 md:p-2.5 rounded-lg transition w-full ${cls}`;bm.innerHTML=icon;}if(currentMode==='dxf')requestDraw();else requestManualDraw();}

// API Cadastre
async function checkCadastreServer(){const b=document.getElementById('btn-check-server'),m=document.getElementById('cadastre-msg');b.innerHTML='<i class="fa-solid fa-gear fa-spin"></i>';m.className='text-[10px] md:text-xs text-blue-500 mt-1 text-center';m.textContent='Проверка...';m.classList.remove('hidden');const t=`https://pkk.rosreestr.ru/api/features/1?text=77:01:0001001:1001`,px=[`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(t)}`,`https://corsproxy.io/?${encodeURIComponent(t)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`];let s=false;for(const p of px){try{const r=await fetch(p,{cache:'no-store'});if(r.ok){const j=await r.json();if(j&&j.features){s=true;break;}}}catch(e){}}b.innerHTML='<i class="fa-solid fa-gear"></i>';if(s){m.className='text-[10px] md:text-xs text-emerald-600 mt-1 text-center font-semibold';m.innerHTML='<i class="fa-solid fa-check-circle"></i> Росреестр доступен';}else{m.className='text-[10px] md:text-xs text-red-500 mt-1 text-center font-semibold';m.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> Используйте адрес (OSM).';}}
function lonLatToMeters(lon,lat){const R=6378137;return{x:lon*R*Math.PI/180,y:R*Math.log(Math.tan(Math.PI/4+(lat*Math.PI/180)/2))};}
async function searchCadastre(){const i=document.getElementById('cadastre-input').value.trim();if(!i){showMessage('Ошибка','Введите кадастровый номер или адрес','warning');return;}const b=document.getElementById('btn-search-cadastre'),m=document.getElementById('cadastre-msg');b.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Поиск...';b.disabled=true;m.classList.add('hidden');try{const isC=/^[\d:\s]+$/.test(i);if(isC){const u=`https://pkk.rosreestr.ru/api/features/1?text=${i}`,px=[`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,`https://corsproxy.io/?${encodeURIComponent(u)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`];let d=null;for(const p of px){try{const r=await fetch(p,{cache:'no-store'});if(r.ok){const j=await r.json();if(j&&j.features){d=j;break;}}}catch(e){}}if(!d||!d.features||d.features.length===0){m.innerHTML='Сервер защищен или участок не найден.<br><b>Совет:</b> Попробуйте адрес.';m.classList.remove('hidden');m.classList.add('text-red-500');return;}const f=d.features[0];if(f.extent){const ex=f.extent,ca=[[ex.xmin,ex.ymin],[ex.xmax,ex.ymin],[ex.xmax,ex.ymax],[ex.xmin,ex.ymax],[ex.xmin,ex.ymin]];let pid=null,om={x:ca[0][0],y:ca[0][1]},sid=manualPoints.length>0?Math.max(...manualPoints.map(p=>p.id))+1:1,fid=sid;ca.forEach((c,idx)=>{if(index===ca.length-1){manualLines.push({id:manualLines.length>0?Math.max(...manualLines.map(l=>l.id))+1:1,p1:manualPoints.find(p=>p.id===pid),p2:manualPoints.find(p=>p.id===fid)});return;}const np={id:sid,x:c[0]-om.x,y:c[1]-om.y,z:null};manualPoints.push(np);if(pid!==null)manualLines.push({id:manualLines.length>0?Math.max(...manualLines.map(l=>l.id))+1:1,p1:manualPoints.find(p=>p.id===pid),p2:np});pid=sid;sid++;});showMessage('Завершено',`Кадастр найден! Добавлены габариты.`,`success`);}else if(f.center){manualPoints.push({id:manualPoints.length>0?Math.max(...manualPoints.map(p=>p.id))+1:1,x:0,y:0,z:null});showMessage('Завершено',`Найден только центр.`,`success`);}}else{const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(i)}&format=json&polygon_geojson=1&limit=1`),d=await r.json();if(!d||d.length===0){m.textContent='Адрес не найден (OSM).';m.classList.remove('hidden');m.classList.add('text-red-500');return;}const res=d[0];if(!res.geojson||(res.geojson.type!=='Polygon'&&res.geojson.type!=='MultiPolygon')){manualPoints.push({id:manualPoints.length>0?Math.max(...manualPoints.map(p=>p.id))+1:1,x:0,y:0,z:null});showMessage('Завершено',`Найден только центр.`,`success`);}else{let ca=res.geojson.type==='Polygon'?res.geojson.coordinates[0]:res.geojson.coordinates[0][0];const om=lonLatToMeters(ca[0][0],ca[0][1]);let pid=null,sid=manualPoints.length>0?Math.max(...manualPoints.map(p=>p.id))+1:1,fid=sid;ca.forEach((c,idx)=>{if(idx===ca.length-1&&c[0]===ca[0][0]&&c[1]===ca[0][1]){manualLines.push({id:manualLines.length>0?Math.max(...manualLines.map(l=>l.id))+1:1,p1:manualPoints.find(p=>p.id===pid),p2:manualPoints.find(p=>p.id===fid)});return;}const mt=lonLatToMeters(c[0],c[1]),np={id:sid,x:mt.x-om.x,y:mt.y-om.y,z:null};manualPoints.push(np);if(pid!==null)manualLines.push({id:manualLines.length>0?Math.max(...manualLines.map(l=>l.id))+1:1,p1:manualPoints.find(p=>p.id===pid),p2:np});pid=sid;sid++;});showMessage('Завершено',`Адрес найден! Контур загружен.`,`success`);}}saveManState();updateManualTable();updateManualLinesTable();fitManualView();toggleCadastreModal();}catch(e){showMessage('Ошибка','Сбой поиска.','error');}finally{b.innerHTML='<i class="fa-solid fa-cloud-arrow-down"></i> Найти и импортировать';b.disabled=false;}}

// Math
function isPointInPolygon(p,vs){let x=p.x,y=p.y,ins=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){let xi=vs[i].x,yi=vs[i].y,xj=vs[j].x,yj=vs[j].y;let int=((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi);if(int)ins=!ins;}return ins;}
function getConvexHull(pts){if(pts.length<3)return pts;let h=[];pts.sort((a,b)=>a.x===b.x?a.y-b.y:a.x-b.x);const cp=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);for(let p of pts){while(h.length>=2&&cp(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}let t=h.length+1;for(let i=pts.length-1;i>=0;i--){let p=pts[i];while(h.length>=t&&cp(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}h.pop();return h;}
function calcPolygonArea(pts){let a=0;for(let i=0,j=pts.length-1;i<pts.length;j=i++)a+=(pts[j].x+pts[i].x)*(pts[j].y-pts[i].y);return Math.abs(a/2);}
function offsetPolygon(h,d){if(d===0)return h;const o=[];for(let i=0;i<h.length;i++){let p0=h[(i-1+h.length)%h.length],p1=h[i],p2=h[(i+1)%h.length],dx1=p1.x-p0.x,dy1=p1.y-p0.y,l1=Math.hypot(dx1,dy1),nx1=dy1/l1,ny1=-dx1/l1,dx2=p2.x-p1.x,dy2=p2.y-p1.y,l2=Math.hypot(dx2,dy2),nx2=dy2/l2,ny2=-dx2/l2,nx=nx1+nx2,ny=ny1+ny2,ln=Math.hypot(nx,ny);if(ln<0.0001)o.push({x:p1.x+nx1*d,y:p1.y+ny1*d});else{nx/=ln;ny/=ln;let dt=nx*nx1+ny*ny1,ol=d/dt;o.push({x:p1.x+nx*ol,y:p1.y+ny*ol});}}if(d>0&&calcPolygonArea(o)<calcPolygonArea(h))return offsetPolygon(h,-d);return o;}

// Earthworks
function toggleEwBoundsInput(){const t=document.querySelector('input[name="ew-bounds-type"]:checked').value,d=document.getElementById('ew-custom-pts-div');if(t==='auto')d.style.display='block';else{d.style.display='none';if(!customBoundaryPoly||customBoundaryPoly.length<3){showMessage("Внимание","Нет нарисованного полигона.","warning");document.querySelector('input[name="ew-bounds-type"][value="auto"]').checked=true;d.style.display='block';}}}
function calculateEarthworks(){const tz=parseFloat(document.getElementById('ew-target-z').value),zt=document.getElementById('ew-z-type').value,off=parseFloat(document.getElementById('ew-offset').value)||0,bt=document.querySelector('input[name="ew-bounds-type"]:checked').value;if(isNaN(tz)){showMessage("Ошибка","Введите проектную Z.","warning");return;}const ap=currentMode==='dxf'?points:manualPoints;let vp=ap.filter(p=>p.z!==null&&Number.isFinite(p.z)).map(p=>({x:p.x,y:p.y,z:p.z}));if(vp.length<3){showMessage("Ошибка","Минимум 3 точки с Z.","warning");return;}let bp=[],bs="",pi=[];if(bt==='drawn'){if(!customBoundaryPoly||customBoundaryPoly.length<3){showMessage("Ошибка","Полигон не нарисован.","warning");return;}bp=customBoundaryPoly;bs="Нарисованный контур";pi=vp.filter(p=>isPointInPolygon(p,bp));}else{const bi=document.getElementById('ew-boundary-points').value.trim();if(bi){const ids=bi.split(',').map(s=>parseInt(s.replace(/\D/g,''),10)).filter(id=>!isNaN(id));if(ids.length<3){showMessage("Ошибка","Укажите 3 точки.","warning");return;}let cpts=[];ids.forEach(id=>{const p=ap.find(pt=>pt.id===id);if(p&&p.z!==null&&Number.isFinite(p.z))cpts.push({x:p.x,y:p.y,z:p.z});});if(cpts.length<3){showMessage("Ошибка","Не найдено 3 точки с Z.","warning");return;}bp=getConvexHull(cpts);bs=bi;pi=cpts;}else{bp=getConvexHull(vp);bs="Все точки";pi=vp;}}if(calcPolygonArea(bp)<0.001){showMessage("Ошибка","Точки на одной линии.","error");return;}const bufp=offsetPolygon(bp,off),a=calcPolygonArea(bufp),az=pi.length>0?(pi.reduce((s,p)=>s+p.z,0)/pi.length):(vp.reduce((s,p)=>s+p.z,0)/vp.length);let d=0,td="";if(zt==='abs'){d=az-tz;td=`${tz.toFixed(3)} м (Абс.)`;}else{d=tz;td=`-${tz.toFixed(3)} м (Отн.)`;}const v=a*Math.abs(d);earthworksData={targetZDisplay:td,offset:off,area:a,avgZ:az,depth:d,volume:v,polygon:bufp,selectedPtsStr:bs};document.getElementById('ew-result-box').classList.remove('hidden');document.getElementById('ew-res-area').textContent=a.toFixed(2);document.getElementById('ew-res-avgz').textContent=az.toFixed(3);document.getElementById('ew-res-depth').textContent=Math.abs(d).toFixed(3)+(d>=0?' (выемка)':' (насыпь)');document.getElementById('ew-res-volume').textContent=v.toFixed(2);if(currentMode==='dxf')requestDraw();else requestManualDraw();}

// 3D Viewer
function open3DViewer(){const ap=currentMode==='dxf'?points:manualPoints,pz=ap.filter(p=>p.z!==null&&Number.isFinite(p.z));if(pz.length<3){showMessage('Ошибка','Нужно 3 точки с Z.','warning');return;}const m=document.getElementById('three-modal'),c=document.getElementById('three-modal-content');m.classList.remove('hidden');setTimeout(()=>{m.classList.remove('opacity-0');c.classList.remove('scale-95');c.classList.add('scale-100');init3DViewer(pz);},50);}
function close3DViewer(){const m=document.getElementById('three-modal'),c=document.getElementById('three-modal-content');m.classList.add('opacity-0');c.classList.remove('scale-100');c.classList.add('scale-95');setTimeout(()=>{m.classList.add('hidden');if(threeRenderer){if(threeControls){threeControls.dispose();threeControls=null;}if(threeMesh){threeMesh.geometry.dispose();threeMesh.material.dispose();if(threeScene)threeScene.remove(threeMesh);threeMesh=null;}if(threeWireframe){threeWireframe.geometry.dispose();threeWireframe.material.dispose();if(threeScene)threeScene.remove(threeWireframe);threeWireframe=null;}threeRenderer.dispose();document.getElementById('three-container').innerHTML='<div class="absolute bottom-4 left-4 text-white/50 text-xs pointer-events-none select-none z-10"><i class="fa-solid fa-mouse"></i> ЛКМ: вращение | ПКМ: сдвиг | Колесико: зум</div>';threeRenderer=null;threeScene=null;threeCamera=null;}},300);}
function init3DViewer(pts){const con=document.getElementById('three-container');if(threeRenderer){if(threeControls){threeControls.dispose();threeControls=null;}if(threeMesh){threeMesh.geometry.dispose();threeMesh.material.dispose();if(threeScene)threeScene.remove(threeMesh);threeMesh=null;}if(threeWireframe){threeWireframe.geometry.dispose();threeWireframe.material.dispose();if(threeScene)threeScene.remove(threeWireframe);threeWireframe=null;}threeRenderer.dispose();threeRenderer=null;threeScene=null;threeCamera=null;con.innerHTML='<div class="absolute bottom-4 left-4 text-white/50 text-xs pointer-events-none select-none z-10"><i class="fa-solid fa-mouse"></i> ЛКМ: вращение | ПКМ: сдвиг | Колесико: зум</div>';}const w=con.clientWidth,h=con.clientHeight;threeScene=new THREE.Scene();threeScene.background=new THREE.Color(0x0f172a);threeCamera=new THREE.PerspectiveCamera(60,w/h,0.1,10000);threeRenderer=new THREE.WebGLRenderer({antialias:true});threeRenderer.setSize(w,h);threeRenderer.setPixelRatio(window.devicePixelRatio);con.appendChild(threeRenderer.domElement);threeControls=new THREE.OrbitControls(threeCamera,threeRenderer.domElement);threeControls.enableDamping=true;threeControls.dampingFactor=0.05;threeScene.add(new THREE.AmbientLight(0xffffff,0.6));const dl=new THREE.DirectionalLight(0xffffff,0.8);dl.position.set(100,200,50);threeScene.add(dl);let mx=Infinity,Mx=-Infinity,my=Infinity,My=-Infinity,mz=Infinity,Mz=-Infinity;pts.forEach(p=>{if(p.x<mx)mx=p.x;if(p.x>Mx)Mx=p.x;if(p.y<my)my=p.y;if(p.y>My)My=p.y;if(p.z<mz)mz=p.z;if(p.z>Mz)Mz=p.z;});const cx=(mx+Mx)/2,cy=(my+My)/2,cz=(mz+Mz)/2,c=[];pts.forEach(p=>c.push(p.x,p.y));const del=new Delaunator(c),geo=new THREE.BufferGeometry(),v=[],col=[];const cL=new THREE.Color(0x0284c7),cM=new THREE.Color(0x10b981),cH=new THREE.Color(0xb45309),cT=new THREE.Color(0xffffff);const gC=(z)=>{let t=Mz===mz?0:(z-mz)/(Mz-mz);const cl=new THREE.Color();if(t<0.33)cl.lerpColors(cL,cM,t/0.33);else if(t<0.66)cl.lerpColors(cM,cH,(t-0.33)/0.33);else cl.lerpColors(cH,cT,(t-0.66)/0.34);return cl;};for(let i=0;i<del.triangles.length;i+=3){const i0=del.triangles[i],i1=del.triangles[i+1],i2=del.triangles[i+2],p0=pts[i0],p1=pts[i1],p2=pts[i2];v.push(p0.x-cx,p0.z-cz,-(p0.y-cy),p1.x-cx,p1.z-cz,-(p1.y-cy),p2.x-cx,p2.z-cz,-(p2.y-cy));const c0=gC(p0.z),c1=gC(p1.z),c2=gC(p2.z);col.push(c0.r,c0.g,c0.b,c1.r,c1.g,c1.b,c2.r,c2.g,c2.b);}geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.computeVertexNormals();const mat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:0.8,flatShading:true});threeMesh=new THREE.Mesh(geo,mat);threeScene.add(threeMesh);threeWireframe=new THREE.LineSegments(new THREE.WireframeGeometry(geo),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.15}));threeScene.add(threeWireframe);const md=Math.max(Mx-mx,My-my,Mz-mz)||10;
// DXF polylines
if(dxfElements&&dxfElements.length){
  var _dlBuf=[];var _dlMat=new THREE.LineBasicMaterial({color:0x60a5fa,transparent:true,opacity:0.5});
  dxfElements.forEach(function(el){
    if(el.type==='POLYLINE'&&el.pts&&el.pts.length>=2){
      for(var _di=0;_di<el.pts.length-1;_di++){
        var _pa=el.pts[_di],_pb=el.pts[_di+1];
        _dlBuf.push(_pa.x-cx,(_pa.z||0)-cz,-(_pa.y-cy),_pb.x-cx,(_pb.z||0)-cz,-(_pb.y-cy));
      }
    }
  });
  if(_dlBuf.length){
    var _dlGeo=new THREE.BufferGeometry();
    _dlGeo.setAttribute('position',new THREE.Float32BufferAttribute(_dlBuf,3));
    threeScene.add(new THREE.LineSegments(_dlGeo,_dlMat));
  }
}
// Marked points
var _ptMat=new THREE.MeshStandardMaterial({color:0xef4444,roughness:0.4});
var _ptR=md*0.008;
pts.forEach(function(p){
  if(!Number.isFinite(p.z))return;
  var _sg=new THREE.SphereGeometry(_ptR,6,6);
  var _sm=new THREE.Mesh(_sg,_ptMat);
  _sm.position.set(p.x-cx,p.z-cz,-(p.y-cy));
  threeScene.add(_sm);
  // vertical line from surface to point
  var _lg=new THREE.BufferGeometry();
  _lg.setAttribute('position',new THREE.Float32BufferAttribute([p.x-cx,0,-(p.y-cy),p.x-cx,p.z-cz,-(p.y-cy)],3));
  threeScene.add(new THREE.Line(_lg,new THREE.LineBasicMaterial({color:0xef4444,opacity:0.6,transparent:true})));
});
// Symbols
cadSymbols.forEach(function(sym){
  if(!sym.pts||!sym.pts.length)return;
  var _sp0=sym.pts[0];
  var _d=parseFloat(sym.props&&sym.props.d||0.3);
  var _h=parseFloat(sym.props&&sym.props.h||3.0);
  var _top=parseFloat(sym.props&&sym.props.top||0);
  var _r=parseInt(sym.color&&sym.color.slice(1,3)||'1e',16)/255;
  var _g=parseInt(sym.color&&sym.color.slice(3,5)||'29',16)/255;
  var _b=parseInt(sym.color&&sym.color.slice(5,7)||'3b',16)/255;
  var _sMat=new THREE.MeshStandardMaterial({color:new THREE.Color(_r,_g,_b),roughness:0.6});
  var _sGeo,_sMesh;
  if(sym.type==='pile'){
    // Cylinder from top mark down to depth
    _sGeo=new THREE.CylinderGeometry(_d/2,_d/2,_h,12);
    _sMesh=new THREE.Mesh(_sGeo,_sMat);
    _sMesh.position.set(_sp0.x-cx,(_top-_h/2)-cz,-(_sp0.y-cy));
    threeScene.add(_sMesh);
  } else if(sym.type==='column'){
    var isSquare=sym.props&&sym.props.shape==='square';
    _sGeo=isSquare?new THREE.BoxGeometry(_d,_h,_d):new THREE.CylinderGeometry(_d/2,_d/2,_h,10);
    _sMesh=new THREE.Mesh(_sGeo,_sMat);
    _sMesh.position.set(_sp0.x-cx,_h/2-cz,-(_sp0.y-cy));
    threeScene.add(_sMesh);
  } else if(sym.type==='well'){
    _sGeo=new THREE.CylinderGeometry(_d/2,_d/2,0.1,16);
    _sMesh=new THREE.Mesh(_sGeo,_sMat);
    _sMesh.position.set(_sp0.x-cx,0-cz,-(_sp0.y-cy));
    threeScene.add(_sMesh);
  } else if(sym.type==='wall'&&sym.pts.length>=2){
    // Wall as flat boxes along segments
    var _ww2=parseFloat(sym.props&&sym.props.w||0.25);
    for(var _wi=0;_wi<sym.pts.length-1;_wi++){
      var _wa=sym.pts[_wi],_wb=sym.pts[_wi+1];
      var _wlen=Math.hypot(_wb.x-_wa.x,_wb.y-_wa.y);
      var _wang=Math.atan2(_wb.y-_wa.y,_wb.x-_wa.x);
      var _wmx=(_wa.x+_wb.x)/2-cx,_wmy=(_wa.y+_wb.y)/2;
      _sGeo=new THREE.BoxGeometry(_wlen,_h,_ww2);
      _sMesh=new THREE.Mesh(_sGeo,_sMat);
      _sMesh.position.set(_wmx,_h/2-cz,-(_wmy-cy));
      _sMesh.rotation.y=-_wang;
      threeScene.add(_sMesh);
    }
  }
});
// Filled contours
if(typeof savedContours!=='undefined'){
  savedContours.forEach(function(sc){
    if(!sc.pts||sc.pts.length<3)return;
    var _shape=new THREE.Shape();
    sc.pts.forEach(function(p,i){
      i?_shape.lineTo(p.x-cx,-(p.y-cy)):_shape.moveTo(p.x-cx,-(p.y-cy));
    });
    _shape.closePath();
    var _sgeo=new THREE.ShapeGeometry(_shape);
    // Rotate so XZ plane is horizontal
    var _smat=new THREE.MeshStandardMaterial({      color:sc.material==='concrete'?0x94a3b8:
            sc.material==='sand'?0xfcd34d:
            sc.material==='asphalt'?0x374151:
            sc.material==='brick'?0xb91c1c:0x4ade80,      transparent:true,opacity:0.7,side:THREE.DoubleSide});
    var _sm2=new THREE.Mesh(_sgeo,_smat);
    _sm2.rotation.x=-Math.PI/2;
    _sm2.position.y=0-cz+0.05;
    threeScene.add(_sm2);
  });
}
threeCamera.position.set(md*0.8,md*0.8,md*0.8);
threeCamera.lookAt(0,0,0);
const ani=function(){
if(!threeRenderer)return;
requestAnimationFrame(ani);
threeControls.update();
threeRenderer.render(threeScene,threeCamera);
};ani();}
function onThreeResize(){const c=document.getElementById('three-container');if(!c||!threeRenderer)return;const w=c.clientWidth,h=c.clientHeight;threeCamera.aspect=w/h;threeCamera.updateProjectionMatrix();threeRenderer.setSize(w,h);}
function update3DMaterial(){if(!threeWireframe)return;const w=document.getElementById('three-wireframe').checked;threeWireframe.material.opacity=w?0.8:0.15;threeWireframe.material.color.setHex(w?0x000000:0xffffff);}

// DXF Specific functions
function toggleDxfZPanel(){const p=document.getElementById('dxf-z-panel'),b=document.getElementById('btn-show-dxf-z-panel');isDxfZPanelOpen=!isDxfZPanelOpen;if(isDxfZPanelOpen){p.classList.remove('hidden');p.classList.add('flex');b.classList.add('hidden');b.classList.remove('flex');}else{p.classList.add('hidden');p.classList.remove('flex');b.classList.remove('hidden');b.classList.add('flex');}}
function toggleDxfContoursConfig(){const p=document.getElementById('dxf-contours-panel');if(p.classList.contains('hidden')){p.classList.remove('hidden');p.style.display='flex';}else{p.classList.add('hidden');p.style.display='none';}}
function toggleDxfLayersPanel(){const p=document.getElementById('dxf-layers-panel');if(p.classList.contains('hidden')){p.classList.remove('hidden');p.classList.add('flex');}else{p.classList.add('hidden');p.classList.remove('flex');}}

function buildDxfLayersPanel(){
var l=document.getElementById('lyr-panel-1');
var keys=Object.keys(dxfLayers);
if(keys.length===0){l.innerHTML='<div class="italic text-center py-4 text-slate-400 text-xs">Слои не найдены</div>';return;}
keys.sort(function(a,b){return a.localeCompare(b,'ru');});
var h='';
keys.forEach(function(name){
  var ly=dxfLayers[name];
  var vis=(ly===true)||(ly&&ly.visible!==false);
  var col=(ly&&typeof ly==='object'&&ly.color)?ly.color:'#64748b';
  var cnt=(ly&&typeof ly==='object'&&ly.count)?ly.count:0;
  var desc=(ly&&typeof ly==='object'&&ly.description)?ly.description:'';
  var incl=(ly&&typeof ly==='object'&&ly.printInclude)||false;
  var safeN=name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  var encN=encodeURIComponent(name);
  h+='<div class="border-b border-slate-100 last:border-0">';
  // Main row
  h+='<div class="flex items-start gap-2 px-3 py-2 hover:bg-slate-50">';
  // Color swatch
  h+='<span style="width:14px;height:14px;border-radius:3px;flex-shrink:0;margin-top:1px;background:'+col+';border:1px solid rgba(0,0,0,.15)" title="Цвет слоя"></span>';
  // Visibility
  h+='<input type="checkbox" '+(vis?'checked':'')+' onchange="toggleDxfLayer(\''+safeN+'\',this.checked)" class="accent-indigo-600 flex-shrink-0 mt-0.5">';
  // Full layer name — no truncate
  h+='<span class="flex-1 text-xs font-medium leading-snug break-all '+(vis?'text-slate-700':'text-slate-400 line-through')+'">'+name+'</span>';
  // Count
  h+='<span class="text-[10px] text-slate-400 flex-shrink-0 mt-0.5 min-w-[24px] text-right">'+cnt+'</span>';
  // PDF checkbox
  h+='<label class="flex items-center gap-1 flex-shrink-0 cursor-pointer" title="Включить в PDF">';
  h+='<input type="checkbox" '+(incl?'checked':'')+' onchange="setLayerPrint(\''+safeN+'\',this.checked)" class="accent-emerald-600 rounded">';
  h+='<i class="fa-solid fa-file-pdf text-[11px] '+(incl?'text-emerald-500':'text-slate-300')+'"></i></label>';
  // Expand btn
  h+='<button onclick="toggleLayerRow(\''+encN+'\')" class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-300 hover:text-slate-600 mt-0.5">';
  h+='<i id="la-'+encN+'" class="fa-solid fa-chevron-down text-[10px] transition-transform '+(desc?'rotate-180':'')+'"></i></button>';
  h+='</div>';
  // Description row
  h+='<div id="ld-'+encN+'" class="px-3 pb-2 pt-0 '+(desc?'':'hidden')+'">';
  h+='<input type="text" value="'+desc.replace(/"/g,'&quot;')+'" ';
  h+='placeholder="Описание слоя (будет напечатано в PDF-отчёте)..." ';
  h+='oninput="setLayerDesc(\''+safeN+'\',this.value)" ';
  h+='class="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400 bg-white">';
  h+='</div>';
  h+='</div>';
});
l.innerHTML=h;
}
function toggleLayerRow(enc){
  var d=document.getElementById('ld-'+enc),a=document.getElementById('la-'+enc);
  if(d)d.classList.toggle('hidden');
  if(a)a.classList.toggle('rotate-180');
}
function setLayerDesc(n,v){if(dxfLayers[n]&&typeof dxfLayers[n]==='object')dxfLayers[n].description=v;}
function setLayerPrint(n,v){
  if(dxfLayers[n]&&typeof dxfLayers[n]==='object'){
    dxfLayers[n].printInclude=v;
    var enc=encodeURIComponent(n);
    var icon=document.querySelector('#ld-'+enc+' ~ * .fa-file-pdf, [id="la-'+enc+'"]');
    buildDxfLayersPanel(); // refresh to update icon color
  }
}
function toggleAllLayers(vis){
  Object.keys(dxfLayers).forEach(function(n){
    if(dxfLayers[n]===null||dxfLayers[n]===undefined)return;
    if(typeof dxfLayers[n]!=='object')dxfLayers[n]={visible:!!dxfLayers[n]};
    dxfLayers[n].visible=vis;
  });
  buildDxfLayersPanel();rebuildCachedPath();
}
function aciToHex(aci){
  var t={1:'#ff2020',2:'#ffff00',3:'#00c800',4:'#00dddd',5:'#0055ff',
    6:'#ff00ff',7:'#1e293b',8:'#808080',9:'#aaaaaa',10:'#ff5500',
    20:'#ff8800',30:'#ffaa00',40:'#ffcc00',50:'#dddd00',60:'#88cc00',
    70:'#00bb44',80:'#009988',90:'#00aacc',100:'#0088cc',110:'#0044ff',
    120:'#5500ff',130:'#aa00cc',140:'#cc0088',150:'#993333',160:'#336633',
    170:'#333388',250:'#111111',251:'#333333',252:'#555555',253:'#888888',254:'#aaaaaa',255:'#cccccc'};
  return t[aci]||'#64748b';
}
// ── Draggable layers panel ──────────────────────────────────────────────────
(function(){
  function makeDraggable(pid,hsel){
    var panel=document.getElementById(pid); if(!panel)return;
    var handle=panel.querySelector(hsel)||panel;
    var ox=0,oy=0,mx=0,my=0,dr=false;
    handle.addEventListener('mousedown',function(e){
      if(e.target.closest('button,input,label'))return;
      dr=true;ox=panel.offsetLeft;oy=panel.offsetTop;mx=e.clientX;my=e.clientY;
      e.preventDefault();
    });
    document.addEventListener('mousemove',function(e){
      if(!dr)return;
      panel.style.left=(ox+e.clientX-mx)+'px';
      panel.style.top=Math.max(0,oy+e.clientY-my)+'px';
    });
    document.addEventListener('mouseup',function(){dr=false;});
  }
  window.addEventListener('load',function(){
    makeDraggable('dxf-layers-panel','.po-drag-handle');
  });
})();





function toggleDxfLayer(n,vis){
  if(dxfLayers[n]===null||dxfLayers[n]===undefined)return;
  // If layer stored as boolean, upgrade to object
  if(typeof dxfLayers[n]!=='object')dxfLayers[n]={visible:!!dxfLayers[n]};
  dxfLayers[n].visible=vis;
  rebuildCachedPath();
}
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
function requestDraw(){if(!isDrawingScheduled){isDrawingScheduled=true;requestAnimationFrame(()=>{draw();isDrawingScheduled=false;});}
  if(typeof _updateHudScale==='function')_updateHudScale();
}
function setTool(t){
  currentTool=t;currentDimStart=null;
  // Highlight toolbar row 2 active button
  document.querySelectorAll('#toolbar-row2 button[id^="tb2-"]').forEach(function(b){
    b.style.background='transparent';b.style.borderColor='transparent';b.style.color='#94a3b8';
  });
  var _m={'point':'tb2-point','interpolate':'tb2-interp','dimension':'tb2-dim'};
  var _b=document.getElementById(_m[t]||'');
  if(_b){_b.style.background='rgba(37,99,235,.3)';_b.style.borderColor='#2563eb';_b.style.color='#93c5fd';}
  // Safe: only access elements that exist
  var cv=document.getElementById('cad-canvas');
  if(cv)cv.style.cursor=t==='area'?'cell':'crosshair';
  var sb=document.getElementById('hud-status');
  var hints={point:'📍 ЛКМ по узлу DXF',interpolate:'🏔 Кликните — интерполяция Z',
    dimension:'📏 Кликните начало',area:'✂ Выделите область PDF'};
  if(sb)sb.textContent=hints[t]||'';
  requestDraw();
}

function updateZDropdown(){const s=document.getElementById('edit-z-point-select');if(!s)return;const v=s.value;s.innerHTML='<option value="" disabled selected>Выберите точку...</option>';const tp=currentMode==='dxf'?points:manualPoints;if(tp.length===0){s.disabled=true;document.getElementById('edit-z-value').disabled=true;document.getElementById('edit-z-type').disabled=true;document.getElementById('btn-apply-z').disabled=true;return;}else{s.disabled=false;document.getElementById('edit-z-value').disabled=false;document.getElementById('edit-z-type').disabled=false;document.getElementById('btn-apply-z').disabled=false;}tp.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=`P${p.id} ${p.z!==null?'(Z: '+p.z.toFixed(3)+')':'(Z: нет)'}`;s.appendChild(o);});if(v&&tp.find(p=>p.id==v))s.value=v;}
document.getElementById('edit-z-point-select')?.addEventListener('change',function(e){const i=parseInt(e.target.value),tp=currentMode==='dxf'?points:manualPoints,p=tp.find(pt=>pt.id===i);if(p){document.getElementById('edit-z-value').value=p.z!==null?p.z:'';document.getElementById('edit-z-type').value=(p.type==='Отн.'||p.type==='Абс.')?p.type:'Абс.';}});
function applyZToPoint(){
  var sel=document.getElementById('edit-z-point-select');
  var valRaw=document.getElementById('edit-z-value').value.trim();
  var typ=document.getElementById('edit-z-type').value;
  if(!sel||sel.value===''||valRaw===''){
    showMessage('Внимание','Выберите точку и введите значение Z.','warning');return;
  }
  var pid=parseInt(sel.value);
  if(isNaN(pid)){showMessage('Ошибка','Некорректный ID точки.','error');return;}

  // For Призма/Поверхность — compute Z from вешка parameters
  var zFinal;
  if(typ==='Призма'||typ==='Поверхность'){
    zFinal=calcVekhaZ();
    typ='Абс.'; // store as absolute after calculation
  } else {
    zFinal=parseFloat(valRaw.replace(',','.'));
  }
  if(isNaN(zFinal)){showMessage('Ошибка','Некорректное значение Z.','error');return;}

  var arr=currentMode==='dxf'?points:manualPoints;
  var p=arr.find(function(pt){return pt.id===pid;});
  if(!p){showMessage('Ошибка','Точка не найдена (ID='+pid+').','error');return;}

  p.z=zFinal; p.type=typ;

  if(currentMode==='dxf'){
    updateTable(); requestDraw();
  } else {
    saveManState(); updateManualTable(); requestManualDraw();
  }
  // Refresh dropdown to show updated Z
  if(typeof _updateZPointSelect==='function')_updateZPointSelect();

  var b=document.getElementById('btn-apply-z');
  if(b){
    var orig=b.innerHTML;
    b.innerHTML='<i class="fa-solid fa-check"></i> Сохранено!';
    b.style.background='#16a34a';
    setTimeout(function(){b.innerHTML=orig;b.style.background='';},1800);
  }
  showMessage('Z-высота','P'+pid+': Z = '+zFinal.toFixed(3)+' м ('+typ+')','success');
}
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
function updateTable(){const tb=document.getElementById('points-tbody'),be=document.getElementById('export-btn'),bd=document.getElementById('points-badge');if(points.length>0){bd.textContent=points.length;bd.classList.remove('hidden');be.disabled=false;}else{bd.classList.add('hidden');be.disabled=true;}updateZDropdown();if(points.length===0){tb.innerHTML=`<tr id="empty-state"><td colspan="6" class="px-3 py-8 text-center text-slate-400 italic">Нет точек.</td></tr>`;return;}let h='';points.forEach(p=>{h+=`<tr class="hover:bg-slate-50 transition border-b border-slate-100"><td class="px-2 py-1 font-medium text-xs">P${p.id}</td><td class="px-1 py-0.5"><input type="number" step="0.001" value="${p.x.toFixed(3)}" onchange="editPtField(${p.id},'x',this.value)" class="w-20 font-mono text-[9px] border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white"></td><td class="px-1 py-0.5"><input type="number" step="0.001" value="${p.y.toFixed(3)}" onchange="editPtField(${p.id},'y',this.value)" class="w-20 font-mono text-[9px] border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white"></td><td class="px-1 py-0.5"><input type="number" step="0.001" value="${p.z!==null&&p.z!==undefined?p.z.toFixed(3):''}" placeholder="-" onchange="editPtField(${p.id},'z',this.value)" class="w-16 font-mono text-[9px] text-sky-600 font-bold border border-transparent hover:border-slate-300 focus:border-sky-400 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white"></td><td class="px-1 py-1 text-[9px] text-slate-500">${p.type||'-'}</td><td class="px-1 py-1 text-right"><button onclick="deletePoint(${p.id})" class="text-red-400 hover:text-red-600 text-xs"><i class="fa-solid fa-xmark"></i></button></td></tr>`;});tb.innerHTML=h;const tc=document.getElementById('table-container');if(tc)tc.scrollTop=tc.scrollHeight;
  if(typeof _updateZPointSelect==='function')_updateZPointSelect();
}
function updateDimsTable(){const tb=document.getElementById('dims-tbody'),bd=document.getElementById('dims-badge');if(dimensions.length>0){bd.textContent=dimensions.length;bd.classList.remove('hidden');}else bd.classList.add('hidden');if(dimensions.length===0){tb.innerHTML=`<tr><td colspan="3" class="px-3 py-8 text-center text-slate-400 italic">Нет линий.</td></tr>`;return;}let h='';dimensions.forEach(d=>{h+=`<tr class="hover:bg-slate-50 border-b border-slate-100"><td class="px-2 md:px-3 py-1.5 md:py-2 font-medium text-purple-700 text-[9px] md:text-xs">${d.label}</td><td class="px-2 md:px-3 py-1.5 md:py-2 font-mono font-bold text-[9px] md:text-xs">${d.distance.toFixed(2)}</td><td class="px-1 md:px-2 py-1.5 md:py-2 text-right"><button onclick="deleteDimension(${d.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button></td></tr>`;});tb.innerHTML=h;}
function sendPointsToManual(){if(points.length===0){showMessage("Нет точек","Сначала отметьте точки.","warning");return;}let a=0;points.forEach(p=>{manualPoints.push({id:manualPoints.length>0?Math.max(...manualPoints.map(pt=>pt.id))+1:1,x:p.x,y:p.y,z:p.z});a++;});saveManState();updateManualTable();fitManualView();switchMode('manual');showMessage("Успех",`Перенесено: ${a}`,"success");}
function resizeCanvas(){const c=document.getElementById('canvas-container'),cv=document.getElementById('cad-canvas');if(c&&cv){cv.width=c.clientWidth;cv.height=c.clientHeight;if(dxfData)draw();}}
function processCADData(){dxfElements=[];dxfLayers={};if(!dxfData||!dxfData.entities)return;function tr(e,tf,d){if(d>15||!e)return;for(let i=0;i<e.length;i++){let en=e[i];if(!en)continue;const ln=en.layer||'0';dxfLayers[ln]=true;if(en.type==='INSERT'&&dxfData.blocks&&dxfData.blocks[en.name]){let bl=dxfData.blocks[en.name];const bx=en.position?(en.position.x||0):0,by=en.position?(en.position.y||0):0,bz=en.position&&en.position.z!==undefined?en.position.z:null;let nx=bx*tf.sx,ny=by*tf.sy;if(tf.rot!==0){const r=tf.rot*Math.PI/180,c=Math.cos(r),s=Math.sin(r),tx=nx*c-ny*s,ty=nx*s+ny*c;nx=tx;ny=ty;}dxfElements.push({type:'POINT',p:{x:nx+tf.x,y:ny+tf.y,z:bz},layer:ln});tr(bl.entities,{x:nx+tf.x,y:ny+tf.y,sx:tf.sx*(en.scale?(en.scale.x||1):1),sy:tf.sy*(en.scale?(en.scale.y||1):1),rot:tf.rot+(en.rotation||0)},d+1);}else{const wp=(p)=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;let nx=p.x*tf.sx,ny=p.y*tf.sy;if(tf.rot!==0){const r=tf.rot*Math.PI/180,c=Math.cos(r),s=Math.sin(r),tx=nx*c-ny*s,ty=nx*s+ny*c;nx=tx;ny=ty;}return{x:nx+tf.x,y:ny+tf.y,z:p.z!==undefined?p.z:null};};try{if(en.type==='LINE'&&en.vertices&&en.vertices.length>=2){let p1=wp(en.vertices[0]),p2=wp(en.vertices[1]);if(p1&&p2)dxfElements.push({type:'POLYLINE',pts:[p1,p2],closed:false,layer:ln});}else if((en.type==='LWPOLYLINE'||en.type==='POLYLINE'||en.type==='SPLINE')&&en.vertices){let pts=[];en.vertices.forEach(v=>{let p=wp(v);if(p)pts.push(p);});if(pts.length>0)dxfElements.push({type:'POLYLINE',pts,closed:!!en.closed,layer:ln});}else if(en.type==='SPLINE'&&en.controlPoints){let pts=[];en.controlPoints.forEach(v=>{let p=wp(v);if(p)pts.push(p);});if(pts.length>0)dxfElements.push({type:'POLYLINE',pts,closed:!!en.closed,layer:ln});}else if(en.type==='CIRCLE'&&en.center&&Number.isFinite(en.radius)){let c=wp(en.center),r=en.radius*Math.abs(tf.sx);if(c&&Number.isFinite(r))dxfElements.push({type:'CIRCLE',c,r:Math.abs(r),layer:ln});}else if(en.type==='ARC'&&en.center&&Number.isFinite(en.radius)){let c=wp(en.center),r=en.radius*Math.abs(tf.sx);if(c&&Number.isFinite(r)&&Number.isFinite(en.startAngle)&&Number.isFinite(en.endAngle))dxfElements.push({type:'ARC',c,r:Math.abs(r),sa:en.startAngle+(tf.rot*Math.PI/180),ea:en.endAngle+(tf.rot*Math.PI/180),layer:ln});}else if(en.type==='POINT'&&en.position){let p=wp(en.position);if(p)dxfElements.push({type:'POINT',p,layer:ln});}else if(en.type==='TEXT'||en.type==='MTEXT'){if(en.startPoint&&en.text){let p=wp(en.startPoint);if(p)dxfElements.push({type:'TEXT',text:en.text,x:p.x,y:p.y,h:(en.textHeight||1)*Math.abs(tf.sy),rot:(en.rotation||0)*Math.PI/180+(tf.rot*Math.PI/180),layer:ln});}}}catch(err){}}}}tr(dxfData.entities,{x:0,y:0,sx:1,sy:1,rot:0},0);buildDxfLayersPanel();rebuildCachedPath();_autoImportDxfZ();
  if(typeof _updateZPointSelect==='function')setTimeout(_updateZPointSelect,200);
}
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
function draw(){const cv=document.getElementById('cad-canvas'),cx=cv.getContext('2d'),pr=isExportingPDF?4:1;if(cx.resetTransform)cx.resetTransform();else cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#ffffff';cx.fillRect(0,0,cv.width,cv.height);if(!dxfData||!cachedPath){cx.strokeStyle='#f1f5f9';cx.lineWidth=1*pr;for(let x=0;x<cv.width;x+=50*pr){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,cv.height);cx.stroke();}for(let y=0;y<cv.height;y+=50*pr){cx.beginPath();cx.moveTo(0,y);cx.lineTo(cv.width,y);cx.stroke();}cx.fillStyle='#94a3b8';cx.font=`${16*pr}px sans-serif`;cx.textAlign='center';cx.fillText('Откройте файл для начала работы',cv.width/2,cv.height/2);cx.textAlign='left';return;}cx.save();if(northAngle!==0){cx.translate(cv.width/2,cv.height/2);cx.rotate(-northAngle*Math.PI/180);cx.translate(-cv.width/2,-cv.height/2);}cx.translate(panX,panY);cx.scale(scale,-scale);if(showGrid&&cadMaxX>cadMinX){var _rw=cadMaxX-cadMinX;var _mag=Math.pow(10,Math.floor(Math.log10(_rw/8)));var _gs=[1,2,5].reduce(function(p,v){return Math.abs(_rw/8-v*_mag)<Math.abs(_rw/8-p*_mag)?v:p;})*_mag;cx.save();cx.strokeStyle="rgba(100,140,220,0.18)";cx.lineWidth=0.4/scale;for(var _xi=Math.floor(cadMinX/_gs)*_gs;_xi<=cadMaxX+_gs;_xi+=_gs){cx.beginPath();cx.moveTo(_xi,cadMinY-_gs);cx.lineTo(_xi,cadMaxY+_gs);cx.stroke();}for(var _yi=Math.floor(cadMinY/_gs)*_gs;_yi<=cadMaxY+_gs;_yi+=_gs){cx.beginPath();cx.moveTo(cadMinX-_gs,_yi);cx.lineTo(cadMaxX+_gs,_yi);cx.stroke();}cx.restore();}if(northPickHover){cx.save();cx.strokeStyle="#f59e0b";cx.lineWidth=1.5/scale;cx.beginPath();cx.arc(northPickHover.x-cadOriginX,northPickHover.y-cadOriginY,5/scale,0,Math.PI*2);cx.stroke();cx.restore();}cx.strokeStyle=lineColor;cx.lineWidth=(1.2/scale)*pr;cx.lineCap='round';cx.lineJoin='round';cx.stroke(cachedPath);if(secondDxfElements&&secondDxfElements.length>0&&secondDxfVisible){if(secondDxfLinesVisible){const sp2=new Path2D();secondDxfElements.forEach(e=>{if(e.type==='POLYLINE'){let f=true;e.pts.forEach(p=>{if(f){sp2.moveTo(p.x-cadOriginX,p.y-cadOriginY);f=false;}else sp2.lineTo(p.x-cadOriginX,p.y-cadOriginY);});if(e.closed)sp2.closePath();}else if(e.type==='CIRCLE'){sp2.moveTo((e.c.x-cadOriginX)+e.r,e.c.y-cadOriginY);sp2.arc(e.c.x-cadOriginX,e.c.y-cadOriginY,e.r,0,Math.PI*2);}else if(e.type==='ARC'){sp2.moveTo((e.c.x-cadOriginX)+e.r*Math.cos(e.sa),(e.c.y-cadOriginY)+e.r*Math.sin(e.sa));sp2.arc(e.c.x-cadOriginX,e.c.y-cadOriginY,e.r,e.sa,e.ea,false);}});cx.strokeStyle='#f97316';cx.lineWidth=(1.8/scale)*pr;cx.lineCap='round';cx.stroke(sp2);}if(secondDxfPointsVisible){const _nr=2.5/scale*pr;secondDxfElements.forEach(e=>{if(e.type==='POINT'){const _px=e.p.x-cadOriginX,_py=e.p.y-cadOriginY,_cr=4/scale*pr;cx.strokeStyle='#ea580c';cx.lineWidth=1.5/scale*pr;cx.beginPath();cx.moveTo(_px-_cr,_py);cx.lineTo(_px+_cr,_py);cx.moveTo(_px,_py-_cr);cx.lineTo(_px,_py+_cr);cx.stroke();cx.beginPath();cx.arc(_px,_py,_nr*1.4,0,Math.PI*2);cx.fillStyle='#ea580c';cx.fill();cx.strokeStyle='#fff';cx.lineWidth=0.5/scale*pr;cx.stroke();}else if(e.type==='TEXT'&&e.text){const _th=Math.max(e.h||0.3,4/scale*pr);cx.save();cx.translate(e.p.x-cadOriginX,e.p.y-cadOriginY);cx.scale(1/scale,-1/scale);cx.font='bold '+(Math.max(_th*scale,8))+'px sans-serif';cx.fillStyle='#c2410c';cx.textBaseline='bottom';cx.fillText(e.text,3,0);cx.restore();}});cx.strokeStyle=lineColor;cx.lineWidth=(1.2/scale)*pr;}}
  // Draw symbols in world space
  _drawSymbols(cx,scale,cadOriginX,cadOriginY,pr);
  // Live symbol preview
  if(typeof _snpActive!=='undefined'&&_snpActive)_snpDrawPreview(cx,scale);
  cx.restore();cx.save();if(northAngle!==0){cx.translate(cv.width/2,cv.height/2);cx.rotate(-northAngle*Math.PI/180);cx.translate(-cv.width/2,-cv.height/2);}cx.fillStyle='#334155';cx.beginPath();cadPoints.forEach(p=>{const sp=cadToScreen(p.x,p.y);cx.moveTo(sp.x+1.2*pr,sp.y);cx.arc(sp.x,sp.y,1.2*pr,0,Math.PI*2);});cx.fill();if(earthworksData&&earthworksData.polygon){cx.beginPath();earthworksData.polygon.forEach((p,i)=>{const sp=cadToScreen(p.x,p.y);if(i===0)cx.moveTo(sp.x,sp.y);else cx.lineTo(sp.x,sp.y);});cx.closePath();cx.fillStyle='rgba(249, 115, 22, 0.15)';cx.fill();cx.strokeStyle='#f97316';cx.lineWidth=0.8*pr;cx.setLineDash([4*pr,4*pr]);cx.stroke();cx.setLineDash([]);}if(dxfShowContours&&dxfCachedContours.length>0){cx.lineWidth=1.2*pr;cx.globalAlpha=typeof dxfContourOpacity!=='undefined'?dxfContourOpacity:0.55;cx.strokeStyle=dxfContourColor||'#78716c';cx.beginPath();dxfCachedContours.forEach(c=>{const pt=c.points;if(pt.length<2)return;const s0=cadToScreen(pt[0].x,pt[0].y);cx.moveTo(s0.x,s0.y);if(pt.length===2){const s1=cadToScreen(pt[1].x,pt[1].y);cx.lineTo(s1.x,s1.y);}else{for(let i=1;i<pt.length-1;i++){const sc=cadToScreen(pt[i].x,pt[i].y),sn=cadToScreen(pt[i+1].x,pt[i+1].y),mx=(sc.x+sn.x)/2,my=(sc.y+sn.y)/2;cx.quadraticCurveTo(sc.x,sc.y,mx,my);}const sl=cadToScreen(pt[pt.length-1].x,pt[pt.length-1].y);cx.lineTo(sl.x,sl.y);}});cx.stroke();dxfCachedContours.forEach(c=>{const pt=c.points;if(pt.length>=2){const mid=Math.floor(pt.length/2),p1=pt[mid-1]||pt[0],p2=pt[mid]||pt[1],s1=cadToScreen(p1.x,p1.y),s2=cadToScreen(p2.x,p2.y);let a=Math.atan2(s2.y-s1.y,s2.x-s1.x);if(a>Math.PI/2||a<-Math.PI/2)a+=Math.PI;cx.save();cx.translate((s1.x+s2.x)/2,(s1.y+s2.y)/2);cx.rotate(a);cx.textAlign='center';cx.textBaseline='middle';const t=c.z.toFixed(2);cx.font=`bold ${8*pr}px sans-serif`;cx.lineWidth=1.5*pr;cx.strokeStyle='#ffffff';cx.strokeText(t,0,0);cx.fillStyle='#78350f';cx.fillText(t,0,0);cx.restore();}});}const padX=100/scale,padY=100/scale,mx=cadOriginX-panX/scale-padX,Mx=cadOriginX+(cv.width-panX)/scale+padX,my=cadOriginY+(panY-cv.height)/scale-padY,My=cadOriginY+panY/scale+padY;for(let i=0;i<cadTexts.length;i++){const t=cadTexts[i];if(t.x<mx||t.x>Mx||t.y<my||t.y>My)continue;if(points.some(p=>`P${p.id}`===t.text.trim()||p.id.toString()===t.text.trim()))continue;let sh=t.h*scale;
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
}}cx.restore()
if(pdfFrame&&Number.isFinite(pdfFrame.x1)){
  var _pf1=cadToScreen(pdfFrame.x1,pdfFrame.y1),_pf2=cadToScreen(pdfFrame.x2,pdfFrame.y2);
  var _pfx=Math.min(_pf1.x,_pf2.x),_pfy=Math.min(_pf1.y,_pf2.y);
  var _pfw=Math.abs(_pf2.x-_pf1.x),_pfh=Math.abs(_pf2.y-_pf1.y);
  cx.strokeStyle='#2563eb';cx.lineWidth=0.8*pr;cx.setLineDash([6*pr,3*pr]);
  cx.strokeRect(_pfx,_pfy,_pfw,_pfh);cx.setLineDash([]);
  cx.fillStyle='rgba(37,99,235,0.04)';cx.fillRect(_pfx,_pfy,_pfw,_pfh);
  cx.fillStyle='#2563eb';cx.font=(8*pr)+'px sans-serif';
  cx.fillText('📄 PDF',_pfx+3*pr,_pfy+10*pr);
};}

const dxfCanvasEv=document.getElementById('cad-canvas');
dxfCanvasEv.addEventListener('mousedown',(e)=>{
  if(georefPickMode!==null&&e.button===0&&currentMode==='dxf'){
    const rb=dxfCanvasEv.getBoundingClientRect(),wc=screenToCad(e.clientX-rb.left,e.clientY-rb.top);
    if(georefPickMode===1){document.getElementById('gr-p1-gx').value=wc.x.toFixed(3);document.getElementById('gr-p1-gy').value=wc.y.toFixed(3);_grP1G={x:wc.x,y:wc.y};}
    else{document.getElementById('gr-p2-gx').value=wc.x.toFixed(3);document.getElementById('gr-p2-gy').value=wc.y.toFixed(3);_grP2G={x:wc.x,y:wc.y};}
    stopGeorefPick();openGeoreferenceModal();return;
  }
  if(currentMode!=='dxf')return;
  if(e.button===0&&pdfFrameDrawing){
    const _rpf=dxfCanvasEv.getBoundingClientRect();
    pdfFrameStart=screenToCad(e.clientX-_rpf.left,e.clientY-_rpf.top);
    pdfFrame=null;return;
  }
  if(e.button===0&&currentTool==='area'){
    isDrawingArea=true;
    const r=dxfCanvasEv.getBoundingClientRect(),c=screenToCad(e.clientX-r.left,e.clientY-r.top);
    exportArea={x1:c.x,y1:c.y,x2:c.x,y2:c.y};requestDraw();
  }else if(e.button===0||e.button===1){
    if(e.button===1)e.preventDefault();
    isDragging=true;dragMoved=false;lastMouseX=e.clientX;lastMouseY=e.clientY;
  }
});
dxfCanvasEv.addEventListener('mousemove',(e)=>{if(currentMode!=='dxf')return;if(isDragging){const dx=e.clientX-lastMouseX,dy=e.clientY-lastMouseY;if(!dragMoved&&(Math.abs(dx)>3||Math.abs(dy)>3))dragMoved=true;if(dragMoved){if(northAngle!==0){var _a=northAngle*Math.PI/180,_c=Math.cos(_a),_s=Math.sin(_a);panX+=dx*_c-dy*_s;panY+=dx*_s+dy*_c;}else{panX+=dx;panY+=dy;}lastMouseX=e.clientX;lastMouseY=e.clientY;currentSnapPoint=null;requestDraw();return;}}const r=dxfCanvasEv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;if(pdfFrameDrawing&&pdfFrameStart){var _pfend=screenToCad(mx,my);pdfFrame={x1:pdfFrameStart.x,y1:pdfFrameStart.y,x2:_pfend.x,y2:_pfend.y};requestDraw();}// Track mouse for contour live preview and pdfFrame drawing
if(contourActive&&!contourClosed){contourMousePos=screenToCad(mx,my);requestDraw();}
  if(_snpActive){_snpMouse=screenToCad(mx,my);requestDraw();}

if(pdfFrameDrawing&&pdfFrameStart){
  var _pfend=screenToCad(mx,my);
  pdfFrame={x1:pdfFrameStart.x,y1:pdfFrameStart.y,x2:_pfend.x,y2:_pfend.y};
  requestDraw();
}
if(isDrawingArea){const c=screenToCad(mx,my);exportArea.x2=c.x;exportArea.y2=c.y;requestDraw();}else if(dxfData&&(currentTool==='point'||currentTool==='dimension'||currentTool==='interpolate')){const cm=screenToCad(mx,my),st=15/scale,sts=st*st;
let cd=Infinity,cp=null;
// NODE snap
if(snapModes.nodes){
  for(let i=0;i<cadSnapPoints.length;i++){const p=cadSnapPoints[i],dx=p.x-cm.x;
    if(Math.abs(dx)>st)continue;const dy=p.y-cm.y;
    if(Math.abs(dy)>st)continue;
    const d2=dx*dx+dy*dy;if(d2<sts&&d2<cd){cd=d2;cp={x:p.x,y:p.y,z:p.z||null,_snapType:'node'};}
  }
}
// LINE snap (nearest point on each segment)
if(snapModes.lines||snapModes.midpoints){
  var _segs=[];
  // From visible DXF elements
  if(dxfElements)dxfElements.forEach(function(el){
    if(el.type==='POLYLINE'&&el.pts&&el.pts.length>=2){
      for(var _si=0;_si<el.pts.length-1;_si++)_segs.push([el.pts[_si],el.pts[_si+1]]);
      if(el.closed&&el.pts.length>2)_segs.push([el.pts[el.pts.length-1],el.pts[0]]);
    }
  });
  // From second DXF
  if(secondDxfElements)secondDxfElements.forEach(function(el){
    if(el.type==='POLYLINE'&&el.pts&&el.pts.length>=2){
      for(var _si=0;_si<el.pts.length-1;_si++)_segs.push([el.pts[_si],el.pts[_si+1]]);
    }
  });
  _segs.forEach(function(seg){
    var A=seg[0],B=seg[1];
    var abx=B.x-A.x,aby=B.y-A.y,len2=abx*abx+aby*aby;
    if(len2<1e-10)return;
    // Midpoint
    if(snapModes.midpoints){
      var mx_=A.x+abx*0.5,my_=A.y+aby*0.5;
      var dm2=Math.pow(mx_-cm.x,2)+Math.pow(my_-cm.y,2);
      if(dm2<sts&&dm2<cd){cd=dm2;cp={x:mx_,y:my_,z:null,_snapType:'mid'};}
    }
    // Nearest on segment
    if(snapModes.lines){
      var t=((cm.x-A.x)*abx+(cm.y-A.y)*aby)/len2;
      t=Math.max(0,Math.min(1,t));
      var nx=A.x+t*abx,ny=A.y+t*aby;
      var dl2=Math.pow(nx-cm.x,2)+Math.pow(ny-cm.y,2);
      // Only use line snap if farther from node snap (prefer nodes)
      if(dl2<sts*0.5&&dl2<cd){cd=dl2;cp={x:nx,y:ny,z:null,_snapType:'line'};}
    }
  });
}
if(cp)currentSnapType=cp._snapType||'node';
else currentSnapType='';
if(currentTool==='dimension'&&currentDimStart&&e.shiftKey){const dx=cm.x-currentDimStart.x,dy=cm.y-currentDimStart.y;if(Math.abs(dx)>Math.abs(dy))cm.y=currentDimStart.y;else cm.x=currentDimStart.x;}currentMouseCAD=cm;let nr=false;if(cp!==currentSnapPoint){currentSnapPoint=cp;nr=true;}
// Update HUD
if(true){
  var _hc=cp||cm;
  document.getElementById('hud-x').textContent=_hc.x.toFixed(3);
  document.getElementById('hud-y').textContent=_hc.y.toFixed(3);
  var _hz=document.getElementById('hud-z');
  var _hz_val=null;
  if(cp&&typeof cp.z!=='undefined'&&cp.z!==null)_hz_val=cp.z;
  else if(cadSnapPoints&&cp){var _sp2=cadSnapPoints.find(function(s){return Math.abs(s.x-cp.x)<0.001&&Math.abs(s.y-cp.y)<0.001;});if(_sp2&&_sp2.z!=null)_hz_val=_sp2.z;}
  _hz.textContent=_hz_val!==null?_hz_val.toFixed(3):'—';
  document.getElementById('hud-snap').textContent=cp?'⊕ '+currentSnapType:'';
}if(currentTool==='dimension'&&currentDimStart)nr=true;if(nr)requestDraw();}});
window.addEventListener('mouseup',(e)=>{
  if(e.button===0&&pdfFrameDrawing){
    pdfFrameDrawing=false;
    var _cv3=document.getElementById('cad-canvas');if(_cv3)_cv3.style.cursor='';
    if(pdfFrame&&Math.abs(pdfFrame.x1-pdfFrame.x2)>0.01&&Math.abs(pdfFrame.y1-pdfFrame.y2)>0.01){
      showMessage('PDF-рамка ✓','Область выделена. Нажмите кнопку PDF.','success');
    var _pfBtn=document.getElementById('btn-clear-pdf-frame');
    if(_pfBtn)_pfBtn.classList.remove('hidden');
    }else{pdfFrame=null;}
    requestDraw();return;
  }
  if(currentMode!=='dxf')return;
  if(e.button===0&&e.target===dxfCanvasEv&&contourActive&&!contourClosed&&!(typeof _sdpActive!=='undefined'&&_sdpActive)){
    var _cr2=dxfCanvasEv.getBoundingClientRect();
    var _cmx2=e.clientX-_cr2.left,_cmy2=e.clientY-_cr2.top;
    var _cad2=screenToCad(_cmx2,_cmy2);
    // Snap
    var _TH2=15/scale,_best2=null,_bd2=Infinity;
    cadSnapPoints.forEach(function(p){
      var d=Math.hypot(p.x-_cad2.x,p.y-_cad2.y);
      if(d<_TH2&&d<_bd2){_bd2=d;_best2=p;}
    });
    if(_best2)_cad2={x:_best2.x,y:_best2.y};
    // Close contour if near first point
    if(contourPts.length>=3){
      if(Math.hypot(contourPts[0].x-_cad2.x,contourPts[0].y-_cad2.y)<_TH2*2){
        closeContour();return;}
    }
    contourPts.push({x:_cad2.x,y:_cad2.y});
    updateContourPanel();requestDraw();return;
  }
  if(isDragging){isDragging=false;if(!dragMoved&&e.target===dxfCanvasEv&&e.button===0&&currentTool!=='area'){if(!currentSnapPoint)return;const t=currentSnapPoint;if(currentTool==='point')addPoint(t.x,t.y);else if(currentTool==='interpolate')addInterpolatedPoint(t.x,t.y);else if(currentTool==='dimension'){if(!currentDimStart)currentDimStart=t;else{if(currentDimStart.x!==t.x||currentDimStart.y!==t.y)addDimension(currentDimStart,t);currentDimStart=null;}}requestDraw();}}else if(isDrawingArea){isDrawingArea=false;if(exportArea&&Math.abs(exportArea.x1-exportArea.x2)<0.1)exportArea=null;requestDraw();}});
dxfCanvasEv.addEventListener('mouseleave',()=>{isDragging=false;isDrawingArea=false;currentMouseCAD=null;currentSnapPoint=null;requestDraw();
  
  });
dxfCanvasEv.addEventListener('wheel',(e)=>{if(currentMode!=='dxf'||!dxfData)return;e.preventDefault();currentSnapPoint=null;const z=1.1,r=dxfCanvasEv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,rx=mx-panX,ry=my-panY,os=scale;if(e.deltaY<0)scale*=z;else scale/=z;if(scale>baseScale*100000)scale=baseScale*100000;if(scale<baseScale/10000)scale=baseScale/10000;panX=mx-rx*(scale/os);panY=my-ry*(scale/os);requestDraw();});

document.getElementById('file-input').addEventListener('change',function(e){
var f=e.target.files[0];if(!f)return;
var rI=function(){e.target.value='';};
if(f.name.toLowerCase().endsWith('.dwg')){
  showMessage('Ошибка','Формат DWG не поддерживается.\nВ AutoCAD: Сохранить как → DXF (ASCII) / R12 DXF.','warning');
  rI();return;
}
var r=new FileReader();
r.onload=function(ev){
  try{
    var P=window.DxfParser||(typeof DxfParser!=='undefined'?DxfParser:null);
    if(!P){showMessage('Ошибка','Библиотека dxf-parser не загружена.\nПроверьте соединение с интернетом и перезагрузите страницу.','error');rI();return;}
    var p=new P(),t=ev.target.result;
    if(!t||t.length===0){showMessage('Ошибка','Файл пуст.','warning');rI();return;}
    if(t.substring(0,20).includes('AutoCAD Binary DXF')){
      showMessage('Ошибка','Бинарный DXF не поддерживается.\nВ AutoCAD: Сохранить как → DXF (ASCII) / R12 DXF.','warning');
      rI();return;
    }
    dxfData=p.parseSync(t);
    if(!dxfData||!dxfData.entities||dxfData.entities.length===0)
      throw new Error('Файл пуст или не содержит объектов (секция ENTITIES пуста).');
    points=[];dimensions=[];exportArea=null;currentDimStart=null;earthworksData=null;
    clearDxfContours();
    var eb=document.getElementById('ew-result-box');if(eb)eb.classList.add('hidden');
    processCADData();
    var up=[];
    cadPoints.forEach(function(c){
      if(!up.find(function(u){return Math.abs(u.x-c.x)<0.001&&Math.abs(u.y-c.y)<0.001;}))
        up.push(c);
    });
    updateTable();updateDimsTable();fitViewToDXF();setTool('point');
    if(up.length>0){
      showConfirm('Импорт DXF',
        'Найдено точек POINT: '+up.length+'\nОбъектов всего: '+dxfData.entities.length+'\nСлоёв: '+Object.keys(dxfLayers).length+'\n\nДобавить точки в таблицу?',
        function(){
          up.forEach(function(u){
            points.push({
              id:points.length>0?Math.max.apply(null,points.map(function(pt){return pt.id;}))+1:1,
              x:u.x,y:u.y,
              z:(u.z!==null&&u.z!==undefined&&!isNaN(u.z))?parseFloat(u.z):null,
              type:(u.z!==null&&u.z!==undefined&&!isNaN(u.z))?'Абс.':'-'
            });
          });
          updateTable();requestDraw();
          showMessage('Успешно','Добавлено '+up.length+' точек.','success');
        });
    }else{
      showMessage('Успешно',
        'Чертёж загружен.\nОбъектов: '+dxfData.entities.length+', Слоёв: '+Object.keys(dxfLayers).length+'.\n\n(Точки POINT в файле не найдены — расставляйте вручную инструментом.)',
        'success');
    }
  }catch(err){
    showMessage('Ошибка','Не удалось открыть DXF.\n'+err.message,'error');
  }finally{rI();}
};
r.onerror=function(){showMessage('Ошибка','Ошибка чтения файла.','error');rI();};
r.readAsText(f,'windows-1251');
});

// === MANUAL MODE LOGIC ===
function requestManualDraw(){if(!manIsDrawingScheduled){manIsDrawingScheduled=true;requestAnimationFrame(()=>{drawManualCanvas();manIsDrawingScheduled=false;});}}
function resizeManualCanvas(){const c=document.getElementById('manual-canvas-container'),cv=document.getElementById('manual-canvas');if(c&&cv){cv.width=c.clientWidth;cv.height=c.clientHeight;fitManualView();}}
function fitManualView(){const cv=document.getElementById('manual-canvas');if(manualPoints.length===0){manScale=1;manOriginX=0;manOriginY=0;manPanX=cv.width/2;manPanY=cv.height/2;requestManualDraw();return;}if(manualPoints.length===1){manScale=1;manOriginX=manualPoints[0].x;manOriginY=manualPoints[0].y;manPanX=cv.width/2;manPanY=cv.height/2;requestManualDraw();return;}let mx=Infinity,my=Infinity,Mx=-Infinity,My=-Infinity;manualPoints.forEach(p=>{if(p.x<mx)mx=p.x;if(p.x>Mx)Mx=p.x;if(p.y<my)my=p.y;if(p.y>My)My=p.y;});if(Mx-mx<1){Mx+=10;mx-=10;}if(My-my<1){My+=10;my-=10;}manOriginX=(mx+Mx)/2;manOriginY=(my+My)/2;const pad=60,dx=Mx-mx,dy=My-my;manScale=Math.min((cv.width-pad*2)/dx,(cv.height-pad*2)/dy);manPanX=cv.width/2;manPanY=cv.height/2;requestManualDraw();}
function manToScreen(x,y){return{x:manPanX+(x-manOriginX)*manScale,y:manPanY-(y-manOriginY)*manScale};}
function screenToMan(x,y){return{x:manOriginX+(x-manPanX)/manScale,y:manOriginY+(manPanY-y)/manScale};}

function finishPolygon(){if(manPolyPoints.length>2){let a=0,p=0;for(let i=0;i<manPolyPoints.length;i++){let j=(i+1)%manPolyPoints.length;a+=(manPolyPoints[i].x*manPolyPoints[j].y)-(manPolyPoints[j].x*manPolyPoints[i].y);p+=Math.hypot(manPolyPoints[j].x-manPolyPoints[i].x,manPolyPoints[j].y-manPolyPoints[i].y);}a=Math.abs(a/2);customBoundaryPoly=[...manPolyPoints];showMessage("Измерение",`Площадь: ${a.toFixed(2)} кв.м\nПериметр: ${p.toFixed(2)} м\nКонтур сохранен.`,"success");}else if(manPolyPoints.length>0)showMessage("Внимание","Минимум 3 точки.","warning");manPolyPoints=[];requestManualDraw();}
function setManTool(t){manCurrentTool=t;manLineStartPoint=null;manPolyPoints=[];document.getElementById('man-tool-pan').className=t==='pan'?'p-2 md:p-2.5 rounded-lg bg-blue-100 text-blue-600 shadow-inner transition w-8 md:w-10':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-8 md:w-10';document.getElementById('man-tool-line').className=t==='line'?'p-2 md:p-2.5 rounded-lg bg-indigo-100 text-indigo-600 shadow-inner transition w-8 md:w-10':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-8 md:w-10';document.getElementById('man-tool-polygon').className=t==='polygon'?'p-2 md:p-2.5 rounded-lg bg-amber-100 text-amber-600 shadow-inner transition w-8 md:w-10':'p-2 md:p-2.5 rounded-lg hover:bg-slate-200 text-slate-600 transition w-8 md:w-10';const h=document.getElementById('man-tool-hint'),fb=document.getElementById('man-tool-finish-poly');if(fb)fb.classList.add('hidden');if(t==='pan'){h.innerHTML='<p><i class="fa-solid fa-hand w-3 md:w-4"></i> Панорамирование</p>';document.getElementById('manual-canvas').style.cursor='grab';}else if(t==='polygon'){h.innerHTML='<p><i class="fa-solid fa-draw-polygon w-3 md:w-4 text-amber-500"></i> Клик — узлы полигона</p>';document.getElementById('manual-canvas').style.cursor='crosshair';if(fb)fb.classList.remove('hidden');}else{h.innerHTML='<p><i class="fa-solid fa-pen-nib w-3 md:w-4 text-indigo-500"></i> Линия (Орто: Shift)</p>';document.getElementById('manual-canvas').style.cursor='crosshair';}requestManualDraw();}
function switchManTab(t){const tp=document.getElementById('tab-man-points'),tl=document.getElementById('tab-man-lines'),cp=document.getElementById('man-points-container'),cl=document.getElementById('man-lines-container');if(t==='points'){tp.className='flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-blue-600 border-b-2 border-blue-600 transition';tl.className='flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 border-b-2 border-transparent hover:text-slate-700 transition';cp.classList.remove('hidden');cl.classList.add('hidden');}else{tl.className='flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-blue-600 border-b-2 border-blue-600 transition';tp.className='flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 border-b-2 border-transparent hover:text-slate-700 transition';cl.classList.remove('hidden');cp.classList.add('hidden');}}
function updateManualTable(){const tb=document.getElementById('manual-points-tbody');if(manualPoints.length===0){tb.innerHTML=`<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400 italic">Добавьте точки.</td></tr>`;updateZDropdown();return;}let h='';manualPoints.forEach(p=>{const z=p.z!==null?p.z.toFixed(3):'-';h+=`<tr class="hover:bg-blue-50 border-b border-slate-100 bg-white"><td class="px-2 md:px-4 py-1.5 md:py-3 font-bold text-[10px] md:text-sm">P${p.id}</td><td class="px-1 md:px-2 py-1.5 md:py-3 font-mono text-[9px] md:text-xs text-blue-600">X:${p.x.toFixed(3)}<br><span class="text-emerald-600">Y:${p.y.toFixed(3)}</span></td><td class="px-1 md:px-2 py-1.5 md:py-3 font-mono text-[9px] md:text-xs font-semibold">${z}</td><td class="px-1 md:px-2 py-1.5 md:py-3 text-right"><button onclick="editManualPoint(${p.id})" class="text-blue-400 hover:text-blue-600 mr-1"><i class="fa-solid fa-pen"></i></button><button onclick="deleteManualPoint(${p.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button></td></tr>`;});tb.innerHTML=h;updateZDropdown();}
function updateManualLinesTable(){const tb=document.getElementById('manual-lines-tbody');if(manualLines.length===0){tb.innerHTML=`<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400 italic">Нет линий.</td></tr>`;return;}let h='';manualLines.forEach(l=>{const d=Math.hypot(l.p2.x-l.p1.x,l.p2.y-l.p1.y).toFixed(3);h+=`<tr class="hover:bg-blue-50 border-b border-slate-100 bg-white"><td class="px-2 md:px-4 py-1.5 md:py-3 font-bold text-[10px] md:text-xs">P${l.p1.id}-P${l.p2.id}</td><td class="px-1 md:px-2 py-1.5 md:py-3 font-mono text-[9px] md:text-xs">${d}</td><td class="px-1 md:px-2 py-1.5 md:py-3 text-right"><button onclick="deleteManualLine(${l.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button></td></tr>`;});tb.innerHTML=h;}
function editManualPoint(id){const p=manualPoints.find(pt=>pt.id===id);if(!p)return;document.getElementById('input-x').value=p.x;document.getElementById('input-y').value=p.y;document.getElementById('input-z').value=p.z!==null?p.z:'';editingManualPointId=id;const b=document.getElementById('btn-add-manual-point');b.innerHTML='<i class="fa-solid fa-save mr-1"></i> Сохранить';b.classList.remove('bg-blue-600','hover:bg-blue-500');b.classList.add('bg-emerald-600','hover:bg-emerald-500');}
function addManualPoint(){const x=parseFloat(document.getElementById('input-x').value.replace(',','.')),y=parseFloat(document.getElementById('input-y').value.replace(',','.')),z=parseFloat(document.getElementById('input-z').value.replace(',','.'));if(isNaN(x)||isNaN(y)){showMessage('Ошибка','X и Y обязательны.','warning');return;}if(editingManualPointId!==null){const p=manualPoints.find(pt=>pt.id===editingManualPointId);if(p){p.x=x;p.y=y;p.z=isNaN(z)?null:z;}editingManualPointId=null;const b=document.getElementById('btn-add-manual-point');b.innerHTML='<i class="fa-solid fa-plus mr-1"></i> Добавить';b.classList.remove('bg-emerald-600','hover:bg-emerald-500');b.classList.add('bg-blue-600','hover:bg-blue-500');}else manualPoints.push({id:manualPoints.length>0?Math.max(...manualPoints.map(pt=>pt.id))+1:1,x,y,z:isNaN(z)?null:z});saveManState();document.getElementById('input-x').value='';document.getElementById('input-y').value='';document.getElementById('input-z').value='';document.getElementById('input-x').focus();updateManualTable();updateManualLinesTable();fitManualView();if(showContours)generateContours();}
function deleteManualPoint(id){manualPoints=manualPoints.filter(p=>p.id!==id);manualLines=manualLines.filter(l=>l.p1.id!==id&&l.p2.id!==id);saveManState();updateManualTable();updateManualLinesTable();fitManualView();if(showContours)generateContours();}
function deleteManualLine(id){manualLines=manualLines.filter(l=>l.id!==id);saveManState();updateManualLinesTable();requestManualDraw();}
function clearManualPoints(){manualPoints=[];manualLines=[];manLineStartPoint=null;earthworksData=null;editingManualPointId=null;customBoundaryPoly=null;const b=document.getElementById('btn-add-manual-point');b.innerHTML='<i class="fa-solid fa-plus mr-1"></i> Добавить';b.classList.remove('bg-emerald-600');b.classList.add('bg-blue-600');const r=document.getElementById('ew-result-box');if(r)r.classList.add('hidden');clearContours();saveManState();updateManualTable();updateManualLinesTable();fitManualView();}

function drawManualCanvas(){
    const c=document.getElementById('manual-canvas'),ctx=c.getContext('2d'),pr=manIsExportingPDF?4:1;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);
    if(bgImageProps.img&&bgImageProps.visible&&!manIsExportingPDF){ctx.save();ctx.globalAlpha=bgImageProps.opacity;const sp=manToScreen(bgImageProps.x,bgImageProps.y),w=bgImageProps.img.width*bgImageProps.scale*manScale,h=bgImageProps.img.height*bgImageProps.scale*manScale;ctx.drawImage(bgImageProps.img,sp.x,sp.y-h,w,h);ctx.restore();}
    if(!manIsExportingPDF){ctx.strokeStyle='#f1f5f9';ctx.lineWidth=1*pr;for(let x=(manPanX%50);x<c.width;x+=50*pr){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke();}for(let y=(manPanY%50);y<c.height;y+=50*pr){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke();}const o=manToScreen(0,0);ctx.strokeStyle='#cbd5e1';ctx.lineWidth=1.5*pr;ctx.setLineDash([5*pr,5*pr]);if(o.y>=0&&o.y<=c.height){ctx.beginPath();ctx.moveTo(0,o.y);ctx.lineTo(c.width,o.y);ctx.stroke();}if(o.x>=0&&o.x<=c.width){ctx.beginPath();ctx.moveTo(o.x,0);ctx.lineTo(o.x,c.height);ctx.stroke();}ctx.setLineDash([]);}
    if(earthworksData&&earthworksData.polygon){ctx.beginPath();earthworksData.polygon.forEach((p,i)=>{const sp=manToScreen(p.x,p.y);if(i===0)ctx.moveTo(sp.x,sp.y);else ctx.lineTo(sp.x,sp.y);});ctx.closePath();ctx.fillStyle='rgba(249, 115, 22, 0.15)';ctx.fill();ctx.strokeStyle='#f97316';ctx.lineWidth=1.5*pr;ctx.setLineDash([5*pr,5*pr]);ctx.stroke();ctx.setLineDash([]);}
    if(manCurrentTool==='polygon'&&manPolyPoints.length>0){ctx.beginPath();ctx.strokeStyle='#f59e0b';ctx.lineWidth=2*pr;ctx.fillStyle='rgba(245, 158, 11, 0.2)';manPolyPoints.forEach((p,i)=>{const sp=manToScreen(p.x,p.y);if(i===0)ctx.moveTo(sp.x,sp.y);else ctx.lineTo(sp.x,sp.y);});if(manCurrentMousePos){const sp=manToScreen(manCurrentMousePos.x,manCurrentMousePos.y);ctx.lineTo(sp.x,sp.y);}ctx.stroke();ctx.fill();}
    if(showContours&&cachedContours.length>0){ctx.lineWidth=1.5*pr;ctx.strokeStyle='#b45309';ctx.beginPath();cachedContours.forEach(ct=>{const pt=ct.points;if(pt.length<2)return;const s0=manToScreen(pt[0].x,pt[0].y);ctx.moveTo(s0.x,s0.y);if(pt.length===2){const s1=manToScreen(pt[1].x,pt[1].y);ctx.lineTo(s1.x,s1.y);}else{for(let i=1;i<pt.length-1;i++){const sc=manToScreen(pt[i].x,pt[i].y),sn=manToScreen(pt[i+1].x,pt[i+1].y),mx=(sc.x+sn.x)/2,my=(sc.y+sn.y)/2;ctx.quadraticCurveTo(sc.x,sc.y,mx,my);}const sl=manToScreen(pt[pt.length-1].x,pt[pt.length-1].y);ctx.lineTo(sl.x,sl.y);}});ctx.stroke();cachedContours.forEach(ct=>{const pt=ct.points;if(pt.length>=2){const mid=Math.floor(pt.length/2),p1=pt[mid-1]||pt[0],p2=pt[mid]||pt[1],s1=manToScreen(p1.x,p1.y),s2=manToScreen(p2.x,p2.y),cx=(s1.x+s2.x)/2,cy=(s1.y+s2.y)/2;let a=Math.atan2(s2.y-s1.y,s2.x-s1.x);if(a>Math.PI/2||a<-Math.PI/2)a+=Math.PI;ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.textAlign='center';ctx.textBaseline='middle';const t=ct.z.toFixed(2);ctx.font=`bold ${10*pr}px sans-serif`;ctx.lineWidth=3*pr;ctx.strokeStyle='#ffffff';ctx.strokeText(t,0,0);ctx.fillStyle='#78350f';ctx.fillText(t,0,0);ctx.restore();}});}
    ctx.strokeStyle=manLineColor;ctx.lineWidth=1.5*pr;manualLines.forEach(l=>{const s1=manToScreen(l.p1.x,l.p1.y),s2=manToScreen(l.p2.x,l.p2.y);ctx.beginPath();ctx.moveTo(s1.x,s1.y);ctx.lineTo(s2.x,s2.y);ctx.stroke();});
    if(!manIsExportingPDF&&manCurrentTool==='line'&&manLineStartPoint&&manCurrentMousePos){const s1=manToScreen(manLineStartPoint.x,manLineStartPoint.y),s2=manSnapPoint?manToScreen(manSnapPoint.x,manSnapPoint.y):manToScreen(manCurrentMousePos.x,manCurrentMousePos.y);ctx.beginPath();ctx.moveTo(s1.x,s1.y);ctx.lineTo(s2.x,s2.y);ctx.setLineDash([4*pr,4*pr]);ctx.strokeStyle=manSnapPoint?'#10b981':'#ef4444';ctx.stroke();ctx.setLineDash([]);}
    manualPoints.forEach(p=>{const sp=manToScreen(p.x,p.y);ctx.beginPath();ctx.arc(sp.x,sp.y,2.5*pr,0,Math.PI*2);ctx.fillStyle='#3b82f6';ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=1.0*pr;ctx.stroke();if(showPointLabels){ctx.fillStyle='#0f172a';ctx.font=`bold ${10*pr}px sans-serif`;ctx.fillText(`P${p.id}`,sp.x+4*pr,sp.y-4*pr);}});
    if(!manIsExportingPDF&&(manCurrentTool==='line'||manCurrentTool==='polygon')&&manSnapPoint){const sp=manToScreen(manSnapPoint.x,manSnapPoint.y),sz=12*pr;ctx.fillStyle='rgba(16, 185, 129, 0.3)';ctx.fillRect(sp.x-sz/2,sp.y-sz/2,sz,sz);ctx.strokeStyle='#10b981';ctx.lineWidth=2*pr;ctx.strokeRect(sp.x-sz/2,sp.y-sz/2,sz,sz);}
    if(cadSymbols.length>0){ctx.save();ctx.translate(manPanX,manPanY);ctx.scale(manScale,-manScale);_drawSymbols(ctx,manScale,manOriginX,manOriginY,pr);ctx.restore();}if(manualPoints.length===0&&!manIsExportingPDF&&!bgImageProps.img){ctx.fillStyle='#94a3b8';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('Заполните форму или добавьте подложку',c.width/2,c.height/2);ctx.textAlign='left';}
}

const manCvs=document.getElementById('manual-canvas');
manCvs.addEventListener('mousedown',(e)=>{if(currentMode!=='manual')return;if(e.button===0&&manCurrentTool==='polygon'){const t=manSnapPoint||manCurrentMousePos;if(t){manPolyPoints.push(t);requestManualDraw();}return;}if(e.button===0&&manCurrentTool==='line'){if(manSnapPoint||manCurrentMousePos){let tp=manSnapPoint||manCurrentMousePos;if(!manSnapPoint){let nid=manualPoints.length>0?Math.max(...manualPoints.map(p=>p.id))+1:1;let np={id:nid,x:tp.x,y:tp.y,z:null};manualPoints.push(np);tp=np;}if(!manLineStartPoint)manLineStartPoint=tp;else{if(manLineStartPoint.id!==tp.id){const ex=manualLines.find(l=>(l.p1.id===manLineStartPoint.id&&l.p2.id===tp.id)||(l.p2.id===manLineStartPoint.id&&l.p1.id===tp.id));if(!ex){manualLines.push({id:manualLines.length>0?Math.max(...manualLines.map(line=>line.id))+1:1,p1:manLineStartPoint,p2:tp});saveManState();updateManualLinesTable();}}manLineStartPoint=null;}requestManualDraw();}return;}if(e.button===0||e.button===1){if(e.button===1)e.preventDefault();manIsDragging=true;manDragMoved=false;manLastX=e.clientX;manLastY=e.clientY;if(manCurrentTool==='pan')manCvs.style.cursor='grabbing';}});
manCvs.addEventListener('mousemove',(e)=>{if(!manIsDragging||currentMode!=='manual')return;const dx=e.clientX-manLastX,dy=e.clientY-manLastY;if(!manDragMoved&&(Math.abs(dx)>3||Math.abs(dy)>3))manDragMoved=true;if(manDragMoved){manPanX+=dx;manPanY+=dy;manLastX=e.clientX;manLastY=e.clientY;requestManualDraw();}});
manCvs.addEventListener('mousemove',(e)=>{if(currentMode!=='manual'||manIsDragging)return;const r=manCvs.getBoundingClientRect();manCurrentMousePos=screenToMan(e.clientX-r.left,e.clientY-r.top);if(manCurrentTool==='line'||manCurrentTool==='polygon'){if(manCurrentTool==='line'&&manLineStartPoint&&e.shiftKey){const dx=manCurrentMousePos.x-manLineStartPoint.x,dy=manCurrentMousePos.y-manLineStartPoint.y;if(Math.abs(dx)>Math.abs(dy))manCurrentMousePos.y=manLineStartPoint.y;else manCurrentMousePos.x=manLineStartPoint.x;}const sts=(15/manScale)**2;let cd=Infinity,cp=null;for(let i=0;i<manualPoints.length;i++){const p=manualPoints[i],d2=(p.x-manCurrentMousePos.x)**2+(p.y-manCurrentMousePos.y)**2;if(d2<sts&&d2<cd){cd=d2;cp=p;}}let nr=false;if(cp!==manSnapPoint){manSnapPoint=cp;nr=true;}if(manLineStartPoint||manPolyPoints.length>0)nr=true;if(nr)requestManualDraw();}});
window.addEventListener('mouseup',(ev)=>{
  if(currentMode!=='manual')return;
  if(manIsDragging){manIsDragging=false;if(manCurrentTool==='pan')manCvs.style.cursor='grab';return;}
  if(manCurrentTool==='dimension'){
    var _r=manCvs.getBoundingClientRect();
    var _w=screenToMan(ev.clientX-_r.left,ev.clientY-_r.top);
    var _th=12/manScale,_best=null,_bd=Infinity;
    manualPoints.forEach(function(p){var d=Math.hypot(p.x-_w.x,p.y-_w.y);if(d<_th&&d<_bd){_bd=d;_best=p;}});
    if(_best){_w.x=_best.x;_w.y=_best.y;}
    if(!manDimStart){manDimStart={x:_w.x,y:_w.y};}
    else{
      var _len=Math.hypot(_w.x-manDimStart.x,_w.y-manDimStart.y);
      if(_len>0.001){manDimensions.push({p1:{x:manDimStart.x,y:manDimStart.y},p2:{x:_w.x,y:_w.y},len:_len});saveManState();}
      manDimStart=null;
    }
    requestManualDraw();
  }
});
manCvs.addEventListener('mouseleave',()=>{manIsDragging=false;if(manCurrentTool==='pan')manCvs.style.cursor='grab';manSnapPoint=null;manCurrentMousePos=null;requestManualDraw();});
manCvs.addEventListener('wheel',(e)=>{if(currentMode!=='manual')return;e.preventDefault();const z=1.1,r=manCvs.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,rx=mx-manPanX,ry=manPanY-my,os=manScale;if(e.deltaY<0)manScale*=z;else manScale/=z;manPanX=mx-rx*(manScale/os);manPanY=my+ry*(manScale/os);requestManualDraw();});

document.getElementById('manual-dxf-input').addEventListener('change',function(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=(ev)=>{try{const P=window.DxfParser||DxfParser,p=new P(),txt=ev.target.result;if(txt.substring(0,20).includes("AutoCAD Binary DXF"))throw new Error("Сохраните в 'DXF (ASCII)'");const d=p.parseSync(txt);let c=0;const ep=[],ls=[];function tr(en,tf){if(!en)return;for(let i=0;i<en.length;i++){let n=en[i];if(!n)continue;if(n.type==='INSERT'&&d.blocks&&d.blocks[n.name]){let b=d.blocks[n.name],bx=n.position?(n.position.x||0):0,by=n.position?(n.position.y||0):0,bz=n.position&&n.position.z!==undefined?n.position.z:null,nx=bx*tf.sx,ny=by*tf.sy;if(tf.rot!==0){const r=tf.rot*Math.PI/180,cs=Math.cos(r),s=Math.sin(r),tx=nx*cs-ny*s,ty=nx*s+ny*cs;nx=tx;ny=ty;}tr(b.entities,{x:nx+tf.x,y:ny+tf.y,sx:tf.sx*(n.scale?(n.scale.x||1):1),sy:tf.sy*(n.scale?(n.scale.y||1):1),rot:tf.rot+(n.rotation||0)});ep.push({x:nx+tf.x,y:ny+tf.y,z:bz});}else{const wp=(pt)=>{if(!pt||!Number.isFinite(pt.x)||!Number.isFinite(pt.y))return null;let nx=pt.x*tf.sx,ny=pt.y*tf.sy;if(tf.rot!==0){const r=tf.rot*Math.PI/180,cs=Math.cos(r),s=Math.sin(r),tx=nx*cs-ny*s,ty=nx*s+ny*cs;nx=tx;ny=ty;}return{x:nx+tf.x,y:ny+tf.y,z:pt.z!==undefined?pt.z:null};};if(n.type==='POINT'&&n.position){let pt=wp(n.position);if(pt)ep.push(pt);}else if(n.type==='CIRCLE'&&n.center){let pt=wp(n.center);if(pt)ep.push(pt);}else if(n.type==='LINE'&&n.vertices&&n.vertices.length>=2){let a=wp(n.vertices[0]),b2=wp(n.vertices[1]);if(a&&b2){ep.push(a);ep.push(b2);ls.push([a,b2]);}}else if((n.type==='LWPOLYLINE'||n.type==='POLYLINE')&&n.vertices){const vv=[];n.vertices.forEach(v=>{let pt=wp(v);if(pt){ep.push(pt);vv.push(pt);}});for(let vi=0;vi<vv.length-1;vi++)ls.push([vv[vi],vv[vi+1]]);if(n.closed&&vv.length>2)ls.push([vv[vv.length-1],vv[0]]);}}}}if(d&&d.entities){tr(d.entities,{x:0,y:0,sx:1,sy:1,rot:0});const u=[];ep.forEach(pt=>{if(!u.find(k=>Math.abs(k.x-pt.x)<0.001&&Math.abs(k.y-pt.y)<0.001))u.push(pt);});const ptMap=new Map();u.forEach(pt=>{const id=manualPoints.length>0?Math.max(...manualPoints.map(mp=>mp.id))+1:1;const np={id,x:pt.x,y:pt.y,z:pt.z};manualPoints.push(np);c++;ptMap.set(pt.x.toFixed(4)+'_'+pt.y.toFixed(4),np);});const findPt=p=>ptMap.get(p.x.toFixed(4)+'_'+p.y.toFixed(4))||manualPoints.find(k=>Math.abs(k.x-p.x)<0.001&&Math.abs(k.y-p.y)<0.001);let lc=0;ls.forEach(seg=>{const pa=findPt(seg[0]),pb=findPt(seg[1]);if(!pa||!pb||pa===pb)return;const lid=manualLines.length>0?Math.max(...manualLines.map(l=>l.id))+1:1;manualLines.push({id:lid,p1:pa,p2:pb});lc++;});}if(c>0){saveManState();updateManualTable();updateManualLinesTable();fitManualView();showMessage("Завершено",`Импорт DXF: ${c} точек, ${lc} линий.`,"success");}else showMessage("Внимание","В DXF пусто.","warning");}catch(err){showMessage("Ошибка","Сбой DXF. "+(err.message||""),"error");}finally{e.target.value='';}};r.readAsText(f,'windows-1251');});
document.getElementById('manual-txt-input').addEventListener('change',function(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=(ev)=>{try{const l=ev.target.result.split('\n');let c=0;if(f.name.toLowerCase().endsWith('.sdr')){l.forEach(ln=>{if(ln.startsWith('08')){try{let x,y,z;if(ln.length>=80){y=parseFloat(ln.substring(20,36));x=parseFloat(ln.substring(36,52));z=parseFloat(ln.substring(52,68));}else{y=parseFloat(ln.substring(18,32));x=parseFloat(ln.substring(32,46));z=parseFloat(ln.substring(46,60));}if(!isNaN(x)&&!isNaN(y)){manualPoints.push({id:manualPoints.length>0?Math.max(...manualPoints.map(p=>p.id))+1:1,x,y,z:isNaN(z)?null:z});c++;}}catch(er){}}});if(c>0){saveManState();updateManualTable();fitManualView();showMessage('Успех',`Загружено SDR: ${c}`,'success');}else showMessage('Ошибка','Блоки 08 не найдены.','warning');}else{l.forEach(ln=>{const t=ln.trim();if(!t)return;const s=/;/.test(t)?';':(/\t/.test(t)?'\t':(/ /.test(t)?' ':',')),pts=t.split(s).filter(k=>k.trim()!=='').map(k=>parseFloat(s!==','?k.replace(',','.'):k)),n=pts.filter(k=>!isNaN(k));if(n.length>=2){manualPoints.push({id:manualPoints.length>0?Math.max(...manualPoints.map(p=>p.id))+1:1,x:n[0],y:n[1],z:n.length>=3?n[2]:null});c++;}});if(c>0){saveManState();updateManualTable();fitManualView();showMessage('Успех',`Точек: ${c}`,'success');}else showMessage('Ошибка','Формат: X Y Z','warning');}}catch(err){showMessage('Ошибка','Сбой чтения.','error');}finally{e.target.value='';}};r.readAsText(f);});
function exportManualToTXT(){if(manualPoints.length===0){showMessage('Нет данных','Добавьте точки.','warning');return;}let c='Имя,X,Y,Z\n';manualPoints.forEach(p=>c+=`P${p.id},${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z!==null?p.z.toFixed(3):'0.000'}\n`);const b=new Blob([c],{type:'text/csv;charset=utf-8;'}),u=window.URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='points.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);window.URL.revokeObjectURL(u);}
function exportManualToDXF(){if(manualPoints.length===0){showMessage('Нет данных','Добавьте точки.','warning');return;}let d=`0\nSECTION\n2\nHEADER\n9\n$PDMODE\n70\n0\n9\n$PDSIZE\n40\n0.0\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;manualPoints.forEach(p=>{const z=p.z!==null?p.z:0;d+=`0\nPOINT\n8\nPoints\n10\n${p.x}\n20\n${p.y}\n30\n${z}\n0\nTEXT\n8\nLabels\n10\n${p.x+0.5}\n20\n${p.y+0.5}\n30\n${z}\n40\n1.0\n1\nP${p.id}\n`;});manualLines.forEach(l=>{d+=`0\nLINE\n8\nLines\n10\n${l.p1.x}\n20\n${l.p1.y}\n30\n${l.p1.z||0}\n11\n${l.p2.x}\n21\n${l.p2.y}\n31\n${l.p2.z||0}\n`;});if(showContours&&cachedContours.length>0)cachedContours.forEach(c=>{for(let i=0;i<c.points.length-1;i++)d+=`0\nLINE\n8\nContours\n62\n30\n10\n${c.points[i].x}\n20\n${c.points[i].y}\n30\n${c.z}\n11\n${c.points[i+1].x}\n21\n${c.points[i+1].y}\n31\n${c.z}\n`;});d+=`0\nENDSEC\n0\nEOF\n`;const b=new Blob([d],{type:'text/plain'}),u=window.URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='manual.dxf';document.body.appendChild(a);a.click();document.body.removeChild(a);window.URL.revokeObjectURL(u);}

// === EVENTS & INIT ===
window.addEventListener('keydown',(e)=>{if(currentMode==='dxf'){if(e.key==='Escape'){if(currentTool==='dimension')currentDimStart=null;if(currentTool==='area')exportArea=null;requestDraw();}}else{if(e.key==='Escape'){if(manCurrentTool==='line')manLineStartPoint=null;requestManualDraw();}if(e.ctrlKey&&e.key==='z'){e.preventDefault();undoMan();}if(e.ctrlKey&&e.key==='y'){e.preventDefault();redoMan();}}if(e.key==='Shift'){if(currentMode==='dxf')requestDraw();else requestManualDraw();}});
window.addEventListener('keyup',(e)=>{if(e.key==='Shift'){if(currentMode==='dxf')requestDraw();else requestManualDraw();}});
window.addEventListener('contextmenu',(e)=>{if(currentMode==='manual'&&manCurrentTool==='polygon'){e.preventDefault();finishPolygon();}});
window.addEventListener('resize',()=>{if(currentMode==='dxf')resizeCanvas();else resizeManualCanvas();});
window.onload=()=>{_northInit();_symInit();setupTouchEvents('cad-canvas',true);setupTouchEvents('manual-canvas',false);updateTable();updateDimsTable();updateManualTable();updateManualLinesTable();switchMode('dxf');setTool('point');setManTool('pan');saveManState();};
// === RESTORED MISSING FUNCTIONS ===

// -- Undo / Redo -------------------------------------------------------------
function saveManState(){manHistory=manHistory.slice(0,manHistoryStep+1);manHistory.push({points:JSON.parse(JSON.stringify(manualPoints)),lines:manualLines.map(function(l){return{id:l.id,p1:Object.assign({},l.p1),p2:Object.assign({},l.p2)};})});if(manHistory.length>50)manHistory.shift();manHistoryStep=manHistory.length-1;}
function undoMan(){if(manHistoryStep>0){manHistoryStep--;var s=manHistory[manHistoryStep];manualPoints=JSON.parse(JSON.stringify(s.points));manualLines=s.lines.map(function(l){var p1=manualPoints.find(function(p){return p.id===l.p1.id;})||Object.assign({},l.p1);var p2=manualPoints.find(function(p){return p.id===l.p2.id;})||Object.assign({},l.p2);return{id:l.id,p1:p1,p2:p2};});updateManualTable();updateManualLinesTable();requestManualDraw();}}
function redoMan(){if(manHistoryStep<manHistory.length-1){manHistoryStep++;var s=manHistory[manHistoryStep];manualPoints=JSON.parse(JSON.stringify(s.points));manualLines=s.lines.map(function(l){var p1=manualPoints.find(function(p){return p.id===l.p1.id;})||Object.assign({},l.p1);var p2=manualPoints.find(function(p){return p.id===l.p2.id;})||Object.assign({},l.p2);return{id:l.id,p1:p1,p2:p2};});updateManualTable();updateManualLinesTable();requestManualDraw();}}

// -- Touch Events ------------------------------------------------------------
function setupTouchEvents(canvasId,isDxf){var cv=document.getElementById(canvasId);if(!cv)return;var lt=[],lpd=null;cv.addEventListener('touchstart',function(e){e.preventDefault();lt=Array.from(e.touches);if(lt.length===2)lpd=Math.hypot(lt[1].clientX-lt[0].clientX,lt[1].clientY-lt[0].clientY);},{passive:false});cv.addEventListener('touchmove',function(e){e.preventDefault();var t=Array.from(e.touches);if(t.length===1&&lt.length>=1){var dx=t[0].clientX-lt[0].clientX,dy=t[0].clientY-lt[0].clientY;if(isDxf){if(northAngle!==0){var _a2=northAngle*Math.PI/180,_c2=Math.cos(_a2),_s2=Math.sin(_a2);panX+=dx*_c2-dy*_s2;panY+=dx*_s2+dy*_c2;}else{panX+=dx;panY+=dy;}}else{manPanX+=dx;manPanY+=dy;}lt=t;if(isDxf)requestDraw();else requestManualDraw();}else if(t.length===2&&lt.length>=2){var cd=Math.hypot(t[1].clientX-t[0].clientX,t[1].clientY-t[0].clientY);if(lpd&&cd>0){var z=cd/lpd,r=cv.getBoundingClientRect(),cx2=(t[0].clientX+t[1].clientX)/2-r.left,cy2=(t[0].clientY+t[1].clientY)/2-r.top;if(isDxf){var rx=cx2-panX,ry=cy2-panY,os=scale;scale*=z;if(scale>baseScale*100000)scale=baseScale*100000;if(scale<baseScale/10000)scale=baseScale/10000;panX=cx2-rx*(scale/os);panY=cy2-ry*(scale/os);}else{var rxM=cx2-manPanX,ryM=manPanY-cy2,osM=manScale;manScale*=z;manPanX=cx2-rxM*(manScale/osM);manPanY=cy2+ryM*(manScale/osM);}lpd=cd;}lt=t;if(isDxf)requestDraw();else requestManualDraw();}},{passive:false});cv.addEventListener('touchend',function(e){lt=Array.from(e.touches);if(lt.length<2)lpd=null;},{passive:false});}

// -- Background Image --------------------------------------------------------
function toggleBgImagePanel(){var p=document.getElementById('bg-image-panel');if(p.classList.contains('hidden')){p.classList.remove('hidden');p.style.display='flex';}else{p.classList.add('hidden');p.style.display='none';}}
function clearBgImage(){bgImageProps={img:null,x:0,y:0,scale:1,opacity:0.5,visible:true};var b=document.getElementById('btn-bg-settings');if(b)b.classList.add('hidden');var bi=document.getElementById('bg-img-input');if(bi)bi.value='';toggleBgImagePanel();requestManualDraw();}
document.getElementById('bg-img-input').addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;var reader=new FileReader();reader.onload=function(ev){var img=new Image();img.onload=function(){bgImageProps.img=img;var b=document.getElementById('btn-bg-settings');if(b)b.classList.remove('hidden');requestManualDraw();};img.src=ev.target.result;};reader.readAsDataURL(f);e.target.value='';});

// -- Manual Panel Toggle -----------------------------------------------------
function toggleManualPanel(){var p=document.getElementById('manual-left-panel'),b=document.getElementById('btn-toggle-man-panel');isManPanelOpen=!isManPanelOpen;if(isManPanelOpen){p.classList.remove('hidden');if(b)b.innerHTML='<i class="fa-solid fa-bars"></i>';}else{p.classList.add('hidden');if(b)b.innerHTML='<i class="fa-solid fa-chevron-right"></i>';}setTimeout(function(){resizeManualCanvas();},50);}

// -- Contours (Manual) -------------------------------------------------------
function toggleContoursConfig(){var p=document.getElementById('contours-panel');if(p.classList.contains('hidden')){p.classList.remove('hidden');p.style.display='flex';}else{p.classList.add('hidden');p.style.display='none';}}
function toggleManContourVis(){showContours=document.getElementById('man-contour-visible').checked;requestManualDraw();}
function clearContours(){showContours=false;cachedContours=[];var b=document.getElementById('btn-build-contours');if(b){b.textContent='Построить';b.className='w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] md:text-sm font-medium py-1 md:py-1.5 rounded transition shadow-sm mt-1';}var cb=document.getElementById('man-contour-visible');if(cb)cb.checked=true;requestManualDraw();}
function generateContours(){var st=parseFloat(document.getElementById('contour-step').value);if(isNaN(st)||st<=0){showMessage('Ошибка','Шаг > 0','warning');return;}var pts=manualPoints.filter(function(pt){return pt.z!==null&&Number.isFinite(pt.z);});if(pts.length<3){showMessage('Ошибка','Мин 3 точки с Z','warning');return;}try{var coords=[];pts.forEach(function(pt){coords.push(pt.x,pt.y);});var d=new Delaunator(coords);cachedContours=[];var eps=0.00001,segs={};for(var i=0;i<d.triangles.length;i+=3){var i0=d.triangles[i],i1=d.triangles[i+1],i2=d.triangles[i+2];var p0={x:pts[i0].x,y:pts[i0].y,z:pts[i0].z+eps},p1={x:pts[i1].x,y:pts[i1].y,z:pts[i1].z+eps*2},p2={x:pts[i2].x,y:pts[i2].y,z:pts[i2].z+eps*3};var mzT=Math.min(p0.z,p1.z,p2.z),MzT=Math.max(p0.z,p1.z,p2.z),sl=Math.ceil(mzT/st)*st;for(var l=sl;l<=MzT;l+=st){var xs=[];[[p0,p1],[p1,p2],[p2,p0]].forEach(function(ed){var a=ed[0],b=ed[1];if((a.z<l&&b.z>l)||(a.z>l&&b.z<l)){var t=(l-a.z)/(b.z-a.z);xs.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}});if(xs.length===2){if(!segs[l])segs[l]=[];segs[l].push({p1:xs[0],p2:xs[1]});}}}var pm=function(a,b){return Math.abs(a.x-b.x)<0.0001&&Math.abs(a.y-b.y)<0.0001;};for(var ls in segs){var lv=parseFloat(ls),seg=segs[ls],pa=[];var rem=seg.slice();while(rem.length>0){var cp=[];var sg=rem.shift();cp.push(sg.p1,sg.p2);var again;do{again=false;for(var ri=0;ri<rem.length;ri++){var rs=rem[ri],h=cp[0],t=cp[cp.length-1];if(pm(t,rs.p1)){cp.push(rs.p2);rem.splice(ri,1);again=true;break;}else if(pm(t,rs.p2)){cp.push(rs.p1);rem.splice(ri,1);again=true;break;}else if(pm(h,rs.p1)){cp.unshift(rs.p2);rem.splice(ri,1);again=true;break;}else if(pm(h,rs.p2)){cp.unshift(rs.p1);rem.splice(ri,1);again=true;break;}}}while(again);pa.push(cp);}pa.forEach(function(pt){cachedContours.push({z:lv,points:pt});});}showContours=true;var vcb=document.getElementById('man-contour-visible');if(vcb)vcb.checked=true;var btn=document.getElementById('btn-build-contours');if(btn){btn.textContent='Обновить';btn.className='w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] md:text-sm font-medium py-1 md:py-1.5 rounded transition shadow-sm mt-1';}requestManualDraw();}catch(err){showMessage('Ошибка','Сбой триангуляции: '+err.message,'error');}}

// -- DXF Contour Visibility --------------------------------------------------
function toggleDxfContourVis(){dxfShowContours=document.getElementById('dxf-contour-visible').checked;requestDraw();}

// -- PDF Export --------------------------------------------------------------
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
function _buildAndSavePDF(pdfMeta,canvasId,pts,dims,lines){
  var cv=document.getElementById(canvasId);
  if(!cv){showMessage('Ошибка','Чертёж не найден','error');return;}

  // ── A3 landscape dimensions (px at 96dpi) ─────────────────────────────
  var A3W=1587,A3H=1123; // 420×297mm at 96dpi
  var MARGIN=30,SB=280;  // SB = right-panel width (title block)

  // ── Off-screen render canvas ───────────────────────────────────────────
  var oc=document.createElement('canvas');
  oc.width=A3W;oc.height=A3H;
  var c=oc.getContext('2d');

  // ── Background ─────────────────────────────────────────────────────────
  c.fillStyle='#fff';c.fillRect(0,0,A3W,A3H);

  // ── BORDER outer ───────────────────────────────────────────────────────
  c.strokeStyle='#000';c.lineWidth=2;
  c.strokeRect(MARGIN,MARGIN,A3W-MARGIN*2,A3H-MARGIN*2);
  // Inner border (drawing field)
  var DW=A3W-MARGIN*2-SB-4, DH=A3H-MARGIN*2;
  var DX=MARGIN+2, DY=MARGIN+2;
  c.lineWidth=0.5;
  c.strokeRect(DX,DY,DW,DH);

  // ── DRAWING: capture canvas content ───────────────────────────────────
  var snapScale=pdfFrame?1:1;
  var drawnOk=false;
  try{
    // Clip to drawing field
    c.save();
    c.beginPath();c.rect(DX+1,DY+1,DW-2,DH-2);c.clip();

    // Get bounding box from points or pdfFrame
    var mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity;
    if(pdfFrame&&Number.isFinite(pdfFrame.x1)){
      mnX=Math.min(pdfFrame.x1,pdfFrame.x2);mxX=Math.max(pdfFrame.x1,pdfFrame.x2);
      mnY=Math.min(pdfFrame.y1,pdfFrame.y2);mxY=Math.max(pdfFrame.y1,pdfFrame.y2);
    } else {
      pts.forEach(function(p){mnX=Math.min(mnX,p.x);mxX=Math.max(mxX,p.x);mnY=Math.min(mnY,p.y);mxY=Math.max(mxY,p.y);});
      if(dxfElements)dxfElements.forEach(function(el){if(el.pts)el.pts.forEach(function(p){mnX=Math.min(mnX,p.x);mxX=Math.max(mxX,p.x);mnY=Math.min(mnY,p.y);mxY=Math.max(mxY,p.y);});});
    }
    if(!Number.isFinite(mnX)){mnX=0;mxX=100;mnY=0;mxY=100;}

    var pad=Math.max((mxX-mnX),(mxY-mnY))*0.06||5;
    mnX-=pad;mxX+=pad;mnY-=pad;mxY+=pad;
    var ww=mxX-mnX,wh=mxY-mnY;
    var pdfSc=Math.min((DW-20)/ww,(DH-20)/wh);
    var offX=DX+10+(DW-20-ww*pdfSc)/2-mnX*pdfSc;
    var offY=DY+10+(DH-20-wh*pdfSc)/2+mxY*pdfSc;

    isExportingPDF=true;
    var prevPanX=panX,prevPanY=panY,prevScale=scale;
    panX=offX;panY=offY;scale=pdfSc;
    draw();
    // Snapshot
    c.drawImage(cv,0,0,cv.width,cv.height,DX,DY,DW,DH);
    panX=prevPanX;panY=prevPanY;scale=prevScale;
    isExportingPDF=false;
    if(canvasId==='cad-canvas')draw(); else drawManualCanvas();
    drawnOk=true;
    c.restore();
  }catch(ex){
    isExportingPDF=false;
    c.restore();
    c.fillStyle='#f8fafc';c.fillRect(DX+1,DY+1,DW-2,DH-2);
    c.fillStyle='#94a3b8';c.font='16px Arial';c.textAlign='center';
    c.fillText('Ошибка захвата чертежа: '+ex.message,DX+DW/2,DY+DH/2);
  }

  // ── RIGHT PANEL vertical line ─────────────────────────────────────────
  var PX=A3W-MARGIN-SB; // panel left edge
  c.strokeStyle='#000';c.lineWidth=1;
  c.beginPath();c.moveTo(PX,MARGIN);c.lineTo(PX,A3H-MARGIN);c.stroke();

  // ── LEGEND (upper right panel) ────────────────────────────────────────
  var lx=PX+8,ly=MARGIN+10,lw=SB-16;
  c.font='bold 10px Arial';c.fillStyle='#000';c.textAlign='center';
  c.fillText('Условные обозначения',PX+SB/2,ly+12);
  c.lineWidth=0.5;c.beginPath();c.moveTo(lx,ly+18);c.lineTo(PX+SB-8,ly+18);c.stroke();
  ly+=24;

  var legendItems=[
    {col:'#2563eb',dash:[8,4],lw:1.5,label:'Водопровод'},
    {col:'#7c3aed',dash:[6,3],lw:1.5,label:'Канализация'},
    {col:'#ea580c',dash:[4,4],lw:1.5,label:'Теплосеть'},
    {col:'#16a34a',dash:[3,3,1,3],lw:1.5,label:'Газопровод'},
    {col:'#000',dash:[],lw:1,label:'Электрокабель'},
    {col:'#1e293b',dash:[],lw:2,label:'Стена (ось)'},
    {col:'#64748b',dash:[],lw:6,label:'Капитальная стена'},
    {col:'#000',sym:'circle',label:'Колодец'},
    {col:'#000',sym:'cross',label:'Свая'},
    {col:'#000',sym:'square',label:'Столб/Колонна'},
  ];
  // Also add from cadSymbols legend
  var symTypes={};
  if(cadSymbols)cadSymbols.forEach(function(s){symTypes[s.type]=s;});

  legendItems.forEach(function(item){
    if(ly>A3H-MARGIN-200)return;
    var iy=ly+6;
    // Line sample
    if(item.sym==='circle'){
      c.strokeStyle=item.col;c.lineWidth=1;
      c.beginPath();c.arc(lx+18,iy,5,0,Math.PI*2);c.stroke();
    } else if(item.sym==='cross'){
      c.strokeStyle=item.col;c.lineWidth=1;
      c.beginPath();c.moveTo(lx+13,iy);c.lineTo(lx+23,iy);c.moveTo(lx+18,iy-5);c.lineTo(lx+18,iy+5);c.stroke();
    } else if(item.sym==='square'){
      c.strokeStyle=item.col;c.lineWidth=1;
      c.strokeRect(lx+13,iy-5,10,10);
    } else {
      c.strokeStyle=item.col;c.lineWidth=item.lw||1;
      if(item.dash&&item.dash.length)c.setLineDash(item.dash);else c.setLineDash([]);
      c.beginPath();c.moveTo(lx+5,iy);c.lineTo(lx+32,iy);c.stroke();
      c.setLineDash([]);
    }
    c.fillStyle='#1e293b';c.font='9px Arial';c.textAlign='left';
    c.fillText(item.label,lx+38,iy+3);
    ly+=16;
  });

  // Scale bar
  ly+=8;
  if(ly<A3H-MARGIN-140){
    var scText='Масштаб: 1:'+(pdfMeta.scale||'500');
    c.font='9px Arial';c.fillStyle='#000';c.textAlign='left';
    c.fillText(scText,lx,ly);ly+=12;
    // Scale bar graphic
    var barW=60,barSeg=3;
    for(var bi=0;bi<barSeg;bi++){
      c.fillStyle=bi%2===0?'#000':'#fff';
      c.fillRect(lx+bi*(barW/barSeg),ly,barW/barSeg,6);
      c.strokeStyle='#000';c.lineWidth=0.5;
      c.strokeRect(lx+bi*(barW/barSeg),ly,barW/barSeg,6);
    }
    ly+=10;
    c.font='8px Arial';c.fillStyle='#000';c.textAlign='left';
    c.fillText('0',lx-2,ly+6);
    c.textAlign='right';
    var mNum=pdfMeta.scale?Math.round(barW/pdfSc*parseFloat(pdfMeta.scale)):100;
    c.fillText(mNum+'м',lx+barW+2,ly+6);
    ly+=14;
  }

  // Coord system
  if(pdfMeta.coord){
    c.font='8px Arial';c.fillStyle='#000';c.textAlign='left';
    c.fillText('СК: '+pdfMeta.coord,lx,ly);ly+=12;
  }
  if(pdfMeta.height){
    c.fillText('ВО: '+pdfMeta.height,lx,ly);ly+=12;
  }

  // ── TITLE BLOCK (stamp) ───────────────────────────────────────────────
  var stampY=A3H-MARGIN-175;
  // Horizontal divider
  c.strokeStyle='#000';c.lineWidth=1;
  c.beginPath();c.moveTo(PX,stampY);c.lineTo(A3W-MARGIN,stampY);c.stroke();

  // Stamp grid
  var sCols=[0,40,72,90,SB];
  function stampLine(y){c.beginPath();c.moveTo(PX,y);c.lineTo(A3W-MARGIN,y);c.lineWidth=0.3;c.stroke();}
  function stampVLine(x){c.beginPath();c.moveTo(PX+x,stampY);c.lineTo(PX+x,A3H-MARGIN);c.lineWidth=0.3;c.stroke();}
  stampVLine(sCols[1]);stampVLine(sCols[2]);stampVLine(sCols[3]);

  // Rows
  var rows=[
    {label:'Разработал',name:'',sign:'',date:''},
    {label:'Проверил',name:'',sign:'',date:''},
    {label:'Геодезист',name:'',sign:'',date:''},
    {label:'Н. контр.',name:'',sign:'',date:''},
  ];
  var rh=18, ry=stampY;
  // Header row
  var hLabels=['Должность','Ф. И. О.','Подпись','Дата'];
  c.font='bold 7px Arial';c.fillStyle='#000';
  hLabels.forEach(function(hl,hi){
    var cx2=PX+sCols[hi]+(sCols[hi+1]-sCols[hi])/2;
    c.textAlign='center';c.fillText(hl,cx2,ry+rh/2+3);
  });
  stampLine(ry+rh);ry+=rh;

  rows.forEach(function(row){
    c.font='7px Arial';c.fillStyle='#1e293b';c.textAlign='left';
    c.fillText(row.label,PX+sCols[0]+2,ry+rh/2+3);
    stampLine(ry+rh);ry+=rh;
  });

  // Main info block
  c.lineWidth=0.5;
  c.beginPath();c.moveTo(PX,ry);c.lineTo(A3W-MARGIN,ry);c.stroke();
  // Org name
  c.font='bold 9px Arial';c.fillStyle='#000';c.textAlign='center';
  var org=pdfMeta.org||'ООО "Геодезия+"';
  c.fillText(org,PX+SB/2,ry+14);
  c.lineWidth=0.3;c.beginPath();c.moveTo(PX,ry+20);c.lineTo(A3W-MARGIN,ry+20);c.stroke();ry+=20;

  // Title
  c.font='bold 10px Arial';c.fillStyle='#000';c.textAlign='center';
  var title=pdfMeta.title||'Исполнительная схема';
  var words=title.split(' '),line1='',line2='';
  words.forEach(function(w){if(line1.length+w.length<25)line1+=w+' ';else line2+=w+' ';});
  c.fillText(line1.trim(),PX+SB/2,ry+12);
  if(line2.trim())c.fillText(line2.trim(),PX+SB/2,ry+24);
  c.lineWidth=0.3;c.beginPath();c.moveTo(PX,ry+30);c.lineTo(A3W-MARGIN,ry+30);c.stroke();ry+=30;

  // Bottom info row
  var infoX=PX+4;
  c.font='bold 8px Arial';c.fillStyle='#000';c.textAlign='left';
  var dateStr=new Date().toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
  c.fillText('Дата: '+dateStr,infoX,ry+10);
  c.textAlign='right';c.fillText('Лист 1 из 1',PX+SB-4,ry+10);

  // Top-left: project name small text
  c.font='8px Arial';c.fillStyle='#374151';c.textAlign='left';
  if(pdfMeta.note){
    var noteLines=pdfMeta.note.split('\n');
    noteLines.slice(0,3).forEach(function(nl,ni){
      c.fillText(nl,DX+4,DY+12+ni*12);
    });
  }

  // ── DATA TABLE (bottom of drawing area) ──────────────────────────────
  var tableY=A3H-MARGIN-2;
  // Points summary — small table at very bottom of drawing field
  var ptCount=pts.length;
  var areaText=_savedArea>0?_savedArea.toFixed(2)+' м²':'—';
  var volText=_savedVolume>0?_savedVolume.toFixed(2)+' м³':'—';
  c.font='7px Arial';c.fillStyle='#374151';c.textAlign='left';
  c.fillText('Точек: '+ptCount+'  |  Площадь: '+areaText+'  |  Объём: '+volText,
    DX+4,tableY-4);

  // ── PDF TABLE: points + dimensions ───────────────────────────────────
  var fontPt=5.5;
  var rowData=[['№','X, м','Y, м','Z, м','Тип']];
  pts.forEach(function(p){
    rowData.push([
      'P'+p.id,
      p.x.toFixed(3),
      p.y.toFixed(3),
      (p.z!=null&&p.z!==undefined)?p.z.toFixed(3):'—',
      p.type||'—'
    ]);
  });

  // ── Build print overlay HTML ──────────────────────────────────────────
  var imgData=oc.toDataURL('image/jpeg',0.95);
  var thS='font-size:'+fontPt+'pt;padding:0.5mm 1mm;background:#1e293b;color:#fff;'+
    'border:0.3pt solid #334155;';
  var tdS='font-size:'+fontPt+'pt;padding:0.4mm 1mm;border:0.2pt solid #cbd5e1;font-family:monospace;';

  var tblHtml='<table style="border-collapse:collapse;width:100%;font-size:'+fontPt+'pt;margin-top:4mm;">'+
    '<thead><tr>'+
    '<th style="'+thS+'width:8mm">№</th>'+
    '<th style="'+thS+'width:28mm">X, м</th>'+
    '<th style="'+thS+'width:28mm">Y, м</th>'+
    '<th style="'+thS+'width:18mm">Z, м</th>'+
    '<th style="'+thS+'width:18mm">Тип</th>'+
    '</tr></thead><tbody>';
  pts.forEach(function(p,i){
    var bg=i%2===0?'background:#f8fafc;':'';
    tblHtml+='<tr style="'+bg+'">'+
      '<td style="'+tdS+'">P'+p.id+'</td>'+
      '<td style="'+tdS+'">'+p.x.toFixed(3)+'</td>'+
      '<td style="'+tdS+'">'+p.y.toFixed(3)+'</td>'+
      '<td style="'+tdS+'">'+(p.z!=null?p.z.toFixed(3):'—')+'</td>'+
      '<td style="'+tdS+'">'+(p.type||'—')+'</td>'+
      '</tr>';
  });
  tblHtml+='</tbody></table>';

  // Add dimensions table
  if(dims&&dims.length){
    tblHtml+='<table style="border-collapse:collapse;margin-top:4mm;font-size:'+fontPt+'pt;">'+
      '<thead><tr>'+
      '<th style="'+thS+'width:20mm">Отрезок</th>'+
      '<th style="'+thS+'width:25mm">Длина, м</th>'+
      '</tr></thead><tbody>';
    dims.forEach(function(d,i){
      var bg=i%2===0?'background:#f8fafc;':'';
      var len=Math.hypot(d.p2.x-d.p1.x,d.p2.y-d.p1.y);
      tblHtml+='<tr style="'+bg+'">'+
        '<td style="'+tdS+'">P'+d.p1.id+'–P'+d.p2.id+'</td>'+
        '<td style="'+tdS+'">'+len.toFixed(3)+'</td>'+
        '</tr>';
    });
    tblHtml+='</tbody></table>';
  }

  // Area/volume
  if(_savedArea>0){
    tblHtml+='<table style="border-collapse:collapse;margin-top:4mm;font-size:'+fontPt+'pt;">'+
      '<thead><tr><th style="'+thS+'width:40mm">Параметр</th>'+
      '<th style="'+thS+'width:25mm">Значение</th></tr></thead><tbody>'+
      '<tr><td style="'+tdS+'">Площадь</td><td style="'+tdS+'">'+_savedArea.toFixed(3)+' м²</td></tr>'+
      '<tr style="background:#f8fafc"><td style="'+tdS+'">Периметр</td><td style="'+tdS+'">'+_savedPerimeter.toFixed(3)+' м</td></tr>'+
      (_savedVolume>0?'<tr><td style="'+tdS+'">Объём грунта</td><td style="'+tdS+'">'+_savedVolume.toFixed(3)+' м³</td></tr>':'');
    if(_savedPileVolume>0){
      tblHtml+='<tr style="background:#f8fafc"><td style="'+tdS+'">Объём бетона (сваи)</td><td style="'+tdS+'">'+_savedPileVolume.toFixed(3)+' м³</td></tr>'+
        '<tr><td style="'+tdS+'font-weight:bold">Итого</td><td style="'+tdS+'font-weight:bold">'+(_savedVolume+_savedPileVolume).toFixed(3)+' м³</td></tr>';
    }
    tblHtml+='</tbody></table>';
  }

  // ── Build print overlay ───────────────────────────────────────────────
  var overlay=document.getElementById('print-overlay');
  if(!overlay){overlay=document.createElement('div');overlay.id='print-overlay';document.body.appendChild(overlay);}
  overlay.style.cssText='display:none;position:fixed;inset:0;background:#fff;z-index:9999;overflow-y:auto;';
  overlay.className='pdf-printing';
  overlay.innerHTML=
    '<div style="max-width:297mm;margin:0 auto;padding:4mm;">' +
    '<img src="'+imgData+'" style="width:100%;border:0.5pt solid #e2e8f0;display:block;" alt="Чертёж">' +
    tblHtml +
    '</div>';

  // Close btn (no-print)
  var closeBtn=document.createElement('button');
  closeBtn.textContent='✕ Закрыть';
  closeBtn.style.cssText='position:fixed;top:10px;right:10px;background:#ef4444;color:#fff;'+
    'border:none;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;z-index:10000;';
  closeBtn.onclick=function(){
    overlay.style.display='none';
    overlay.className='';
    isExportingPDF=false;manIsExportingPDF=false;
  };
  overlay.appendChild(closeBtn);

  // Print btn
  var printBtn=document.createElement('button');
  printBtn.textContent='🖨 Распечатать / Сохранить PDF';
  printBtn.style.cssText='position:fixed;top:10px;right:140px;background:#2563eb;color:#fff;'+
    'border:none;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;z-index:10000;';
  printBtn.onclick=function(){window.print();};
  overlay.appendChild(printBtn);

  // DOCX btn
  var docxBtn=document.createElement('button');
  docxBtn.textContent='📄 Скачать DOCX';
  docxBtn.style.cssText='position:fixed;top:10px;right:330px;background:#16a34a;color:#fff;'+
    'border:none;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;z-index:10000;';
  docxBtn.onclick=function(){_exportDocx(pts,dims,pdfMeta);};
  overlay.appendChild(docxBtn);

  overlay.style.display='block';

  isExportingPDF=false;manIsExportingPDF=false;
  var b=document.getElementById('pdf-modal-generate-btn');
  if(b){b.innerHTML='<i class="fa-solid fa-file-pdf"></i>';b.disabled=false;}
};

// ═══════════════════════════════════════════════════════════════════════════
// GEOREFERENCING MODULE – 2D Helmert Similarity Transform
// ═══════════════════════════════════════════════════════════════════════════

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

function transformPointGeoref(p, t){
  return {
    x: t.s*(p.x*t.cosT - p.y*t.sinT) + t.tx,
    y: t.s*(p.x*t.sinT + p.y*t.cosT) + t.ty,
    z: p.z
  };
}

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
function georefLoadPreview(input){
  var file=input.files[0];
  if(!file)return;
  document.getElementById('gr-file-name').textContent=file.name;
  // Store file reference
  var fi=document.getElementById('georef-file-input');
  fi._pendingFile=file;
  input.value='';
  // Parse and render preview
  var ParserClass=window.DxfParser||(typeof DxfParser!=='undefined'?DxfParser:null);
  if(!ParserClass){document.getElementById('georef-mini-hint').textContent='DXF парсер не загружен';return;}
  var reader=new FileReader();
  reader.onload=function(ev){
    try{
      var parser=new ParserClass();
      var dxf=parser.parseSync(ev.target.result);
      _georefParsedDxf=dxf;
      _georefExtractMiniSnaps(dxf);
      ['gr-mini-x1','gr-mini-y1','gr-mini-x2','gr-mini-y2',
       'gr-p1-lx','gr-p1-ly','gr-p2-lx','gr-p2-ly'].forEach(function(id){
        var el=document.getElementById(id);if(el)el.value='';});
      _georefMiniP1=null;_georefMiniP2=null;
      _grP1L=null;_grP2L=null;
      _georefRenderMini();
      _georefPopulateSnapList();
      document.getElementById('georef-mini-hint').style.display='none';
      document.getElementById('gr-mini-status').textContent='Файл загружен. Укажите базовые точки кнопками выше.';
    }catch(err){
      document.getElementById('georef-mini-hint').textContent='Ошибка: '+err.message;
    }
  };
  reader.readAsText(file,'windows-1251');
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

function showHelpTab(id){
  document.querySelectorAll('.help-panel').forEach(function(p){p.classList.add('hidden');});
  document.querySelectorAll('.help-tab').forEach(function(t){
    t.classList.remove('active','border-blue-600','text-blue-600');
    t.classList.add('inactive','border-transparent','text-slate-500');
  });
  var panel=document.getElementById(id);
  if(panel)panel.classList.remove('hidden');
  var tab=document.getElementById('ht-'+id.replace('h-',''));
  if(tab){tab.classList.remove('inactive','border-transparent','text-slate-500');tab.classList.add('active','border-blue-600','text-blue-600');}
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

// ══════════════════════════════════════════════════════════════════════════════
// NORTH ARROW
// ══════════════════════════════════════════════════════════════════════════════
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
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&northPickMode)_northCancelPick();});
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

// ══════════════════════════════════════════════════════════════════════════════
// УСЛОВНЫЕ ОБОЗНАЧЕНИЯ (Symbols)
// ══════════════════════════════════════════════════════════════════════════════
var _ST={
  // ── ПОДЗЕМНЫЕ КОММУНИКАЦИИ (Underground utilities) ──────────────────
  voda:{
    label:'Водопровод',code:'В',color:'#0ea5e9',clicks:'multi',
    props:[
      {id:'dia',label:'Диаметр (мм)',def:'100',step:'10',type:'num'},
      {id:'depth',label:'Глубина (м)',def:'1.5',step:'0.1',type:'num'},
      {id:'mat',label:'Материал',def:'чуг',type:'sel',
       opts:['чуг','ст','пл','асб'],optLabels:['Чугун','Сталь','Пластик','Асбест']}
    ]
  },
  kanal:{
    label:'Канализация',code:'К',color:'#a855f7',clicks:'multi',
    props:[
      {id:'dia',label:'Диаметр (мм)',def:'200',step:'50',type:'num'},
      {id:'depth',label:'Глубина (м)',def:'2.0',step:'0.1',type:'num'},
      {id:'tip',label:'Тип',def:'быт',type:'sel',
       opts:['быт','ливн','пром'],optLabels:['Бытовая','Ливневая','Промышленная']}
    ]
  },
  gaz:{
    label:'Газопровод',code:'Г',color:'#f59e0b',clicks:'multi',
    props:[
      {id:'dia',label:'Диаметр (мм)',def:'100',step:'10',type:'num'},
      {id:'press',label:'Давление',def:'нд',type:'sel',
       opts:['нд','сд','вд'],optLabels:['Низкое','Среднее','Высокое']}
    ]
  },
  teplo:{
    label:'Теплосеть',code:'Т',color:'#ef4444',clicks:'multi',
    props:[
      {id:'dia',label:'Диаметр (мм)',def:'200',step:'50',type:'num'},
      {id:'depth',label:'Глубина (м)',def:'1.5',step:'0.1',type:'num'}
    ]
  },
  kabel:{
    label:'Эл. кабель',code:'Кб',color:'#6366f1',clicks:'multi',
    props:[
      {id:'vol',label:'Напряжение (кВ)',def:'0.4',step:'0.1',type:'num'},
      {id:'cnt',label:'Кол-во кабелей',def:'1',step:'1',type:'num'}
    ]
  },
  svyaz:{
    label:'Кабель связи',code:'С',color:'#10b981',clicks:'multi',
    props:[
      {id:'cnt',label:'Кол-во',def:'1',step:'1',type:'num'}
    ]
  },
  // ── КОЛОДЦЫ СМОТРОВЫЕ (Manholes) ─────────────────────────────────────
  kol_voda:{
    label:'Колодец вод.',code:'В',color:'#0ea5e9',clicks:'one',
    props:[{id:'num',label:'Номер колодца',def:'',type:'num'},{id:'el',label:'Отметка крышки',def:'',step:'0.01',type:'num'}]
  },
  kol_kanal:{
    label:'Колодец кан.',code:'К',color:'#a855f7',clicks:'one',
    props:[{id:'num',label:'Номер',def:'',type:'num'},{id:'el',label:'Отметка крышки',def:'',step:'0.01',type:'num'}]
  },
  kol_gaz:{
    label:'Колодец газ.',code:'Г',color:'#f59e0b',clicks:'one',
    props:[{id:'num',label:'Номер',def:'',type:'num'},{id:'el',label:'Отметка крышки',def:'',step:'0.01',type:'num'}]
  },
  kol_teplo:{
    label:'Колодец тепло',code:'Т',color:'#ef4444',clicks:'one',
    props:[{id:'num',label:'Номер',def:'',type:'num'},{id:'el',label:'Отметка крышки',def:'',step:'0.01',type:'num'}]
  },
  kol_el:{
    label:'Колодец эл.',code:'Э',color:'#6366f1',clicks:'one',
    props:[{id:'num',label:'Номер',def:'',type:'num'},{id:'el',label:'Отметка крышки',def:'',step:'0.01',type:'num'}]
  },
  // ── СТОЛБЫ И ОПОРЫ (Poles and supports) ─────────────────────────────
  stolb_d:{
    label:'Столб деревян.',code:'д',color:'#92400e',clicks:'one',
    props:[{id:'h',label:'Высота (м)',def:'6',step:'1',type:'num'}]
  },
  stolb_m:{
    label:'Столб металл.',code:'м',color:'#475569',clicks:'one',
    props:[{id:'h',label:'Высота (м)',def:'9',step:'1',type:'num'}]
  },
  stolb_zh:{
    label:'Столб ж/б',code:'ж/б',color:'#94a3b8',clicks:'one',
    props:[{id:'h',label:'Высота (м)',def:'10',step:'1',type:'num'}]
  },
  // ── ОГРАДЫ И ЗАБОРЫ (Fences and walls) ──────────────────────────────
  ograda_kap:{
    label:'Забор кап.',code:'',color:'#1e293b',clicks:'multi',
    props:[{id:'h',label:'Высота (м)',def:'2.0',step:'0.5',type:'num'},
           {id:'mat',label:'Материал',def:'кирп',type:'sel',
            opts:['кирп','бет','мет'],optLabels:['Кирпич','Бетон','Металл']}]
  },
  ograda_d:{
    label:'Забор деревян.',code:'',color:'#92400e',clicks:'multi',
    props:[{id:'h',label:'Высота (м)',def:'1.5',step:'0.5',type:'num'}]
  },
  podpor:{
    label:'Подпорная стенка',code:'',color:'#1e293b',clicks:'multi',
    props:[{id:'h',label:'Высота (м)',def:'1.0',step:'0.5',type:'num'},
           {id:'side',label:'Откос с',def:'left',type:'sel',
            opts:['left','right'],optLabels:['Левой стороны','Правой стороны']}]
  },
  // ── ЗДАНИЯ И СООРУЖЕНИЯ (Buildings) ─────────────────────────────────
  zdanie:{
    label:'Здание',code:'',color:'#1e293b',clicks:'area',
    props:[{id:'fl',label:'Этажей',def:'1',step:'1',type:'num'},
           {id:'mat',label:'Материал',def:'кир',type:'sel',
            opts:['кир','дер','смеш'],optLabels:['Кирпич/бетон','Деревянное','Смешанное']},
           {id:'type',label:'Назначение',def:'ж',type:'sel',
            opts:['ж','н','пр'],optLabels:['Жилое','Нежилое','Производств.']}]
  },
  svaya:{
    label:'Свая',code:'',color:'#1e293b',clicks:'one',
    props:[{id:'dia',label:'Диаметр (м)',def:'0.3',step:'0.1',type:'num'},
           {id:'h',label:'Отм. головы',def:'',step:'0.01',type:'num'}]
  }
};;
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
      var rect=el.getBoundingClientRect();
      var sx=ev.clientX-rect.left,sy=ev.clientY-rect.top;
      // Topo signs panel
      if(_tpActive){
        var _tpw=(cid==='cad-canvas')?screenToCad(sx,sy):screenToMan(sx,sy);
        _tpHandleClick(_tpw.x,_tpw.y);
        return;
      }
      if(!symTool)return;
      var t=_ST[symTool];
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
  if(!cadSymbols||!cadSymbols.length)return;
  cadSymbols.forEach(function(sym){
    try{
      var pts=sym.pts, col=sym.color||'#1e293b';
      if(!pts||pts.length===0)return;
      ctx.save();
      ctx.strokeStyle=col; ctx.fillStyle=col;

      switch(sym.type){
        // ── ПОДЗЕМНЫЕ КОММУНИКАЦИИ ──────────────────────────────────────
        // Underground pipes: dashed line + periodic letter label
        case 'voda': case 'kanal': case 'gaz': case 'teplo': case 'kabel': case 'svyaz':{
          if(pts.length<2)break;
          var lw=Math.max(0.03,0.35/scl);
          var dashLen=Math.max(0.08,4/scl), gapLen=Math.max(0.04,2/scl);
          ctx.lineWidth=lw; ctx.lineCap='butt';
          ctx.setLineDash([dashLen,gapLen]);
          ctx.beginPath();
          pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
          ctx.stroke(); ctx.setLineDash([]);
          // Label along each segment
          var code=sym.props&&sym.props.dia?
            _ST[sym.type].code+(sym.props.dia?'Ø'+sym.props.dia:''):_ST[sym.type].code;
          for(var si=0;si<pts.length-1;si++){
            var mx=(pts[si].x+pts[si+1].x)/2, my=(pts[si].y+pts[si+1].y)/2;
            var dx=pts[si+1].x-pts[si].x, dy=pts[si+1].y-pts[si].y;
            var ang=Math.atan2(dy,dx);
            ctx.save();
            ctx.translate(mx,my);
            ctx.rotate(ang);
            ctx.scale(1/scl,-1/scl);
            ctx.font='bold '+(Math.max(6,3*scl/scl))+'px Arial Narrow';
            ctx.fillStyle=col; ctx.textAlign='center'; ctx.textBaseline='bottom';
            ctx.fillText(_ST[sym.type].code,0,-3/scl*scl);
            ctx.restore();
          }
          break;
        }

        // ── КОЛОДЦЫ СМОТРОВЫЕ ───────────────────────────────────────────
        case 'kol_voda':
          _drawManhole(ctx,scl,pts[0],col,'H',sym.props);break;
        case 'kol_kanal':
          _drawManhole(ctx,scl,pts[0],col,'+',sym.props);break;
        case 'kol_gaz':
          _drawManhole(ctx,scl,pts[0],col,'/',sym.props);break;
        case 'kol_teplo':
          _drawManhole(ctx,scl,pts[0],col,'#',sym.props);break;
        case 'kol_el':
          _drawManhole(ctx,scl,pts[0],col,'E',sym.props);break;

        // ── СТОЛБЫ И ОПОРЫ ──────────────────────────────────────────────
        case 'stolb_d':{
          // Wooden pole: small circle ○
          var r=Math.max(0.04,1.5/scl);
          ctx.lineWidth=Math.max(0.02,0.5/scl);
          ctx.beginPath(); ctx.arc(pts[0].x,pts[0].y,r,0,Math.PI*2);
          ctx.stroke();
          // Label
          ctx.save(); ctx.translate(pts[0].x,pts[0].y); ctx.scale(1/scl,-1/scl);
          ctx.font='6px Arial'; ctx.textAlign='center'; ctx.textBaseline='top';
          ctx.fillText('д',0,r*scl+1); ctx.restore();
          break;
        }
        case 'stolb_m':{
          // Metal pole: filled circle ●
          var r2=Math.max(0.04,1.5/scl);
          ctx.beginPath(); ctx.arc(pts[0].x,pts[0].y,r2,0,Math.PI*2);
          ctx.fill();
          ctx.save(); ctx.translate(pts[0].x,pts[0].y); ctx.scale(1/scl,-1/scl);
          ctx.fillStyle=col; ctx.font='6px Arial'; ctx.textAlign='center';
          ctx.textBaseline='top'; ctx.fillText('м',0,r2*scl+1); ctx.restore();
          break;
        }
        case 'stolb_zh':{
          // ж/б pole: filled square ■
          var sq=Math.max(0.05,2/scl);
          ctx.fillRect(pts[0].x-sq/2,pts[0].y-sq/2,sq,sq);
          ctx.save(); ctx.translate(pts[0].x,pts[0].y); ctx.scale(1/scl,-1/scl);
          ctx.fillStyle=col; ctx.font='6px Arial'; ctx.textAlign='center';
          ctx.textBaseline='top'; ctx.fillText('ж/б',0,sq*scl+1); ctx.restore();
          break;
        }

        // ── ОГРАДЫ — КАПИТАЛЬНАЯ ────────────────────────────────────────
        case 'ograda_kap':{
          if(pts.length<2)break;
          ctx.lineWidth=Math.max(0.04,1/scl); ctx.lineCap='square';
          ctx.beginPath();
          pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
          ctx.stroke();
          // Perpendicular ticks every ~5 world units or 8px
          var tickH=Math.max(0.06,2.5/scl), tickStep=Math.max(0.2,8/scl);
          for(var fi=0;fi<pts.length-1;fi++){
            var ax=pts[fi].x,ay=pts[fi].y,bx=pts[fi+1].x,by=pts[fi+1].y;
            var segLen=Math.hypot(bx-ax,by-ay);
            var tx=(bx-ax)/segLen,ty=(by-ay)/segLen;
            var nx=-ty,ny=tx;
            var nTicks=Math.max(2,Math.floor(segLen/tickStep));
            for(var ti=0;ti<=nTicks;ti++){
              var t=ti/nTicks;
              var px2=ax+t*(bx-ax), py2=ay+t*(by-ay);
              ctx.beginPath();
              ctx.moveTo(px2,py2);
              ctx.lineTo(px2+nx*tickH,py2+ny*tickH);
              ctx.stroke();
            }
          }
          break;
        }

        // ── ОГРАДА ДЕРЕВЯННАЯ ───────────────────────────────────────────
        case 'ograda_d':{
          if(pts.length<2)break;
          ctx.lineWidth=Math.max(0.03,0.7/scl);
          ctx.setLineDash([Math.max(0.1,3/scl),Math.max(0.05,1.5/scl)]);
          ctx.beginPath();
          pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
          ctx.stroke(); ctx.setLineDash([]);
          var tickH2=Math.max(0.05,2/scl), tickStep2=Math.max(0.2,8/scl);
          for(var fi2=0;fi2<pts.length-1;fi2++){
            var ax2=pts[fi2].x,ay2=pts[fi2].y,bx2=pts[fi2+1].x,by2=pts[fi2+1].y;
            var segLen2=Math.hypot(bx2-ax2,by2-ay2);
            var tx2=(bx2-ax2)/segLen2,ty2=(by2-ay2)/segLen2;
            var nx2=-ty2,ny2=tx2;
            var nT2=Math.max(2,Math.floor(segLen2/tickStep2));
            for(var ti2=0;ti2<=nT2;ti2++){
              var t2=ti2/nT2;
              var px3=ax2+t2*(bx2-ax2), py3=ay2+t2*(by2-ay2);
              ctx.beginPath(); ctx.moveTo(px3,py3);
              ctx.lineTo(px3+nx2*tickH2,py3+ny2*tickH2); ctx.stroke();
            }
          }
          break;
        }

        // ── ПОДПОРНАЯ СТЕНКА ────────────────────────────────────────────
        case 'podpor':{
          if(pts.length<2)break;
          ctx.lineWidth=Math.max(0.04,1.2/scl); ctx.lineCap='round';
          ctx.beginPath();
          pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
          ctx.stroke();
          // One-sided oblique ticks (downhill side)
          var side=sym.props&&sym.props.side==='right'?-1:1;
          var tickH3=Math.max(0.06,3/scl), tickStep3=Math.max(0.15,5/scl);
          for(var fi3=0;fi3<pts.length-1;fi3++){
            var ax3=pts[fi3].x,ay3=pts[fi3].y,bx3=pts[fi3+1].x,by3=pts[fi3+1].y;
            var segLen3=Math.hypot(bx3-ax3,by3-ay3);
            var tx3=(bx3-ax3)/segLen3,ty3=(by3-ay3)/segLen3;
            var nx3=-ty3*side,ny3=tx3*side;
            var nT3=Math.max(2,Math.floor(segLen3/tickStep3));
            ctx.lineWidth=Math.max(0.03,0.5/scl);
            for(var ti3=0;ti3<=nT3;ti3++){
              var t3=ti3/nT3;
              var px4=ax3+t3*(bx3-ax3), py4=ay3+t3*(by3-ay3);
              ctx.beginPath(); ctx.moveTo(px4,py4);
              ctx.lineTo(px4+nx3*tickH3-tx3*tickH3*0.5,
                         py4+ny3*tickH3-ty3*tickH3*0.5);
              ctx.stroke();
            }
          }
          break;
        }

        // ── ЗДАНИЕ ──────────────────────────────────────────────────────
        case 'zdanie':{
          if(pts.length<3)break;
          // Fill based on material
          var mat=sym.props&&sym.props.mat||'кир';
          var fillClr=mat==='кир'?'rgba(220,180,160,0.5)':
                      mat==='дер'?'rgba(200,230,180,0.5)':
                      'rgba(200,200,200,0.5)';
          ctx.fillStyle=fillClr;
          ctx.beginPath();
          pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
          ctx.closePath(); ctx.fill();
          // Outline
          ctx.strokeStyle=col; ctx.lineWidth=Math.max(0.04,1/scl);
          ctx.beginPath();
          pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
          ctx.closePath(); ctx.stroke();
          // Label: floors and material
          var cx2=pts.reduce(function(s,p){return s+p.x;},0)/pts.length;
          var cy2=pts.reduce(function(s,p){return s+p.y;},0)/pts.length;
          var lbl=(sym.props&&sym.props.fl>1?sym.props.fl+' ':'')+
                  (sym.props&&sym.props.mat?sym.props.mat.toUpperCase():'К')+
                  (sym.props&&sym.props.type==='н'?'Н':sym.props&&sym.props.type==='пр'?'Пр':'');
          ctx.save(); ctx.translate(cx2,cy2); ctx.scale(1/scl,-1/scl);
          ctx.font='bold 7px Arial'; ctx.fillStyle='#1e293b';
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(lbl,0,0); ctx.restore();
          break;
        }

        // ── СВАЯ ────────────────────────────────────────────────────────
        case 'svaya':{
          var dia=parseFloat(sym.props&&sym.props.dia||0.3);
          var r3=Math.max(dia/2,1/scl);
          // Filled circle (головка сваи)
          ctx.beginPath(); ctx.arc(pts[0].x,pts[0].y,r3,0,Math.PI*2);
          ctx.fill();
          // Cross inside
          ctx.strokeStyle='#fff'; ctx.lineWidth=Math.max(0.02,0.4/scl);
          ctx.beginPath();
          ctx.moveTo(pts[0].x-r3,pts[0].y); ctx.lineTo(pts[0].x+r3,pts[0].y);
          ctx.moveTo(pts[0].x,pts[0].y-r3); ctx.lineTo(pts[0].x,pts[0].y+r3);
          ctx.stroke();
          // Elevation label
          if(sym.props&&sym.props.h){
            ctx.save(); ctx.translate(pts[0].x,pts[0].y); ctx.scale(1/scl,-1/scl);
            ctx.font='5px Arial'; ctx.fillStyle='#1e293b';
            ctx.textAlign='left'; ctx.textBaseline='top';
            ctx.fillText(parseFloat(sym.props.h).toFixed(2),r3*scl+2,0);
            ctx.restore();
          }
          break;
        }

        default: break;
      }
      ctx.restore();
    }catch(ex){/* silent */}
  });
}

// ── Manhole helper ──────────────────────────────────────────────────────
function _drawManhole(ctx,scl,pt,col,inner,props){
  var r=Math.max(0.06,2/scl);
  ctx.strokeStyle=col; ctx.lineWidth=Math.max(0.03,0.6/scl);
  // Outer circle
  ctx.beginPath(); ctx.arc(pt.x,pt.y,r,0,Math.PI*2); ctx.stroke();
  // Inner symbol
  var h=r*0.65;
  ctx.lineWidth=Math.max(0.02,0.4/scl);
  if(inner==='+'){
    ctx.beginPath();
    ctx.moveTo(pt.x-h,pt.y); ctx.lineTo(pt.x+h,pt.y);
    ctx.moveTo(pt.x,pt.y-h); ctx.lineTo(pt.x,pt.y+h);
    ctx.stroke();
  } else if(inner==='H'||inner==='—'){
    ctx.beginPath();
    ctx.moveTo(pt.x-h,pt.y); ctx.lineTo(pt.x+h,pt.y);
    ctx.stroke();
  } else if(inner==='/'){
    ctx.beginPath();
    ctx.moveTo(pt.x-h,pt.y+h); ctx.lineTo(pt.x+h,pt.y-h);
    ctx.stroke();
  } else if(inner==='#'){
    ctx.beginPath();
    ctx.moveTo(pt.x-h,pt.y-h/2); ctx.lineTo(pt.x+h,pt.y-h/2);
    ctx.moveTo(pt.x-h,pt.y+h/2); ctx.lineTo(pt.x+h,pt.y+h/2);
    ctx.stroke();
  } else if(inner==='E'){
    ctx.beginPath();
    ctx.moveTo(pt.x-h/2,pt.y-h); ctx.lineTo(pt.x-h/2,pt.y+h);
    ctx.moveTo(pt.x-h/2,pt.y); ctx.lineTo(pt.x+h/2,pt.y);
    ctx.stroke();
  }
  // Number label
  if(props&&props.num){
    ctx.save(); ctx.translate(pt.x,pt.y); ctx.scale(1/scl,-1/scl);
    ctx.font='5px Arial'; ctx.fillStyle='#1e293b';
    ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText(props.num,r*scl+1,0); ctx.restore();
  }
  // Elevation label
  if(props&&props.el){
    ctx.save(); ctx.translate(pt.x,pt.y); ctx.scale(1/scl,-1/scl);
    ctx.font='5px Arial'; ctx.fillStyle='#1e293b';
    ctx.textAlign='left'; ctx.textBaseline='bottom';
    ctx.fillText(parseFloat(props.el).toFixed(2),r*scl+1,0); ctx.restore();
  }
}
function _pipe(ctx,pts,oX,oY,scl,col,dash,ltr){
  if(pts.length<2)return;
  ctx.strokeStyle=col;ctx.lineWidth=1.5/scl;ctx.setLineDash(dash||[]);
  ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x-oX,p.y-oY):ctx.moveTo(p.x-oX,p.y-oY);});ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=col;for(var i=0;i<pts.length-1;i++){var dx=pts[i+1].x-pts[i].x,dy=pts[i+1].y-pts[i].y,seg=Math.hypot(dx,dy);for(var t=seg/2;t<seg;t+=5){var fx=pts[i].x+dx/seg*t-oX,fy=pts[i].y+dy/seg*t-oY;ctx.save();ctx.scale(1,-1);ctx.font='bold '+(3.5/scl)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ltr,fx,-fy);ctx.restore();}}
}

// ══════════════════════════════════════════════════════════════════════════════
// GEOREF MINI CANVAS — второй DXF preview + point picking
// ══════════════════════════════════════════════════════════════════════════════
var _georefParsedDxf=null;
var _georefMiniSnaps=[];
// Coordinate storage — JS variables survive modal reopen
var _grP1L=null; // {x,y} local P1 (survey DXF)
var _grP2L=null; // {x,y} local P2 (survey DXF)
var _grP1G=null; // {x,y} geodetic P1 (main DXF)
var _grP2G=null; // {x,y} geodetic P2 (main DXF)

   // snap points from second DXF
var _georefMiniElems=[];   // simplified elements for rendering
var _georefMiniScale=1, _georefMiniOX=0, _georefMiniOY=0;
var _georefPickTarget=0;   // 0=none, 1=picking P1, 2=picking P2
var _georefMiniP1=null, _georefMiniP2=null;

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
  var cv=document.getElementById('georef-mini-canvas');if(!cv)return;
  var ctx=cv.getContext('2d'),W=cv.width,H=cv.height;
  var sc=_georefMiniScale,oX=_georefMiniOX,oY=_georefMiniOY;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  // Draw elements
  ctx.save();ctx.translate(0,H);ctx.scale(sc,-sc);ctx.translate(-oX,-oY);
  ctx.strokeStyle='#334155';ctx.lineWidth=0.8/sc;ctx.lineCap='round';
  _georefMiniElems.forEach(function(el){
    if(el.type==='line'&&el.pts.length>=2){
      ctx.beginPath();el.pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();
    } else if(el.type==='circle'){
      ctx.beginPath();ctx.arc(el.cx,el.cy,el.r,0,Math.PI*2);ctx.stroke();
    } else if(el.type==='point'){
      ctx.beginPath();ctx.arc(el.pt.x,el.pt.y,1.5/sc,0,Math.PI*2);ctx.fillStyle='#334155';ctx.fill();
    }
  });
  // Draw snap points
  ctx.fillStyle='rgba(100,150,220,0.4)';
  _georefMiniSnaps.forEach(function(p){ctx.beginPath();ctx.arc(p.x,p.y,2/sc,0,Math.PI*2);ctx.fill();});
  // Draw picked points
  if(_georefMiniP1){
    ctx.fillStyle='#f97316';ctx.beginPath();ctx.arc(_georefMiniP1.x,_georefMiniP1.y,5/sc,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.scale(1,-1);ctx.fillStyle='#f97316';ctx.font='bold '+(9/sc)+'px Arial';
    ctx.textAlign='center';ctx.fillText('P1',_georefMiniP1.x,-_georefMiniP1.y-6/sc);ctx.restore();
  }
  if(_georefMiniP2){
    ctx.fillStyle='#8b5cf6';ctx.beginPath();ctx.arc(_georefMiniP2.x,_georefMiniP2.y,5/sc,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.scale(1,-1);ctx.fillStyle='#8b5cf6';ctx.font='bold '+(9/sc)+'px Arial';
    ctx.textAlign='center';ctx.fillText('P2',_georefMiniP2.x,-_georefMiniP2.y-6/sc);ctx.restore();
  }
  ctx.restore();
}


// ─── Mini canvas zoom / pan ──────────────────────────────────────────────────
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

// Wire georef modal to also initialize mini canvas

// ─── Manual / list input for mini-canvas base points ─────────────────────────
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

// ── Auto-import DXF POINT entities with Z into cadPoints for contours ─────────
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

// ─── Layer panel tabs ────────────────────────────────────────────────────────
function setLayerTab(n){
  ['lyr-panel-1','lyr-panel-2'].forEach(function(id,i){
    var p=document.getElementById(id);if(p){p.classList.toggle('hidden',i+1!==n);}
  });
  ['lyr-tab-1','lyr-tab-2'].forEach(function(id,i){
    var b=document.getElementById(id);if(!b)return;
    if(i+1===n){
      b.className='flex-1 py-1.5 text-[10px] font-semibold text-blue-600 border-b-2 border-blue-500 bg-white';
    } else {
      b.className='flex-1 py-1.5 text-[10px] font-semibold text-slate-400 border-b-2 border-transparent';
    }
  });
}
// ─── Second DXF visibility ───────────────────────────────────────────────────
function setSecondDxfVisible(v){secondDxfVisible=v;requestDraw();}
function setSecondDxfLinesVis(v){secondDxfLinesVisible=v;requestDraw();}
function setSecondDxfPointsVis(v){secondDxfPointsVisible=v;requestDraw();}
// ─── Remove second DXF overlay ───────────────────────────────────────────────
function clearSecondDxf(){
  secondDxfElements=[];secondDxfVisible=false;
  var b=document.getElementById('gr-clear-btn');if(b)b.classList.add('hidden');
  var c=document.getElementById('lyr-dxf2-controls');if(c)c.classList.add('hidden');
  var e=document.getElementById('lyr-dxf2-empty');if(e)e.classList.remove('hidden');
  requestDraw();showMessage('Удалено','Вложенный DXF убран.','info');
}
// ─── Import Z-heights from second DXF into cadPoints ────────────────────────
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
// ─── Update DXF2 layer panel when overlay applied ────────────────────────────
function _updateDxf2LayerPanel(){
  var c=document.getElementById('lyr-dxf2-controls');
  var e=document.getElementById('lyr-dxf2-empty');
  if(secondDxfElements.length>0){
    if(c)c.classList.remove('hidden');
    if(e)e.classList.add('hidden');
  } else {
    if(c)c.classList.add('hidden');
    if(e)e.classList.remove('hidden');
  }
  // Reset checkboxes
  var cv=document.getElementById('lyr-dxf2-visible');if(cv)cv.checked=true;
  var cl=document.getElementById('lyr-dxf2-lines');if(cl)cl.checked=true;
  var cp=document.getElementById('lyr-dxf2-points');if(cp)cp.checked=true;
  secondDxfVisible=true;secondDxfLinesVisible=true;secondDxfPointsVisible=true;
}

// ─── Add second DXF points to snap grid for measuring/line tools ──────────────
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

function setContourColor(c){dxfContourColor=c;requestDraw();}
function setContourOpacity(o){dxfContourOpacity=parseFloat(o);requestDraw();}

// --- Area & Volume ---
var _savedArea=0,_savedVolume=0,_savedPerimeter=0;
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
function openAreaVol(){
  var pts=points.filter(function(p){return Number.isFinite(p.x)&&Number.isFinite(p.y);});
  var av=document.getElementById('area-vol-modal');if(!av)return;
  document.getElementById('av-pt-count').textContent=pts.length;
  if(pts.length<3){
    document.getElementById('av-area').textContent='Нужно >= 3 точек';
    document.getElementById('av-perimeter').textContent='--';
    document.getElementById('av-volume').textContent='--';
    av.classList.remove('hidden');return;
  }
  var area=_shoelaceArea(pts),perim=_perimeterCalc(pts);
  _savedArea=area;_savedPerimeter=perim;
  document.getElementById('av-area').textContent=area.toFixed(3)+' м²';
  document.getElementById('av-perimeter').textContent=perim.toFixed(3)+' м';
  updateVolume();
  av.classList.remove('hidden');
}
function updateVolume(){
  var h=parseFloat(document.getElementById('av-height').value)||0;
  var vol=_savedArea*Math.abs(h);_savedVolume=vol;
  document.getElementById('av-volume').textContent=
    _savedArea>0?(vol.toFixed(3)+' м³'):'--';
}
function closeAreaVol(){document.getElementById('area-vol-modal').classList.add('hidden');}
function saveAreaVolToReport(){
  closeAreaVol();
  showMessage('Записано',
    'Площадь: '+_savedArea.toFixed(3)+' м²\n'+
    'Периметр: '+_savedPerimeter.toFixed(3)+' м\n'+
    'Объём: '+_savedVolume.toFixed(3)+' м³\n\nДанные будут включены в PDF.','success');
}

// ─── Contour drawing tool ─────────────────────────────────────────────────────
function startContour(){
  if(typeof _snpActive!=='undefined'&&_snpActive){snpClose();}
  if(pdfFrameDrawing){pdfFrameDrawing=false;}
  setTool('point');
  contourPts=[];contourActive=true;contourClosed=false;contourMousePos=null;
  var cv=document.getElementById('cad-canvas');
  if(cv)cv.style.cursor='crosshair';
  // Show compact contour panel
  var p=document.getElementById('contour-panel');
  if(p)p.style.display='flex';
  updateContourPanel();
  requestDraw();
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
  var cv=document.getElementById('cad-canvas');
  if(cv)cv.style.cursor='';
  var p=document.getElementById('contour-panel');
  if(p)p.style.display='none';
  updateContourPanel();
  requestDraw();
}
function updateContourPanel(){
  var el=document.getElementById('ctr-pts-count');if(el)el.textContent=contourPts.length;
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
  var h=parseFloat(document.getElementById('ctr-depth').value)||0;
  var vol=_savedArea*Math.abs(h);_savedVolume=vol;
  var pv=_savedPileVolume||0;
  var el=document.getElementById('ctr-vol');if(el)el.textContent=_savedArea>0?vol.toFixed(3)+' м³':'—';
  var ep=document.getElementById('ctr-pile-vol');if(ep)ep.textContent=pv>0?pv.toFixed(3)+' м³':'—';
  var et=document.getElementById('ctr-total-vol');if(et)et.textContent=_savedArea>0?(vol+pv).toFixed(3)+' м³':'—';
}
// Point-in-polygon test (ray casting)
function _ptInContour(px,py,poly){
  var n=poly.length,inside=false;
  for(var i=0,j=n-1;i<n;j=i++){
    var xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;
    if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
// ─── PDF Frame ────────────────────────────────────────────────────────────────
function startPdfFrame(){
  if(typeof contourActive!=='undefined'&&contourActive&&typeof clearContour==='function'){clearContour();}
  if(typeof symTool!=='undefined'&&symTool&&typeof _symCancel==='function'){_symCancel();}
  if(typeof setTool==='function')setTool('point');
  pdfFrame=null; pdfFrameDrawing=true; pdfFrameStart=null;
  var cv=document.getElementById('cad-canvas');
  if(cv)cv.style.cursor='crosshair';
  requestDraw();
}
function clearPdfFrame(){
  pdfFrame=null;pdfFrameDrawing=false;pdfFrameStart=null;
  var cv=document.getElementById('cad-canvas');if(cv)cv.style.cursor='';
  var btn=document.getElementById('btn-clear-pdf-frame');
  if(btn)btn.classList.add('hidden');
  requestDraw();
}
var _savedPileVolume=0,_savedWellsInside=[];

function saveContourToReport(){
  var h=parseFloat(document.getElementById('ctr-depth').value)||0;
  _savedVolume=_savedArea*Math.abs(h);
  showMessage('Записано в отчёт',
    'Площадь: '+_savedArea.toFixed(3)+' м²\n'+
    'Периметр: '+_savedPerimeter.toFixed(3)+' м\n'+
    'Объём грунта: '+_savedVolume.toFixed(3)+' м³\n'+
    'Объём бетона (сваи): '+(_savedPileVolume||0).toFixed(3)+' м³\n'+
    'Итого: '+((_savedVolume||0)+(_savedPileVolume||0)).toFixed(3)+' м³','success');
}

function toggleSnapPanel(){
  var p=document.getElementById('snap-panel');
  if(!p)return;
  p.style.display=(p.style.display==='none'||p.style.display==='')?'block':'none';
}
function updateSnapModes(){
  snapModes.nodes   =document.getElementById('snap-nodes')   ?document.getElementById('snap-nodes').checked   :true;
  snapModes.lines   =document.getElementById('snap-lines')   ?document.getElementById('snap-lines').checked   :true;
  snapModes.midpoints=document.getElementById('snap-midpoints')?document.getElementById('snap-midpoints').checked:false;
  // Update label
  var active=[];
  if(snapModes.nodes)active.push('Узлы');
  if(snapModes.lines)active.push('Линии');
  if(snapModes.midpoints)active.push('Середина');
  var lbl=document.getElementById('snap-mode-label');
  if(lbl)lbl.textContent=active.length?active.join('+'):'Выкл';
  var h2=document.getElementById('hud-snap-mode');if(h2)h2.textContent=active.length?active.join('+'):'Выкл';
}

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
// Override applyZToPoint to use vekha calculation


// ─── Symbols Table ────────────────────────────────────────────────────────────
var symTableRows=[]; // manual extra rows not from cadSymbols
var symTableVisible=false;

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

// ─── Material fill patterns ───────────────────────────────────────────────────
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

// ─── Save current contour as filled area ──────────────────────────────────────
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
    height:parseFloat(document.getElementById('ctr-depth').value)||0
  });
  showMessage('Закрашено','Область сохранена с материалом. Контур очищен.','success');
  clearContour();
}

function deleteContourFill(i){
  if(confirm('Удалить закрашенную область?')){savedContours.splice(i,1);requestDraw();}
}

// ─── Leader callouts for symbols ──────────────────────────────────────────────
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

function toggleLeaders(){
  showLeaders=!showLeaders;
  var btn=document.getElementById('leaders-toggle-btn');
  if(btn){
    btn.classList.toggle('text-emerald-600',showLeaders);
    btn.classList.toggle('text-slate-400',!showLeaders);
  }
  requestDraw();
}



// Update quick bar when contour state changes

// Patch startContour and clearContour to update bar






// ═══════════════════════════════════════════════════════════════════════════
// SYMBOL DRAWING PANEL — ArchiCAD/AutoCAD style
// ═══════════════════════════════════════════════════════════════════════════

// Open the drawing panel














// Canvas click handler for symbol drawing panel




// Draw live preview of current symbol being placed


// Keyboard shortcuts for sym panel
// legacy sdp keydown removed


// ═══ AI Analysis Panel ════════════════════════════════════════════════════════
var _aiHistory=[];

function openAIPanel(){
  var p=document.getElementById('ai-panel');
  if(p)p.style.display='flex';
  if(typeof _setupAIPanel==='function')_setupAIPanel();
}
function closeAIPanel(){
  var p=document.getElementById('ai-panel');
  if(p)p.style.display='none';
}

function _buildProjectContext(){
  var c='ДАННЫЕ ПРОЕКТА:\n';
  var pts=currentMode==='dxf'?points:manualPoints;
  if(pts&&pts.length){
    c+='Точек: '+pts.length+'\n';
    pts.slice(0,20).forEach(function(p){
      c+='P'+p.id+': X='+p.x.toFixed(3)+' Y='+p.y.toFixed(3)+(p.z!=null?' Z='+p.z.toFixed(3):'')+'\n';
    });
    if(pts.length>20)c+='...ещё '+(pts.length-20)+'\n';
  }
  if(dimensions&&dimensions.length)c+='Размеров: '+dimensions.length+'\n';
  if(typeof _savedArea!=='undefined'&&_savedArea>0){
    c+='Площадь: '+_savedArea.toFixed(3)+' м²\n';
    if(typeof _savedVolume!=='undefined'&&_savedVolume>0)c+='Объём: '+_savedVolume.toFixed(3)+' м³\n';
  }
  if(cadSymbols&&cadSymbols.length)c+='Символов: '+cadSymbols.length+'\n';
  if(dxfData&&dxfData.entities)c+='DXF объектов: '+dxfData.entities.length+'\n';
  return c;
}

var _aiQuickPrompts={
  summary:'Дай краткую сводку геодезического проекта: параметры, размеры, площади, объёмы.',
  quality:'Проверь качество геодезических данных: аномалии, пропуски Z-отметок.',
  volume:'Проанализируй объёмы земляных работ. Дай рекомендации по точности.',
  pdf:'Подготовь текст для исполнительной схемы PDF: наименование работ, характеристики.',
  anomaly:'Найди аномалии в данных. Укажи подозрительные координаты или Z-отметки.'
};

function aiQuick(type){
  var p=_aiQuickPrompts[type];if(!p)return;
  var inp=document.getElementById('ai-input');if(inp)inp.value=p;
  sendAIMessage();
}

function _aiAddMsg(role,text){
  var box=document.getElementById('ai-messages');if(!box)return;
  var d=document.createElement('div');
  d.style.cssText=role==='user'
    ?'align-self:flex-end;background:#7c3aed;color:#fff;border-radius:12px 12px 2px 12px;padding:8px 12px;max-width:85%;white-space:pre-wrap;font-size:12px;'
    :'align-self:flex-start;background:#f1f5f9;color:#1e293b;border-radius:12px 12px 12px 2px;padding:8px 12px;max-width:85%;white-space:pre-wrap;font-size:12px;';
  d.textContent=text;
  var empty=box.querySelector('.ai-empty');if(empty)empty.remove();
  box.appendChild(d);box.scrollTop=box.scrollHeight;
}

async function sendAIMessage(){
  var inp=document.getElementById('ai-input');
  var text=(inp&&inp.value||'').trim();if(!text)return;
  if(inp)inp.value='';
  _aiAddMsg('user',text);
  _aiHistory.push({role:'user',content:text});
  var typing=document.getElementById('ai-typing');
  var sendBtn=document.getElementById('ai-send-btn');
  if(typing)typing.style.display='flex';
  if(sendBtn)sendBtn.disabled=true;
  var sys={role:'system',content:'Ты геодезический ИИ-помощник. Отвечай по-русски кратко и точно.\n\n'+_buildProjectContext()};
  var msgs=[sys].concat(_aiHistory.slice(-8));
  var model=(document.getElementById('ai-model')&&document.getElementById('ai-model').value)||'openai/gpt-4o-mini';
  try{
    var resp=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:model,messages:msgs,max_tokens:1200})});
    if(resp.status===401){window.location.href='/login';return;}
    var data=await resp.json();
    if(data.error){_aiAddMsg('assistant','⚠ Ошибка: '+data.error);}
    else{
      var reply=data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
      if(reply){_aiHistory.push({role:'assistant',content:reply});_aiAddMsg('assistant',reply);}
      else _aiAddMsg('assistant','⚠ Пустой ответ');
    }
  }catch(e){_aiAddMsg('assistant','⚠ Ошибка сети: '+e.message);}
  finally{if(typing)typing.style.display='none';if(sendBtn)sendBtn.disabled=false;}
}


// ═══════════════════════════════════════════════════════════════════════════
// SYMBOL DRAWING SYSTEM — clean rewrite
// ═══════════════════════════════════════════════════════════════════════════
var _snpActive  = false;   // panel open
var _snpType    = null;    // current type key
var _snpProp    = {};      // current props
var _snpPts     = [];      // points being placed
var _snpMouse   = null;    // cursor world pos for preview
var _snpLastClickTime = 0; // for double-click detection

// ── Open panel ─────────────────────────────────────────────────────────────
function openSymDrawPanel(typeId){
  if(contourActive) clearContour();
  pdfFrameDrawing=false;
  var p=document.getElementById('sym-panel-new');
  if(!p)return;
  p.style.display='flex';
  _snpActive=true; _snpPts=[]; _snpMouse=null;
  _snpBuildGrid();
  _snpSelectType(typeId||Object.keys(_ST)[0]);
  var cv=document.getElementById('cad-canvas');
  if(cv)cv.style.cursor='crosshair';
  requestDraw();
}

function snpClose(){
  var p=document.getElementById('sym-panel-new');
  if(p)p.style.display='none';
  _snpActive=false; _snpType=null; _snpPts=[]; _snpMouse=null;
  var cv=document.getElementById('cad-canvas');
  if(cv)cv.style.cursor='';
  requestDraw();
}

// ── Build pictogram grid ───────────────────────────────────────────────────
function _snpBuildGrid(){
  var g=document.getElementById('snp-grid'); if(!g)return; g.innerHTML='';
  // Group symbols by category
  var cats={
    'Трубопроводы':['voda','kanal','gaz','teplo','kabel','svyaz'],
    'Колодцы':['kol_voda','kol_kanal','kol_gaz','kol_teplo','kol_el'],
    'Столбы':['stolb_d','stolb_m','stolb_zh'],
    'Ограды':['ograda_kap','ograda_d','podpor'],
    'Прочие':['zdanie','svaya']
  };
  g.style.gridTemplateColumns='repeat(5,1fr)';
  g.innerHTML='';

  Object.keys(cats).forEach(function(catName){
    // Category header
    var h=document.createElement('div');
    h.style.cssText='grid-column:1/-1;font-size:8px;color:#64748b;font-weight:700;'+
      'text-transform:uppercase;letter-spacing:.5px;padding:4px 2px 2px;';
    h.textContent=catName;
    g.appendChild(h);

    cats[catName].forEach(function(id){
      var t=_ST[id]; if(!t)return;
      var btn=document.createElement('button');
      btn.id='snp-btn-'+id;
      btn.title=t.label;

      // SVG mini-preview of the symbol
      var svg=_snpMiniSvg(id,t);
      btn.innerHTML=svg+'<div style="font-size:8px;margin-top:2px;color:#cbd5e1;'+
        'line-height:1.1;word-break:break-word;text-align:center;">'+
        (t.code?'<b>'+t.code+'</b> ':'')+
        t.label.replace('Водопровод','Водопр.').replace('Канализация','Канализ.').
          replace('Теплосеть','Тепло').replace('деревян.','дер.').
          replace('Подпорная стенка','Подпорн.')+'</div>';
      btn.style.cssText='background:#1e3a5f;border:2px solid transparent;border-radius:6px;'+
        'padding:4px 2px 3px;cursor:pointer;color:#f1f5f9;min-height:50px;'+
        'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;';
      btn.onclick=function(){_snpSelectType(id);};
      g.appendChild(btn);
    });
  });
}

function _snpMiniSvg(id,t){
  var c=t.color||'#2563eb';
  var w=44,h=28;
  // Pipe-type symbols
  if(['voda','kanal','gaz','teplo','kabel','svyaz'].indexOf(id)>=0){
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28">'+
      '<line x1="4" y1="14" x2="40" y2="14" stroke="'+c+'" stroke-width="1.5" stroke-dasharray="6,3"/>'+
      '<text x="22" y="11" text-anchor="middle" fill="'+c+'" font-size="8" font-weight="bold" font-family="Arial">'+t.code+'</text>'+
      '</svg>';
  }
  // Manhole symbols
  if(id==='kol_voda') return _mhSvg(c,'—');
  if(id==='kol_kanal') return _mhSvg(c,'+');
  if(id==='kol_gaz') return _mhSvg(c,'/');
  if(id==='kol_teplo') return _mhSvg(c,'#');
  if(id==='kol_el') return _mhSvg(c,'E');
  // Poles
  if(id==='stolb_d') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28"><circle cx="22" cy="14" r="7" fill="none" stroke="'+c+'" stroke-width="1.5"/><text x="22" y="28" text-anchor="middle" fill="'+c+'" font-size="7">д</text></svg>';
  if(id==='stolb_m') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28"><circle cx="22" cy="14" r="6" fill="'+c+'"/><text x="22" y="28" text-anchor="middle" fill="'+c+'" font-size="7">м</text></svg>';
  if(id==='stolb_zh') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28"><rect x="16" y="8" width="12" height="12" fill="'+c+'"/><text x="22" y="28" text-anchor="middle" fill="'+c+'" font-size="7">ж/б</text></svg>';
  // Fences
  if(id==='ograda_kap') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28"><line x1="4" y1="14" x2="40" y2="14" stroke="'+c+'" stroke-width="2"/><line x1="10" y1="14" x2="10" y2="21" stroke="'+c+'" stroke-width="1.2"/><line x1="18" y1="14" x2="18" y2="21" stroke="'+c+'" stroke-width="1.2"/><line x1="26" y1="14" x2="26" y2="21" stroke="'+c+'" stroke-width="1.2"/><line x1="34" y1="14" x2="34" y2="21" stroke="'+c+'" stroke-width="1.2"/></svg>';
  if(id==='ograda_d') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28"><line x1="4" y1="14" x2="40" y2="14" stroke="'+c+'" stroke-width="1.2" stroke-dasharray="5,3"/><line x1="10" y1="14" x2="10" y2="21" stroke="'+c+'" stroke-width="1"/><line x1="20" y1="14" x2="20" y2="21" stroke="'+c+'" stroke-width="1"/><line x1="30" y1="14" x2="30" y2="21" stroke="'+c+'" stroke-width="1"/></svg>';
  if(id==='podpor') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28"><line x1="4" y1="14" x2="40" y2="14" stroke="'+c+'" stroke-width="2"/><line x1="10" y1="14" x2="7" y2="21" stroke="'+c+'" stroke-width="1"/><line x1="18" y1="14" x2="15" y2="21" stroke="'+c+'" stroke-width="1"/><line x1="26" y1="14" x2="23" y2="21" stroke="'+c+'" stroke-width="1"/><line x1="34" y1="14" x2="31" y2="21" stroke="'+c+'" stroke-width="1"/></svg>';
  // Building
  if(id==='zdanie') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28"><rect x="5" y="5" width="34" height="18" fill="rgba(220,180,160,0.5)" stroke="'+c+'" stroke-width="1.5"/><text x="22" y="16" text-anchor="middle" fill="'+c+'" font-size="7">КЖ</text></svg>';
  // Svaya
  if(id==='svaya') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 44 28"><circle cx="22" cy="14" r="7" fill="'+c+'"/><line x1="15" y1="14" x2="29" y2="14" stroke="white" stroke-width="1.2"/><line x1="22" y1="7" x2="22" y2="21" stroke="white" stroke-width="1.2"/></svg>';
  return '<svg width="'+w+'" height="'+h+'"><text x="22" y="16" text-anchor="middle" font-size="8">'+t.code+'</text></svg>';
}
function _mhSvg(c,inner){
  var svg='<svg width="44" height="28" viewBox="0 0 44 28"><circle cx="22" cy="14" r="8" fill="none" stroke="'+c+'" stroke-width="1.5"/>';
  if(inner==='+') svg+='<line x1="16" y1="14" x2="28" y2="14" stroke="'+c+'" stroke-width="1.2"/><line x1="22" y1="8" x2="22" y2="20" stroke="'+c+'" stroke-width="1.2"/>';
  else if(inner==='—') svg+='<line x1="16" y1="14" x2="28" y2="14" stroke="'+c+'" stroke-width="1.2"/>';
  else if(inner==='/') svg+='<line x1="16" y1="20" x2="28" y2="8" stroke="'+c+'" stroke-width="1.2"/>';
  else if(inner==='#') svg+='<line x1="16" y1="11" x2="28" y2="11" stroke="'+c+'" stroke-width="1"/><line x1="16" y1="17" x2="28" y2="17" stroke="'+c+'" stroke-width="1"/>';
  else if(inner==='E') svg+='<line x1="19" y1="8" x2="19" y2="20" stroke="'+c+'" stroke-width="1.2"/><line x1="19" y1="14" x2="26" y2="14" stroke="'+c+'" stroke-width="1"/>';
  svg+='</svg>';
  return svg;
}

// ── Select element type ────────────────────────────────────────────────────
function _snpSelectType(id){
  var t=_ST[id]; if(!t)return;
  _snpType=id; _snpPts=[]; _snpMouse=null;

  // Update header
  var ic=document.getElementById('snp-icon'); if(ic)ic.textContent=t.icon;
  var ti=document.getElementById('snp-title'); if(ti)ti.textContent=t.label;

  // Highlight button
  Object.keys(_ST).forEach(function(k){
    var b=document.getElementById('snp-btn-'+k);
    if(!b)return;
    if(k===id){
      b.style.borderColor=t.color;
      b.style.background='rgba(37,99,235,.25)';
    } else {
      b.style.borderColor='transparent';
      b.style.background='#2d3e6a';
    }
  });

  // Build props
  _snpProp={};
  var pa=document.getElementById('snp-props-area'); if(!pa)return;
  pa.innerHTML='';
  t.props.forEach(function(prop){
    _snpProp[prop.id]=prop.def;
    var div=document.createElement('div');
    div.style.cssText='margin-bottom:10px;';
    var lbl=document.createElement('label');
    lbl.textContent=prop.label;
    lbl.style.cssText='display:block;font-size:10px;color:#94a3b8;'+
      'font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;';
    div.appendChild(lbl);
    if(prop.type==='sel'){
      var sel=document.createElement('select');
      sel.style.cssText='width:100%;background:#2d3e6a;border:1px solid #3d5080;'+
        'border-radius:6px;color:#f1f5f9;padding:6px 8px;font-size:12px;cursor:pointer;';
      (prop.opts).forEach(function(ov,oi){
        var o=document.createElement('option');
        o.value=ov; o.textContent=(prop.optLabels||prop.opts)[oi];
        if(ov===prop.def)o.selected=true;
        sel.appendChild(o);
      });
      sel.onchange=function(){_snpProp[prop.id]=this.value;};
      div.appendChild(sel);
    } else {
      var inp=document.createElement('input');
      inp.type='number'; inp.value=prop.def; inp.step=prop.step||'1';
      inp.style.cssText='width:100%;background:#2d3e6a;border:1px solid #3d5080;'+
        'border-radius:6px;color:#f1f5f9;padding:6px 8px;font-size:12px;box-sizing:border-box;';
      inp.oninput=function(){_snpProp[prop.id]=this.value;};
      div.appendChild(inp);
    }
    pa.appendChild(div);
  });

  // Instruction box
  var info=document.createElement('div');
  info.style.cssText='background:#0f1d38;border-radius:8px;padding:10px;'+
    'font-size:10px;color:#64748b;line-height:1.6;margin-top:6px;';
  var clicks=t.clicks;
  info.innerHTML=(clicks==='one')
    ? '🖱 Клик — разместить элемент на чертеже'
    : (clicks==='two')
    ? '🖱 Клик 1 — начало · Клик 2 — конец'
    : '🖱 Клики — добавить вершины<br>⏎ Enter / 2× клик — завершить<br>U — откат точки · ESC — отмена';
  pa.appendChild(info);

  _snpUpdateHint();
  requestDraw();
}

function _snpUpdateHint(){
  var h=document.getElementById('snp-hint'); if(!h||!_snpType)return;
  var t=_ST[_snpType], n=_snpPts.length;
  var msg=t.clicks==='one'?'Кликните на чертеже':
    t.clicks==='two'?(n===0?'Укажите начальную точку':'Укажите конечную точку'):
    n===0?'Укажите первую точку':n===1?'Укажите следующую точку':
    n+' точек — Enter для завершения';
  h.textContent=msg;
  var cnt=document.getElementById('snp-pts-count');
  if(cnt)cnt.textContent=n>0?n+' pt':'';
}

// ── Canvas click handler ───────────────────────────────────────────────────
function _snpHandleClick(wx,wy){
  if(!_snpActive||!_snpType)return false;
  var t=_ST[_snpType];
  // Snap to nearby survey points
  var th=12/scale, best=null, bd=Infinity;
  if(cadSnapPoints)cadSnapPoints.forEach(function(p){
    var d=Math.hypot(p.x-wx,p.y-wy);
    if(d<th&&d<bd){bd=d;best=p;}
  });
  if(best){wx=best.x;wy=best.y;}

  // Double-click → finish for multi
  var now=Date.now();
  if(t.clicks==='multi'&&_snpPts.length>=2&&now-_snpLastClickTime<400){
    snpFinish(); _snpLastClickTime=0; return true;
  }
  _snpLastClickTime=now;

  _snpPts.push({x:wx,y:wy});
  _snpUpdateHint();

  if(t.clicks==='one'){ snpFinish(); }
  else if(t.clicks==='two'&&_snpPts.length>=2){ snpFinish(); }
  else if(t.clicks==='area'&&_snpPts.length>=3){
    // Auto-close check: click near first point
    var fp=_snpPts[0];
    if(Math.hypot(wx-fp.x,wy-fp.y)<10/scale){ snpFinish(); }
  }

  requestDraw();
  return true;
}

// ── Finish / save ──────────────────────────────────────────────────────────
function snpFinish(){
  if(!_snpType||_snpPts.length===0)return;
  var t=_ST[_snpType];
  var minPts={one:1,two:2,multi:2}[t.clicks]||1;
  if(_snpPts.length<minPts){
    var h=document.getElementById('snp-hint');
    if(h)h.textContent='⚠ Нужно ещё '+(minPts-_snpPts.length)+' точки';
    return;
  }
  var col=document.getElementById('snp-color');
  var c=col?col.value:'#1e3a5f';
  // For area types, close the polygon
  var finalPts=_snpPts.slice();
  if((_ST[_snpType]&&_ST[_snpType].clicks==='area')&&finalPts.length>=3){
    finalPts.push({x:finalPts[0].x,y:finalPts[0].y});}
  cadSymbols.push({
    type:_snpType,
    pts:finalPts,
    props:Object.assign({},_snpProp),
    color:c,
    label:t.label
  });
  _snpPts=[];
  var h=document.getElementById('snp-hint');
  if(h)h.textContent='✓ '+t.label+' добавлен';
  if(typeof _symLegend==='function')_symLegend();
  requestDraw();requestManualDraw();
}

function snpUndo(){
  if(_snpPts.length>0){_snpPts.pop();_snpUpdateHint();requestDraw();}
}

// ── Preview drawing (called from draw() — world transform active) ──────────
function _snpDrawPreview(ctx,scl){
  if(!_snpActive||!_snpType||_snpPts.length===0)return;
  var t=_ST[_snpType];
  var colEl=document.getElementById('snp-color');
  var c=colEl?colEl.value:'#2563eb';
  var pts=_snpPts.slice();

  // Add rubber-band point at cursor
  if(_snpMouse&&t.clicks!=='one') pts.push({x:_snpMouse.x,y:_snpMouse.y});
  if(pts.length<1)return;

  ctx.save();
  ctx.strokeStyle=c; ctx.fillStyle=c;
  ctx.lineWidth=1.5/scl; ctx.globalAlpha=0.8;

  // Rubber-band line
  if(pts.length>=2){
    ctx.setLineDash([6/scl,3/scl]);
    ctx.beginPath();
    pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Placed points
  ctx.globalAlpha=1;
  _snpPts.forEach(function(p,i){
    ctx.fillStyle=i===0?'#16a34a':c;
    ctx.strokeStyle=i===0?'#16a34a':c;
    ctx.beginPath(); ctx.arc(p.x,p.y,5/scl,0,Math.PI*2); ctx.fill();
    // Label
    ctx.save(); ctx.translate(p.x,p.y); ctx.scale(1/scl,-1/scl);
    ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(i+1,0,0);
    ctx.restore();
  });

  // Snap ring at cursor
  if(_snpMouse){
    var sn=null, th=12/scl, bd2=Infinity;
    if(cadSnapPoints)cadSnapPoints.forEach(function(p){
      var d=Math.hypot(p.x-_snpMouse.x,p.y-_snpMouse.y);
      if(d<th&&d<bd2){bd2=d;sn=p;}
    });
    if(sn){
      ctx.strokeStyle='#f59e0b'; ctx.lineWidth=1.5/scl;
      ctx.beginPath(); ctx.arc(sn.x,sn.y,8/scl,0,Math.PI*2); ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Keyboard shortcuts ─────────────────────────────────────────────────────
document.addEventListener('keydown',function(e){
  if(!_snpActive)return;
  if(e.key==='Enter'){snpFinish();}
  else if(e.key==='u'||e.key==='U'){snpUndo();}
  else if(e.key==='Escape'){snpClose();}
  else if(e.key==='Tab'){
    var keys=Object.keys(_ST);
    var idx=keys.indexOf(_snpType);
    _snpSelectType(keys[(idx+1)%keys.length]);
    e.preventDefault();
  }
});


// ── DOCX Export via server-side API ───────────────────────────────────────
function exportToDocx(){
  var pts=currentMode==='dxf'?points:manualPoints;
  if(!pts||pts.length===0){showMessage('DOCX','Нет точек для экспорта','warning');return;}

  // Build data payload
  var payload={
    title:'Ведомость геодезических точек',
    date:new Date().toLocaleDateString('ru-RU'),
    points:pts.map(function(p){
      return{id:p.id,x:p.x.toFixed(4),y:p.y.toFixed(4),z:p.z!=null?p.z.toFixed(4):'—',type:p.type||''};
    }),
    dimensions:(dimensions||[]).map(function(d){
      return{name:'P'+d.p1.id+'−P'+d.p2.id,length:Math.hypot(d.p2.x-d.p1.x,d.p2.y-d.p1.y).toFixed(4)};
    }),
    area:_savedArea>0?{
      area:_savedArea.toFixed(4),
      perim:_savedPerimeter.toFixed(4),
      vol:(_savedVolume||0).toFixed(4),
      pileVol:(_savedPileVolume||0).toFixed(4)
    }:null,
    symbols:(cadSymbols||[]).map(function(s){
      return{type:s.label,pts:s.pts.length};
    })
  };

  // Send to /api/export-docx
  showMessage('DOCX','Формирование документа...','info');
  fetch('/api/export-docx',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  }).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.blob();
  }).then(function(blob){
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='geodesy_'+new Date().getTime()+'.docx';
    a.click();URL.revokeObjectURL(url);
    showMessage('DOCX','Файл скачан ✓','success');
  }).catch(function(err){
    showMessage('DOCX','Ошибка: '+err.message,'error');
  });
}


// ── Export to DOCX via server ─────────────────────────────────────────────
async function _exportDocx(pts, dims, meta){
  try{
    var payload={
      title: meta.title||'Исполнительная схема',
      org: meta.org||'',
      coord: meta.coord||'',
      height: meta.height||'',
      scale: meta.scale||'',
      note: meta.note||'',
      date: new Date().toLocaleDateString('ru-RU'),
      points: pts.map(function(p){return{id:p.id,x:p.x,y:p.y,z:p.z,type:p.type||''}}),
      dimensions: (dims||[]).map(function(d){
        return{p1:d.p1.id,p2:d.p2.id,len:Math.hypot(d.p2.x-d.p1.x,d.p2.y-d.p1.y)};
      }),
      area: _savedArea||0,
      perimeter: _savedPerimeter||0,
      volume: _savedVolume||0,
      pileVolume: _savedPileVolume||0
    };
    var resp=await fetch('/api/export-docx',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(resp.status===401){window.location.href='/login';return;}
    if(!resp.ok){var err=await resp.text();showMessage('Ошибка','DOCX: '+err,'error');return;}
    var blob=await resp.blob();
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download=(meta.title||'report').replace(/\s+/g,'_')+'.docx';
    a.click();URL.revokeObjectURL(url);
    showMessage('DOCX','Файл скачан успешно','success');
  }catch(e){showMessage('Ошибка','DOCX: '+e.message,'error');}
}


// ═══ TOPO SIGN DRAWING FUNCTIONS ═══════════════════════════════════════════
function _tpLine(ctx,pts,scl,col,lw,dash){
  if(pts.length<2)return;
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw/scl;
  if(dash&&dash.length)ctx.setLineDash(dash.map(function(v){return v/scl;}));
  ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
  ctx.stroke();ctx.setLineDash([]);ctx.restore();
}
function _tpPoly(ctx,pts,scl,fill,stroke,lw,dash){
  if(pts.length<2)return;
  ctx.save();ctx.beginPath();
  pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw/scl;
    if(dash&&dash.length)ctx.setLineDash(dash.map(function(v){return v/scl;}));
    ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
}
function _tpLabel(ctx,x,y,text,px,col,bold,scl){
  ctx.save();ctx.translate(x,y);ctx.scale(1/scl,-1/scl);
  ctx.fillStyle=col||'#000';ctx.font=(bold?'bold ':'')+px+'px Arial';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,0,0);ctx.restore();
}
function _tpOffsetPoly(pts,off){
  return pts.map(function(p,i){
    var nx=0,ny=0,cnt=0;
    if(i<pts.length-1){var dx=pts[i+1].x-p.x,dy=pts[i+1].y-p.y,l=Math.hypot(dx,dy)||1;nx+=(-dy/l);ny+=(dx/l);cnt++;}
    if(i>0){var dx2=p.x-pts[i-1].x,dy2=p.y-pts[i-1].y,l2=Math.hypot(dx2,dy2)||1;nx+=(-dy2/l2);ny+=(dx2/l2);cnt++;}
    if(cnt){nx/=cnt;ny/=cnt;var nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;}
    return{x:p.x+off*nx,y:p.y+off*ny};
  });
}
function _ptInPoly(pt,vs){
  var inside=false;
  for(var i=0,j=vs.length-1;i<vs.length;j=i++){
    var xi=vs[i].x,yi=vs[i].y,xj=vs[j].x,yj=vs[j].y;
    if(((yi>pt.y)!==(yj>pt.y))&&(pt.x<(xj-xi)*(pt.y-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
// Building (capital/non-capital)
function _tpDrawBuilding(ctx,pts,scl,prop,capital){
  if(pts.length<3)return;
  _tpPoly(ctx,pts,scl,capital?'rgba(180,180,185,.4)':'rgba(220,220,220,.25)',
    '#1e293b',capital?0.5:0.4,capital?null:[4,2]);
  var cx=pts.reduce(function(a,p){return a+p.x;},0)/pts.length;
  var cy=pts.reduce(function(a,p){return a+p.y;},0)/pts.length;
  if(prop&&prop.floors&&prop.floors!=='1')_tpLabel(ctx,cx,cy,prop.floors,7,'#1e293b',true,scl);
}
// Ruin
function _tpDrawRuin(ctx,pts,scl){
  _tpPoly(ctx,pts,scl,'rgba(200,200,200,.15)','#94a3b8',0.3,[2,2]);
}
// Chimney
function _tpDrawChimney(ctx,p,scl,prop){
  if(!p)return;
  var r=2.5/scl;
  ctx.save();ctx.strokeStyle='#1e293b';ctx.lineWidth=0.6/scl;
  ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#1e293b';ctx.beginPath();ctx.arc(p.x,p.y,0.5/scl,0,Math.PI*2);ctx.fill();
  if(prop&&prop.h)_tpLabel(ctx,p.x,p.y+r*2.2,'тр.'+prop.h+'м',5,'#374151',false,scl);
  ctx.restore();
}
// Water tower
function _tpDrawWaterTower(ctx,p,scl,prop){
  if(!p)return;
  var r=2.5/scl;
  ctx.save();ctx.strokeStyle='#1e293b';ctx.lineWidth=0.6/scl;ctx.fillStyle='rgba(180,200,220,.3)';
  ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  var s=r*0.55;ctx.strokeRect(p.x-s,p.y-s,s*2,s*2);
  if(prop&&prop.h)_tpLabel(ctx,p.x,p.y-r*2,'бш.'+prop.h+'м',5,'#1e293b',false,scl);
  ctx.restore();
}
// Fence
function _tpDrawFence(ctx,pts,scl,capital){
  if(pts.length<2)return;
  var col=capital?'#1e293b':'#475569';
  _tpLine(ctx,pts,scl,col,capital?0.8:0.5,null);
  var step=3;
  for(var i=0;i<pts.length-1;i++){
    var ax=pts[i].x,ay=pts[i].y,bx=pts[i+1].x,by=pts[i+1].y;
    var len=Math.hypot(bx-ax,by-ay),tx=(bx-ax)/len,ty=(by-ay)/len,nx=-ty,ny=tx;
    var n=Math.floor(len/step);
    ctx.save();ctx.strokeStyle=col;ctx.lineWidth=(capital?0.5:0.35)/scl;
    for(var k=1;k<n;k++){
      var px2=ax+tx*k*step,py2=ay+ty*k*step;
      ctx.beginPath();ctx.moveTo(px2,py2);ctx.lineTo(px2+nx*1.2/scl,py2+ny*1.2/scl);ctx.stroke();
    }
    ctx.restore();
  }
}
// Pipe (utilities: В,К,Г,Т)
function _tpDrawPipe(ctx,pts,scl,letter,sub){
  if(pts.length<2)return;
  var cols={В:'#2563eb',К:'#7c3aed',Г:'#16a34a',Т:'#ea580c'};
  var col=cols[letter]||'#374151';
  _tpLine(ctx,pts,scl,col,0.7,null);
  var total=0;
  for(var i=0;i<pts.length-1;i++)total+=Math.hypot(pts[i+1].x-pts[i].x,pts[i+1].y-pts[i].y);
  var mid=total/2,dist=0;
  for(var i=0;i<pts.length-1;i++){
    var seg=Math.hypot(pts[i+1].x-pts[i].x,pts[i+1].y-pts[i].y);
    if(dist+seg>=mid){
      var t=(mid-dist)/seg;
      var mx=pts[i].x+(pts[i+1].x-pts[i].x)*t;
      var my=pts[i].y+(pts[i+1].y-pts[i].y)*t;
      var angle=Math.atan2(pts[i+1].y-pts[i].y,pts[i+1].x-pts[i].x);
      ctx.save();ctx.translate(mx,my);ctx.scale(1/scl,-1/scl);ctx.rotate(-angle);
      ctx.fillStyle=col;ctx.font='bold 8px Arial';ctx.textAlign='center';
      ctx.fillText(letter+(sub?'('+sub+')':''),0,-3);ctx.restore();break;
    }
    dist+=seg;
  }
}
// Cable (electricity/telecom)
function _tpDrawCable(ctx,pts,scl,letter,sub){
  if(pts.length<2)return;
  var col='#dc2626';
  _tpLine(ctx,pts,scl,col,0.5,null);
  // Arrow marks at midpoints
  for(var i=0;i<pts.length-1;i++){
    var ax=pts[i].x,ay=pts[i].y,bx=pts[i+1].x,by=pts[i+1].y;
    var len=Math.hypot(bx-ax,by-ay),tx=(bx-ax)/len,ty=(by-ay)/len,nx=-ty,ny=tx;
    var ar=1.5/scl,mx=ax+tx*len/2,my=ay+ty*len/2;
    ctx.save();ctx.strokeStyle=col;ctx.lineWidth=0.4/scl;
    ctx.beginPath();ctx.moveTo(mx+nx*ar,my+ny*ar);ctx.lineTo(mx,my);ctx.lineTo(mx-nx*ar,my-ny*ar);ctx.stroke();
    ctx.restore();
  }
  if(pts.length>=2){
    var mx2=(pts[0].x+pts[pts.length-1].x)/2,my2=(pts[0].y+pts[pts.length-1].y)/2;
    _tpLabel(ctx,mx2,my2+2/scl,letter+(sub?'('+sub+'кВ)':''),5,col,false,scl);
  }
}
// Well
function _tpDrawWell(ctx,p,scl,prop){
  if(!p)return;
  var r=1.8/scl;
  ctx.save();ctx.strokeStyle='#0284c7';ctx.fillStyle='#fff';ctx.lineWidth=0.7/scl;
  ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(p.x-r,p.y);ctx.lineTo(p.x+r,p.y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x,p.y+r);ctx.stroke();
  if(prop&&prop.type==='артезианский'){ctx.beginPath();ctx.arc(p.x,p.y,r*1.5,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
// Spring
function _tpDrawSpring(ctx,p,scl){
  if(!p)return;
  var r=1.2/scl;
  ctx.save();ctx.fillStyle='#0284c7';ctx.strokeStyle='#0284c7';ctx.lineWidth=0.6/scl;
  ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(p.x+r,p.y);ctx.lineTo(p.x+r*3,p.y);ctx.stroke();
  ctx.restore();
}
// Ditch
function _tpDrawDitch(ctx,pts,scl,w){
  if(pts.length<2)return;
  var lw=Math.max(parseFloat(w||0.5)*0.4,0.4);
  _tpLine(ctx,pts,scl,'#0284c7',lw,null);
  for(var i=0;i<pts.length-1;i++){
    var ax=pts[i].x,ay=pts[i].y,bx=pts[i+1].x,by=pts[i+1].y;
    var len=Math.hypot(bx-ax,by-ay),tx=(bx-ax)/len,ty=(by-ay)/len,nx=-ty,ny=tx;
    ctx.save();ctx.strokeStyle='#0284c7';ctx.lineWidth=0.3/scl;
    for(var k=2;k<len;k+=2){
      var px2=ax+tx*k,py2=ay+ty*k;
      ctx.beginPath();ctx.moveTo(px2,py2);ctx.lineTo(px2+nx*0.8/scl,py2+ny*0.8/scl);ctx.stroke();
    }
    ctx.restore();
  }
}
// Tree
function _tpDrawTree(ctx,p,scl,prop){
  if(!p)return;
  var d=parseFloat(prop&&prop.d||4),h=parseFloat(prop&&prop.h||10);
  var cr=d/2,sr=Math.max(0.4/scl,0.3);
  ctx.save();
  ctx.fillStyle='#15803d';ctx.beginPath();ctx.arc(p.x,p.y,sr,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#15803d';ctx.fillStyle='rgba(21,128,61,.1)';ctx.lineWidth=0.5/scl;
  ctx.beginPath();ctx.arc(p.x,p.y,cr,0,Math.PI*2);ctx.fill();ctx.stroke();
  _tpLabel(ctx,p.x,p.y+cr+1.5/scl,h+'м',5,'#15803d',false,scl);
  ctx.restore();
}
// Shrub
function _tpDrawShrub(ctx,p,scl){
  if(!p)return;
  var r=1.2/scl;
  ctx.save();ctx.strokeStyle='#15803d';ctx.fillStyle='rgba(21,128,61,.15)';ctx.lineWidth=0.5/scl;
  [[-r,0],[0,r*0.7],[r,0]].forEach(function(o){
    ctx.beginPath();ctx.arc(p.x+o[0],p.y+o[1],r*0.8,0,Math.PI*2);ctx.fill();ctx.stroke();
  });
  ctx.restore();
}
// Lawn contour
function _tpDrawLawn(ctx,pts,scl){
  if(pts.length<3)return;
  _tpPoly(ctx,pts,scl,'rgba(21,128,61,.1)','#15803d',0.3,[4,2]);
}
// Road
function _tpDrawRoad(ctx,pts,scl,capital,w){
  if(pts.length<2)return;
  var hw=parseFloat(w||6)/2,col=capital?'#374151':'#92400e';
  var outer=_tpOffsetPoly(pts,hw),inner=_tpOffsetPoly(pts,-hw);
  ctx.save();
  if(capital){
    ctx.beginPath();
    outer.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
    for(var k=inner.length-1;k>=0;k--)ctx.lineTo(inner[k].x,inner[k].y);
    ctx.closePath();ctx.fillStyle='rgba(200,200,200,.35)';ctx.fill();
  }
  ctx.strokeStyle=col;ctx.lineWidth=0.6/scl;
  [outer,inner].forEach(function(e){
    ctx.beginPath();e.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();
  });
  if(!capital){ctx.lineWidth=0.3/scl;ctx.setLineDash([5/scl,3/scl]);
    ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
}
// Geodetic point (triangulation)
function _tpDrawGeoPt(ctx,p,scl,prop){
  if(!p)return;
  var r=3/scl;
  ctx.save();ctx.strokeStyle='#dc2626';ctx.fillStyle='#dc2626';ctx.lineWidth=0.7/scl;
  ctx.beginPath();
  ctx.moveTo(p.x,p.y+r);
  ctx.lineTo(p.x+r*0.866,p.y-r*0.5);
  ctx.lineTo(p.x-r*0.866,p.y-r*0.5);
  ctx.closePath();ctx.stroke();
  ctx.beginPath();ctx.arc(p.x,p.y,0.7/scl,0,Math.PI*2);ctx.fill();
  if(prop&&prop.n)_tpLabel(ctx,p.x,p.y+r+1.5/scl,prop.n,6,'#dc2626',true,scl);
  ctx.restore();
}
// Benchmark (репер)
function _tpDrawReper(ctx,p,scl,prop){
  if(!p)return;
  var r=2/scl;
  ctx.save();ctx.strokeStyle='#dc2626';ctx.lineWidth=0.7/scl;ctx.fillStyle='rgba(220,38,38,.15)';
  ctx.fillRect(p.x-r,p.y-r*0.5,r*2,r);ctx.strokeRect(p.x-r,p.y-r*0.5,r*2,r);
  ctx.beginPath();ctx.moveTo(p.x-r*1.5,p.y+r*0.5);ctx.lineTo(p.x+r*1.5,p.y+r*0.5);ctx.stroke();
  if(prop&&prop.h)_tpLabel(ctx,p.x,p.y-r*1.5,'Rp '+prop.h,5,'#dc2626',false,scl);
  ctx.restore();
}
// Boundary
function _tpDrawBoundary(ctx,pts,scl,type){
  if(pts.length<2)return;
  var col=type==='red'?'#dc2626':'#1e293b';
  _tpLine(ctx,pts,scl,col,type==='red'?0.7:0.5,type==='red'?[6,3]:[3,3]);
  if(type==='plot'){
    ctx.save();ctx.fillStyle=col;
    pts.forEach(function(p){ctx.beginPath();ctx.arc(p.x,p.y,0.8/scl,0,Math.PI*2);ctx.fill();});
    ctx.restore();
  }
}

// ── _drawSymbols: render all placed topo signs (world transform active) ────
function _drawSymbols(ctx,scl,oX,oY,pr){
  cadSymbols.forEach(function(sym){
    try{
      var def=_TP[sym.type];
      if(!def||!def.draw)return;
      ctx.save();
      def.draw(ctx,sym.pts,scl,sym.props||{});
      ctx.restore();
    }catch(e){}
  });
}

// ── Preview in draw() (world transform active) ─────────────────────────────
function _snpDrawPreview(ctx,scl){
  if(!_tpActive||!_tpType||_tpPts.length===0)return;
  var def=_TP[_tpType]; if(!def)return;
  var pts=_tpPts.slice();
  if(_tpMouse&&def.clicks!=='one')pts.push({x:_tpMouse.x,y:_tpMouse.y});
  ctx.save();ctx.globalAlpha=0.6;
  if(pts.length>=1)try{def.draw(ctx,pts,scl,_tpProp);}catch(e){}
  ctx.globalAlpha=1;
  _tpPts.forEach(function(p,i){
    ctx.fillStyle=i===0?'#16a34a':'#2563eb';
    ctx.beginPath();ctx.arc(p.x,p.y,4/scl,0,Math.PI*2);ctx.fill();
  });
  if(_tpMouse&&_tpPts.length>0&&def.clicks!=='one'){
    ctx.setLineDash([4/scl,3/scl]);ctx.strokeStyle='#94a3b8';ctx.lineWidth=0.5/scl;
    ctx.beginPath();var lp=_tpPts[_tpPts.length-1];
    ctx.moveTo(lp.x,lp.y);ctx.lineTo(_tpMouse.x,_tpMouse.y);
    ctx.stroke();ctx.setLineDash([]);
  }
  ctx.restore();
}

// ── Click handler ─────────────────────────────────────────────────────────
function _tpHandleClick(wx,wy){
  if(!_tpActive||!_tpType)return false;
  var def=_TP[_tpType];
  var th=12/scale,best=null,bd=Infinity;
  if(cadSnapPoints)cadSnapPoints.forEach(function(p){
    var d=Math.hypot(p.x-wx,p.y-wy);if(d<th&&d<bd){bd=d;best=p;}
  });
  if(best){wx=best.x;wy=best.y;}
  var now=Date.now();
  if((def.clicks==='line'||def.clicks==='poly')&&_tpPts.length>=2&&now-_tpLastT<400){
    snpFinish();_tpLastT=0;return true;
  }
  _tpLastT=now;
  _tpPts.push({x:wx,y:wy});
  var cnt=document.getElementById('snp-pts-count');
  if(cnt)cnt.textContent=_tpPts.length+' pt';
  if(def.clicks==='one')snpFinish();
  requestDraw();return true;
}


// ── Update Z-panel point selector ──────────────────────────────────────
function _updateZPointSelect(){
  var sel=document.getElementById('edit-z-point-select');
  if(!sel)return;
  var prev=sel.value;
  while(sel.options.length>1)sel.remove(1);
  var arr=currentMode==='dxf'?points:manualPoints;
  arr.forEach(function(p){
    var o=document.createElement('option');
    o.value=p.id;
    var zStr=p.z!=null?p.z.toFixed(3):'—';
    o.textContent='P'+p.id+' ('+p.x.toFixed(2)+', '+p.y.toFixed(2)+', Z:'+zStr+')';
    if(p.z!=null)o.style.color='#16a34a';
    sel.appendChild(o);
  });
  if(prev)sel.value=prev;
}


// ── Bottom bar scale update ──────────────────────────────────────────────────
function _updateHudScale(){
  var el=document.getElementById('hud-scale');
  if(!el)return;
  // Compute approx map scale: 1px = 1/scale world units
  // If scale is ~pixels-per-world-unit, display as "1:X"
  var m=Math.round(1/scale*1000)/1000;
  el.textContent=m>0?'1:'+m.toFixed(3):'—';
}

function _toggleStatusBar(){
  var sb=document.getElementById('bottom-status-bar');
  var r2=document.getElementById('sb-row2');
  var btn=sb&&sb.querySelector('button[onclick="_toggleStatusBar()"]');
  if(!sb)return;
  var exp=sb.classList.contains('sb-expanded');
  if(exp){sb.style.height='18px';sb.classList.remove('sb-expanded');if(r2)r2.style.display='none';if(btn)btn.textContent='▲';}
  else{sb.style.height='36px';sb.classList.add('sb-expanded');if(r2)r2.style.display='flex';if(btn)btn.textContent='▼';}
}


// ── Export functions (restored) ──────────────────────────────────────────────
function exportToDXF(){
  var arr=points||[];
  var dims=dimensions||[];
  function _f(v){return Number.isFinite(v)?v.toFixed(6):'0.000000';}
  var lines=['0','SECTION','2','ENTITIES'];
  arr.forEach(function(p){
    lines.push('0','POINT','8','POINTS','10',_f(p.x),'20',_f(p.y),'30',_f(p.z||0));
  });
  if(typeof dxfElements!=='undefined'&&dxfElements){
    dxfElements.forEach(function(el){
      if(el.type==='LINE'&&el.pts&&el.pts.length>=2){
        lines.push('0','LINE','8',el.layer||'0',
          '10',_f(el.pts[0].x),'20',_f(el.pts[0].y),'30',_f(el.pts[0].z||0),
          '11',_f(el.pts[1].x),'21',_f(el.pts[1].y),'31',_f(el.pts[1].z||0));
      }
    });
  }
  lines.push('0','ENDSEC','0','EOF');
  var blob=new Blob([lines.join('\n')],{type:'application/dxf'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='export_'+(new Date()).toISOString().slice(0,10)+'.dxf';
  a.click();
  showMessage('Экспорт DXF','Файл загружен','success');
}

function openXYZExportDialog(){
  var d=document.getElementById('xyz-export-dialog');
  if(d){d.style.display=d.style.display==='none'||!d.style.display?'flex':'none';}
  else{
    // Fallback: direct export
    runXYZExport();
  }
}

function runXYZExport(){
  var arr=currentMode==='dxf'?points:manualPoints;
  if(!arr||!arr.length){showMessage('Ошибка','Нет точек','warning');return;}
  var lines=[];
  arr.forEach(function(p){
    var x=p.x.toFixed(4).replace(',','.');
    var y=p.y.toFixed(4).replace(',','.');
    var z=p.z!=null?p.z.toFixed(4).replace(',','.'):'0.0000';
    lines.push(x+'\t'+y+'\t'+z);
  });
  var blob=new Blob([lines.join('\n')],{type:'text/plain'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='points_xyz_'+(new Date()).toISOString().slice(0,10)+'.txt';
  a.click();
  showMessage('XYZ экспорт',arr.length+' точек экспортировано','success');
}

function openRebasePanel(){
  var p=document.getElementById('rebase-panel');
  if(p){p.style.display='flex';}
  else showMessage('Info','Панель пересчёта координат недоступна','info');
}

function applyRebase(){
  var newX=parseFloat((document.getElementById('rebase-new-x')||{value:''}).value.replace(',','.'));
  var newY=parseFloat((document.getElementById('rebase-new-y')||{value:''}).value.replace(',','.'));
  if(!Number.isFinite(newX)||!Number.isFinite(newY)){showMessage('Ошибка','Введите X и Y','error');return;}
  var sel=document.getElementById('rebase-point-sel');
  if(!sel||!sel.value){showMessage('Внимание','Выберите точку','warning');return;}
  var pid=parseInt(sel.value);
  var arr=currentMode==='dxf'?points:manualPoints;
  var p=arr.find(function(pt){return pt.id===pid;});
  if(!p)return;
  var dx=newX-p.x,dy=newY-p.y;
  arr.forEach(function(pt){pt.x+=dx;pt.y+=dy;});
  if(typeof dxfElements!=='undefined'&&dxfElements){
    dxfElements.forEach(function(el){
      if(el.pts)el.pts.forEach(function(v){v.x+=dx;v.y+=dy;});
      if(el.p){el.p.x+=dx;el.p.y+=dy;}
      if(el.center){el.center.x+=dx;el.center.y+=dy;}
    });
  }
  if(typeof cadSnapPoints!=='undefined'&&cadSnapPoints){
    cadSnapPoints.forEach(function(s){s.x+=dx;s.y+=dy;});
  }
  if(typeof rebuildCachedPath==='function')rebuildCachedPath();
  updateTable();requestDraw();
  showMessage('Пересчёт','ΔX='+dx.toFixed(4)+' ΔY='+dy.toFixed(4),'success');
  var panel=document.getElementById('rebase-panel');
  if(panel)panel.style.display='none';
}
