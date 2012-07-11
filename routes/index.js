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

// When first logging into the chat
exports.post_index = function(req, res) {
  var username = sanitizer.escape(req.body.user.name);
  var meetingID = sanitizer.escape(req.body.meeting.id);
  if((username) && (meetingID) && (username.length <= max_username_length) && (meetingID.length <= max_meetingid_length) && (meetingID.split(' ').length == 1)) {
	  var sessionID = req.sessionID;
	  redisAction.createMeeting(meetingID);
	  redisAction.createUser(meetingID, sessionID);
	  
	  store.get(redisAction.getCurrentPresentationString(meetingID), function (err, currPresID) {
	    if(!currPresID) {
	      redisAction.createPresentation(meetingID, true, function (presentationID) {
  	      redisAction.createPage(meetingID, presentationID, 'default.png', true, function (pageID) {
    	      var folder = routes.presentationImageFolder(presentationID);
    	      fs.mkdir(folder, 0777 , function (reply) {
    	        newFile = fs.createWriteStream(folder + '/default.png');
              oldFile = fs.createReadStream('images/default.png');
              newFile.once('open', function (fd) {
                  util.pump(oldFile, newFile);
              });
            });
  	      });
	      });
	    }
	  });
	  redisAction.updateUserProperties(meetingID, sessionID, ["username", username,
	          "meetingID", meetingID, "refreshing", false, "dupSess", false, "sockets", 0]);
	  res.cookie('sessionid', sessionID); //save the id so socketio can get the username
	  res.cookie('meetingid', meetingID);
	  res.redirect('/chat');
  }
  else res.redirect('/');
};

// When we have clicked on the logout button.
exports.logout = function(req, res) {
	req.session.destroy(); //end the session
	res.cookie('sessionid', null); //clear the cookie from the machine
	res.cookie('meetingid', null);
};

// When we return to the chat page (or open a new tab when already logged in)
exports.get_chat = function(req, res) {
	//requiresLogin before this verifies that a user is logged in...
	redisAction.getUserProperty(req.cookies['meetingid'], req.cookies['sessionid'], "username", function (username) {
	  res.render('chat', { title: 'BigBlueButton HTML5 Client', user: username, max_chat_length: max_chat_length });
	});
};

// Demo image upload for first image
exports.post_chat = function(req, res, next) {
  var meetingID = req.cookies['meetingid'];
  var sessionID = req.cookies['sessionid'];
  redisAction.isValidSession(meetingID, sessionID, function (reply) {
    var file = req.files.image.path;
    var pageIDs = [];
    redisAction.createPresentation(meetingID, true, function (presentationID) {
      var folder = routes.presentationImageFolder(presentationID);
      fs.mkdir(folder, 0777 , function (reply) {
        im.convert(['-quality', '90', '-density', '300x300', file, folder + '/slide%d.png'], function (err, reply) {
          //counts how many files are in the folder for the presentation to get the slide count.
          exec("ls -1 " + folder + "/ | wc -l", function (error, stdout, stdouterr) {
            var numOfPages = parseInt(stdout, 10);
            var numComplete = 0;
            
            for(var i = 0; i < numOfPages; i++) {
              if(i != 0) var setCurrent = false;
              else var setCurrent = true;
              redisAction.createPage(meetingID, presentationID, "slide" + i + ".png", setCurrent, function (pageID) {
                pageIDs.push(pageID);
                numComplete++;
                if(numComplete == numOfPages) socketAction.publishSlides(meetingID);
              });
            }
          });
        });
      });
    });
  });
  
  res.redirect('back');
};

// Any other page that we have not defined yet.
exports.error404 = function(req, res) {
  console.log("User tried to access: " + req.url);
  res.send("Page not found", 404);
};
