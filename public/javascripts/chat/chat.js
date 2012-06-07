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

	var PORT = 3000;
	var SERVER_IP = 'localhost';
	var socket = io.connect('http://'+SERVER_IP+':'+PORT);
	id = getCookie('id');
	console.log(document.cookie);
	//when you hit enter
	$('#chat_input').submit(function(e) {
		e.preventDefault();
		var msg = $('#chat_input_box').val();
		if ((msg != '') && (id != '')) {
			socket.emit('msg', msg, id);
			$('#chat_input_box').val('');
		}
		$('#chat_input_box').focus();
	});
	//when you connect
	socket.on('connect', function () {
		//immediately send a message saying we are connected.
		socket.emit('user connect', id);

		//when you get a new message
		socket.on('msg', function(msg) {
			$('#chat_messages').append('<div>' + msg + '</div>');
		});
		//
		socket.on('user connect', function(msg) {
			$('#chat_messages').append('<div><b>' + msg + '</b></div>');
		});

		socket.on('user disconnected', function(msg) {
			$('#chat_messages').append('<div><b> ' + msg + '</b></div>');
		});
	});
});
