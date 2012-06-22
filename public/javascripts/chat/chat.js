// temporary variables for slide count
var current_slide = 1;
var max_slide = 3;

// Object references
var chcount = document.getElementById('charcount');
var msgbox = document.getElementById("chat_messages");
var chatbox = document.getElementById('chat_input_box');

var PORT = 3000;
//var SERVER_IP = 'localhost';
var SERVER_IP = '192.168.0.103';

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
  
  // Double-back confirmation of logout request
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
	
	//Update all the messages in the chat box (e.g. received after first signing in)
	socket.on('all_messages', function (messages) {
	  msgbox.innerHTML = '';
	  for (var i = messages.length - 1; i >= 0; i--){
      msgbox.innerHTML += '<div>' + messages[i].username + ": " + messages[i].message + '</div>';
	  };
	  msgbox.scrollTop = msgbox.scrollHeight;
	});
  
  // If the server is reconnected to the client
	socket.on('reconnect', function () {
	  msgbox.innerHTML += '<div><b> RECONNECTED! </b></div>';
	});
  
  // If the client is attempting to reconnect to the server
	socket.on('reconnecting', function () {
	  msgbox.innerHTML += '<div><b> Reconnecting... </b></div>';
	});
  
  // If the client cannot reconnect to the server
	socket.on('reconnect_failed', function () {
	  msgbox.innerHTML += '<div><b> Reconnect FAILED! </b></div>';
	});

  // If the server disconnects from the client or vice-versa
	socket.on('disconnect', function() {
		window.location.replace("./");
	});
	
	// WHITEBOARD EVENTS //
	socket.on('clrPaper', function () {
	  clearPaper();
	});
	
	//when a line is drawn
	socket.on('li', function(x1, y1, x2, y2){
	  dPath(x1, y1, x2, y2);
	});
	
	//when a new rectangle is created/drawn
	socket.on('makeRect', function(x, y) {
	  makeRect(x, y, 0, 0);
	});
	
	//when the rectangle being drawn is updated
	socket.on('updRect', function(x, y, w, h){
	  updRect(x, y, w, h);
	});
	
	//when the viewBox changes
	socket.on('viewBox', function(xperc, yperc, wperc, hperc){
	  setViewBox(xperc, yperc, wperc, hperc);
	});
	
	//when the cursor is moved
	socket.on('mvCur', function(x, y) {
	  mvCur(x, y);
	});
	
	//when the slide changes
	socket.on('changeslide', function(slidenum, url) {
	  current_slide = slidenum;
	  slide.attr('src', url);
	});
	
	//when the zoom level changes
	socket.on('zoom', function(delta) {
	  setZoom(delta);
	});
	
	//when the panning action stops
	socket.on('panStop', function() {
	  panDone();
	});
});

//if an error occurs while not connected
socket.on('error', function (reason) {
  console.error('Unable to connect Socket.IO', reason);
});

//POST request using javascript
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

// Sending a chat message to users
function sendMessage() {
  var msg = chatbox.value;
	if (msg != '') {
		socket.emit('msg', msg);
		chatbox.value = '';
	}
	chatbox.focus();
}

// Clearing the canvas drawings
function clearCanvas() {
  socket.emit("clrPaper");
}

// Drawing a line on the canvas
function emLi(x1, y1, x2, y2) {
  socket.emit("li", x1, y1, x2, y2);
}

// Creating a rectangle on the canvas
function emMakeRect(x, y) {
  socket.emit('makeRect', x, y);
}

// Updating the size of the rectangle being drawn
function emUpdRect(x, y, w, h) {
  socket.emit('updRect', x, y, w, h);
}

// Move the cursor around the canvas
function emMvCur(x, y) {
  socket.emit('mvCur', x, y);
}

// Change the ViewBox size of the canvas (pan and zoom)
function emViewBox(xperc, yperc, wperc, hperc) {
  socket.emit('viewBox', xperc, yperc, wperc, hperc);
}

// Update the zoom level for the clients
function emZoom(delta) {
  socket.emit('zoom', delta);
}

// Display the next image
function nextImg() {
  socket.emit('nextslide', current_slide);
}

// Display the previous image
function prevImg() {
  socket.emit('prevslide', current_slide);
}

// Logout of the meeting
function logout() {
  socket.emit('logout');
}

// Panning has stopped
function emPanStop() {
  socket.emit('panStop');
}

// Calculate the next slide (temporary)
function getNextSlide(curr, max) {
  if(curr == max) return 1;
  else return curr+1;
}

// Calculate the previous slide (temporary)
function getPrevSlide(curr, max) {
  if(curr == 1) return max;
  else return curr-1;
}

// Set the drawing type to "line"
function chooseLine() {
  turnOn("line");
}

// Set the drawing type to "rectangle"
function chooseRect() {
  turnOn("rectangle");
}

// Set the drawing type to "panzoom"
function choosePanZoom() {
  turnOn("panzoom");
}

// Update the character count in the chat box
function countchars(max) {
  chcount.innerHTML = max - chatbox.value.length;
}