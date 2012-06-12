function is_valid_connected(socket) {
	if(!users[socket.handshake.sessionID]) {
		socket.disconnect();
		return false;
	}
	else return true;
};

exports.onconnection = function(socket) {
	//When a user sends a message...
	socket.on('msg', function(msg) {
	  msg = sanitizer.escape(msg);
    if(is_valid_connected(socket)) {
      if(msg.length > max_chat_length) {
  	    pub.publish(socket.handshake.sessionID, JSON.stringify(['msg', "System", "Message too long."]));
  	  }
  	  else {
        var username = socket.handshake.username;
  	    var meetingID = socket.handshake.meetingID;
        pub.publish(meetingID, JSON.stringify(['msg', username, msg]));
      }
    }
  });

	// When a user connects to the socket...
	socket.on('user connect', function() {
		if(is_valid_connected(socket)) {
		  var handshake = socket.handshake;
  		var sessionID = handshake.sessionID;
  		var meetingID = handshake.meetingID;
    	var username = handshake.username;
    	var socketID = socket.id;
    	
      socket.join(meetingID); //join the socket Room with value of the meetingID
      socket.join(sessionID); //join the socket Room with value of the sessionID
      
      //add socket to list of sockets.
      users[sessionID]['sockets'][socketID] = true;
      if((users[sessionID]['refreshing'] == false) && (users[sessionID]['duplicateSession'] == false)) {
        //all of the next sessions created with this sessionID are duplicates
        users[sessionID]['duplicateSession'] = true;
        pub.publish(meetingID, JSON.stringify(['user connect', username]));
			}
			else users[sessionID]['refreshing'] = false;
		}
	});

	// When a user disconnects from the socket...
	socket.on('disconnect', function () {
	  var handshake = socket.handshake;
		var sessionID = handshake.sessionID;
		if(users[sessionID]) { //socket is gone, so check database
		  var meetingID = handshake.meetingID;
		  var username = handshake.username;
  		var socketID = socket.id;
  		
			users[sessionID]['refreshing'] = true; //assume they are refreshing...
			//wait one second, then check if there are 0 sockets...
			setTimeout(function() {
				if(users[sessionID]) {
					delete users[sessionID]['sockets'][sessionID]; //socket has been disconnected
					if(Object.keys(users[sessionID]['sockets']).length == 0) {
						delete users[sessionID]; //delete the user from the datastore
						pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone they disconnected
					}
				}
				else {
					pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone they disconnected
				}
			}, 1000);
		}
	});
  
  // When the user logs out
	socket.on('logout', function() {
		if(is_valid_connected(socket)) {
		  //initialize local variables
		  var handshake = socket.handshake;
		  var sessionID = handshake.sessionID;
		  var meetingID = handshake.meetingID;
		  var username = handshake.username;
      
      delete users[sessionID]; //delete user from datastore
			pub.publish(sessionID, JSON.stringify(['logout'])); //send to all users on same session (all tabs)
  		socket.disconnect(); //disconnect own socket
		}
		pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone you have disconnected
	});
	
	socket.on('prevslide', function(slide_num){
	  if(is_valid_connected(socket)) {
	    var meetingID = socket.handshake.meetingID;
	    var num;
	    if(slide_num > 0 && slide_num <= maxImage) {
	      if(slide_num == 1) num = maxImage;
	      else num = slide_num - 1;
	      pub.publish(meetingID, JSON.stringify(['changeslide', num, "images/presentation/test" + num + ".png"]));
      }
    }
	});
	
	socket.on('nextslide', function(slide_num){
	  if(is_valid_connected(socket)) {
	    var meetingID = socket.handshake.meetingID;
	    var num;
	    if(slide_num > 0 && slide_num <= maxImage) {
	      if(slide_num == maxImage) num = 1;
	      else num = slide_num + 1;
	      pub.publish(meetingID, JSON.stringify(['changeslide', num, "images/presentation/test" + num + ".png"]));
      }
    }
	});
};