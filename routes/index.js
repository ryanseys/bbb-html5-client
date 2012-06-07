
/*
 * GET home page.
 */
var users = {}; //temporary datastore

exports.index = function(req, res){
	res.render('index', { title: 'BigBlueButton HTML5 Client' });
};

exports.chat = function(req, res){
	users[req.body.user.name] = req.sessionID;
	console.log(users[req.body.user.name]); //prints out the session id
	req.session.user = req.body.user.name;
	res.cookie('username', req.body.user.name);
	res.render('chat', {title: 'BigBlueButton HTML5 Chat', user: req.session.user });
};

exports.logout = function(req, res){
	req.session.destroy();
	res.redirect('/');
};