// ── 3d.js ──────────────────────────────────────────

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
