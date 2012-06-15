// Node.js Routes

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
  fs.rename(req.files.image.path, __dirname + "/../public/images/presentation/test1.png", function (status) {
    res.redirect('back');
  });
};

// Any other page that we have not defined yet.
exports.error404 = function(req, res) {
	res.send('Page not found', 404);
};
