//initialize variables
var slide_w;
var slide_h;

var paper;
var cur;
var slide;
var defaults;

//cursor variables
var p_curx;
var p_cury;
var curx;
var cury;

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
  
  cur = defaults[1];
  slide = defaults[0];
}

function initEvents() {
  //when moving mouse around
  slide.mousemove(mvCur);
  
  //when dragging
  cur.drag(curDragging, curDragStart, curDragStop);
}

var curDragStart = function(x, y, e) {
  p_curx = e.offsetX;
  p_cury = e.offsetY;
};

var curDragging = function(dx, dy, x, y, e) {
  curx = e.offsetX;
  cury = e.offsetY;
  paper.path("M" + p_curx + " " + p_cury + "L" + curx + " " + cury);
  p_curx = curx;
  p_cury = cury;
};

var curDragStop = function() {
  //console.log("stop dragging");
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

/*

$('#slide').mousemove(function (e) {
    var offset = $(this).offset();
    // document.body.scrollLeft doesn't work
    var x = e.clientX - offset.left + $(window).scrollLeft();
    var y = e.clientY - offset.top + $(window).scrollTop();
    socket.emit("mouseMove", x, y);
    //var r = rect(x,y,"blue");
    //svg.appendChild(r);
    var circle = paper.circle(50, 40, 10);
});

$(document).mousedown(function () {
    $(".canvas").bind('mouseover', function (e) {
      var offset = $(this).offset();
      var x = e.clientX - offset.left + $(window).scrollLeft();
      var y = e.clientY - offset.top + $(window).scrollTop();
      if(lineOn) {
        if(pressed) {
          socket.emit('ctxDrawLine', x, y);
        }
        socket.emit('ctxMoveTo', x, y);
        pressed = true;
      }
      else if(rectangleOn) {
        if(pressed) {
          rectX = x - cornerx;
          rectY = y - cornery;
          ctxTemp.clearRect(0, 0, 600, 400);
          ctxTemp.strokeRect(cornerx, cornery, rectX, rectY);
        }
        else {
          cornerx = x;
          cornery = y;
          pressed = true;
        }
      }
    });
})
.mouseup(function() {
  $(".canvas").unbind('mouseover');
  pressed = false;
  if(rectangleOn) {
    ctx.strokeRect(cornerx, cornery, rectX, rectY);
    ctxTemp.clearRect(0, 0, cTemp.width, cTemp.height);
  }
});

*/

