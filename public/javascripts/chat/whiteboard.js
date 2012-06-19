$(function() {
  var paper = Raphael("slide", 600, 400);
  var slide_img = paper.image('/images/presentation/test1.png', 0, 0, 600, 400);
  var cursor = paper.circle(10, 10, 3);
  cursor.attr({fill: "red"});
  
  slide_img.mousemove(function(e) {
    cursor.attr({ cx: e.offsetX, cy: e.offsetY });
  });
});

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

