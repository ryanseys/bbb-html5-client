//object references
slide_obj = document.getElementById("slide");

// initialize variables
var slide_w;
var slide_h;
var view_w;
var view_h;
var zoom_x;
var zoom_y;
var s_left; //fixed - DO NOT MODIFY
var s_top; //fixed - DO NOT MODIFY
var ZOOM_MAX; //static
var pan_x;
var pan_y;
var onFirefox;

// slide variables
var paper;
var cur;
var slide;
var defaults;
var cornerx;
var cornery;

// cursor variables
var cx2;
var cy2;
var cx1;
var cy1;

var rectOn;
var lineOn;
var panZoomOn;

//for lines
var path;
var step;
var end;
var x1;
var y1;

//for rectangles
var rect;

function getRectOn() {
  return rectOn;
}

function getLineOn() {
  return lineOn;
}

function turnOn(string) {
  // If the user requests to turn on the rectangle tool
  if(string == "rectangle") {
    if(!rectOn) {
      lineOn = false;
      panZoomOn = false;
      rectOn = true;
      cur.undrag();
      slide.undrag();
      $('#slide').unbind('mousewheel');
      cur.drag(curRectDragging, curRectDragStart, curRectDragStop);
      slide.drag(curRectDragging, curRectDragStart, curRectDragStop);
    }
  }
  // If the user requests to turn on the line tool
  else if(string == "line") {
    if(!lineOn) {
      rectOn = false;
      panZoomOn = false;
      lineOn = true;
      cur.undrag();
      slide.undrag();
      $('#slide').unbind('mousewheel');
      cur.drag(curDragging, curDragStart, curDragStop);
      slide.drag(curDragging, curDragStart, curDragStop);
    }
  }
  // If the user requests to turn on the pan & zoom tool
  else if(string == "panzoom") {
    if(!panZoomOn) {
      rectOn = false;
      lineOn = false;
      panZoomOn = true;
      cur.undrag();
      slide.undrag();
      $('#slide').bind('mousewheel', zoomSlide);
      cur.drag(panDragging, panGo, panStop);
      slide.drag(panDragging, panGo, panStop);
    }
  }
}

// Initialize default values
function initDefaults() {
  // Do not touch unless you know what you're doing
  slide_w = 600;
  slide_h = 400;
  view_w  = 600;
  view_h = 400;
  ZOOM_MAX = 4;
  
  // Create a slide if not already created
  paper = paper || Raphael("slide", slide_w, slide_h);
  
  //Default objects in paper (canvas)
  defaults = paper.add([
    {
      type: "image",
      src: '/images/presentation/test1.png',
      x: 0,
      y: 0,
      width: slide_w,
      height: slide_h
    },
    {
      type: "circle",
      cx: 0,
      cy: 0,
      r: 3,
      fill: "red"
    }
  ]);
  
  // Set defaults for variables
  slide = defaults[0];
  cur = defaults[1];
  s_left = slide_obj.offsetLeft;
  s_top = slide_obj.offsetTop;
  cornerx = 0;
  cornery = 0;
  pan_x = 0;
  pan_y = 0;
  lineOn = false;
  rectOn = false;
  panZoomOn = false;
  turnOn("panzoom"); // default tool on is specified here
  
  // Firefox fix
  if (navigator.userAgent.indexOf("Firefox") != -1) {
    onFirefox = true;
    paper.renderfix();
  }
}

// Initialize the events
function initEvents() {
  slide.mousemove(mvingCur);
}

// Initialize the paper
function initPaper() {
  initDefaults();
  initEvents();
}

// When the user is dragging the cursor (click + move)
var panDragging = function(dx, dy, x, y) {
  pan_x = (cornerx - dx)/view_w;
  pan_y = (cornery - dy)/view_h;
  //check to make sure not out of boundary
  if(pan_x < 0) pan_x = 0;
  if(pan_y < 0) pan_y = 0;
  if(pan_x*view_w + view_w > slide_w) pan_x = (slide_w - view_w)/view_w;
  if(pan_y*view_h + view_h > slide_h) pan_y = (slide_h - view_h)/view_h;
  emViewBox(pan_x, pan_y, view_w/slide_w, view_h/slide_h);
};

