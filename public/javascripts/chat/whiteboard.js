//object references
slide_obj = document.getElementById("slide");

// initialize variables
var slide_w; //the width of the slide div (container for the svg) (in pixels)
var slide_h; //the height of the slide div (container for the svg) (in pixels)

//the number of pixels from left to right shown in the slide div (more zoom = less pixels, max pixels = slide_w)
var view_w;
//the number of pixels from top to bottom shown in the slide div (more zoom = less pixels, max pixels = slide_h)
var view_h;

//svg offset is from the corner of the document to the slide div
var s_left; //fixed - DO NOT MODIFY
var s_top; //fixed - DO NOT MODIFY

var ZOOM_MAX; //static
//percentage as a decimal of the pan from the top left corner of the *view* to the top left corner of the svg.
//this is a weird number
var pan_x;
var pan_y;

//whether person is on firefox browser or not
var onFirefox;
var panning; // 0 is off, 1 is started, 2 is in progress
// slide variables
var paper;
var cur;
var current_url;
var defaults;

var global_box_w = 600;
var global_box_h = 400;

//number of pixels to the left the corner of the view is
var cornerx;
// number of pixels down from the top corner of the view
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

var shapes;

//
var resizing = false;

//for rectangles
var rect;

function getRectOn() {
  return rectOn;
}

function getLineOn() {
  return lineOn;
}

function turnOn(tool) {
  
  // If the user requests to turn on the line too
  if(tool == 'line') {
    if(!lineOn) {
      rectOn = false;
      panZoomOn = false;
      lineOn = true;
      //cur.undrag();
      $('#slide').unbind('mousewheel');
      //cur.drag(curDragging, curDragStart, curDragStop);
      for(url in slides) {
        if(slides.hasOwnProperty(url)) {
          paper.getById(slides[url].id).undrag();
          paper.getById(slides[url].id).drag(curDragging, curDragStart, curDragStop);
          //paper.getById(slides[url]).mousemove(mvingCur);
        }
      }
    }
  }
  // If the user requests to turn on the rectangle tool
  else if(tool == 'rect') {
    if(!rectOn) {
      lineOn = false;
      panZoomOn = false;
      rectOn = true;
      //cur.undrag();
      $('#slide').unbind('mousewheel');
      //cur.drag(curRectDragging, curRectDragStart, curRectDragStop);
      for(url in slides) {
        if(slides.hasOwnProperty(url)) {
          paper.getById(slides[url].id).undrag();
          paper.getById(slides[url].id).drag(curRectDragging, curRectDragStart, curRectDragStop);
          //paper.getById(slides[url]).mousemove(mvingCur);
        }
      }
    }
  }

  // If the user requests to turn on the pan & zoom tool
  else if(tool == 'panzoom') {
    if(!panZoomOn) {
      rectOn = false;
      lineOn = false;
      panZoomOn = true;
      //cur.undrag();
      $('#slide').bind('mousewheel', zoomSlide);
      //cur.drag(panDragging, panGo, panStop);
      for(url in slides) {
        if(slides.hasOwnProperty(url)) {
          paper.getById(slides[url].id).undrag();
          paper.getById(slides[url].id).drag(panDragging, panGo, panStop);
          //paper.getById(slides[url]).mousemove(mvingCur);
        }
      }
    }
  }
  else {
    console.log("ERROR: Cannot turn on tool, invalid tool: " + tool);
  }
}

