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

function initDefaults() {
  slide_w = 600;
  slide_h = 400;
  view_w = 600;
  view_h = 400;
  paper = paper || Raphael("slide", slide_w, slide_h);
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
  turnOn("panzoom");
  if (navigator.userAgent.indexOf("Firefox") != -1) {
    onFirefox = true;
    paper.renderfix();
  }
}

function initEvents() {
  //when moving mouse around
  slide.mousemove(mvingCur);
}

var panDragging = function(dx, dy, x, y) {
  pan_x = (cornerx - dx)/view_w;
  pan_y = (cornery - dy)/view_h;
  //check to make sure not out of boundary
  if(pan_x < 0) pan_x = 0;
  if(pan_y < 0) pan_y = 0;
  
  if(pan_x*view_w + view_w > slide_w) pan_x = (slide_w - view_w)/view_w;
  if(pan_y*view_h + view_h > slide_h) pan_y = (slide_h - view_h)/view_h;
  console.log("emit " + [pan_x, pan_y, view_w/slide_w, view_h/slide_h].join(" "));
  emViewBox(pan_x, pan_y, view_w/slide_w, view_h/slide_h);
  //paper.setViewBox(pan_x*view_w, pan_y*view_h, view_w, view_h);
};

function setViewBox(xperc, yperc, wperc, hperc) {
  console.log("set " + [xperc*view_w, yperc*view_h, wperc*view_w, hperc*view_h].join(" "));
  paper.setViewBox(xperc*view_w, yperc*view_h, wperc*slide_w, hperc*slide_h);
}

var panGo = function(x, y) {
  
};

var panStop = function(e) {
  cornerx = paper._viewBox[0];
  cornery = paper._viewBox[1];
};

var curDragStart = function(x, y) {
  cx1 = (x - s_left)/slide_w;
  cy1 = (y - s_top)/slide_h;
  path = "M" + cx1 + " " + cy1;
};

var curDragging = function(dx, dy, x, y) {
  cx2 = (x - s_left)/slide_w;
  cy2 = (y - s_top)/slide_h;
  emLi(cx1, cy1, cx2, cy2);
  path += "L" + cx2 + " " + cy2;
  cx1 = cx2;
  cy1 = cy2;
};

function dPath(x1, y1, x2, y2) {
  paper.path("M" + x1*view_w +" " + y1*view_h + "L" + x2*view_w + " " + y2*view_h);
}

var curDragStop = function(e) {
  curves = Raphael.path2curve(path);
};

var curRectDragStart = function(x, y) {
  cx2 = (x - s_left)/slide_w;
  cy2 = (y - s_top)/slide_h;
  emMakeRect(cx2, cy2);
};

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

function makeRect(x, y) {
  rect = paper.rect(x*slide_w, y*slide_h, 0, 0);
}

function updRect(x1, y1, w, h) {
  rect.attr({ x: x1*slide_w, y: y1*slide_h, width: w*slide_w, height: h*slide_h });
}

var curRectDragStop = function(e) {
  
};

var mvingCur = function(e, x, y) {
  emMvCur((x - s_left)/slide_w, (y - s_top)/slide_h);
};

function mvCur(x, y) {
  cur.attr({ cx: (x + pan_x)*view_w, cy: (y + pan_y)*view_h });
}

function clearPaper() {
  paper.clear();
  initPaper();
}

var zoomSlide = function(event, delta) {
  if(delta < 0) {
    view_w = view_w * 1.05;
    view_h = view_h * 1.05;
  }
  else {
    view_w = view_w * 0.95;
    view_h = view_h * 0.95;
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
  console.log([pan_x, pan_y, view_w/slide_w, view_h/slide_h].join(" "));
  emViewBox(pan_x, pan_y, view_w/slide_w, view_h/slide_h);
  //paper.setViewBox(pan_x*view_w, pan_y*view_h, view_w, view_h);
};

function initPaper() {
  initDefaults();
  initEvents();
}

initPaper();