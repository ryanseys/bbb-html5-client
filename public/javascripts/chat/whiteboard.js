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
var current_url;
var defaults;
var cornerx;
var cornery;

var slides;

var default_cur_r;

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
      $('#slide').unbind('mousewheel');
      cur.drag(curRectDragging, curRectDragStart, curRectDragStop);
      for(url in slides) {
        if(slides.hasOwnProperty(url)) {
          paper.getById(slides[url]).undrag();
          paper.getById(slides[url]).drag(curRectDragging, curRectDragStart, curRectDragStop);
          //paper.getById(slides[url]).mousemove(mvingCur);
        }
      }
    }
  }
  // If the user requests to turn on the line tool
  else if(string == "line") {
    if(!lineOn) {
      rectOn = false;
      panZoomOn = false;
      lineOn = true;
      cur.undrag();
      $('#slide').unbind('mousewheel');
      cur.drag(curDragging, curDragStart, curDragStop);
      for(url in slides) {
        if(slides.hasOwnProperty(url)) {
          paper.getById(slides[url]).undrag();
          paper.getById(slides[url]).drag(curDragging, curDragStart, curDragStop);
          //paper.getById(slides[url]).mousemove(mvingCur);
        }
      }
    }
  }
  // If the user requests to turn on the pan & zoom tool
  else if(string == "panzoom") {
    if(!panZoomOn) {
      rectOn = false;
      lineOn = false;
      panZoomOn = true;
      cur.undrag();
      $('#slide').bind('mousewheel', zoomSlide);
      cur.drag(panDragging, panGo, panStop);
      for(url in slides) {
        if(slides.hasOwnProperty(url)) {
          paper.getById(slides[url]).undrag();
          paper.getById(slides[url]).drag(panDragging, panGo, panStop);
          //paper.getById(slides[url]).mousemove(mvingCur);
        }
      }
    }
  }
}

// Initialize default values
function initDefaults() {
  // Do not touch unless you know what you're doing
  
  ZOOM_MAX = 4;
  default_cur_r = 3;

  slide_w = 600;
  slide_h = 400;

  // Create a slide if not already created
  paper = paper || Raphael("slide", 600, 400);

  //Default objects in paper (canvas)
  defaults = paper.add([
    {
      type: "circle",
      cx: 0,
      cy: 0,
      r: default_cur_r,
      fill: "red"
    }
  ]);

  if (paper._viewBox) {
    view_w = paper._viewBox[2];
    view_h = paper._viewBox[3];
  }
  else {
    view_w = slide_w;
    view_h = slide_h;
  }

  // Set defaults for variables
  if(slides) {
    rebuildPaper();
  }
  else {
    slides = {}; //if previously loaded
  }
  cur = defaults[0];
  s_left = slide_obj.offsetLeft;
  s_top = slide_obj.offsetTop;
  cornerx = 0;
  cornery = 0;
  if(paper._viewBox) {
    pan_x = paper._viewBox[0]/view_w;
    pan_y = paper._viewBox[1]/view_h;
  }
  else {
    pan_x = 0;
    pan_y = 0;
  }

  lineOn = false;
  rectOn = false;
  panZoomOn = false;

  // Firefox fix
  if (navigator.userAgent.indexOf("Firefox") != -1) {
    onFirefox = true;
    paper.renderfix();
  }
}

// Initialize the events
function initEvents() {
  turnOn("line"); // default tool on is specified here
}

// Initialize the paper
function initPaper() {
  initDefaults();
  initEvents();
}

function addImageToPaper(url) {
  var img = paper.image(url, 0, 0, slide_w, slide_h);
  img.hide();
  slides[url] = img.id;
  img.drag(curDragging, curDragStart, curDragStop);
  //img.mousemove(mvingCur);
  return img;
}

function removeAllImagesFromPaper() {
  var img;
  for (url in slides) {
    if(slides.hasOwnProperty(url)) {
      paper.getById(slides[url]).remove();
      $('#preload' + slides[url]).remove();
    }
  }
  slides = {};
}

