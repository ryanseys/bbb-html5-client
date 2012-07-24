// Publish usernames to all the sockets
exports.publishUsernames = function(meetingID, sessionID, callback) {
  var usernames = [];
  redisAction.getUsers(meetingID, function (users) {
      for (var i = users.length - 1; i >= 0; i--){
        usernames.push({ 'name' : users[i].username, 'id' : users[i].pubID });
      };
      var receivers = sessionID != undefined ? sessionID : meetingID;
      pub.publish(receivers, JSON.stringify(['user list change', usernames]));
      if(callback) callback(true);
  });
  
  //check if no users left in meeting
  store.scard(redisAction.getUsersString(meetingID), function(err, cardinality) {
    if(cardinality == '0') {
      redisAction.processMeeting(meetingID);
      if(callback) callback(false);
    }
  });
};

exports.publishPresenter = function(meetingID, sessionID, callback) {
  redisAction.getPresenterPublicID(meetingID, function(publicID) {
    var receivers = sessionID != undefined ? sessionID : meetingID;
    pub.publish(receivers, JSON.stringify(['setPresenter', publicID]));
    if(callback) callback(true);
  });
};

//Get all messages from Redis and publish to a specific sessionID (user)
exports.publishMessages = function(meetingID, sessionID, callback) {
  var messages = [];
  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
      redisAction.getItems(meetingID, presentationID, pageID, 'messages', function (messages) {
        var receivers = sessionID != undefined ? sessionID : meetingID;
        pub.publish(receivers, JSON.stringify(['all_messages', messages]));
        if(callback) callback();
      });
    });
  });
};
/*
//Get all paths from Redis and publish to a specific sessionID (user)
exports.publishPaths = function(meetingID, sessionID, callback) {
  var paths = [];
  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
      redisAction.getItems(meetingID, presentationID, pageID, 'currentpaths', function (paths) {
        var receivers = sessionID != undefined ? sessionID : meetingID;
        pub.publish(receivers, JSON.stringify(['all_paths', paths]));
        if(callback) callback();
      });
    });
  });
};
*/
exports.publishSlides = function(meetingID, sessionID, callback) {
  var slides = [];
  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    redisAction.getPageIDs(meetingID, presentationID, function(presentationID, pageIDs) {
     var numOfSlides = pageIDs.length;
     var slideCount = 0;
     for(var i = 0; i < numOfSlides; i++) {
       redisAction.getPageImage(meetingID, presentationID, pageIDs[i], function(filename) {
         slides.push('images/presentation' +presentationID+'/'+filename);
         if(slides.length == numOfSlides) {
            var receivers = sessionID != undefined ? sessionID : meetingID;
            pub.publish(receivers, JSON.stringify(['all_slides', slides]));
            if(callback) callback();
         }
       });
     }
    });
  });
};

exports.publishShapes = function(meetingID, sessionID, callback) {
  var shapes = [];
  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
      redisAction.getItems(meetingID, presentationID, pageID, 'currentshapes', function (shapes) {
        var receivers = sessionID != undefined ? sessionID : meetingID;
        pub.publish(receivers, JSON.stringify(['all_shapes', shapes]));
        if(callback) callback();
      });
    });
  });
};
/*
//Get all rectangles from Redis and publish to a specific sessionID (user)
exports.publishRects = function(meetingID, sessionID, callback) {
  var rects = [];
  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
      redisAction.getItems(meetingID, presentationID, pageID, 'currentrects', function (rects) {
        var receivers = sessionID != undefined ? sessionID : meetingID;
        pub.publish(receivers, JSON.stringify(['all_rects', rects]));
        if(callback) callback();
      });
    });
  });
};
*/
exports.publishViewBox = function(meetingID, sessionID, callback) {
  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    redisAction.getViewBox(meetingID, function(viewBox) {
      viewBox = JSON.parse(viewBox);
      var receivers = sessionID != undefined ? sessionID : meetingID;
      pub.publish(receivers, JSON.stringify(['viewBox', viewBox[0], viewBox[1], viewBox[2], viewBox[3]]));
      if(callback) callback();
    });
  });
};

