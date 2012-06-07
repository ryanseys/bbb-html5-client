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
	var username = users[req.sessionID] = req.body.user.name; //sets a relationship between session id and name
	console.log(Object.keys(users).length); //get the number of connected users
	res.cookie('id', req.sessionID); //save the id so socketio can get the username
	res.render('chat', {title: 'BigBlueButton HTML5 Chat', user: username });
};

exports.logout = function(req, res) {
	delete users[req.cookies['id']]; //remove the user from the datastore
	req.session.destroy(); //end the session 
	res.cookie('id', null); //clear the cookie from the machine
	res.redirect('/'); //go back to the homepage
};

exports.get_chat = function(req, res) {
	//requiresLogin before this verifies that a user is logged in...
	console.log(Object.keys(users).length); //get the number of connected users
	res.render('chat', { title: 'BigBlueButton HTML5 Chat', user: users[req.cookies['id']] });
};

exports.error404 = function(req, res) {
  res.send('Page not found', 404);
};