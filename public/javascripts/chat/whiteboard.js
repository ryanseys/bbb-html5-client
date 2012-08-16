//object references
slide_obj = document.getElementById("slide");

var gw, gh, cx2, cy2, cx1, cy1, x1, y1, x2, y2, px, py, cx, cy, sw, sh, slides,
    paper, cur, defaults, onFirefox, s_top, s_left, current_url, ex, ey, ex2, ey2, ellipse, line,
    current_colour, current_thickness, path, rect, sx, sy, current_shapes, sw_orig, sh_orig, vw, vh, shift_pressed;
var rectOn = false, lineOn = false, panZoomOn = false, ellipseOn = false, 
    zoom_level = 1, fitToPage = true, first_image_displayed = false, path_max = 30,
    path_count = 0, ZOOM_MAX = 4, panning = 0, default_colour = "#FF0000", default_thickness = 1,
    dcr = 3;

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
  current_tool = tool;
  // If the user requests to turn on the line too
  if(tool == 'line') {
    cur.undrag();
    cur.drag(curDragging, curDragStart, curDragStop);
  }
  // If the user requests to turn on the rectangle tool
  else if(tool == 'rect') {
    cur.undrag();
    cur.drag(curRectDragging, curRectDragStart, curRectDragStop);
  }
  // If the user requests to turn on the pan & zoom tool
  else if(tool == 'panzoom') {
    cur.undrag();
    cur.drag(panDragging, panGo, panStop);
  }
  else if(tool == 'ellipse') {
    cur.undrag();
    cur.drag(curEllipseDragging, curEllipseDragStart, curEllipseDragStop);
  }
  else {
    console.log("ERROR: Cannot turn on tool, invalid tool: " + tool);
  }
}

// Initialize default values
function initPaper() {
  paper = paper || Raphael('slide', gw, gh);
  paper.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
  cur = paper.circle(0, 0, dcr);
  cur.attr('fill', 'red');
  $(cur.node).bind('mousewheel', zoomSlide);
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
  if(sw_ && sh_) {
    paper.setViewBox(cx_*gw, cy_*gh, sw_*gw, sh_*gh);
    sw = gw/sw_;
    sh = gh/sh_;
  }
  else {
    paper.setViewBox(cx_*gw, cy_*gh, paper._viewBox[2], paper._viewBox[3]);
  }
  cx = cx_*sw;
  cy = cy_*sh;
  sx = (vw - gw)/2;
  sy = (vh - gh)/2;
  if(sy < 0) sy = 0; // ??
  paper.canvas.style.left = sx + "px";
  paper.canvas.style.top = sy + "px";
  paper.setSize(gw-2, gh-2);
  var z = paper._viewBox[2]/gw;
  cur.attr({ r : dcr*z }); //adjust cursor size
  zoom_level = z;
  paper.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
}

function setFitToPage(fit) {
  fitToPage = fit;
  var temp = slides;
  removeAllImagesFromPaper();
  slides = temp;
  rebuildPaper();
  sendPaperUpdate(0, 0, 1, 1);
  getShapesFromServer();
}

function addImageToPaper(url, w, h) {
  if(fitToPage) {
    var xr = w/vw;
    var yr = h/vh;
    var max = Math.max(xr, yr);
    var img = paper.image(url, cx = 0, cy = 0, gw = w/max, gh = h/max);
    sw = w/max;
    sh = h/max;
    sw_orig = sw;
    sh_orig = sh;
  }
  else {
    //fit to width
    var wr = w/vw;
    var img = paper.image(url, cx = 0, cy = 0, w/wr, h/wr);
    sw = w/wr;
    sh = h/wr;
    sw_orig = sw;
    sh_orig = sh;
    gw = sw;
    gh = sh;
  }
  slides[url] = { 'id' : img.id, 'w' : w, 'h' : h};
  if(!current_url) {
    img.toBack();
    current_url = url;
  }
  else if(current_url == url) {
    img.toBack();
  }
  else {
    img.hide();
  }
  img.mousemove(mvingCur);
  $(img.node).bind('mousewheel', zoomSlide);
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
  current_url = null;
}

//accepts an array of points
function drawListOfShapes(shapes) {
  current_shapes = paper.set();
  for (var i = shapes.length - 1; i >= 0; i--) {
    var shape_type = shapes[i].shape;
    var colour = shapes[i].colour;
    var thickness = shapes[i].thickness;
    //paths
    if(shape_type == 'path') {
	    drawLine(shapes[i].points.toScaledPath(gw, gh), colour, thickness);
    }
    //rectangles
    else if(shape_type == 'rect') {
      var r = shapes[i].points.split(',');
	    drawRect(r[0], r[1], r[2], r[3], colour, thickness);
    }
    else if(shape_type == 'ellipse') {
      var elip = shapes[i].points.split(',');
	    drawEllipse(elip[0], elip[1], elip[2], elip[3], colour, thickness);
    }
  }
}

