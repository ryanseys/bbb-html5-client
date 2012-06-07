// Routes
exports.get_index = function(req, res) {
	if(!users[req.cookies['id']]) {
		res.render('index', { title: 'BigBlueButton HTML5 Client' });
	}
	else {
		res.redirect('/chat');
	}
};

exports.post_chat = function(req, res) {
	users[req.sessionID] = { username: req.body.user.name, sockets: { } }; //sets a relationship between session id & name/sockets
	res.cookie('id', req.sessionID); //save the id so socketio can get the username
	res.render('chat', {title: 'BigBlueButton HTML5 Chat', user: users[req.sessionID]['username'] });
};

exports.logout = function(req, res) {
	delete users[req.cookies['id']]; //remove the user from the datastore
	req.session.destroy(); //end the session
	res.cookie('id', null); //clear the cookie from the machine
	res.redirect('/'); //go back to the homepage
};

exports.get_chat = function(req, res) {
	//requiresLogin before this verifies that a user is logged in...
	res.render('chat', { title: 'BigBlueButton HTML5 Chat', user: users[req.cookies['id']]['username'] });
};

exports.error404 = function(req, res) {
	res.send('Page not found', 404);
};
