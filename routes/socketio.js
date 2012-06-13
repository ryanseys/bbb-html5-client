function is_valid_connected(socket, callback) {
	gfunc.isValidSession(socket.handshake.sessionID, function (isValid) {
	  if (isValid) {
	    callback(true);
  	}
  	else {
  	  socket.disconnect();
  		callback(false);
  	}
	});
};

exports.onconnection = function(socket) {
	//When a user sends a message...
	socket.on('msg', function(msg) {
	  msg = sanitizer.escape(msg);
	  is_valid_connected(socket, function (reply) {
	    if(reply) {
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
  });

	// When a user connects to the socket...
	socket.on('user connect', function() {
	  is_valid_connected(socket, function (reply) {
		  if(reply) {
  		  var handshake = socket.handshake;
    		var sessionID = handshake.sessionID;
    		var meetingID = handshake.meetingID;
      	var username = handshake.username;
      	var socketID = socket.id;
    	
        socket.join(meetingID); //join the socket Room with value of the meetingID
        socket.join(sessionID); //join the socket Room with value of the sessionID
      
        //add socket to list of sockets.
        gfunc.getUserProperties(sessionID, function(properties) {
          var numOfSockets = parseInt(properties.sockets, 10);
          numOfSockets+=1;
          store.hset('user:' + sessionID, 'sockets', numOfSockets);
          if ((properties.refreshing == 'false') && (properties.dupSess == 'false')) {
            //all of the next sessions created with this sessionID are duplicates
            store.hset("user:" + sessionID, "dupSess", true);
            pub.publish(meetingID, JSON.stringify(['user connect', username]));
    			}
    			else store.hset("user:" + sessionID, "refreshing", false);
    		});
  		}
  	});
	});

	// When a user disconnects from the socket...
	socket.on('disconnect', function () {
	  var handshake = socket.handshake;
		var sessionID = handshake.sessionID;
		gfunc.isValidSession(sessionID, function (isValid) {
		  if(isValid) { //socket is gone, so check database
  		  var meetingID = handshake.meetingID;
  		  var username = handshake.username;
    		var socketID = socket.id;

  			store.hset("user:" + sessionID, "refreshing", true, function(reply) {
  			  setTimeout(function() {
    			  gfunc.isValidSession(sessionID, function (isValid) {
    				  if(isValid) {
    				    gfunc.getUserProperties(sessionID, function(properties) {
                  var numOfSockets = parseInt(properties.sockets, 10);
                  numOfSockets-=1;
      					  if(numOfSockets == 0) {
      					    store.srem('users', 'user:' + sessionID, function(num_deleted) {
      					      store.del('user:' + sessionID, function(reply) {
          						  pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone they disconnected
      					      });
      					    });
        					}
        					else store.hset("user:" + sessionID, "sockets", numOfSockets);
      				  });
    				  }
      				else {
      					pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone they disconnected
      				}
    				});
    			}, 1000);
  			}); //assume they are refreshing...
  			//wait one second, then check if there are 0 sockets...
  		}
		});
	});
  
  // When the user logs out
	socket.on('logout', function() {
	  is_valid_connected(socket, function (reply) {
	    if(reply) {
  		  //initialize local variables
  		  var handshake = socket.handshake;
  		  var sessionID = handshake.sessionID;
  		  var meetingID = handshake.meetingID;
  		  var username = handshake.username;
  		  store.srem("users", "user:" + sessionID, function(num_deleted) {
  		    if(reply) {
  		      store.del("user:" + sessionID, function(reply) {
              pub.publish(sessionID, JSON.stringify(['logout'])); //send to all users on same session (all tabs)
            	socket.disconnect(); //disconnect own socket      
    		    });
  		    }
  		  });
        
  		}
  		pub.publish(meetingID, JSON.stringify(['user disconnected', username])); //tell everyone you have disconnected
	  });
	});
	
	socket.on('prevslide', function(slide_num){
	  is_valid_connected(socket, function (reply) {
	    if(reply) {
  	    var meetingID = socket.handshake.meetingID;
  	    var num;
  	    if(slide_num > 0 && slide_num <= maxImage) {
  	      if(slide_num == 1) num = maxImage;
  	      else num = slide_num - 1;
  	      pub.publish(meetingID, JSON.stringify(['changeslide', num, "images/presentation/test" + num + ".png"]));
        }
      }
    });
	});
	
	socket.on('nextslide', function(slide_num){
	  is_valid_connected(socket, function (reply) {
	    if(reply) {
	      var meetingID = socket.handshake.meetingID;
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