function rebuildPaper() {
  current_url = null;
  for(url in slides) {
    if(slides.hasOwnProperty(url)) {
      addImageToPaper(url, slides[url].w, slides[url].h, function(img) {
      });
    }
  }
}

function showImageFromPaper(url) {
  var current = getImageFromPaper(current_url);
  if(current) {
    current.hide();
  }
  var next = getImageFromPaper(url);
  if(next) {
    next.show();
    next.toFront();
    current_shapes.forEach(function(element) {
      element.toFront();
    });
    cur.toFront();
  }
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
};

// When the user is dragging the cursor (click + move)
var panDragging = function(dx, dy) {
  var x = (px - dx);
  x = x < 0 ? 0 : x;
  var y = (py - dy);
  y = y < 0 ? 0 : y;
  var x2;
  if(fitToPage) x2 = gw + x;
  else x2 = vw + x;
  x = x2 > sw ? sw - (vw - sx*2) : x;
  var y2;
  if(fitToPage) y2 = gh + y; 
  else y2 = vh + y;
  y = y2 > sh ? sh - (vh - sy*2) : y;
  sendPaperUpdate(x/sw, y/sh, null, null);
};

// When panning finishes
var panStop = function(e) {
  //nothing to do
};

// When dragging for drawing lines starts
var curDragStart = function(x, y) {
  cx1 = x - s_left - sx + cx;
  cy1 = y - s_top - sy + cy;
  emitMakeShape('line', [cx1/sw, cy1/sh, current_colour, current_thickness]);
};

// As line drawing drag continues
var curDragging = function(dx, dy, x, y) {
  cx2 = x - s_left - sx + cx;
  cy2 = y - s_top - sy + cy;
  if(shift_pressed) {
    emitUpdateShape('line', [cx2/sw, cy2/sh, false]);
  }
  else {
    path_count++;
    if(path_count < path_max) {
      emitUpdateShape('line', [cx2/sw, cy2/sh, true]);
    }
    else {
      path_count = 0;
      emPublishPath(line.attrs.path.join(',').toScaledPath(1/gw, 1/gh), current_colour, current_thickness);
      emitMakeShape('line', [cx1/sw, cy1/sh, current_colour, current_thickness]);
    }
    cx1 = cx2;
    cy1 = cy2;
  }
};

// Drawing line has ended
var curDragStop = function(e) {
  emPublishPath(line.attrs.path.join(',').toScaledPath(1/gw, 1/gh), current_colour, current_thickness);
  line = null; //any late updates will be blocked by this
};

function makeLine(x, y, colour, thickness) {
  x *= gw;
  y *= gh;
  line = paper.path("M" + x + " " + y + "L" + x + " " + y);
  if(colour) line.attr({ 'stroke' : colour, 'stroke-width' : thickness });
  current_shapes.push(line);
}

function drawLine(path, colour, thickness) {
  var l = paper.path(path);
  l.attr({ 'stroke' : colour, 'stroke-width' : thickness });
  current_shapes.push(l);
}

function updateLine(x2, y2, add) {
  x2 *= gw;
  y2 *= gh;
  if(add) {
    //if adding to the line
    if(line) line.attr({ path : (line.attrs.path + "L" + x2 + " " + y2) });
  }
  else {
    //if simply updating the last portion
    if(line) {
      line.attrs.path.pop();
      var path = line.attrs.path.join(' ');
      line.attr({ path : (path + "L" + x2 + " " + y2) });
    }
  }
}

// Creating a rectangle has started
var curRectDragStart = function(x, y) {
  cx2 = (x - s_left - sx + cx)/sw;
  cy2 = (y - s_top - sy + cy)/sh;
  emitMakeShape('rect', [cx2, cy2, current_colour, current_thickness]);
};

// Adjusting rectangle continues
var curRectDragging = function(dx, dy, x, y, e) {
  var x1;
  var y1;
  if(shift_pressed) dy = dx;
  dx = dx/sw;
  dy = dy/sh;
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
  emitUpdateShape('rect', [x1, y1, dx, dy]);
};

// When rectangle finished being drawn (placeholder for now)
var curRectDragStop = function(e) {
  if(rect) var r = rect.attrs;
  if(r) emPublishRect(r.x/gw, r.y/gh, r.width/gw, r.height/gh, current_colour, current_thickness);
  rect = null;
};

// Socket response - Make rectangle on canvas
function makeRect(x, y, colour, thickness) {
  rect = paper.rect(x*gw, y*gh, 0, 0);
  if(colour) rect.attr({ 'stroke' : colour, 'stroke-width' : thickness });
  current_shapes.push(rect);
}

