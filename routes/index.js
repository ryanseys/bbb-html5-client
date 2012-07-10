// Node.js Routes
slides = [];
// When we get the homepage.
exports.get_index = function(req, res) {
	redisAction.isValidSession(req.cookies['meetingid'], req.cookies['sessionid'], function(reply) {
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
  if((username) && (meetingID) && (username.length <= max_username_length) && (meetingID.length <= max_meetingid_length)) {
	  store.sadd(redisAction.getMeetingsString(), meetingID); //create the meeting if not already created.
	  store.sadd(redisAction.getUsersString(meetingID), req.sessionID); //meeting-123-users.push(sessionID)
	  
	  store.get(redisAction.getCurrentPresentationString(meetingID), function(err, currPresID) {
	    if(!currPresID) {
	      var presentationID = rack(); //create a new unique presentationID
	      store.sadd(redisAction.getPresentationsString(meetingID), presentationID, function(err, reply) {
	        console.log("Added presentationID " + presentationID + " to set of presentations.");
	      });
	      store.set(redisAction.getCurrentPresentationString(meetingID), presentationID, function(err, reply) {
	        console.log("Set presentationID to " + presentationID);
	      });
	      var pageID = rack(); //create a new unique pageID.
	      store.lpush(redisAction.getPagesString(meetingID, presentationID), pageID, function(err, reply) {
	        console.log("Added pageID " + pageID + " to list of pages."); 
	      });
	      store.set(redisAction.getCurrentPageString(meetingID, presentationID), pageID, function(err, reply) {
	        console.log("Set current pageID to " + pageID);
	      });
	      console.log("Setting default image for pageID: " + pageID);
	      fs.mkdir('public/images/presentation' + presentationID, 0777 , function(reply) {
	        newFile = fs.createWriteStream('public/images/presentation' + presentationID + '/default.png');     
          oldFile = fs.createReadStream('images/default.png');
          newFile.once('open', function(fd) {
              util.pump(oldFile, newFile);
          });
        });
	      store.set(redisAction.getPageImageString(meetingID, presentationID, pageID), 'default.png', function(err, reply) {
	        if(reply) console.log("Set default image to default.png");
	        else console.log("Error: could not set default image: " + err);
	      });
	    }
	    else console.log("Current presentation already exists as ID " + currPresID);
	  });
	  store.hmset(redisAction.getUserString(meetingID, req.sessionID), "username", username,
	          "meetingID", meetingID, "refreshing", false, "dupSess", false, "sockets", 0);
	  res.cookie('sessionid', req.sessionID); //save the id so socketio can get the username
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
	redisAction.getUserProperty(req.cookies['meetingid'], req.cookies['sessionid'], "username", function(username) {
	  res.render('chat', { title: 'BigBlueButton HTML5 Chat', user: username, max_chat_length: max_chat_length });
	});
};

// Demo image upload for first image
exports.post_chat = function(req, res, next) {
  console.log("Uploading slides...");
  var meetingID = req.cookies['meetingid'];
  var sessionID = req.cookies['sessionid'];
  
  redisAction.isValidSession(meetingID, sessionID, function(reply) {
    var presentationID = rack(); //create new presentation id
    store.sadd(redisAction.getPresentationsString(meetingID), presentationID, function(err, reply) {
      console.log("Added presentationID " + presentationID + " to set of presentations.");
    });
    store.set(redisAction.getCurrentPresentationString(meetingID), presentationID, function(err, reply) {
      console.log("Set presentationID to " + presentationID);
    });
    var pdf_file = req.files.image.path;
    fs.mkdir('public/images/presentation' + presentationID, 0777 , function(reply) {
      im.convert(['-quality', '90', '-density', '300x300', req.files.image.path, 'public/images/presentation' + presentationID + '/slide%d.png'], function(err, reply) {
        exec("ls -1 public/images/presentation" + presentationID + "/ | wc -l", function(error, stdout, stdouterr) {
          var numOfPages = parseInt(stdout, 10);
          console.log("Number of pages: " + numOfPages);
          var numComplete = 0;
          for(var i = 0; i < numOfPages; i++) {
            var pageID = rack(); //create a new unique pageID.
            store.lpush(redisAction.getPagesString(meetingID, presentationID), pageID);
            if(i == 0) {
              store.set(redisAction.getCurrentPageString(meetingID, presentationID), pageID, function(err, reply) {
                console.log("Set current pageID to " + pageID);
              });
            }
            store.set(redisAction.getPageImageString(meetingID, presentationID, pageID), "slide" + i + ".png", function() {
              numComplete++;
              if(numComplete == numOfPages) socketAction.publishSlides(meetingID);
            });
          }
        });
        console.log("Slides uploaded and processed");
      });
    });
  });
  res.redirect('back');
};

// Any other page that we have not defined yet.
exports.error404 = function(req, res) {
	res.send('Page not found', 404);
};
