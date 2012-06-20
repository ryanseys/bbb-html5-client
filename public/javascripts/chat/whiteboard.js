// initialize variables
var slide_w;
var slide_h;
var onFirefox;
// slide variables
var paper;
var cur;
var slide;
var defaults;

// cursor variables
var cx2;
var cy2;
var cx1;
var cy1;

var rectOn;
var lineOn;

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

function turnOnShape(string) {
  if(string == "rectangle") {
    rectOn = true;
    lineOn = false;
  }
  else if(string == "line") {
    lineOn = true;
    rectOn = false;
  }
}

function initDefaults() {
  slide_w = 600;
  slide_h = 400;
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
          cx: 10,
          cy: 10,
          r: 3,
          fill: "red"
      }
  ]);
  
  slide = defaults[0];
  cur = defaults[1];
  paper.renderfix();
  if (navigator.userAgent.indexOf("Firefox") != -1) {
    onFirefox = true;
  }
}

function initEvents() {
  //when moving mouse around
  slide.mousemove(mvingCur);
  
  //when dragging
  cur.drag(curDragging, curDragStart, curDragStop); //for lines
  //cur.drag(curRectDragging, curRectDragStart, curRectDragStop); //for rectangles
}

var curDragStart = function(x, y, e) {
  if(onFirefox) {
    cx2 = e.layerX;
    cy2 = e.layerY;
  }
  else {
    cx2 = e.offsetX;
    cy2 = e.offsetY;
  }
  path = "M" + cx2 + " " + cy2; // + "L" + cx2 + " " + cy2;
};

var curDragging = function(dx, dy, x, y, e) {
  if(onFirefox) {
    cx1 = e.layerX;
    cy1 = e.layerY;
  }
  else {
    cx1 = e.offsetX;
    cy1 = e.offsetY;
  }
  emLi(cx2, cy2, cx1, cy1);
  path += "L" + cx1 + " " + cy1;
  cx2 = cx1;
  cy2 = cy1;
};

function dPath(x1, y1, x2, y2) {
  paper.path("M" + x1 +" " + y1+ "L" + x2 + " " + y2);
}

var curDragStop = function(e) {
    curves = Raphael.path2curve(path);
};

var curRectDragStart = function(x, y, e) {
  if(onFirefox) {
    cx2 = e.layerX;
    cy2 = e.layerY;
  }
  else {
    cx2 = e.offsetX;
    cy2 = e.offsetY;
  }
    emMakeRect(cx2, cy2);
};

var curRectDragging = function(dx, dy, x, y, e) {
    if(dx < 0) {
      x1 = cx2 + dx;
      dx = -dx;
    }
    else x1 = cx2;
    if(dy < 0) {
      y1 = cy2 + dy;
      dy = -dy;
    }
    else y1 = cy2;
    emUpdRect(x1, y1, dx, dy);
};

function makeRect(x, y) {
  rect = paper.rect(x, y, 0, 0);
}

function updRect(x1, y1, w, h) {
  rect.attr({ x: x1, y: y1, width: w, height: h});
}

var curRectDragStop = function(e) {
    console.log('done rectangle');
};

var mvingCur = function(e) {
  if(onFirefox) emMvCur(e.layerX, e.layerY);
  else emMvCur(e.offsetX, e.offsetY);
};

function mvCur(x, y) {
  cur.attr({ cx: x, cy: y });
}

function clearPaper() {
  paper.clear();
  initPaper();
}

function initPaper() {
  initDefaults();
  initEvents();
}

initPaper();