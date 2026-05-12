'use strict';
// ── Global state ──────────────────────────────
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
