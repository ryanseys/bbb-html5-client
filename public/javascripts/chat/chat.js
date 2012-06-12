function countchars(max) {
  $('#charcount').text(max - $('#chat_input_box').val().length);
}

$(function() {

	//used to parse the cookie data.
	function getCookie(c_name) {
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++) {
			x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
			y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
			x=x.replace(/^\s+|\s+$/g,"");
			if (x==c_name) {
				return unescape(y);
			}
		}
	}
	
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
	//var SERVER_IP = '192.168.0.102';
	//connect to the websocket.
	var socket = io.connect('http://'+SERVER_IP+':'+PORT);

	id = getCookie('id'); //get the session
  
	//when you hit enter
	$('#chat_input').submit(function(e) {
		e.preventDefault();
		console.log("hi");
		var msg = $('#chat_input_box').val();
		if ((msg != '') && (id != '')) {
			socket.emit('msg', msg, id);
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
		socket.on('msg', function(name, msg) {
			$('#chat_messages').append('<div>' + name + ': ' + msg + '</div>');
		  $('#chat_messages').scrollTop($('#chat_messages').get(0).scrollHeight); //scroll to bottom
		});

		socket.on('logout', function() {
			$.post('logout');
			window.location.replace("./");
		});

		//when a user connects
		socket.on('user connect', function(name) {
			$('#chat_messages').append('<div><b>' + name + ' connected! </b></div>');
		});

		//when a user disconnects
		socket.on('user disconnected', function(name) {
			$('#chat_messages').append('<div><b> ' + name + ' disconnected! </b></div>');
		});

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