function drawRect(x, y, w, h, colour, thickness) {
  var r = paper.rect(x*gw, y*gh, w*gw, h*gh);
  if(colour) r.attr({ 'stroke' : colour, 'stroke-width' : thickness });
  current_shapes.push(r);
}

// Socket response - Update rectangle drawn
function updateRect(x1, y1, w, h) {
  if(rect) rect.attr({ x: (x1)*gw, y: (y1)*gh, width: w*gw, height: h*gh });
}

var curEllipseDragStart = function(x, y) {
  ex = (x - s_left - sx + cx);
  ey = (y - s_top - sy + cy);
  emitMakeShape('ellipse', [ex/sw, ey/sh, current_colour, current_thickness]);
};

function makeEllipse(cx, cy, colour, thickness) {
  ellipse = paper.ellipse(cx*gw, cy*gh, 0, 0);
  if(colour) ellipse.attr({ 'stroke' : colour, 'stroke-width' : thickness });
  current_shapes.push(ellipse);
}

function drawEllipse(cx, cy, rx, ry, colour, thickness) {
  var elip = paper.ellipse(cx*gw, cy*gh, rx*gw, ry*gh);
  if(colour) elip.attr({ 'stroke' : colour, 'stroke-width' : thickness });
  current_shapes.push(elip);
}

var curEllipseDragging = function(dx, dy, x, y, e) {
  if(shift_pressed) dy = dx;
  emitUpdateShape('ellipse', [(ex+dx/2)/sw, (ey+dy/2)/sh, (dx/2)/sw, (dy/2)/sh]);
};

// Socket response - Update rectangle drawn
function updateEllipse(x, y, w, h) {
  if(ellipse) ellipse.attr({cx: x*gw, cy: y*gh, rx: w*gw, ry: h*gh });
}

var curEllipseDragStop = function(e) {
  if(ellipse) var attrs = ellipse.attrs;
  if(attrs) emitPublishEllipse(attrs.cx/gw, attrs.cy/gh, attrs.rx/gw, attrs.ry/gh, current_colour, current_thickness);
  ellipse = null; //late updates will be blocked by this
};

// Send cursor moving event to server
var mvingCur = function(e, x, y) {
  emMvCur((x - sx - s_left + cx)/sw, (y - sy - s_top + cy)/sh);
};

// Socket response - Update the cursor position on screen
function mvCur(x, y) {
  cur.attr({ cx: x*gw, cy: y*gh });
};

// Socket response - Clear canvas
function clearPaper() {
  if(current_shapes){
    current_shapes.forEach(function(element) {
      element.remove();
    });
  }
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
  
  var x = cx/sw, y = cy/sh, z = zoom_level > 1 ? 1 : zoom_level; //cannot zoom out further than 100%
  z = z < 0.25 ? 0.25 : z; //cannot zoom in further than 400% (1/4)
  //cannot zoom to make corner less than (x,y) = (0,0)
  x = x < 0 ? 0 : x;
  y = y < 0 ? 0 : y;
  //cannot view more than the bottom corners
  var zz = 1 - z;
  x = x > zz ? zz : x;
  y = y > zz ? zz : y;
  sendPaperUpdate(x, y, z, z); //send update to all clients
}

initPaper();

var c = document.getElementById("colourView");
var tc = document.getElementById('thicknessView');
var cptext = document.getElementById("colourText");
var ctx = c.getContext("2d");
var tctx = tc.getContext('2d');

s_left = slide_obj.offsetLeft;
s_top = slide_obj.offsetTop;
vw = slide_obj.clientWidth;
vh = slide_obj.clientHeight;

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

document.onkeydown = function(event) {
  var keyCode; 
  if(!event) keyCode = window.event.keyCode;
  else keyCode = event.keyCode;
  
  switch(keyCode) {
    case 16:
      shift_pressed = true;
    break;

    default:
      //nothing
    break; 
  }
};

document.onkeyup = function(event) {
  var keyCode; 
  if(!event) keyCode = window.event.keyCode;
  else keyCode = event.keyCode;
  switch(keyCode) {
    case 16:
      shift_pressed = false;
    break;

    default:
      //nothing
    break; 
  }
};

String.prototype.toScaledPath = function(w, h) {
  var path;
  var points = this.match(/(\d+[.]?\d*)/g);
  var len = points.length;
  for(var j = 0; j < len; j+=2) {
    if(j != 0) path += "L" + (points[j] * w) + "," + (points[j+1] * h);
    else path = "M" + (points[j] * w) + "," + (points[j+1] * h);
  }
  return path;
};