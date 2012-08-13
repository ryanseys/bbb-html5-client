//object references
slide_obj = document.getElementById("slide");

var cx2, cy2, cx1, cy1, x1, y1, x2, y2, px, py, cx, cy, sw, sh, slides,
    paper, cur, defaults, onFirefox, s_top, s_left, current_url, 
    current_colour, current_thickness, path, rect, sx, sy, current_shapes;
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
    cur.drag(curDragging, curDragStart, curDragStop);
  }
  // If the user requests to turn on the rectangle tool
  else if(tool == 'rect') {
    lineOn = false;
    panZoomOn = false;
    rectOn = true;
    cur.undrag();
    cur.drag(curRectDragging, curRectDragStart, curRectDragStop);
  }

  // If the user requests to turn on the pan & zoom tool
  else if(tool == 'panzoom') {
    rectOn = false;
    lineOn = false;
    panZoomOn = true;
    cur.undrag();
    cur.drag(panDragging, panGo, panStop);
  }
  else {
    console.log("ERROR: Cannot turn on tool, invalid tool: " + tool);
  }
}

// Initialize default values
function initDefaults() {
  var slide = document.getElementById('slide');
  var x = slide.offsetLeft;
  var y = slide.offsetTop;
  paper = paper || Raphael(x, y, gw, gh);
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
    console.log(cx_*gw, cy_*gh, sw_*gw, sh_*gh);
    paper.setViewBox(cx_*gw, cy_*gh, sw_*gw, sh_*gh);
    sw = gw/sw_;
    sh = gh/sh_;
  }
  else {
    paper.setViewBox(cx_*gw, cy_*gh, paper._viewBox[2], paper._viewBox[3]);
  }
  cx = cx_*sw;
  cy = cy_*sh;
  sx = (slide_obj.clientWidth - gw)/2;
  sy = (slide_obj.clientHeight - gh)/2;
  paper.canvas.style.left = s_left + sx + "px";
  paper.canvas.style.top = s_top + sy + "px";
  paper.setSize(gw, gh);
  var z = paper._viewBox[2]/gw;
  cur.attr({ r : dcr*z }); //adjust cursor size
  zoom_level = z;
  paper.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
}

function recalculateView() {
  var w = parseInt($('#wslider').val(), 10);
  var h = parseInt($('#hslider').val(), 10);
}

// Initialize the paper
function initPaper() {
  initDefaults();
}

function addImageToPaper(url, w, h) {
  if(fitToPage) {
    var xr = w/slide_obj.clientWidth;
    var yr = h/slide_obj.clientHeight;
    var max = Math.max(xr, yr);
    var img = paper.image(url, cx = 0, cy = 0, gw = w/max, gh = h/max);
  }
  else {
    //fit to width
  }
  slides[url] = { 'id' : img.id, 'w' : w, 'h' : h};
  if(!first_image_displayed) {
    img.toBack();
    first_image_displayed = true;
    current_url = url;
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
}

function drawListOfShapes(shapes) {
  for (var i = shapes.length - 1; i >= 0; i--) {
    var shape_type = shapes[i].shape;
    var colour = shapes[i].colour;
    var thickness = shapes[i].thickness;
    //paths
    if(shape_type == 'path') {
      var pathArray = shapes[i].points.split(',');
	    var firstValuesArray = pathArray[0].split(' ');
	    for (var j = 0; j < 2; j++) {
        if(j == 0) {
          firstValuesArray[j] *= gw; //put width
        }
        else firstValuesArray[j] *= gh; //put height
      }
	    var pathString = "M" + firstValuesArray.join(' ');
	    var len = pathArray.length;
	    for (var k = 1; k < len; k++) {
	      var pairOfPoints = pathArray[k].split(' ');
	      for (var m = 0; m < 2; m++) {
	        if(m == 0) {
	          pairOfPoints[m] *= gw; //put width
	        }
	        else pairOfPoints[m] *= gh; //put height
        }
	      pathString += "L" + pairOfPoints.join(' ');
      }
	    setPath(pathString, colour, thickness);
    }
    //rectangles
    else if(shape_type == 'rect') {
      var r = shapes[i].points.split(',');
	    drawRect(parseFloat(r[0]), parseFloat(r[1]), parseFloat(r[2]), parseFloat(r[3]), colour, thickness);
    }
  }
}

function rebuildPaper() {
  first_image_displayed = false;
  for(url in slides) {
    if(slides.hasOwnProperty(url)) {
      addImageToPaper(url, slides[url].w, slides[url].h, function(img) {
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
};

// When the user is dragging the cursor (click + move)
var panDragging = function(dx, dy, x, y) {
  var x = (px - dx);
  x = x < 0 ? 0 : x;
  var y = (py - dy);
  y = y < 0 ? 0 : y;
  var x2 = gw + x;
  x = x2 > sw ? sw - gw : x;
  var y2 = gh + y;
  y = y2 > sh ? sh - gh : y;
  sendPaperUpdate(x/sw, y/sh, null, null);
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
  cx1 = (x - s_left - sx) + cx;
  cy1 = (y - s_top - sy) + cy;
  path = cx1/sw + " " + cy1/sh;
};

// As line drawing drag continues
var curDragging = function(dx, dy, x, y) {
  cx2 = (x - s_left - sx) + cx;
  cy2 = (y - s_top - sy) + cy;
  emLi(cx1/sw, cy1/sh, cx2/sw, cy2/sh, current_colour, current_thickness); //emit to socket
  path += "," + cx2/sw + " " + cy2/sh;
  cx1 = cx2;
  cy1 = cy2;
  path_count++;
  if(path_count == path_max) {
    path_count = 0;
    emPublishPath(path, current_colour, current_thickness);
    path = cx1/sw + " " + cy1/sh;
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
  cx2 = (x - s_left - sx + cx)/sw;
  cy2 = (y - s_top - sy + cy)/sh;
  emMakeRect(cx2, cy2, current_colour, current_thickness);
};

// Adjusting rectangle continues
var curRectDragging = function(dx, dy, x, y, e) {
  var x1;
  var y1;
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
  emMvCur((x - s_left - sx + cx)/sw, (y - s_top - sy + cy)/sh);
};

// Socket response - Update the cursor position on screen
function mvCur(x, y) {
  cur.attr({ cx: (x*gw), cy: (y*gh) });
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
  
  var x = cx/sw, y = cy/sh, z = zoom_level > 1 ? 1 : zoom_level; //cannot zoom out further than 100%
  z = z < 0.25 ? 0.25 : z; //cannot zoom in further than 400% (1/4)
  //cannot zoom to make corner less than (x,y) = (0,0)
  x = x < 0 ? 0 : x;
  y = y < 0 ? 0 : y;
  x = x > 1 - z ? 1 - z : x;
  y = y > 1 - z ? 1 - z : y;
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