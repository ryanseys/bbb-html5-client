//object references
slide_obj = document.getElementById("slide");

var cx2, cy2, cx1, cy1, x1, y1, x2, y2, px, py, cx, cy, sw, sh, slides,
    paper, cur, defaults, onFirefox, s_top, s_left, current_url, 
    current_colour, current_thickness, path, rect;
var gw = 600, gh = 400, rectOn = false, lineOn = false, panZoomOn = false, 
    zoom_level = 1, fitToPage = true, first_image_displayed = false, path_max = 30,
    path_count = 0, ZOOM_MAX = 4, panning = 0, default_colour = "#FF0000", default_thickness = 1,
    dcr = 3;

current_colour = default_colour;

function drawThicknessView(thickness, colour) {
  current_thickness = thickness;
  tctx.fillStyle='#FFFFFF';
  tctx.fillRect(0,0,20,20);
  var center = Math.round((20-thickness+1)/2);
  tctx.fillStyle=colour;
  tctx.fillRect(center,center,thickness+1,thickness+1);
}

function drawColourView(colour) {
  current_colour = colour;
  ctx.fillStyle = colour;
  cptext.value = colour;
  ctx.fillRect(0,0,12,12);
}
function getRectOn() {
  return rectOn;
}

function getLineOn() {
  return lineOn;
}

function setCurrentTool(tool) {
  current_tool = tool;
}

function toggleColourPicker() {
  if(cpVisible) {
    cpVisible = false;
    cp.raphael.forEach(function(i){ i.hide(); });
  }
  else {
    cpVisible = true;
    cp.raphael.forEach(function(i){ i.show(); });
  }
}

function turnOn(tool) {
  // If the user requests to turn on the line too
  if(tool == 'line') {
    rectOn = false;
    panZoomOn = false;
    lineOn = true;
    cur.undrag();
    $('#slide').unbind('mousewheel');
    cur.drag(curDragging, curDragStart, curDragStop);
  }
  // If the user requests to turn on the rectangle tool
  else if(tool == 'rect') {
    lineOn = false;
    panZoomOn = false;
    rectOn = true;
    cur.undrag();
    $('#slide').unbind('mousewheel');
    cur.drag(curRectDragging, curRectDragStart, curRectDragStop);
  }

  // If the user requests to turn on the pan & zoom tool
  else if(tool == 'panzoom') {
    rectOn = false;
    lineOn = false;
    panZoomOn = true;
    cur.undrag();
    $('#slide').bind('mousewheel', zoomSlide);
    cur.drag(panDragging, panGo, panStop);
  }
  else {
    console.log("ERROR: Cannot turn on tool, invalid tool: " + tool);
  }
}

// Initialize default values
function initDefaults() {
  paper = paper || Raphael("slide", gw, gh);
  cur = paper.circle(0, 0, dcr);
  cur.attr('fill', 'red');
  // Set defaults for variables
  if(slides) {
    rebuildPaper();
  }
  else slides = {}; //if previously loaded
  
  if (navigator.userAgent.indexOf("Firefox") != -1) {
    paper.renderfix();
  }
}

function updatePaperFromServer(cx_, cy_, sw_, sh_) {
  if(panning != 1) {
    paper.setViewBox(cx = cx_*gw, cy = cy_*gh, sw = sw_*gw || sw, sh = sh_*gh || sh);
  }
  else paper.setViewBox(cx_*gw, cy_*gh, sw = sw_*gw || sw, sh = sh_*gh || sh);
  //paper.setSize(sw, sh);
}

function recalculateView() {
  var w = parseInt($('#wslider').val(), 10);
  var h = parseInt($('#hslider').val(), 10);
}

// Initialize the paper
function initPaper() {
  initDefaults();
}