exports.publishTool = function(meetingID, sessionID, tool, callback) {
  redisAction.getCurrentTool(meetingID, function(tool) {
    var receivers = sessionID != undefined ? sessionID : meetingID;
    pub.publish(receivers, JSON.stringify(['toolChanged', tool]));
    if(callback) callback();
  });
};

// All socket IO events that can be emitted by the client
exports.SocketOnConnection = function(socket) {
	
	//When a user sends a message...
	socket.on('msg', function (msg) {
	  msg = sanitizer.escape(msg);
	  var handshake = socket.handshake;
	  var sessionID = handshake.sessionID;
	  var meetingID = handshake.meetingID;
	  redisAction.isValidSession(meetingID, sessionID, function (reply) {
	    if(reply) {
	      if(msg.length > max_chat_length) {
    	    pub.publish(sessionID, JSON.stringify(['msg', 'System', 'Message too long.']));
    	  }
    	  else {
          var username = handshake.username;
          pub.publish(meetingID, JSON.stringify(['msg', username, msg]));
          var messageID = rack(); //get a randomly generated id for the message
          
          //try later taking these nulls out and see if the function still works
          store.rpush(redisAction.getMessagesString(meetingID, null, null), messageID); //store the messageID in the list of messages
          store.hmset(redisAction.getMessageString(meetingID, null, null, messageID), 'message', msg, 'username', username);
        }
	    }
	  });
  });

	// When a user connects to the socket...
	socket.on('user connect', function () {
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
            store.hset(redisAction.getUserString(meetingID, sessionID), 'dupSess', true);
            socketAction.publishUsernames(meetingID, null, function() {
              socketAction.publishPresenter(meetingID);
            });
    			}
    			else {
    			  store.hset(redisAction.getUserString(meetingID, sessionID), 'refreshing', false);
    			  socketAction.publishUsernames(meetingID, sessionID, function() {
    			    socketAction.publishPresenter(meetingID, sessionID);
    			  });
  			  }
  			  socketAction.publishMessages(meetingID, sessionID);
  			  socketAction.publishShapes(meetingID, sessionID);
  			  //socketAction.publishPaths(meetingID, sessionID);
  			  //socketAction.publishRects(meetingID, sessionID);
  			  socketAction.publishSlides(meetingID, sessionID, function() {
  			    socketAction.publishViewBox(meetingID, sessionID);
  			    socketAction.publishTool(meetingID, sessionID);
  			  });
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
  			redisAction.updateUserProperties(meetingID, sessionID, ['refreshing', true], function(success) {
  			  setTimeout(function () {
    			    //in one second, check again...
      			redisAction.isValidSession(meetingID, sessionID, function (isValid) {
      				if(isValid) {
      				  redisAction.getUserProperties(meetingID, sessionID, function(properties) {
                  var numOfSockets = parseInt(properties.sockets, 10);
                  numOfSockets-=1;
        					if(numOfSockets == 0) {
        					  redisAction.deleteUser(meetingID, sessionID, function() {
        					    socketAction.publishUsernames(meetingID);
        					  });
          				}
          				else {
          					redisAction.updateUserProperties(meetingID, sessionID, ['sockets', numOfSockets]);
          					//store.hset(redisAction.getUserString(meetingID, sessionID), "sockets", numOfSockets);
        					}
        				});
      				}
        			else {
        				socketAction.publishUsernames(meetingID);
        				socketAction.publishPresenter(meetingID, sessionID);
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
  		socketAction.publishUsernames(meetingID);
	  });
	});
	
	// A user clicks to change to previous slide
	socket.on('prevslide', function (slide_num) {
	  var handshake = socket.handshake;
		var sessionID = handshake.sessionID;
		var meetingID = handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == sessionID) {
  	    redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
  	      redisAction.changeToPrevPage(meetingID, presentationID, function(pageID){
  	        redisAction.getPageImage(meetingID, presentationID, pageID, function(filename) {
  	          pub.publish(meetingID, JSON.stringify(['changeslide', 'images/presentation' + presentationID + '/'+filename]));
  	          pub.publish(meetingID, JSON.stringify(['clrPaper']));
  	          //socketAction.publishPaths(meetingID);
      			  //socketAction.publishRects(meetingID);
      			  socketAction.publishShapes(meetingID);
  	        });
  	      });
	      });
      }
    });
	});
	
	// A user clicks to change to next slide
	socket.on('nextslide', function () {
	  var handshake = socket.handshake;
		var sessionID = handshake.sessionID;
		var meetingID = handshake.meetingID;
    redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == sessionID) {
	      redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
  	      redisAction.changeToNextPage(meetingID, presentationID, function(pageID){
  	        redisAction.getPageImage(meetingID, presentationID, pageID, function(filename) {
  	          pub.publish(meetingID, JSON.stringify(['changeslide', 'images/presentation' + presentationID + '/'+filename]));
  	          pub.publish(meetingID, JSON.stringify(['clrPaper']));
      			  socketAction.publishShapes(meetingID);
  	        });
  	      });
	      });
      }
    });
	});
	
	// When a line creation event is received
	socket.on('li', function (x1, y1, x2, y2, colour) {
	  var meetingID = socket.handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
	      pub.publish(meetingID, JSON.stringify(['li', x1, y1, x2, y2, colour]));
	    }
	  });
	});
	
	// When a rectangle creation event is received
	socket.on('makeRect', function (x, y, colour) {
	  var meetingID = socket.handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
        pub.publish(meetingID, JSON.stringify(['makeRect', x, y, colour]));
      }
    });
	});
	
	// When a rectangle update event is received
	socket.on('updRect', function (x, y, w, h) {
	  var meetingID = socket.handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
        pub.publish(meetingID, JSON.stringify(['updRect', x, y, w, h]));
      }
    });
	});
	
	// When a cursor move event is received
	socket.on('mvCur', function (x, y) {
	  var meetingID = socket.handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
	      pub.publish(meetingID, JSON.stringify(['mvCur', x, y]));
      }
    });
	});
	
	// When a clear Paper event is received
	socket.on('clrPaper', function () {
	  var meetingID = socket.handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
	      redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    	    redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
    	      redisAction.getItemIDs(meetingID, presentationID, pageID, 'currentshapes', function(meetingID, presentationID, pageID, itemIDs, itemName) {
    	        redisAction.deleteItemList(meetingID, presentationID, pageID, itemName, itemIDs);
    	      });
    	      //delete all current paths
        	  redisAction.getItemIDs(meetingID, presentationID, pageID, 'currentpaths', function(meetingID, presentationID, pageID, itemIDs, itemName) {
              redisAction.deleteItemList(meetingID, presentationID, pageID, itemName, itemIDs);
            });
            //delete all current rects
        	  redisAction.getItemIDs(meetingID, presentationID, pageID, 'currentrects', function(meetingID, presentationID, pageID, itemIDs, itemName) {
              redisAction.deleteItemList(meetingID, presentationID, pageID, itemName, itemIDs);
            });
        	  pub.publish(meetingID, JSON.stringify(['clrPaper']));
    	    });
    	  });
  	  }
	  });
	});

	socket.on('setPresenter', function (publicID) {
	  console.log('setting presenter to' + publicID);
	  var meetingID = socket.handshake.meetingID;
	  redisAction.setPresenterFromPublicID(meetingID, publicID, function(success) {
	    if(success) {
	      pub.publish(meetingID, JSON.stringify(['setPresenter', publicID]));
	    }
	  });
	});
	
	// When a user is updating the viewBox of the paper
	socket.on('viewBox', function (xperc, yperc, wperc, hperc) {
	  var meetingID = socket.handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
	      pub.publish(socket.handshake.meetingID, JSON.stringify(['viewBox', xperc, yperc, wperc, hperc]));
        redisAction.setViewBox(socket.handshake.meetingID, JSON.stringify([xperc, yperc, wperc, hperc]));
      }
    });
	});
	
	// When a user is zooming
	socket.on('zoom', function(delta) {
	  var meetingID = socket.handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
	      pub.publish(meetingID, JSON.stringify(['zoom', delta]));
      }
    });
	});
	
	// When a user finishes panning
	socket.on('panStop', function() {
	  var meetingID = socket.handshake.meetingID;
	  redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
	      pub.publish(meetingID, JSON.stringify(['panStop']));
      }
    });
	});
	
	socket.on('undo', function() {
    var meetingID = socket.handshake.meetingID;
    redisAction.getPresenterSessionID(meetingID, function(presenterID) {
      if(presenterID == socket.handshake.sessionID) {
        redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
          redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
            store.rpop(redisAction.getCurrentShapesString(meetingID, presentationID, pageID), function(err, reply) {
              pub.publish(meetingID, JSON.stringify(['clrPaper']));
              socketAction.publishShapes(meetingID);
            });
          });
        });
      }
    });
	});
	
	socket.on('saveShape', function (shape, points, colour) {
	  var handshake = socket.handshake;
		var meetingID = handshake.meetingID;
		redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
    	  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    	    redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
    	      var shapeID = rack(); //get a randomly generated id for the message
	          store.rpush(redisAction.getCurrentShapesString(meetingID, presentationID, pageID), shapeID);
            store.hmset(redisAction.getShapeString(meetingID, presentationID, pageID, shapeID), 'shape', shape, 'points', points, 'colour', colour, function(err, reply){
            });
    	    });
    	  });
  	  }
	  });
	});