// Socket response - Set the ViewBox of the paper
function setViewBox(xperc, yperc, wperc, hperc) {
  paper.setViewBox(xperc*view_w, yperc*view_h, wperc*slide_w, hperc*slide_h);
}

//When panning starts (placeholder for now)
var panGo = function(x, y) {
  cur.hide();
};

// When panning finishes
var panStop = function(e) {
  emPanStop();
};

// Socket response - panStop occurred
function panDone() {
  cornerx = paper._viewBox[0];
  cornery = paper._viewBox[1];
  cur.show();
}

// When dragging for drawing lines starts
var curDragStart = function(x, y) {
  cx1 = (x - s_left)/slide_w;
  cy1 = (y - s_top)/slide_h;
  path = "M" + cx1 + " " + cy1;
};

// As line drawing drag continues
var curDragging = function(dx, dy, x, y) {
  cx2 = (x - s_left)/slide_w;
  cy2 = (y - s_top)/slide_h;
  emLi(cx1, cy1, cx2, cy2); //emit to socket
  path += "L" + cx2 + " " + cy2;
  cx1 = cx2;
  cy1 = cy2;
};

// Socket response - Draw the path (line) on the canvas
function dPath(x1, y1, x2, y2) {
  paper.path("M" + x1*view_w +" " + y1*view_h + "L" + x2*view_w + " " + y2*view_h);
}

// Drawing line has ended
var curDragStop = function(e) {
  curves = Raphael.path2curve(path);
};

// Creating a rectangle has started
var curRectDragStart = function(x, y) {
  cx2 = (x - s_left)/slide_w;
  cy2 = (y - s_top)/slide_h;
  emMakeRect(cx2, cy2);
};

// Adjusting rectangle continues
var curRectDragging = function(dx, dy, x, y, e) {
  dx = dx/slide_w;
  dy = dy/slide_h;
  if(dx >= 0) x1 = cx2;
  else {
    x1 = cx2 + dx;
    dx = -dx;
  }
  if(dy >= 0) y1 = cy2;
  else {
    y1 = cy2 + dy;
    dy = -dy;
  }
  emUpdRect(x1, y1, dx, dy);
};

// Socket response - Make rectangle on canvas
function makeRect(x, y) {
  rect = paper.rect(x*slide_w, y*slide_h, 0, 0);
}

// Socket response - Update rectangle drawn
function updRect(x1, y1, w, h) {
  rect.attr({ x: x1*slide_w, y: y1*slide_h, width: w*slide_w, height: h*slide_h });
}

// When rectangle finished being drawn (placeholder for now)
var curRectDragStop = function(e) {
};

// Send cursor moving event to server
var mvingCur = function(e, x, y) {
  emMvCur((x - s_left)/slide_w, (y - s_top)/slide_h);
};

// Socket response - Update the cursor position on screen
function mvCur(x, y) {
  cur.attr({ cx: (x + pan_x)*view_w, cy: (y + pan_y)*view_h });
}

// Socket response - Clear canvas
function clearPaper() {
  paper.clear();
  initPaper();
}

// Update zoom variables on all clients
var zoomSlide = function(event, delta) {
  emZoom(delta);
};

// Socket response - Update zoom variables and viewbox
function setZoom(delta) {
  if(delta < 0) {
      view_w = view_w * 1.05;
      view_h = view_h * 1.05;
  }
  else {
    if(slide_h/view_h < ZOOM_MAX) {
      view_w = view_w * 0.95;
      view_h = view_h * 0.95;
    }
  }
  if(view_w > slide_w) {
    view_w = slide_w;
    pan_x = 0;
  }
  if(view_h > slide_h) {
    view_h = slide_h;
    pan_y = 0;
  }
  if(pan_x*view_w + view_w > slide_w) pan_x = (slide_w - view_w)/view_w;
  if(pan_y*view_h + view_h > slide_h) pan_y = (slide_h - view_h)/view_h;
  emViewBox(pan_x, pan_y, view_w/slide_w, view_h/slide_h);
}

// After entire file loaded, initialize the paper
initPaper();