function addImageToPaper(url, callback) {
  var newimg = new Image();
  newimg.onload = function() {
    var w = newimg.width;
    var h = newimg.height;
    if(fitToPage) {
      //fit to page
      var gr = gw/gh;
      var ir = w/h;
      if(ir < gr) {
        sw = w/gr;
        var img = paper.image(url, cx = (gw-sw)/2, cy = 0, sw, sh = gh);
      }
      else {
        sh = gw/w*h;
        var img = paper.image(url, cx = 0, cy = (gh-sh)/2, sw = gw, sh);
      }
      sendPaperUpdate(0, 0, 1, 1);
    }
    else {
      //fit to width
    }
    slides[url] = { 'id' : img.id, 'height' : h, 'width' : w };
    if(!first_image_displayed) {
      img.toBack();
      first_image_displayed = true;
      current_url = url;
    }
    else {
      img.hide();
    }
    img.mousemove(mvingCur);
    callback(img);
  };
  newimg.src = url;
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
  first_image_displayed = false;
  for(url in slides) {
    if(slides.hasOwnProperty(url)) {
      addImageToPaper(url, function(img) {
      });
    }
  }
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
    else return null;
  }
  else return null;
}

function hideImageFromPaper(url) {
  var img = getImageFromPaper(url);
  if(img) img.hide();
}

function sendImageToBack(url) {
  var img = getImageFromPaper(url);
  if(img) img.toBack();
}

function bringCursorToFront() {
  cur.toFront();
}

//When panning starts (placeholder for now)
var panGo = function(x, y) {
  px = cx;
  py = cy;
  console.log('px:' + px + " py: " + py);
};

// When the user is dragging the cursor (click + move)
var panDragging = function(dx, dy, x, y) {
  sendPaperUpdate((px - dx)/gw, (py - dy)/gh, null, null);
};

// When panning finishes
var panStop = function(e) {
  //nothing to do
};

// When dragging for drawing lines starts
var curDragStart = function(x, y) {
  var img = getImageFromPaper(current_url);
  var attrs = img.attrs;
  var w = attrs.width;
  var h = attrs.height;
  cx1 = (x - s_left) + cx;
  cy1 = (y - s_top) + cy;
  path = cx1/gw + " " + cy1/gh;
};

// As line drawing drag continues
var curDragging = function(dx, dy, x, y) {
  cx2 = (x - s_left) + cx;
  cy2 = (y - s_top) + cy;
  emLi(cx1/gw, cy1/gh, cx2/gw, cy2/gh, current_colour, current_thickness); //emit to socket
  path += "," + cx2/gw + " " + cy2/gh;
  cx1 = cx2;
  cy1 = cy2;
  path_count++;
  if(path_count == path_max) {
    path_count = 0;
    emPublishPath(path, current_colour, current_thickness);
    path = cx1/gw + " " + cy1/gh;
  }
};

// Socket response - Draw the path (line) on the canvas
function dPath(x1, y1, x2, y2, colour, thickness) {
  setPath("M"+(x1)*gw+" "+(y1)*gh+"L"+(x2)*gw+" "+(y2)*gh,colour,thickness);
};

// Drawing line has ended
var curDragStop = function(e) {
  emPublishPath(path, current_colour, current_thickness);
};

// Creating a rectangle has started
var curRectDragStart = function(x, y) {
  cx2 = (x - s_left)/gw;
  cy2 = (y - s_top)/gh;
  emMakeRect(cx2, cy2, current_colour, current_thickness);
};

