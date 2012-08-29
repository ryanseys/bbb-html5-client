// Node.js Routes
exports.presentationImageFolder = function(presentationID) {
  return 'public/images/presentation' + presentationID;
};

// When we get the homepage.
exports.get_index = function(req, res) {
	redisAction.isValidSession(req.cookies['meetingid'], req.cookies['sessionid'], function (reply) {
	  if(!reply) {
  		res.render('index', { title: 'BigBlueButton HTML5 Client', max_u: max_username_length, max_mid: max_meetingid_length });
  	}
  	else {
      res.redirect('/chat');
  	}
	});
};

//Used to make a meeting in Redis and callback whether the meeting was successfully created.
function makeMeeting(meetingID, sessionID, username, callback) {
  if((username) && (meetingID) && (username.length <= max_username_length) && (meetingID.length <= max_meetingid_length) && (meetingID.split(' ').length == 1)) {
  var publicID = rack();
  redisAction.isMeetingRunning(meetingID, function(isRunning) {
    if(!isRunning) {
      redisAction.createMeeting(meetingID, function() {
        redisAction.setCurrentTool(meetingID, 'line');
        redisAction.setPresenter(meetingID, sessionID, publicID);
      });
    }
  });
  redisAction.createUser(meetingID, sessionID);
  store.get(redisAction.getCurrentPresentationString(meetingID), function (err, currPresID) {
    if(!currPresID) {
      redisAction.createPresentation(meetingID, true, function (presentationID) {
	      redisAction.createPage(meetingID, presentationID, 'default.png', true, function (pageID) {
	        redisAction.setViewBox(meetingID, JSON.stringify([0, 0, 1, 1]));
  	      var folder = routes.presentationImageFolder(presentationID);
  	      fs.mkdir(folder, 0777 , function (reply) {
  	        newFile = fs.createWriteStream(folder + '/default.png');
            oldFile = fs.createReadStream('images/default.png');
            newFile.once('open', function (fd) {
                util.pump(oldFile, newFile);
                redisAction.setImageSize(meetingID, presentationID, pageID, 800, 600);
            });
          });
	      });
      });
    }
  });
  redisAction.setIDs(meetingID, sessionID, publicID, function() {
    redisAction.updateUserProperties(meetingID, sessionID, ["username", username,
	          "meetingID", meetingID, "refreshing", false, "dupSess", false, "sockets", 0, 'pubID', publicID]);
	  callback(true);
  });
}
else callback(false);
}

// When first logging into the chat
exports.post_index = function(req, res) {
  var username = sanitizer.escape(req.body.user.name);
  var meetingID = sanitizer.escape(req.body.meeting.id);
  var sessionID = req.sessionID;
  makeMeeting(meetingID, sessionID, username, function(join) {
    if(join) {
      res.cookie('sessionid', sessionID); //save the id so socketio can get the username
      res.cookie('meetingid', meetingID);
      res.redirect('/chat');
    }
    else res.redirect('/');
  });
};

// When we have clicked on the logout button.
exports.logout = function(req, res) {
	req.session.destroy(); //end the session
	res.cookie('sessionid', null); //clear the cookie from the machine
	res.cookie('meetingid', null);
};

/* 
The join URL is used to connect to a meeting immediately without 
going to the login screen.

Example:
localhost:3000/join?meetingid=123&fullname=Ryan&checksum=password

This will connect under the meetingID 123 with the name "Ryan" as 
long as the checksum string is equal on the server side.
*/
exports.join = function(req, res) {
  var query = req.query;
  if(query) {
    var meetingID = query.meetingid;
    var username = query.fullname;
    var checksum = query.checksum;
    var sessionID = req.sessionID;
    if(checksum == "password") {
      makeMeeting(meetingID, sessionID, username, function(join) {
        if(join) {
          res.cookie('sessionid', sessionID); //save the id so socketio can get the username
          res.cookie('meetingid', meetingID);
          res.redirect('/chat');
        }
        else res.redirect('/');
      });
    }
    else res.redirect('/');
  }
};

// When we return to the chat page (or open a new tab when already logged in)
exports.get_chat = function(req, res) {
	//requiresLogin before this verifies that a user is logged in...
	var meetingID = req.cookies['meetingid'];
	redisAction.getUserProperty(meetingID, req.cookies['sessionid'], "username", function (username) {
	  res.render('chat', { title: 'BigBlueButton HTML5 Client', user: username, max_chat_length: max_chat_length, meetingID : meetingID });
	});
};

//Uploading custom slides
exports.post_chat = function(req, res, next) {
  if(req.files.image.size != 0) {
    var meetingID = req.cookies['meetingid'];
    var sessionID = req.cookies['sessionid'];
    pub.publish(meetingID, JSON.stringify(['uploadStatus', "Processing..."]));
    redisAction.isValidSession(meetingID, sessionID, function (reply) {
      var file = req.files.image.path;
      var pageIDs = [];
      redisAction.getCurrentPresentationID(meetingID, function(prevPresID) {
        redisAction.getCurrentPageID(meetingID, prevPresID, function(prevPageID) {
          redisAction.createPresentation(meetingID, false, function (presentationID) {
            redisAction.setViewBox(meetingID, JSON.stringify([0, 0, 1, 1]));
            var folder = routes.presentationImageFolder(presentationID);
            fs.mkdir(folder, 0777 , function (reply) {
              im.convert(['-quality', '50', '-density', '150x150', file, folder + '/slide%d.png'], function (err, reply) {
                if(!err) {
                  //counts how many files are in the folder for the presentation to get the slide count.
                  exec("ls -1 " + folder + "/ | wc -l", function (error, stdout, stdouterr) {
                    var numOfPages = parseInt(stdout, 10);
                    var numComplete = 0;
                    for(var i = 0; i < numOfPages; i++) {
                      if(i != 0) var setCurrent = false;
                      else var setCurrent = true;
                      redisAction.createPage(meetingID, presentationID, "slide" + i + ".png", setCurrent, function (pageID, imageName) {        
                        im.identify(folder + "/" + imageName, function(err, features) {
                          if (err) throw err;
                          else redisAction.setImageSize(meetingID, presentationID, pageID, features.width, features.height, function() {
                            pageIDs.push(pageID);
                            numComplete++;
                            if(numComplete == numOfPages) {
                              redisAction.setCurrentPresentation(meetingID, presentationID, function() {
                                pub.publish(meetingID, JSON.stringify(['clrPaper']));
                                socketAction.publishSlides(meetingID, null, function() {
                                  socketAction.publishViewBox(meetingID);
                                  pub.publish(meetingID, JSON.stringify(['uploadStatus', ""]));
                                });
                              });
                            }
                          });
                        });
                      });
                    }
                  });
                }
                else {
                  console.log(err);
                  fs.rmdir(folder, function() {
                    console.log("Deleted invalid presentation folder");
                    pub.publish(meetingID, JSON.stringify(['uploadStatus', "Invalid file", true]));
                  });
                }
              });
            });
          });
        });
      });
    });
  }
  res.redirect('/chat');
};

// Any other page that we have not defined yet.
exports.error404 = function(req, res) {
  console.log("User tried to access: " + req.url);
  res.send("Page not found", 404);
};
