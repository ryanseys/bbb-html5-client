function countchars(max) {
  $('#charcount').text(max - $('#chat_input_box').val().length);
}

$(function() {
	
  var current_slide = 1;
  var max_slide = 3;
  
  function getNextSlide(curr, max) {
    if(curr == max) return 1;
    else return curr+1;
  }
  
  function getPrevSlide(curr, max) {
    if(curr == 1) return max;
    else return curr-1;
  }
  
	var PORT = 3000;
	var SERVER_IP = 'localhost';
	//var SERVER_IP = '192.168.0.233';
	//connect to the websocket.
	var socket = io.connect('http://'+SERVER_IP+':'+PORT);
	
	var c = document.getElementById("drawingArea");
	var ctx = c.getContext("2d");
	
	var cTemp = document.getElementById("drawingTemp");
	var ctxTemp = cTemp.getContext("2d");
	
	var pressed = false;
	var rectangleOn = false;
	var lineOn = false;
	var cornerx;
  var cornery;
  var rectX;
  var rectY;
  var svg = document.getElementById("mysvg");
  
  var rect = function(h, w, fill) {
    var NS="http://www.w3.org/2000/svg";
    var SVGObj= document.createElementNS(NS,"rect");
    SVGObj.width.baseVal.value=w;
    SVGObj.height.baseVal.value=h;
    SVGObj.setAttribute("height",h);
    SVGObj.style.fill=fill;
    return SVGObj;
  }
  var r = rect(100,100,"blue");
  svg.appendChild(r);
  
	//when you hit enter
	$('#chat_input').submit(function(e) {
		e.preventDefault();
		var msg = $('#chat_input_box').val();
		if (msg != '') {
			socket.emit('msg', msg);
			$('#chat_input_box').val('');
		}
		$('#chat_input_box').focus();
	});
	
	$('#clearCanvas').submit(function (e) {
		e.preventDefault();
		socket.emit("ctxClear");
	});
	
	$('#chooseRect').submit(function (e) {
		e.preventDefault();
		lineOn = false;
		rectangleOn = true;
	});
	
	$('#chooseLine').submit(function (e) {
		e.preventDefault();
		rectangleOn = false;
		lineOn = true;
	});
	
	$('.canvas').mousemove(function (e) {
      var offset = $(this).offset();
      // document.body.scrollLeft doesn't work
      var x = e.clientX - offset.left + $(window).scrollLeft();
      var y = e.clientY - offset.top + $(window).scrollTop();
      socket.emit("mouseMove", x, y);
      var r = rect(x,y,"blue");
      svg.appendChild(r);
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
	
	$('#forward_image').submit(function(e) {
		e.preventDefault();
		socket.emit('nextslide', current_slide);
	});
	
	$('#backward_image').submit(function(e) {
		e.preventDefault();
		socket.emit('prevslide', current_slide);
	});

	//when you hit enter
	$('#logout').submit(function(e) {
		e.preventDefault();
    socket.emit('logout');
	});
  
	//when you connect
	socket.on('connect', function () {
	  
		//immediately send a message saying we are connected.
		socket.emit('user connect');
		
		//when you get a new message
		socket.on('msg', function (name, msg) {
			$('#chat_messages').append('<div>' + name + ': ' + msg + '</div>');
		  $('#chat_messages').scrollTop($('#chat_messages').get(0).scrollHeight); //scroll to bottom
		});

		socket.on('logout', function () {
			$.post('logout');
			window.location.replace("./");
		});
		
		socket.on('mouseMove', function (x, y) {
		  slide = document.getElementById('slide');
		  $('#cursor').offset({ top: y + slide.offsetTop - 5, left: x+slide.offsetLeft - 5 });
		});
		
		socket.on('ctxMoveTo', function(x, y) {
		  ctx.moveTo(x,y);
		});
		
		socket.on('ctxDrawLine', function(x, y) {
		  ctx.lineTo(x,y);
      ctx.stroke();
		});
		
		socket.on('ctxClear', function () {
		  ctx.clearRect(0, 0, c.width, c.height);
		  ctx.beginPath();
		});
    
		//when a user connects
		//socket.on('user connect', function (name) {
		//	$('#chat_messages').append('<div><b>' + name + ' connected! </b></div>');
		//});
		
		// When the user list needs an update
		socket.on('user list change', function (names) {
		  $('#current_users').html(''); //clear it first
		  for (var i = names.length - 1; i >= 0; i--){
		    $('#current_users').append('<div><b>' + names[i] + '</b></div>');
		  };
		});
		
		socket.on('all_messages', function (messages){
		  $('#chat_messages').html('');
		  for (var i = messages.length - 1; i >= 0; i--){
		    $('#chat_messages').append('<div>' + messages[i].username + ": " + messages[i].message + '</div>');
		  };
		  $('#chat_messages').scrollTop($('#chat_messages').get(0).scrollHeight); //scroll to bottom
		});

		//when a user disconnects
		//socket.on('user disconnected', function (name) {
		//	$('#chat_messages').append('<div><b> ' + name + ' disconnected! </b></div>');
		//});

		socket.on('reconnect', function () {
			$('#chat_messages').append('<div><b> RECONNECTED! </b></div>');
		});

		socket.on('reconnecting', function () {
			$('#chat_messages').append('<div><b> Reconnecting... </b></div>');
		});

		socket.on('reconnect_failed', function () {
			$('#chat_messages').append('<div><b> Reconnect FAILED! </b></div>');
		});

		socket.on('disconnect', function() {
			window.location.replace("./");
		});
		
		socket.on('changeslide', function(slidenum, url) {
		  current_slide = slidenum;
		  $('#slide').css('background-image', 'url('+ url +')');
		});
	});
	
	socket.on('error', function (reason) {
    console.error('Unable to connect Socket.IO', reason);
  });
});