/*
	socket.on('savePath', function(path) {
	  var handshake = socket.handshake;
		var meetingID = handshake.meetingID;
		redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
    	  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    	    redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
    	      var pathID = rack(); //get a randomly generated id for the message
    	      store.rpush(redisAction.getPathsString(meetingID, presentationID, pageID), pathID); //store the pathID in the list of paths
            store.rpush(redisAction.getCurrentPathsString(meetingID, presentationID, pageID), pathID); //store the pathID in the list of currentpaths
            store.hmset(redisAction.getPathString(meetingID, presentationID, pageID, pathID), 'path', path);
    	    });
    	  });
  	  }
	  });
	});
	
	socket.on('saveRect', function(x, y, w, h) {
	  var handshake = socket.handshake;
		var meetingID = handshake.meetingID;
		redisAction.getPresenterSessionID(meetingID, function(presenterID) {
	    if(presenterID == socket.handshake.sessionID) {
    	  redisAction.getCurrentPresentationID(meetingID, function(presentationID) {
    	    redisAction.getCurrentPageID(meetingID, presentationID, function(pageID) {
    	      var rectID = rack(); //get a randomly generated id for the message
    	      store.rpush(redisAction.getRectsString(meetingID, presentationID, pageID), rectID); //store the pathID in the list of paths
            store.rpush(redisAction.getCurrentRectsString(meetingID, presentationID, pageID), rectID); //store the pathID in the list of currentpaths
            store.hmset(redisAction.getRectString(meetingID, presentationID, pageID, rectID), 'rect', [x, y, w, h].join(','));
    	    });
    	  });
  	  }
	  });
  });
*/  
  socket.on('changeTool', function (tool) {
     var handshake = socket.handshake;
  	 var meetingID = handshake.meetingID;
  	 redisAction.getPresenterSessionID(meetingID, function(presenterID) {
  	   if(presenterID == socket.handshake.sessionID) {
	        redisAction.setCurrentTool(meetingID, tool, function(success) {
	          if(success) {
	            pub.publish(meetingID, JSON.stringify(['toolChanged', tool]));
	          }
	        });
	     }
     });
  });
};
