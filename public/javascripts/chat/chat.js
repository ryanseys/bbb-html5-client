var current_slide = 1;
var max_slide = 3;

var chcount = document.getElementById('charcount');
var msgbox = document.getElementById("chat_messages");
var chatbox = document.getElementById('chat_input_box');

var PORT = 3000;
var SERVER_IP = 'localhost';
//var SERVER_IP = '192.168.0.103';

//connect to the websocket.
var socket = io.connect('http://'+SERVER_IP+':'+PORT);

//when you connect
socket.on('connect', function () {
  
	//immediately send a message saying we are connected.
	socket.emit('user connect');
	
	//when you get a new message
	socket.on('msg', function (name, msg) {
	  msgbox.innerHTML += '<div>' + name + ': ' + msg + '</div>';
	  msgbox.scrollTop = msgbox.scrollHeight;
	});

	socket.on('logout', function () {
		post_to_url('logout');
		window.location.replace("./");
	});
	
	// When the user list needs an update
	socket.on('user list change', function (names) {
	  var currusers = document.getElementById('current_users');
	  currusers.innerHTML = ''; //clear it first
	  for (var i = names.length - 1; i >= 0; i--) {
	    currusers.innerHTML += '<div><b>' + names[i] + '</b></div>';
	  };
	});
	
	socket.on('all_messages', function (messages) {
	  msgbox.innerHTML = '';
	  for (var i = messages.length - 1; i >= 0; i--){
      msgbox.innerHTML += '<div>' + messages[i].username + ": " + messages[i].message + '</div>';
	  };
	  msgbox.scrollTop = msgbox.scrollHeight;
	});

	socket.on('reconnect', function () {
	  msgbox.innerHTML += '<div><b> RECONNECTED! </b></div>';
	});

	socket.on('reconnecting', function () {
	  msgbox.innerHTML += '<div><b> Reconnecting... </b></div>';
	});

	socket.on('reconnect_failed', function () {
	  msgbox.innerHTML += '<div><b> Reconnect FAILED! </b></div>';
	});

	socket.on('disconnect', function() {
		window.location.replace("./");
	});
	
	// WHITEBOARD EVENTS //
	socket.on('clrPaper', function () {
	  clearPaper();
	});
	
	socket.on('li', function(x1, y1, x2, y2){
	  dPath(x1, y1, x2, y2);
	});
	
	socket.on('makeRect', function(x, y) {
	  makeRect(x, y, 0, 0);
	});
	
	socket.on('updRect', function(x, y, w, h){
	  updRect(x, y, w, h);
	});
	
	socket.on('mvCur', function(x, y) {
	  mvCur(x, y);
	});
	
	socket.on('changeslide', function(slidenum, url) {
	  current_slide = slidenum;
	  slide.attr('src', url);
	});
});

socket.on('error', function (reason) {
  console.error('Unable to connect Socket.IO', reason);
});
  
function post_to_url(path, params, method) {
  method = method || "post"; // Set method to post by default, if not specified.
  // The rest of this code assumes you are not using a library.
  // It can be made less wordy if you use one.
  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);
  for(var key in params) {
    if(params.hasOwnProperty(key)) {
      var hiddenField = document.createElement("input");
      hiddenField.setAttribute("type", "hidden");
      hiddenField.setAttribute("name", key);
      hiddenField.setAttribute("value", params[key]);
      form.appendChild(hiddenField);
    }
  }
  document.body.appendChild(form);
  form.submit();
}

function clearCanvas() {
  socket.emit("clrPaper");
}

function emLi(x1, y1, x2, y2) {
  socket.emit("li", x1, y1, x2, y2);
}

function emMakeRect(x, y) {
  socket.emit('makeRect', x, y);
}

function emUpdRect(x, y, w, h) {
  socket.emit('updRect', x, y, w, h);
}

function emMvCur(x, y) {
  socket.emit('mvCur', x, y);
}

function getNextSlide(curr, max) {
  if(curr == max) return 1;
  else return curr+1;
}

function getPrevSlide(curr, max) {
  if(curr == 1) return max;
  else return curr-1;
}

function chooseLine() {
  turnOn("line");
}

function chooseRect() {
  turnOn("rectangle");
}

function choosePanZoom() {
  turnOn("panzoom");
}

function sendMessage() {

  var msg = chatbox.value;
	if (msg != '') {
		socket.emit('msg', msg);
		chatbox.value = '';
	}
	chatbox.focus();
}

function nextImg() {
  socket.emit('nextslide', current_slide);
}

function prevImg() {
  socket.emit('prevslide', current_slide);
}

function logout() {
  socket.emit('logout');
}

function countchars(max) {
  chcount.innerHTML = max - chatbox.value.length;
}
