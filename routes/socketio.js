// Publish usernames to all the sockets
function publishUsernames(meetingID) {
  var usernames = [];
  redisAction.getUsers(meetingID, function (users) {
      for (var i = users.length - 1; i >= 0; i--){
        usernames.push(users[i].username);
      };
      pub.publish(meetingID, JSON.stringify(['user list change', usernames]));
  });
}

// All socket IO events that can be emitted by the client
exports.SocketOnConnection = function(socket) {
	
	//When a user sends a message...
	socket.on('msg', function(msg) {
	  msg = sanitizer.escape(msg);
	  var handshake = socket.handshake;
	  var sessionID = handshake.sessionID;
	  var meetingID = handshake.meetingID;
	  redisAction.isValidSession(meetingID, sessionID, function (reply) {
	    if(reply) {
	      if(msg.length > max_chat_length) {
    	    pub.publish(sessionID, JSON.stringify(['msg', "System", "Message too long."]));
    	  }
    	  else {
          var username = handshake.username;
          pub.publish(meetingID, JSON.stringify(['msg', username, msg]));
        }
	    }
	  });
  });

	// When a user connects to the socket...
	socket.on('user connect', function() {
	  var handshake = socket.handshake;
	  var sessionID = handshake.sessionID;
	  var meetingID = handshake.meetingID;
	  redisAction.isValidSession(meetingID, sessionID, function (reply) {
		  if(reply) {
      	var username = handshake.username;
      	var socketID = socket.id;
    	
        socket.join(meetingID); //join the socket Room with value of the meetingID
        socket.join(sessionID); //join the socket Room with value of the sessionID
      
        //add socket to list of sockets.
        redisAction.getUserProperties(meetingID, sessionID, function(properties) {
          var numOfSockets = parseInt(properties.sockets, 10);
          numOfSockets+=1;
          store.hset(redisAction.getUserString(meetingID, sessionID), 'sockets', numOfSockets);
          if ((properties.refreshing == 'false') && (properties.dupSess == 'false')) {
            //all of the next sessions created with this sessionID are duplicates
            store.hset(redisAction.getUserString(meetingID, sessionID), "dupSess", true);
            pub.publish(meetingID, JSON.stringify(['user connect', username]));
            publishUsernames(meetingID);
    			}
    			else store.hset(redisAction.getUserString(meetingID, sessionID), "refreshing", false);
    		});
  		}
  	});
	});

	// When a user disconnects from the socket...
	socket.on('disconnect', function () {
	  var handshake = socket.handshake;
		var sessionID = handshake.sessionID;
		var meetingID = handshake.meetingID;
		//check if user is still in database
		redisAction.isValidSession(meetingID, sessionID, function (isValid) {
		  if(isValid) {
  		  var username = handshake.username;
    		var socketID = socket.id;

  			store.hset(redisAction.getUserString(meetingID, sessionID), "refreshing", true, function(reply) {
  			  setTimeout(function() {
  			    //in one second, check again...
    			  redisAction.isValidSession(meetingID, sessionID, function (isValid) {
    				  if(isValid) {
    				    redisAction.getUserProperties(meetingID, sessionID, function(properties) {
                  var numOfSockets = parseInt(properties.sockets, 10);
                  numOfSockets-=1;
      					  if(numOfSockets == 0) {
      					    store.srem(redisAction.getUsersString(meetingID), sessionID, function(num_deleted) {
      					      store.del(redisAction.getUserString(meetingID, sessionID), function(reply) {
          						  pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone they disconnected
          						  publishUsernames(meetingID);
      					      });
      					    });
        					}
        					else store.hset(redisAction.getUserString(meetingID, sessionID), "sockets", numOfSockets);
      				  });
    				  }
      				else {
      					pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone they disconnected
      					publishUsernames(meetingID);
      				}
    				});
    			}, 1000);
  			}); 
  		}
		});
	});
  
  // When the user logs out
	socket.on('logout', function() {
	  var handshake = socket.handshake;
		var sessionID = handshake.sessionID;
		var meetingID = handshake.meetingID;
	  redisAction.isValidSession(meetingID, sessionID, function (isValid) {
	    if(isValid) {
  		  //initialize local variables
  		  var username = handshake.username;
  		  //remove the user from the list of users
  		  store.srem(redisAction.getUsersString(meetingID), sessionID, function(numDeleted) {
  		    //delete key from database
		      store.del(redisAction.getUserString(meetingID, sessionID), function(reply) {
            pub.publish(sessionID, JSON.stringify(['logout'])); //send to all users on same session (all tabs)
          	socket.disconnect(); //disconnect own socket      
  		    });
  		  });
  		}
  		pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone you have disconnected
  		publishUsernames(meetingID);
	  });
	});
	
	// A user clicks to change to previous slide
	socket.on('prevslide', function(slide_num){
	  var handshake = socket.handshake;
		var sessionID = handshake.sessionID;
		var meetingID = handshake.meetingID;
	  redisAction.isValidSession(meetingID, sessionID, function (isValid) {
	    if(isValid) {
  	    var num;
  	    if(slide_num > 0 && slide_num <= maxImage) {
  	      if(slide_num == 1) num = maxImage;
  	      else num = slide_num - 1;
  	      pub.publish(meetingID, JSON.stringify(['changeslide', num, "images/presentation/test" + num + ".png"]));
        }
      }
    });
	});
	
	// A user clicks to change to next slide
	socket.on('nextslide', function(slide_num){
	  var handshake = socket.handshake;
		var sessionID = handshake.sessionID;
		var meetingID = handshake.meetingID;
	  redisAction.isValidSession(meetingID, sessionID, function (isValid) {
	    if(isValid) {
  	    var num;
  	    if(slide_num > 0 && slide_num <= maxImage) {
  	      if(slide_num == maxImage) num = 1;
  	      else num = slide_num + 1;
  	      pub.publish(meetingID, JSON.stringify(['changeslide', num, "images/presentation/test" + num + ".png"]));
        }
      }
    });
	});
};