// Initialize default values
function initDefaults() {
  // Do not touch unless you know what you're doing
  

  
  slide_w = global_box_w;
  slide_h = global_box_h;
  
  // Create a slide if not already created
  paper = paper || Raphael("slide", global_box_w, global_box_h);
  
  //Default objects in paper (canvas)
  if(!resizing) {
    ZOOM_MAX = 4;
    default_cur_r = 3;
    shapes = paper.set();
    defaults = paper.add([
      {
        type: "circle",
        cx: 0,
        cy: 0,
        r: default_cur_r,
        fill: "red"
      }
    ]);
  }
  
  if (paper._viewBox) {
    view_w = paper._viewBox[2];
    view_h = paper._viewBox[3];
  }
  else {
    view_w = slide_w;
    view_h = slide_h;
  }
  
  // Set defaults for variables
  if(slides && !resizing) rebuildPaper();
  else slides = {}; //if previously loaded
  
  cur = defaults[0];
  s_left = slide_obj.offsetLeft;
  s_top = slide_obj.offsetTop;
  cornerx = 0;
  cornery = 0;
  panning = 0;
  
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

/*
function recalculateView() {
  var w = parseInt($('#wslider').val(), 10);
  var h = parseInt($('#hslider').val(), 10);
  $('#slide').height(h);
  $('#slide').width(w);
  
  paper.setSize(w, h);

  global_box_w = w;
  global_box_h = h;
  resizing = true;
  document.getElementsByTagName('svg')[0].setAttribute('preserveAspectRatio', 'XMidYMid');
  initDefaults();
  resizing = false;
  document.getElementsByTagName('svg')[0].forceRedraw();
}
*/

// Initialize the paper
function initPaper() {
  initDefaults();
}

function addImageToPaper(url) {
  var img = paper.image(url, 0, 0, slide_w, slide_h);
  img.node.setAttribute('preserveAspectRatio', 'XMidYMid');
  img.hide();
  slides[url] = { 'id' : img.id };
  img.drag(curDragging, curDragStart, curDragStop);
  var newimg = new Image();
  newimg.onload = function() {
    slides[url].height = newimg.height;
    slides[url].width = newimg.width;
  };
  
  newimg.src = url;
  img.mousemove(mvingCur);
  return img;
}

function removeAllImagesFromPaper() {
  var img;
  for (url in slides) {
    if(slides.hasOwnProperty(url)) {
      paper.getById(slides[url].id).remove();
      $('#preload' + slides[url].id).remove();
    }
  }
  slides = {};
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
  var current = getImageFromPaper(current_url);
  if(current) current.hide();
  var next = getImageFromPaper(url);
  if(next) next.show();
  current_url = url;
}

function getImageFromPaper(url) {
  if(slides[url]) {
    var id = slides[url].id;
    if(id) {
      return paper.getById(id);
    }
  }
  return null;
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
  pan_x = xperc;
  pan_y = yperc;
  view_w = wperc*slide_w;
  view_h = hperc*slide_h;
  paper.setViewBox(xperc*view_w, yperc*view_h, wperc*slide_w, hperc*slide_h);
  if((panning == 0) || (panning == 1)) {
    cornerx = xperc*view_w;
    cornery = yperc*view_h;
    if(panning == 1) {
     panning = 2;
    }
  }
}

//When panning starts (placeholder for now)
var panGo = function(x, y) {
  cur.hide();
  panning = 1;
};

// When panning finishes
var panStop = function(e) {
  cornerx = paper._viewBox[0];
  cornery = paper._viewBox[1];
  emPanStop();
};

// Socket response - panStop occurred
function panDone() {
  cur.show();
  panning = 0;
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
  shapes.push(paper.path("M" + (x1+pan_x)*view_w +" " + (y1+pan_y)*view_h + "L" + (x2+pan_x)*view_w + " " + (y2+pan_y)*view_h));
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
  //zooming out
  if(delta < 0) {
      view_w = view_w * 1.05;
      view_h = view_h * 1.05;
      cur.attr({ 'r' : cur.attrs.r*1.05 });
  }
  //zooming in
  else {
    //cannot zoom in too much
    if(slide_h/view_h < ZOOM_MAX) {
      view_w = view_w * 0.95;
      view_h = view_h * 0.95;
      cur.attr({ 'r' : cur.attrs.r*0.95 });
    }
  }
  //handle left side collision
  if(view_w > slide_w) {
    view_w = slide_w;
    pan_x = 0;
    cur.attr({ 'r' : default_cur_r });
  }
  //handle top collision
  if(view_h > slide_h) {
    view_h = slide_h;
    pan_y = 0;
    cur.attr({ 'r' : default_cur_r });
  }
  //handle right wall collisions
  if(pan_x*view_w + view_w > slide_w) pan_x = (slide_w - view_w)/view_w;
  //handle left wall collisions
  if(pan_y*view_h + view_h > slide_h) pan_y = (slide_h - view_h)/view_h;
  emViewBox(pan_x, pan_y, view_w/slide_w, view_h/slide_h);
}

initPaper();