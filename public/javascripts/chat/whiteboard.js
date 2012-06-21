//object references
slide_obj = document.getElementById("slide");

// initialize variables
var slide_w;
var slide_h;
var bottom_x;
var bottom_y;
var zoom_x;
var zoom_y;
var s_left;
var s_top;
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
  bottom_x = 600;
  bottom_y = 400;
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
  cornerx = 0;
  cornery = 0;
  lineOn = false;
  rectOn = false;
  panZoomOn = false;
  turnOn("line");
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
  //bottom_x = 300;
  //bottom_y = 200;
  s_left = cornerx - dx;
  s_top = cornery - dy;
  //check to make sure not out of boundary
  if(s_left < 0) s_left = 0;
  if(s_top < 0) s_top = 0;
  if(bottom_x + s_left > slide_w) s_left = slide_w - bottom_x;
  if(bottom_y + s_top > slide_h) s_top = slide_h - bottom_y;
  //if(s_left > slide_w) s_left = slide_w;
  //if(s_top > slide_h) s_top = slide_h;
  console.log(s_left + " " + s_top + " " + bottom_x + " " + bottom_y);
  paper.setViewBox(s_left, s_top, bottom_x, bottom_y);
};

var panGo = function(x, y) {
  cur.hide();
};

var panStop = function(e) {
  cornerx = paper._viewBox[0];
  cornery = paper._viewBox[1];
  cur.show();
};

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

var zoomSlide = function(event, delta) {
    var dir = delta > 0 ? 'Up' : 'Down',
        vel = Math.abs(delta);
    console.log(dir + ' at a velocity of ' + vel);
    if(delta < 0) {
      bottom_x = bottom_x * 1.05;
      bottom_y = bottom_y * 1.05;
    }
    else {
      bottom_x = bottom_x * 0.95;
      bottom_y = bottom_y * 0.95;
    }
    if(bottom_x > slide_w) {
      bottom_x = slide_w;
      s_left = 0;
    }
    if(bottom_y > slide_h) {
      bottom_y = slide_h;
      s_top = 0;
    }
    if(bottom_x + s_left > slide_w) s_left = slide_w - bottom_x;
    if(bottom_y + s_top > slide_h) s_top = slide_h - bottom_y;
    paper.setViewBox(s_left, s_top, bottom_x, bottom_y);
    return false;
};

jQuery(function($) {
    
});

function initPaper() {
  initDefaults();
  initEvents();
}

initPaper();