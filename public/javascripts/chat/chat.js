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
	//var SERVER_IP = 'localhost';
	var SERVER_IP = '192.168.0.233';
	//connect to the websocket.
	var socket = io.connect('http://'+SERVER_IP+':'+PORT);
	
	id = getCookie('id'); //get the session
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
		socket.on('msg', function(name, msg) {
			$('#chat_messages').append('<div>' + name + ': ' + msg + '</div>');
		});
		
		//when a user connects
		socket.on('user connect', function(name) {
			$('#chat_messages').append('<div><b>' + name + ' connected! </b></div>');
		});
		
		//when a user disconnects
		socket.on('user disconnected', function(name) {
			$('#chat_messages').append('<div><b> ' + name + ' disconnected! </b></div>');
		});
	});
});
