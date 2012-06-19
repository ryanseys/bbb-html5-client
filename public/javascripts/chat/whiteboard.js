//initialize variables
var paper = Raphael("slide", 600, 400);
var cur;
var slide;

var defaults = paper.add([
    {
        type: "image",
        src: '/images/presentation/test1.png',
        x: 0,
        y: 0,
        width: 600,
        height: 400
    },
    {
        type: "circle",
        cx: 10,
        cy: 10,
        r: 3,
        fill: "red"
    }
]);

function initDefaults() {
  cur = defaults[1];
  slide = defaults[0];
}

function initEvents() {
  //when moving mouse around
  slide.mousemove(mvCur);
  
  //when dragging
  cur = cur.drag(curDragging, curDragStart, curDragStop);
}

var curDragStart = function() {
  var c = paper.path("M10 10L90 90");
  console.log("start dragging");
};

var curDragging = function() {
  console.log("dragging");
};

var curDragStop = function() {
  console.log("stop dragging");
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

