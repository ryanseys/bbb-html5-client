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
	users[req.sessionID] = req.body.user.name; //sets a relationship between session id and name
	console.log(users[req.sessionID]); //prints out the name
	res.cookie('id', req.sessionID); //save the id so socketio can get the username
	res.render('chat', {title: 'BigBlueButton HTML5 Chat', user: users[req.sessionID] });
};

exports.logout = function(req, res) {
	req.session.destroy();
	res.cookie('id', null);
	res.redirect('/');
};

exports.get_chat = function(req, res) {
	res.render('chat', { title: 'BigBlueButton HTML5 Chat', user: users[req.cookies['id']] });
};