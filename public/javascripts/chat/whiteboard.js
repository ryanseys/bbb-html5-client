//object references
slide_obj = document.getElementById("slide");

// initialize variables
var slide_w;
var slide_h;
var s_left;
var s_top;
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
    if(!rectOn) {
      rectOn = true;
      lineOn = false;
      cur.undrag();
      cur.drag(curRectDragging, curRectDragStart, curRectDragStop);
      slide.drag(curRectDragging, curRectDragStart, curRectDragStop);
    }
  }
  else if(string == "line") {
    if(!lineOn) {
      lineOn = true;
      rectOn = false;
      cur.undrag();
      cur.drag(curDragging, curDragStart, curDragStop);
      slide.drag(curDragging, curDragStart, curDragStop);
    }
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
  s_left = slide_obj.offsetLeft;
  s_top = slide_obj.offsetTop;
  lineOn = false;
  rectOn = false;
  turnOnShape("line");
  if (navigator.userAgent.indexOf("Firefox") != -1) {
    onFirefox = true;
    paper.renderfix();
  }
}

function initEvents() {
  //when moving mouse around
  slide.mousemove(mvingCur);
}

var curDragStart = function(x, y) {
  cx1 = x - s_left;
  cy1 = y - s_top;
  path = "M" + cx1 + " " + cy1;
};

var curDragging = function(dx, dy, x, y) {
  cx2 = x - s_left;
  cy2 = y - s_top;
  emLi(cx1, cy1, cx2, cy2);
  path += "L" + cx2 + " " + cy2;
  cx1 = cx2;
  cy1 = cy2;
};

function dPath(x1, y1, x2, y2) {
  paper.path("M" + x1 +" " + y1 + "L" + x2 + " " + y2);
}

var curDragStop = function(e) {
    curves = Raphael.path2curve(path);
};

var curRectDragStart = function(x, y) {
  cx2 = x - s_left;
  cy2 = y - s_top;
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

var mvingCur = function(e, x, y) {
  emMvCur(x - s_left, y - s_top);
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