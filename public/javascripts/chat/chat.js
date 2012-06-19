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
		  console.log("ctxMoveTo");
		});
		
		socket.on('ctxDrawLine', function(x, y) {
		  console.log("ctxDrawLine");
		});
		
		socket.on('ctxClear', function () {
		  console.log("ctxClear");
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
		  slide_img.attr('src', url);
		});
	});
	
	socket.on('error', function (reason) {
    console.error('Unable to connect Socket.IO', reason);
  });
});