function getImageFromPaper(url) {
  var id = slides[url];
  if(id) {
    return paper.getById(id);
  }
  else return null;
}

function rebuildPaper() {
  for(url in slides) {
    if(slides.hasOwnProperty(url)) {
      addImageToPaper(url);
    }
  }
  showImageFromPaper(current_url);
}

function showImageFromPaper(url) {
  var id = slides[url];
  for(thisurl in slides) {
    if(url != thisurl) {
      var img = paper.getById(slides[thisurl]);
      if(img) img.hide();
    }
  }
  paper.getById(id).show();
  current_url = url;
}

function hideImageFromPaper(url) {
  var img = getImageFromPaper(url);
  if(img) img.hide();
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
  path = (cx1+pan_x)*view_w/slide_w + " " + (cy1+pan_y)*view_h/slide_h;
};

// As line drawing drag continues
var curDragging = function(dx, dy, x, y) {
  cx2 = (x - s_left)/slide_w;
  cy2 = (y - s_top)/slide_h;
  emLi(cx1, cy1, cx2, cy2); //emit to socket
  path += "," + (cx2+pan_x)*view_w/slide_w + " " + (cy2+pan_y)*view_h/slide_h;
  cx1 = cx2;
  cy1 = cy2;
};

// Socket response - Draw the path (line) on the canvas
function dPath(x1, y1, x2, y2) {
  paper.path("M" + (x1+pan_x)*view_w +" " + (y1+pan_y)*view_h + "L" + (x2+pan_x)*view_w + " " + (y2+pan_y)*view_h);
};

// Drawing line has ended
var curDragStop = function(e) {
  emPublishPath(path);
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

function drawRect(x, y, w, h) {
  var r = paper.rect(x*slide_w, y*slide_h, w*slide_w, h*slide_h);
}

// Socket response - Update rectangle drawn
function updRect(x1, y1, w, h) {
  if(rect) {
    rect.attr({ x: (x1 + pan_x)*view_w, y: (y1 + pan_y)*view_h, width: w*view_w, height: h*view_h });
  }
  else rect = paper.rect(x1*slide_w, y1*slide_h, w, h);
}

// When rectangle finished being drawn (placeholder for now)
var curRectDragStop = function(e) {
  if(rect) var r = rect.attrs;
  if(r) emPublishRect(r.x/slide_w, r.y/slide_h, r.width/slide_w, r.height/slide_h);
  rect = null;
};

// Send cursor moving event to server
var mvingCur = function(e, x, y) {
  emMvCur((x - s_left)/slide_w, (y - s_top)/slide_h);
};

// Socket response - Update the cursor position on screen
function mvCur(x, y) {
  cur.attr({ cx: (x + pan_x)*view_w, cy: (y + pan_y)*view_h });
};

// Socket response - Clear canvas
function clearPaper() {
  paper.clear();
  initPaper();
}

function setPath(path) {
  paper.path(path);
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
      cur.attr({ 'r' : cur.attrs.r*1.05 });
  }
  else {
    if(slide_h/view_h < ZOOM_MAX) {
      view_w = view_w * 0.95;
      view_h = view_h * 0.95;
      cur.attr({ 'r' : cur.attrs.r*0.95 });
    }
  }
  if(view_w > slide_w) {
    view_w = slide_w;
    pan_x = 0;
    cur.attr({ 'r' : default_cur_r });
  }
  if(view_h > slide_h) {
    view_h = slide_h;
    pan_y = 0;
    cur.attr({ 'r' : default_cur_r });
  }
  if(pan_x*view_w + view_w > slide_w) pan_x = (slide_w - view_w)/view_w;
  if(pan_y*view_h + view_h > slide_h) pan_y = (slide_h - view_h)/view_h;
  emViewBox(pan_x, pan_y, view_w/slide_w, view_h/slide_h);
}

initPaper();