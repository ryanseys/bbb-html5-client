//* Math.floor((Math.random()*100)+50)/100

// Object references
var chcount = document.getElementById('charcount');
var msgbox = document.getElementById("chat_messages");
var chatbox = document.getElementById('chat_input_box');

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
	  //msgbox.innerHTML = '';
	  for (var i = messages.length - 1; i >= 0; i--){
      msgbox.innerHTML += '<div>' + messages[i].username + ": " + messages[i].message + '</div>';
	  };
	  msgbox.scrollTop = msgbox.scrollHeight;
	});
	
	socket.on('all_shapes', function (shapes) {
	  clearPaper();
	  drawListOfShapes(shapes);
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

	//when the viewBox changes
	socket.on('viewBox', function(xperc, yperc, wperc, hperc) {
	  xperc = parseFloat(xperc, 10);
	  yperc = parseFloat(yperc, 10);
	  wperc = parseFloat(wperc, 10);
	  hperc = parseFloat(hperc, 10);
	  updatePaperFromServer(xperc, yperc, wperc, hperc);
	});
	
	//when the cursor is moved
	socket.on('mvCur', function(x, y) {
	  mvCur(x, y);
	});
	
	//when the slide changes
	socket.on('changeslide', function(url) {
	  showImageFromPaper(url);
	});
	
	socket.on('fitToPage', function(fit) {
	  setFitToPage(fit);
	});
	
	//when the zoom level changes
	socket.on('zoom', function(delta) {
	  setZoom(delta);
	});
	
	//when the panning action stops
	socket.on('panStop', function() {
	  panDone();
	});
	
	socket.on('makeShape', function(shape, data) {
	  switch(shape) {
      case 'line':
        makeLine.apply(makeLine, data);
      break;

      case 'rect':
        makeRect.apply(makeRect, data);
      break;

      case 'ellipse':
        makeEllipse.apply(makeEllipse, data);
      break;

      default:
        //no other shapes allowed
      break;
    }
	});
	
	socket.on('updShape', function(shape, data) {
	  switch(shape) {
      case 'line':
        updateLine.apply(updateLine, data);
      break;

      case 'rect':
        updateRect.apply(updateRect, data);
      break;

      case 'ellipse':
        updateEllipse.apply(updateEllipse, data);
      break;
      
      case 'text':
        updateText.apply(updateText, data);
      break;

      default:
        console.log('shape not recognized');
      break; 
    }
	});
	
	socket.on('textDone', function() {
	  textDone();
	});

	socket.on('toolChanged', function(tool) {
	  turnOn(tool);
	});
	
	socket.on('paper', function(cx, cy, sw, sh) {
    updatePaperFromServer(cx, cy, sw, sh);
	});
	
	socket.on('setPresenter', function(publicID) {
	  $('.presenter').removeClass('presenter');
	  $('#' + publicID).addClass('presenter');
	});
	
	socket.on('uploadStatus', function(message, error) {
	  $('#uploadStatus').text(message);
	  if(error) {
	    setTimeout(function() {
	      $('#uploadStatus').text('');
	    }, 3000);
	  }
	});
	
	socket.on('all_slides', function(urls) {
	  $('#uploadStatus').text(""); //upload finished
	  removeAllImagesFromPaper();
	  var count = 0;
	  var numOfSlides = urls.length;
	  for (var i = 0; i < numOfSlides; i++) {
	    var array = urls[i];
	    var img = addImageToPaper(array[0], array[1], array[2]);
  	  $('#slide').append('<img id="preload'+img.id+'"src="'+img.attr('src')+'" style="display:none;" alt=""/>'); //preload images
	  };
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

function getShapesFromServer() {
  socket.emit('all_shapes');
}

function sendFitToPage(fit) {
  socket.emit('fitToPage', fit);
}

function emitDoneText() {
  socket.emit('textDone');
}

function emitMakeShape(shape, data) {
  socket.emit('makeShape', shape, data);
}

function emitUpdateShape(shape, data) {
  socket.emit('updShape', shape, data);
}

function sendPaperUpdate(cx, cy, sw, sh) {
  socket.emit('paper', cx, cy, sw, sh);
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

function emitPublishShape(shape, data) {
  socket.emit('saveShape', shape, JSON.stringify(data));
}

function changeTool(tool) {
  socket.emit('changeTool', tool);
}

function undoShape() {
  socket.emit('undo');
}

function emitText(t, x, y, w, spacing, colour, font, fontsize) {
  socket.emit('textUpdate', t, x, y, w, spacing, colour, font, fontsize);
}

function switchPresenter() {
  socket.emit('setPresenter', $('.selected').attr('id'));
}

// Update the character count in the chat box
function countchars(max) {
  chcount.innerHTML = max - chatbox.value.length;
}
