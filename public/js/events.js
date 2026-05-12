// ── events.js — event listeners and initialization ──

// Patch startContour and clearContour to update bar
var _origStartContour=startContour;
startContour=function(){_origStartContour();_updateQuickBar();};
var _origClearContour=clearContour;
clearContour=function(){_origClearContour();_updateQuickBar();};
var _origCloseContour=closeContour;
closeContour=function(){_origCloseContour();_updateQuickBar();};
