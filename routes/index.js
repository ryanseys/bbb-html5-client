// Node.js Routes

// When we get the homepage.
exports.get_index = function(req, res) {
	gfunc.isValidSession(req.cookies['id'], function(reply) {
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
  var meetingid = sanitizer.escape(req.body.meeting.id);
  if((username) && (meetingid) && (username.length <= max_username_length) && (meetingid.length <= max_meetingid_length)) {
	  store.hmset(req.sessionID, "username", username, "meetingID", meetingid, "refreshing", false, "dupSess", false, "sockets", 0);
	  store.sadd("users", req.sessionID);
	  res.cookie('id', req.sessionID); //save the id so socketio can get the username
	  res.redirect('/chat');
  }
  else res.redirect('/');
};

// When we have clicked on the logout button.
exports.logout = function(req, res) {
	req.session.destroy(); //end the session
	res.cookie('id', null); //clear the cookie from the machine
};

// When we return to the chat page (or open a new tab when already logged in)
exports.get_chat = function(req, res) {
	//requiresLogin before this verifies that a user is logged in...
	gfunc.getUserProperty(req.cookies['id'], "username", function(username) {
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
