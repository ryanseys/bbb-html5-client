// initialize variables
var slide_w;
var slide_h;

// slide variables
var paper;
var cur;
var slide;
var defaults;

// cursor variables
var p_curx;
var p_cury;
var curx;
var cury;

var rectOn;
var lineOn;

//for lines
var path;
var step;
var end;

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
}

function initEvents() {
  //when moving mouse around
  slide.mousemove(mvCur);
  
  //when dragging
  cur.drag(curDragging, curDragStart, curDragStop); //for lines
  //cur.drag(curRectDragging, curRectDragStart, curRectDragStop); //for rectangles
}

var curDragStart = function(x, y, e) {
    p_curx = e.offsetX;
    p_cury = e.offsetY;
    path = "M" + p_curx + " " + p_cury + "L" + p_curx + " " + p_cury;
};

var curDragging = function(dx, dy, x, y, e) {
    curx = e.offsetX;
    cury = e.offsetY;
    end = "L" + curx + " " + cury;
    step = "M" + p_curx + " " + p_cury + end;
    paper.path(step);
    path += end;
    p_curx = curx;
    p_cury = cury;
};

var curDragStop = function(e) {
    curves = Raphael.path2curve(path);
};

var curRectDragStart = function(x, y, e) {
    p_curx = e.offsetX;
    p_cury = e.offsetY;
    rect = paper.rect(p_curx, p_cury, 0, 0);
};

var curRectDragging = function(dx, dy, x, y, e) {
    if(dx < 0) {
      xval = p_curx + dx;
      dx = -dx;
    }
    else xval = p_curx;
    if(dy < 0) {
      yval = p_cury + dy;
      dy = -dy;
    }
    else yval = p_cury;
    rect.attr({ x: xval, y: yval, width: dx, height: dy});
};

var curRectDragStop = function(e) {

    console.log('done rectangle');
};

var mvCur = function(e) {
  cur.attr({ cx: e.offsetX, cy: e.offsetY });
};

function clearPaper() {
  paper.clear();
  initPaper();
}

function initPaper() {
  initDefaults();
  initEvents();
}

initPaper();