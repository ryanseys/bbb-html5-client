// Object references
var chcount = document.getElementById('charcount');
var msgbox = document.getElementById("chat_messages");
var chatbox = document.getElementById('chat_input_box');
var proc_img = document.getElementById('processing_img');

var PORT = 3000;
var SERVER_IP = window.location.hostname;

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
	  var clickFunc = '$(\'.selected\').removeClass(\'selected\');$(this).addClass(\'selected\');';
	  var currusers = document.getElementById('current_users');
	  currusers.innerHTML = ''; //clear it first
	  for (var i = names.length - 1; i >= 0; i--) {
	    currusers.innerHTML += '<div class="user clickable" onclick="'+clickFunc+'" id= "'+names[i].id+'"><b>' + names[i].name + '</b></div>';
	  }
	});
	
	//Update all the messages in the chat box (e.g. received after first signing in)
	socket.on('all_messages', function (messages) {
	  msgbox.innerHTML = '';
	  for (var i = messages.length - 1; i >= 0; i--){
      msgbox.innerHTML += '<div>' + messages[i].username + ": " + messages[i].message + '</div>';
	  };
	  msgbox.scrollTop = msgbox.scrollHeight;
	});
	
	socket.on('all_shapes', function (shapes) {
	  for (var i = shapes.length - 1; i >= 0; i--) {
	    var shape_type = shapes[i].shape;
	    var colour = shapes[i].colour;
	    var thickness = shapes[i].thickness;
	    if(shape_type == 'path') {
	      var pathArray = shapes[i].points.split(',');
  	    var firstValuesArray = pathArray[0].split(' ');
  	    for (var j = 0; j < 2; j++) {
          if(j == 0) {
            firstValuesArray[j] *= global_box_w; //put width
          }
          else firstValuesArray[j] *= global_box_h; //put height
        }
  	    var pathString = "M" + firstValuesArray.join(' ');
  	    var len = pathArray.length;
  	    for (var k = 1; k < len; k++) {
  	      var pairOfPoints = pathArray[k].split(' ');
  	      for (var m = 0; m < 2; m++) {
  	        if(m == 0) {
  	          pairOfPoints[m] *= global_box_w; //put width
  	        }
  	        else pairOfPoints[m] *= global_box_h; //put height
          }
  	      pathString += "L" + pairOfPoints.join(' ');
        }
  	    setPath(pathString, colour, thickness);
	    }
	    else if(shape_type == 'rect') {
	      var r = shapes[i].points.split(',');
  	    drawRect(parseFloat(r[0]), parseFloat(r[1]), parseFloat(r[2]), parseFloat(r[3]), colour, thickness);
	    }
    }
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
	socket.on('li', function(x1, y1, x2, y2, colour, thickness){
	  dPath(x1, y1, x2, y2, colour, thickness);
	});
	
	//when a new rectangle is created/drawn
	socket.on('makeRect', function(x, y, colour, thickness) {
	  makeRect(x, y, colour, thickness);
	});
	
	//when the rectangle being drawn is updated
	socket.on('updRect', function(x, y, w, h) {
	  updRect(x, y, w, h);
	});
	
	//when the viewBox changes
	socket.on('viewBox', function(xperc, yperc, wperc, hperc) {
	  xperc = parseFloat(xperc, 10);
	  yperc = parseFloat(yperc, 10);
	  wperc = parseFloat(wperc, 10);
	  hperc = parseFloat(hperc, 10);
	  setViewBox(xperc, yperc, wperc, hperc);
	});
	
	//when the cursor is moved
	socket.on('mvCur', function(x, y) {
	  mvCur(x, y);
	});
	
	//when the slide changes
	socket.on('changeslide', function(url) {
	  showImageFromPaper(url);
	});
	
	//when the zoom level changes
	socket.on('zoom', function(delta) {
	  setZoom(delta);
	});
	
	//when the panning action stops
	socket.on('panStop', function() {
	  panDone();
	});
	
	socket.on('processing', function() {
	});
	
	socket.on('toolChanged', function(tool) {
	  turnOn(tool);
	});
	
	socket.on('setPresenter', function(publicID) {
	  $('.presenter').removeClass('presenter');
	  $('#' + publicID).addClass('presenter');
	});
	
	socket.on('all_slides', function(slides) {
	  var img;
	  removeAllImagesFromPaper();
	  for (var i = slides.length - 1; i >= 0; i--) {
	    img = addImageToPaper(slides[i]);
	    //this simply stores the image in the dom so it can be fetched quickly during switching slides
	    $('#slide').append('<img id="preload'+img.id+'"src="'+slides[i]+'" style="display:none;" alt=""/>'); //preload images
	  };
	  showImageFromPaper(slides[0]);
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
function emLi(x1, y1, x2, y2, colour, thickness) {
  socket.emit("li", x1, y1, x2, y2, colour, thickness);
}

// Creating a rectangle on the canvas
function emMakeRect(x, y, colour, thickness) {
  socket.emit('makeRect', x, y, colour, thickness);
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
  socket.emit('nextslide');
}

// Display the previous image
function prevImg() {
  socket.emit('prevslide');
}

// Logout of the meeting
function logout() {
  socket.emit('logout');
}

// Panning has stopped
function emPanStop() {
  socket.emit('panStop');
}

function emPublishPath(path, colour, thickness) {
  socket.emit('saveShape', 'path', path, colour, thickness);
}

function emPublishRect(x, y, w, h, colour, thickness) {
  socket.emit('saveShape', 'rect', [x, y, w, h].join(','), colour, thickness);
}

// Set the drawing type to "line"
function chooseLine() {
  socket.emit('changeTool', 'line');
}

// Set the drawing type to "rectangle"
function chooseRect() {
  socket.emit('changeTool', 'rect');
}

// Set the drawing type to "panzoom"
function choosePanZoom() {
  socket.emit('changeTool', 'panzoom');
}

function undoShape() {
  socket.emit('undo');
}

function switchPresenter() {
  socket.emit('setPresenter', $('.selected').attr('id'));
}

// Update the character count in the chat box
function countchars(max) {
  chcount.innerHTML = max - chatbox.value.length;
}
