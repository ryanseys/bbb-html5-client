// Routes
exports.get_index = function(req, res) {
	if(!users[req.cookies['id']]) {
		res.render('index', { title: 'BigBlueButton HTML5 Client', max_u: max_username_length, max_mid: max_meetingid_length });
	}
	else {
		res.redirect('/chat');
	}
};

exports.post_chat = function(req, res) {
  var username = sanitizer.escape(req.body.user.name);
  var meetingid = sanitizer.escape(req.body.meeting.id);
  if((username) && (meetingid) && (username.length < max_username_length) && (meetingid.length < max_meetingid_length)) {
	  users[req.sessionID] = { username: username, meetingID: meetingid, sockets: { }, refreshing: false, duplicateSession: false }; //sets a relationship between session id & name/sockets
	  res.cookie('id', req.sessionID); //save the id so socketio can get the username
	  res.redirect('/chat');
  }
  else res.redirect('/');
};

exports.logout = function(req, res) {
	req.session.destroy(); //end the session
	res.cookie('id', null); //clear the cookie from the machine
};

exports.get_chat = function(req, res) {
	//requiresLogin before this verifies that a user is logged in...
	res.render('chat', { title: 'BigBlueButton HTML5 Chat', user: users[req.cookies['id']]['username'], max_chat_length: max_chat_length });
};

exports.error404 = function(req, res) {
	res.send('Page not found', 404);
};