// Adjusting rectangle continues
var curRectDragging = function(dx, dy, x, y, e) {
  var x1;
  var y1;
  dx = dx/gw;
  dy = dy/gh;
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
function makeRect(x, y, colour, thickness) {
  rect = paper.rect(x*gw, y*gh, 0, 0);//, thickness);
  if(colour) rect.attr({ 'stroke' : colour, 'stroke-width' : thickness });
}

function drawRect(x, y, w, h, colour, thickness) {
  var r = paper.rect(x*gw, y*gh, w*gw, h*gh);//, thickness);
  if(colour) r.attr({ 'stroke' : colour, 'stroke-width' : thickness });
}

// Socket response - Update rectangle drawn
function updRect(x1, y1, w, h) {
  if(rect) {
    rect.attr({ x: (x1)*gw, y: (y1)*gh, width: w*gw, height: h*gh});
  }
  else {
    rect = paper.rect(x1*gw, y1*gh, w, h);
  }
}

// When rectangle finished being drawn (placeholder for now)
var curRectDragStop = function(e) {
  if(rect) var r = rect.attrs;
  if(r) emPublishRect(r.x/gw, r.y/gh, r.width/gw, r.height/gh, current_colour, current_thickness);
  rect = null;
};

// Send cursor moving event to server
var mvingCur = function(e, x, y) {
  emMvCur((x - s_left)/gw, (y - s_top)/gh);
};

// Socket response - Update the cursor position on screen
function mvCur(x, y) {
  cur.attr({ cx: (x*sw) + cx, cy: (y*sh) + cy });
};

// Socket response - Clear canvas
function clearPaper() {
  paper.clear();
  initPaper();
}

function setPath(path, colour, thickness) {
  var line = paper.path(path);
  if(colour) line.attr({'stroke' : colour, 'stroke-width' : thickness, 'stroke-linecap' : 'round'});
}

// Update zoom variables on all clients
var zoomSlide = function(event, delta) {
  emZoom(delta);
};

// Socket response - Update zoom variables and viewbox
function setZoom(d) {
  var step = 0.05; //step size
  
  if(d < 0) zoom_level += step; //zooming out
  else zoom_level -= step; //zooming in
  
  var x = cx/gw, y = cy/gh, z = zoom_level > 1 ? 1 : zoom_level; //cannot zoom out further than 100%
  //cannot zoom to make corner less than (x,y) = (0,0)
  x = x < 0 ? 0 : x;
  y = y < 0 ? 0 : y;
  z = z < 0.25 ? 0.25 : z; //cannot zoom in further than 400% (1/4)
  
  cur.attr({ 'r' : dcr*z }); //adjust cursor size
  sendPaperUpdate(x, y, z, z); //send update to all clients
  
  /*
  //handle left side collision
  if(view_w > g_w) {
    view_w = g_w;
    pan_x = 0;
    cur.attr({ 'r' : default_cur_r });
  }
  //handle top collision
  if(view_h > g_h) {
    view_h = g_h;
    pan_y = 0;
    cur.attr({ 'r' : default_cur_r });
  }
  
  //handle right wall collisions
  if(pan_x*view_w + view_w > g_w) pan_x = (g_w - view_w)/view_w;
  //handle bottom wall collisions
  if(pan_y*view_h + view_h > g_h) pan_y = (g_h - view_h)/view_h;
  emViewBox(pan_x, pan_y, view_w/g_w, view_h/g_h);
  */
}

initPaper();

var c = document.getElementById("colourView");
var tc = document.getElementById('thicknessView');
var cptext = document.getElementById("colourText");
var ctx = c.getContext("2d");
var tctx = tc.getContext('2d');

s_left = slide_obj.offsetLeft;
s_top = slide_obj.offsetTop;

drawThicknessView(default_thickness, default_colour);
drawColourView(default_colour);

cp = Raphael.colorwheel(625, 450, 75, default_colour); //create colour picker
cp.raphael.forEach(function(item) { item.hide(); }); //hide it
var cpVisible = false;

$(function() {
  $("#thickness").slider({ value: 1, min: 1, max: 20 });
  $("#thickness").bind("slide", function(event, ui) {
    drawThicknessView(ui.value, current_colour);
  });
});

cp.onchange = function() {
  drawColourView(this.color());
  drawThicknessView(current_thickness, this.color());
};

cptext.onkeyup = function() {
  drawColourView(this.value);
  drawThicknessView(current_thickness, this.value);
};